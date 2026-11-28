// «Conectar con Meta»: la API de Instagram con inicio de sesión unificado (Facebook Login para empresas con una
// configuración, config_id). El administrador pulsa el botón, inicia sesión en Meta, elige la cuenta de Instagram
// y Meta vuelve a Planifica con un código; el Worker lo cambia por un token de usuario del sistema (no vence),
// lo guarda cifrado y desde ahí todo funciona igual que con el token pegado (sync.js), contra graph.facebook.com.
//
//   GET  /api/admin/clientes/:id/redes/meta        → { url } para ir a Meta (guarda un «state» de un solo uso)
//   GET  <base>/redes/meta/vuelta?code&state        → página: canjea el código y vuelve a Clientes y equipo
//   GET  /api/admin/redes/meta/pendiente/:state     → cuentas para elegir (si Meta autorizó más de una)
//   POST /api/admin/redes/meta/elegir                { state, cuenta_id }
//
// La dirección de vuelta (<origen><base>/redes/meta/vuelta) tiene que estar registrada en la configuración de Meta.
import { db, HttpError, leerAjuste, guardarAjuste, parseCookies, str, uuid } from "@dualstudio/comun/servidor";
import { env } from "../env.js";
import { soloAdmin, usuarioDe } from "../sesion.js";
import { cifrar, descifrar } from "./cifrado.js";
import { conectarInstagram } from "./sync.js";

const VERSION = "v23.0";
const VIGENCIA = 15 * 60_000; // el «state» y la elección pendiente valen 15 minutos

const dirVuelta = (url) => env.metaVuelta || `${url.origin}${env.basePath}/redes/meta/vuelta`;

function exigirConfiguracion() {
  if (!env.metaAppId || !env.metaConfigId) {
    throw new HttpError(409, "Faltan META_APP_ID y META_CONFIG_ID en la configuración del Worker.");
  }
  if (!env.metaAppSecret) {
    throw new HttpError(
      409,
      "Falta la clave secreta de la app de Meta: agrégala en Cloudflare como secreto META_APP_SECRET.",
    );
  }
}

async function leerUnaVez(clave) {
  const v = await leerAjuste(clave);
  await db.run("DELETE FROM _ajustes WHERE clave = ?", [clave]);
  if (!v) return null;
  try {
    const o = JSON.parse(v);
    return o.exp > Date.now() ? o : null;
  } catch {
    return null;
  }
}

