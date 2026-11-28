// Cliente mínimo de la API de Instagram (Instagram API con inicio de sesión de Instagram, graph.instagram.com).
// Solo lectura: perfil, publicaciones y métricas. Cada llamada gasta una del presupuesto de la ejecución
// (en el plan gratuito de Cloudflare, un Worker puede hacer como mucho 50 llamadas externas por ejecución).
//
// Las métricas se devuelven con nombres propios (ver METRICAS) para que el resto de la app no dependa de cómo
// las llame Meta, que los cambia de vez en cuando.
import { env } from "../env.js";

const VERSION = "v23.0";

export class ErrorRed extends Error {
  /** token: el token ya no sirve (vencido, revocado, contraseña cambiada) y hay que volver a conectarlo. */
  constructor(mensaje, { token = false, codigo = null } = {}) {
    super(mensaje);
    this.token = token;
    this.codigo = codigo;
  }
}
export class SinPresupuesto extends Error {}

/**
 * Presupuesto de llamadas externas de una ejecución. Lleva también a qué API se habla:
 *  · conexión «token» (inicio de sesión de Instagram): graph.instagram.com
 *  · conexión «meta» (inicio de sesión unificado): graph.facebook.com, con el token de usuario del sistema
 * Los nombres de campos y métricas son los mismos en las dos.
 */
export const presupuesto = (n) => ({ n, meta: false });
export function usarConexion(p, origen) {
  p.meta = origen === "meta";
  return p;
}
const baseDe = (p) => (p.meta ? env.metaApiBase : env.igApiBase);

async function pedir(p, ruta, params = {}) {
  if (p.n <= 0) throw new SinPresupuesto("Sin llamadas disponibles en esta ejecución.");
  p.n--;
  const url = new URL(ruta.startsWith("http") ? ruta : `${baseDe(p)}/${VERSION}${ruta}`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, v);
  let res;
  try {
    res = await fetch(url, { headers: { accept: "application/json" } });
  } catch {
    throw new ErrorRed("No se pudo conectar con Instagram.");
  }
  let j = null;
  try {
    j = await res.json();
  } catch { /* respuesta vacía o no JSON */ }
  if (!res.ok || j?.error) {
    const e = j?.error || {};
    // 190: token vencido o revocado; 102: sesión no válida. Otros OAuthException (p. ej. 100) no son del token.
    const token = e.code === 190 || e.code === 102 || res.status === 401;
    throw new ErrorRed(
      token
        ? "Instagram rechazó el token: hay que volver a conectarlo."
        : (e.message ? `Instagram: ${e.message}` : `Instagram respondió ${res.status}.`),
      { token, codigo: e.code ?? res.status },
    );
  }
  return j || {};
}

/** Perfil de la cuenta: { id, usuario, seguidores, publicaciones }. Con «meta», la cuenta se pide por su id. */
export async function perfil(p, token, cuentaId) {
  const j = p.meta
    ? await pedir(p, `/${cuentaId}`, { fields: "id,username,followers_count,media_count", access_token: token })
    : await pedir(p, "/me", { fields: "user_id,username,followers_count,media_count", access_token: token });
  return {
    id: String(j.user_id || j.id || ""),
    usuario: j.username || "",
    seguidores: Number.isFinite(j.followers_count) ? j.followers_count : null,
    publicaciones: Number.isFinite(j.media_count) ? j.media_count : null,
  };
}

/** Renueva un token de larga duración (debe tener 24 h o más). → { token, vence (ms) } */
export async function renovar(p, token) {
  const j = await pedir(p, `${env.igApiBase}/refresh_access_token`, {
    grant_type: "ig_refresh_token",
    access_token: token,
  });
  return { token: j.access_token, vence: Date.now() + Number(j.expires_in || 0) * 1000 };
}

const CAMPOS_MEDIO =
  "id,shortcode,permalink,media_type,media_product_type,timestamp,like_count,comments_count,thumbnail_url,media_url";

/** Una página de publicaciones de la cuenta (las más recientes primero). → { medios, siguiente } */
export async function medios(p, token, cuentaId, siguiente) {
  const j = siguiente
    ? await pedir(p, siguiente)
    : await pedir(p, `/${cuentaId}/media`, { fields: CAMPOS_MEDIO, limit: 50, access_token: token });
  return { medios: (j.data || []).map(medio), siguiente: j.paging?.next || null };
}

const medio = (m) => ({
  id: String(m.id),
  codigo: m.shortcode || codigoDeLink(m.permalink),
  link: m.permalink || "",
  tipo: m.media_product_type === "REELS" ? "REELS" : (m.media_type || m.media_product_type || ""),
  publicado_en: m.timestamp || null,
  // Los videos traen thumbnail_url; las fotos y carruseles, media_url.
  miniatura: m.thumbnail_url || (m.media_type === "VIDEO" ? null : m.media_url) || null,
  basicas: {
    likes: Number.isFinite(m.like_count) ? m.like_count : undefined,
    comentarios: Number.isFinite(m.comments_count) ? m.comments_count : undefined,
  },
});

