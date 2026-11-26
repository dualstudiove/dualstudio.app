// API de las métricas de redes.
//  · Administración: /api/admin/clientes/:id/redes (ver y conectar/desconectar Instagram con un token).
//  · Un cliente:     /<cliente>/api/redes/vincular, /actualizar, /miniatura… y /api/resultados (el dashboard).
// Lo que la parrilla necesita a diario (métricas de cada post, cifras del mes) viaja con /api/datos (datosDeRedes).
import { cuotaDiaria, db, HttpError, Raw, str } from "@dualstudio/comun/servidor";
import { env } from "../env.js";
import { accesoACliente, exigirEditor, soloAdmin } from "../sesion.js";
import { borrarImagenes, decodificar, guardarImagen } from "../almacen.js";
import { tocar } from "../cambios.js";
import { SQL_COLAB_DE, tocarPost } from "../colab.js";
import {
  conectarInstagram,
  conexionDe,
  desconectar,
  faltanHistorial,
  FRENO_MANUAL_MS,
  presupuesto,
  PRESUPUESTO_EJECUCION,
  SinPresupuesto,
  sincronizar,
} from "./sync.js";

const REDES = new Set(["ig"]); // TikTok se suma cuando esté su conexión
const MAX_MINIATURA_REMOTA = 8 * 1024 * 1024;

const json = (t) => {
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
};
const red = (v) => {
  if (!REDES.has(v)) throw new HttpError(400, "Esa red no está disponible.");
  return v;
};

/** Lo que se muestra de una conexión (nunca el token). */
const estadoConexion = (c) =>
  c && {
    usuario: c.usuario,
    estado: c.estado,
    error: c.error || null,
    origen: c.origen,
    sincronizado_en: c.sincronizado_en || null,
    token_vence: c.token_vence || null,
    conectado_en: c.conectado_en,
    // Cuándo se puede volver a pulsar «Actualizar».
    actualizar_desde: c.manual_en ? c.manual_en + FRENO_MANUAL_MS : 0,
  };

/** Para /api/datos: conexiones, métricas de cada post y cifras de la cuenta por mes. */
export async function datosDeRedes(clienteId) {
  const conexiones = await db.all("SELECT * FROM redes_conexiones WHERE cliente_id = ?", [clienteId]);
  const redes = {};
  for (const c of conexiones) redes[c.red] = estadoConexion(c);
  const metricas = {};
  for (
    const f of await db.all(
      `SELECT publicacion_id, red, medio_id, tipo, publicado_en, metricas, actualizado_en, error, miniatura_id,
              miniatura_url IS NOT NULL AS hay_url
         FROM redes_posts WHERE cliente_id = ? OR publicacion_id IN (${SQL_COLAB_DE})`,
      [clienteId, clienteId],
    )
  ) {
    (metricas[f.publicacion_id] ||= {})[f.red] = {
      encontrado: !!f.medio_id,
      tipo: f.tipo,
      publicado_en: f.publicado_en,
      m: json(f.metricas),
      at: f.actualizado_en,
      error: f.error,
      miniatura: f.miniatura_id || null,
      // La parrilla genera la miniatura propia cuando falta (ver /redes/miniatura).
      falta_miniatura: !f.miniatura_id && !!f.hay_url,
    };
  }
  // Por mes (últimos 15): seguidores al inicio y al cierre, y la suma de lo que pasó cada día.
  const cuentaMes = {};
  for (
    const f of await db.all(
      `SELECT red, substr(dia, 1, 7) AS mes,
              SUM(json_extract(datos, '$.alcance')) AS alcance,
              SUM(json_extract(datos, '$.reproducciones')) AS reproducciones,
              SUM(json_extract(datos, '$.interacciones')) AS interacciones,
              SUM(json_extract(datos, '$.cuentas')) AS cuentas,
              (SELECT seguidores FROM redes_cuenta_dia x WHERE x.cliente_id = d.cliente_id AND x.red = d.red
                 AND substr(x.dia, 1, 7) = substr(d.dia, 1, 7) AND x.seguidores IS NOT NULL ORDER BY x.dia DESC LIMIT 1) AS seguidores,
              (SELECT seguidores FROM redes_cuenta_dia x WHERE x.cliente_id = d.cliente_id AND x.red = d.red
                 AND substr(x.dia, 1, 7) = substr(d.dia, 1, 7) AND x.seguidores IS NOT NULL ORDER BY x.dia ASC LIMIT 1) AS seguidores_ini
         FROM redes_cuenta_dia d
        WHERE cliente_id = ? AND dia >= date('now', '-15 months')
        GROUP BY red, mes`,
      [clienteId],
    )
  ) {
    const n = (v) => (v === null || v === undefined ? null : Number(v));
    (cuentaMes[f.red] ||= {})[f.mes] = {
      seguidores: n(f.seguidores),
      seguidores_ini: n(f.seguidores_ini),
      alcance: n(f.alcance),
      reproducciones: n(f.reproducciones),
      interacciones: n(f.interacciones),
      cuentas: n(f.cuentas),
    };
  }
  return { redes, metricas, cuentaMes };
}