async function pedirMeta(ruta, params) {
  const u = new URL(`${env.metaApiBase}/${VERSION}${ruta}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  let res;
  try {
    res = await fetch(u, { headers: { accept: "application/json" } });
  } catch {
    throw new HttpError(502, "No se pudo conectar con Meta.");
  }
  const j = await res.json().catch(() => null);
  if (!res.ok || j?.error) throw new HttpError(400, `Meta: ${j?.error?.message || `respondió ${res.status}`}`);
  return j || {};
}

/** Las cuentas de Instagram que el usuario autorizó: [{ id, usuario }]. */
async function cuentasAsignadas(token) {
  const j = await pedirMeta("/me/assigned_instagram_accounts", { fields: "id,username", access_token: token });
  const out = [];
  for (const c of (j.data || []).slice(0, 20)) {
    if (!c?.id) continue;
    let usuario = c.username || "";
    if (!usuario) {
      const d = await pedirMeta(`/${c.id}`, { fields: "username", access_token: token }).catch(() => ({}));
      usuario = d.username || "";
    }
    out.push({ id: String(c.id), usuario });
  }
  return out;
}

export function registrarMeta(r) {
  const A = { auth: soloAdmin };

  r.add("GET", "/api/admin/clientes/:id/redes/meta", A, async ({ params, usuario, url }) => {
    exigirConfiguracion();
    const c = await db.get("SELECT id FROM clientes WHERE id = ?", [params.id]);
    if (!c) throw new HttpError(404, "El cliente no existe.");
    const state = uuid().replace(/-/g, "");
    const vuelta = dirVuelta(url);
    await guardarAjuste(
      `meta_state|${state}`,
      JSON.stringify({ cliente_id: c.id, usuario_id: usuario.id, vuelta, exp: Date.now() + VIGENCIA }),
    );
    const u = new URL(`${env.metaDialogBase}/${VERSION}/dialog/oauth`);
    u.searchParams.set("client_id", env.metaAppId);
    u.searchParams.set("config_id", env.metaConfigId);
    u.searchParams.set("redirect_uri", vuelta);
    u.searchParams.set("response_type", "code");
    u.searchParams.set("override_default_response_type", "true");
    u.searchParams.set("state", state);
    return { url: u.toString(), vuelta };
  });

  r.add("GET", "/api/admin/redes/meta/pendiente/:state", A, async ({ params, usuario }) => {
    const v = await leerAjuste(`meta_pend|${str(params.state, 64)}`);
    const o = v ? JSON.parse(v) : null;
    if (!o || o.exp < Date.now() || o.usuario_id !== usuario.id) {
      throw new HttpError(404, "La elección venció. Vuelve a pulsar «Conectar con Meta».");
    }
    const c = await db.get("SELECT nombre FROM clientes WHERE id = ?", [o.cliente_id]);
    return { cliente_id: o.cliente_id, cliente: c?.nombre || "", cuentas: o.cuentas };
  });

  r.add("POST", "/api/admin/redes/meta/elegir", A, async ({ body, usuario }) => {
    const o = await leerUnaVez(`meta_pend|${str(body.state, 64)}`);
    if (!o || o.usuario_id !== usuario.id) {
      throw new HttpError(404, "La elección venció. Vuelve a pulsar «Conectar con Meta».");
    }
    const cuenta = o.cuentas.find((c) => c.id === String(body.cuenta_id || ""));
    if (!cuenta) throw new HttpError(400, "Elige una de las cuentas autorizadas.");
    const token = await descifrar(o.token);
    return conectarInstagram({ clienteId: o.cliente_id, token, usuarioId: usuario.id, origen: "meta", cuentaId: cuenta.id });
  });
}

/** La vuelta desde Meta (una página, no la API): canjea el código y lleva a Clientes y equipo. */
export async function vueltaMeta(c) {
  const url = new URL(c.req.url);
  const ir = (q) =>
    new Response(null, { status: 302, headers: { location: `${env.basePath}/configuracion?${new URLSearchParams(q)}#marcas` } });
  const state = str(url.searchParams.get("state"), 64);
  const st = state ? await leerUnaVez(`meta_state|${state}`) : null;
  if (!st) return ir({ meta_error: "La conexión venció o no es válida. Vuelve a pulsar «Conectar con Meta»." });
  const u = await usuarioDe(parseCookies(c.req.header("cookie") || ""));
  if (!u || !u.es_admin || u.id !== st.usuario_id) {
    return ir({ meta_error: "Inicia sesión como administrador y vuelve a intentarlo." });
  }
  if (url.searchParams.get("error") || !url.searchParams.get("code")) {
    return ir({ meta_error: "No se completó la autorización en Meta." });
  }
  try {
    exigirConfiguracion();
    const t = await pedirMeta("/oauth/access_token", {
      client_id: env.metaAppId,
      client_secret: env.metaAppSecret,
      redirect_uri: st.vuelta,
      code: url.searchParams.get("code"),
    });
    if (!t.access_token) throw new HttpError(400, "Meta no devolvió el token.");
    const cuentas = await cuentasAsignadas(t.access_token);
    if (!cuentas.length) {
      return ir({ meta_error: "No autorizaste ninguna cuenta de Instagram. Vuelve a conectar y elige la del cliente." });
    }
    if (cuentas.length === 1) {
      const r = await conectarInstagram({
        clienteId: st.cliente_id,
        token: t.access_token,
        usuarioId: u.id,
        origen: "meta",
        cuentaId: cuentas[0].id,
      });
      return ir({ meta_ok: r.usuario });
    }
    const pend = uuid().replace(/-/g, "");
    await guardarAjuste(
      `meta_pend|${pend}`,
      JSON.stringify({
        cliente_id: st.cliente_id,
        usuario_id: u.id,
        token: await cifrar(t.access_token),
        cuentas,
        exp: Date.now() + VIGENCIA,
      }),
    );
    return ir({ meta_elegir: pend });
  } catch (e) {
    return ir({ meta_error: e instanceof HttpError ? e.message : "No se pudo completar la conexión con Meta." });
  }
}