/** El código de un link de Instagram: instagram.com/p/<código>, /reel/<código>, /tv/<código>. */
export function codigoDeLink(link) {
  const m = /instagram\.com\/(?:[^/?#]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]{5,})/i.exec(
    String(link || ""),
  );
  return m ? m[1] : null;
}

// Nombre en Meta → nombre propio.
const METRICAS = {
  likes: "likes",
  comments: "comentarios",
  shares: "compartidos",
  saved: "guardados",
  reach: "alcance",
  views: "reproducciones",
  total_interactions: "interacciones",
};
const LISTA_COMPLETA = "reach,views,likes,comments,shares,saved,total_interactions";
const LISTA_BASICA = "reach,likes,comments,saved";

const valorDe = (d) => {
  const v = d?.total_value?.value ?? d?.values?.[0]?.value;
  return Number.isFinite(v) ? v : undefined;
};

/** Métricas de una publicación. Si Meta no acepta alguna para ese tipo, reintenta con las básicas. */
export async function metricasDeMedio(p, token, medioId) {
  let j;
  try {
    j = await pedir(p, `/${medioId}/insights`, { metric: LISTA_COMPLETA, access_token: token });
  } catch (e) {
    if (!(e instanceof ErrorRed) || e.token || e.codigo !== 100) throw e;
    j = await pedir(p, `/${medioId}/insights`, { metric: LISTA_BASICA, access_token: token });
  }
  const out = {};
  for (const d of j.data || []) {
    const k = METRICAS[d.name];
    const v = valorDe(d);
    if (k && v !== undefined) out[k] = v;
  }
  return out;
}

const CUENTA_BASICA = "reach,views,accounts_engaged,total_interactions";
// (Sin clics en la bio: Meta quitó website_clicks en enero de 2025 y profile_links_taps solo cuenta los botones
// de contacto —dirección, llamar, correo, mensaje—, no el link de la bio.)
const CUENTA_COMPLETA = `${CUENTA_BASICA},profile_views`;

/**
 * Cifras de la cuenta de un día: { alcance, reproducciones, cuentas, interacciones, visitas }
 * (desde/hasta en segundos). Si Meta no acepta visitas al perfil, se piden
 * solo las básicas.
 */
export async function cifrasDelDia(p, token, cuentaId, desde, hasta) {
  const q = (metric) => ({ metric, period: "day", metric_type: "total_value", since: desde, until: hasta, access_token: token });
  let j;
  try {
    j = await pedir(p, `/${cuentaId}/insights`, q(CUENTA_COMPLETA));
  } catch (e) {
    if (!(e instanceof ErrorRed) || e.token || e.codigo !== 100) throw e;
    j = await pedir(p, `/${cuentaId}/insights`, q(CUENTA_BASICA));
  }
  const nombres = {
    reach: "alcance",
    views: "reproducciones",
    accounts_engaged: "cuentas",
    total_interactions: "interacciones",
    profile_views: "visitas",
  };
  const out = {};
  for (const d of j.data || []) {
    const v = valorDe(d);
    if (nombres[d.name] && v !== undefined) out[nombres[d.name]] = v;
  }
  return out;
}

/**
 * A qué horas están conectados los seguidores: matriz 7 × 24 (día de la semana 0 = domingo, hora local) con el
 * promedio de seguidores conectados. Meta da las horas en la hora del Pacífico; aquí se pasan a la hora local.
 */
export async function audiencia(p, token, cuentaId) {
  const j = await pedir(p, `/${cuentaId}/insights`, {
    metric: "online_followers",
    period: "lifetime",
    access_token: token,
  });
  const suma = Array.from({ length: 7 }, () => Array(24).fill(0));
  const n = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const d of j.data || []) {
    for (const v of d.values || []) {
      if (!v || typeof v.value !== "object" || !v.end_time) continue;
      const fin = Date.parse(v.end_time);
      if (!Number.isFinite(fin)) continue;
      // end_time es el final del día (del Pacífico) al que corresponden los valores.
      const inicioPacifico = inicioDelDiaPacifico(fin - 1);
      for (const [h, c] of Object.entries(v.value)) {
        const hora = Number(h);
        if (!(hora >= 0 && hora < 24) || !Number.isFinite(c)) continue;
        const local = new Date(inicioPacifico + hora * 3600_000 + env.tzOffsetMin * 60_000);
        const dow = local.getUTCDay(), hl = local.getUTCHours();
        suma[dow][hl] += c;
        n[dow][hl]++;
      }
    }
  }
  return suma.map((fila, d) => fila.map((s, h) => (n[d][h] ? Math.round(s / n[d][h]) : 0)));
}

/**
 * Seguidores de un día (follows_and_unfollows): { siguieron, dejaron, neto } entre desde y hasta (segundos).
 * Meta lo da para los últimos 30 días y solo a cuentas con 100 seguidores o más.
 */
export async function seguidoresDelDia(p, token, cuentaId, desde, hasta) {
  const j = await pedir(p, `/${cuentaId}/insights`, {
    metric: "follows_and_unfollows",
    period: "day",
    metric_type: "total_value",
    breakdown: "follow_type",
    since: desde,
    until: hasta,
    access_token: token,
  });
  let siguieron = 0, dejaron = 0, hay = false;
  for (const d of j.data || []) {
    if (d.name !== "follows_and_unfollows") continue;
    for (const b of d.total_value?.breakdowns || []) {
      for (const x of b.results || []) {
        if (!Number.isFinite(x?.value)) continue;
        const tipo = String(x.dimension_values?.[0] || "").toUpperCase();
        if (tipo === "FOLLOWER") siguieron += x.value;
        else if (tipo === "NON_FOLLOWER") dejaron += x.value;
        else continue;
        hay = true;
      }
    }
  }
  return hay ? { siguieron, dejaron, neto: siguieron - dejaron } : null;
}

/** Instante (ms) del inicio del día, en la hora del Pacífico, que contiene a `ms`. */
function inicioDelDiaPacifico(ms) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms)).reduce((o, x) => ((o[x.type] = x.value), o), {});
  const comoUtc = Date.UTC(partes.year, partes.month - 1, partes.day, partes.hour, partes.minute, partes.second);
  const desfase = comoUtc - Math.floor(ms / 1000) * 1000; // hora del Pacífico − UTC
  return Date.UTC(partes.year, partes.month - 1, partes.day) - desfase;
}