export function registrarRedes(r) {
  const A = { auth: soloAdmin };
  const C = { cliente: true, auth: accesoACliente };

  // ── Administración ──
  const clienteAdmin = async (id) => {
    const c = await db.get("SELECT id FROM clientes WHERE id = ?", [id]);
    if (!c) throw new HttpError(404, "El cliente no existe.");
    return c;
  };

  r.add("GET", "/api/admin/clientes/:id/redes", A, async ({ params }) => {
    await clienteAdmin(params.id);
    const out = {};
    for (const c of await db.all("SELECT * FROM redes_conexiones WHERE cliente_id = ?", [params.id])) {
      out[c.red] = estadoConexion(c);
    }
    return out;
  });

  r.add("PUT", "/api/admin/clientes/:id/redes/ig", A, async ({ params, body, usuario }) => {
    await clienteAdmin(params.id);
    return conectarInstagram({ clienteId: params.id, token: body.token, usuarioId: usuario.id });
  });

  r.add("DELETE", "/api/admin/clientes/:id/redes/:red", A, async ({ params }) => {
    await clienteAdmin(params.id);
    await desconectar(params.id, red(params.red));
    return { ok: true };
  });

  // ── Un cliente ──
  const conectada = async (cliente, nombreRed) => {
    const con = await conexionDe(cliente.id, red(nombreRed));
    if (!con || !con.token) throw new HttpError(409, "Este cliente no tiene su cuenta conectada.");
    if (con.estado === "error") {
      throw new HttpError(409, con.error || "La conexión tiene un problema: un administrador debe revisarla.");
    }
    return con;
  };

  /** El vínculo de un post de este cliente o que comparte en colaboración (su cliente_id es la cuenta dueña). */
  const vinculo = (publicacionId, nombreRed, clienteId) =>
    db.get(
      `SELECT * FROM redes_posts WHERE publicacion_id = ? AND red = ?
         AND (cliente_id = ? OR publicacion_id IN (${SQL_COLAB_DE}))`,
      [str(publicacionId, 60), red(nombreRed), clienteId, clienteId],
    );

  // Vincular un post: encuentra la publicación de su link y trae sus métricas al momento.
  r.add("POST", "/api/redes/vincular", C, async (ctx) => {
    exigirEditor(ctx);
    const { cliente, body } = ctx;
    await cuotaDiaria(`redes-vincular|${cliente.id}`, 300, "Se alcanzó el límite de vínculos de hoy.");
    const post = await vinculo(body.publicacion_id, body.red, cliente.id);
    if (!post) return { ok: true, vacio: true };
    // En una colaboración, las métricas se leen desde la cuenta dueña
    const con = await conectada({ id: post.cliente_id }, body.red);
    try {
      return await sincronizar(con, presupuesto(8), { soloPost: post.publicacion_id, forzar: true });
    } catch (e) {
      if (e instanceof SinPresupuesto) return { ok: true, parcial: true, faltan: await faltanHistorial(con.cliente_id) };
      throw e;
    }
  });

  // Botón «Actualizar»: todo el cliente, una vez cada 15 minutos.
  r.add("POST", "/api/redes/actualizar", C, async (ctx) => {
    exigirEditor(ctx);
    const con = await conectada(ctx.cliente, ctx.body.red || "ig");
    const ahora = Date.now();
    // Mientras se trae el historial de los últimos 3 meses, se puede volver a pulsar al minuto.
    const freno = (await faltanHistorial(con.cliente_id)) ? 60_000 : FRENO_MANUAL_MS;
    const espera = (con.manual_en || 0) + freno - ahora;
    if (espera > 0) {
      throw new HttpError(429, `Ya se actualizó hace poco. Podrás volver a hacerlo en ${Math.ceil(espera / 60_000)} min.`);
    }
    // El freno se marca antes, para que dos clics seguidos no gasten el doble.
    const marcado = await db.run(
      "UPDATE redes_conexiones SET manual_en = ? WHERE cliente_id = ? AND red = ? AND COALESCE(manual_en, 0) = ?",
      [ahora, con.cliente_id, con.red, con.manual_en || 0],
    );
    if (!marcado.changes) throw new HttpError(429, "Ya se está actualizando.");
    try {
      return await sincronizar({ ...con, manual_en: ahora }, presupuesto(PRESUPUESTO_EJECUCION), { forzar: true });
    } catch (e) {
      if (e instanceof SinPresupuesto) return { ok: true, parcial: true, faltan: await faltanHistorial(con.cliente_id) };
      throw e;
    }
  });

  // Miniatura propia: el navegador pide la imagen de la red a través del Worker (así no la bloquea el navegador),
  // la achica a 320 px en WebP y la sube. El Worker no la procesa: en el plan gratuito tiene poco tiempo de CPU.
  r.add("GET", "/api/redes/miniatura-remota/:id", C, async (ctx) => {
    exigirEditor(ctx);
    const f = await vinculo(ctx.params.id, ctx.query.red || "ig", ctx.cliente.id);
    if (!f?.miniatura_url) throw new HttpError(404, "No hay miniatura para este post.");
    if (!urlDeImagenPermitida(f.miniatura_url)) throw new HttpError(400, "La dirección de la miniatura no es válida.");
    let res;
    try {
      res = await fetch(f.miniatura_url);
    } catch {
      throw new HttpError(502, "No se pudo descargar la miniatura.");
    }
    const tipo = res.headers.get("content-type") || "";
    if (!res.ok || !/^image\//.test(tipo)) throw new HttpError(404, "La miniatura ya no está disponible.");
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > MAX_MINIATURA_REMOTA) throw new HttpError(413, "La imagen es demasiado grande.");
    return new Raw(bytes, tipo, { "cache-control": "no-store" });
  });

  r.add("POST", "/api/redes/miniatura", { ...C, maxBody: 600_000 }, async (ctx) => {
    exigirEditor(ctx);
    const { cliente, body, usuario } = ctx;
    const post = await vinculo(body.publicacion_id, body.red || "ig", cliente.id);
    if (!post) throw new HttpError(404, "Ese post no está vinculado.");
    await cuotaDiaria(`imagenes|${cliente.id}`, 200, "Se alcanzó el límite de imágenes de hoy para este cliente.");
    const { tipo, bytes } = decodificar(body.datos, body.tipo);
    // La miniatura queda con la cuenta dueña del post (se borra con él)
    const { id } = await guardarImagen({ clienteId: post.cliente_id, tipo, bytes, usuarioId: usuario.id });
    await db.run("UPDATE redes_posts SET miniatura_id = ? WHERE publicacion_id = ? AND red = ?", [
      id,
      post.publicacion_id,
      post.red,
    ]);
    if (post.miniatura_id) await borrarImagenes(post.cliente_id, [post.miniatura_id]);
    await tocarPost(post.publicacion_id);
    return { id };
  });

  // Dashboard: cifras diarias de la cuenta en un periodo (y el anterior, para comparar) y la audiencia.
  r.add("GET", "/api/resultados", C, async ({ cliente, query }) => {
    const nombreRed = red(query.red || "ig");
    const desde = /^\d{4}-\d{2}-\d{2}$/.test(query.desde || "") ? query.desde : null;
    const hasta = /^\d{4}-\d{2}-\d{2}$/.test(query.hasta || "") ? query.hasta : null;
    if (!desde || !hasta || desde > hasta) throw new HttpError(400, "El periodo no es válido.");
    const dias = await db.all(
      `SELECT dia, seguidores, datos FROM redes_cuenta_dia
        WHERE cliente_id = ? AND red = ? AND dia >= ? AND dia <= ? ORDER BY dia LIMIT 800`,
      [cliente.id, nombreRed, desde, hasta],
    );
    const con = await conexionDe(cliente.id, nombreRed);
    return {
      conexion: estadoConexion(con) || null,
      dias: dias.map((d) => ({ dia: d.dia, seguidores: d.seguidores, ...(json(d.datos) || {}) })),
      audiencia: json(con?.audiencia),
    };
  });
}

/** Solo imágenes de los servidores de Meta (o de la API configurada, en pruebas): nada de direcciones internas. */
function urlDeImagenPermitida(u) {
  try {
    const x = new URL(u);
    const h = x.hostname.toLowerCase();
    if (x.protocol === "https:" && /(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(h)) return true;
    // Con una API simulada (IG_API_BASE en pruebas), sus imágenes también.
    const simulada = new URL(env.igApiBase);
    return simulada.hostname !== "graph.instagram.com" && x.host === simulada.host;
  } catch {
    return false;
  }
}
