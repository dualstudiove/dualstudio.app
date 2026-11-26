// Colaboraciones: un mismo post compartido entre varios clientes (p. ej. un «compartir navideño» que se publica
// en colaboración desde una cuenta e invita a las demás). No hay copias: el post es uno, su dueño es el cliente que
// lo creó (publicaciones.cliente_id) y publicaciones_colab dice qué otros clientes lo comparten. Aparece en la
// parrilla de cada uno; lo edita quien sea editor de cualquiera de ellos; las métricas (del link, que es uno) e
// impulsos se ven en todos.
//
//   PUT /<cliente>/api/publicaciones/:id/colab   { clientes: [slug…] }   → los clientes con quienes se comparte
import { db, HttpError } from "@dualstudio/comun/servidor";
import { tocar } from "./cambios.js";
import { accesoACliente, clientesDe, exigirEditor } from "./sesion.js";

/** El post si el cliente es su dueño o lo comparte; null si no. */
export function postDeCliente(publicacionId, clienteId) {
  return db.get(
    `SELECT p.* FROM publicaciones p
      WHERE p.id = ? AND (p.cliente_id = ?
        OR EXISTS (SELECT 1 FROM publicaciones_colab c WHERE c.publicacion_id = p.id AND c.cliente_id = ?))`,
    [publicacionId, clienteId, clienteId],
  );
}

/** Ids de los posts que el cliente comparte (sin ser dueño). Para consultas «IN (…)». */
export const SQL_COLAB_DE = "SELECT publicacion_id FROM publicaciones_colab WHERE cliente_id = ?";

/** Dueño y demás clientes de un post. */
export async function participantes(publicacionId) {
  const p = await db.get("SELECT cliente_id FROM publicaciones WHERE id = ?", [publicacionId]);
  if (!p) return null;
  const otros = (await db.all("SELECT cliente_id FROM publicaciones_colab WHERE publicacion_id = ?", [
    publicacionId,
  ])).map((f) => f.cliente_id);
  return { dueno: p.cliente_id, otros };
}

/** Avisa del cambio a todos los clientes del post (para que cada parrilla se refresque). */
export async function tocarPost(publicacionId, extra = []) {
  const p = await participantes(publicacionId);
  const ids = new Set([...(p ? [p.dueno, ...p.otros] : []), ...extra]);
  for (const id of ids) await tocar(id);
}

/**
 * Para /api/datos y la Agenda: { [publicacionId]: { dueno: slug, cuentas: [{ slug, nombre }] } } de los posts que
 * tienen colaboración (cuentas incluye al dueño, primero).
 */
export async function infoColab(publicacionIds) {
  const out = {};
  const ids = [...new Set(publicacionIds)];
  for (let i = 0; i < ids.length; i += 80) {
    const lote = ids.slice(i, i + 80);
    const marcas = lote.map(() => "?").join(",");
    const filas = await db.all(
      `SELECT p.id AS publicacion_id, d.slug AS dueno_slug, d.nombre AS dueno_nombre, c.slug, c.nombre
         FROM publicaciones_colab x
         JOIN publicaciones p ON p.id = x.publicacion_id
         JOIN clientes d ON d.id = p.cliente_id
         JOIN clientes c ON c.id = x.cliente_id
        WHERE x.publicacion_id IN (${marcas})
        ORDER BY c.nombre`,
      lote,
    );
    for (const f of filas) {
      const o = out[f.publicacion_id] ||= {
        dueno: f.dueno_slug,
        cuentas: [{ slug: f.dueno_slug, nombre: f.dueno_nombre }],
      };
      o.cuentas.push({ slug: f.slug, nombre: f.nombre });
    }
  }
  return out;
}

export function registrarColab(r) {
  const C = { cliente: true, auth: accesoACliente };

  r.add("PUT", "/api/publicaciones/:id/colab", C, async (ctx) => {
    exigirEditor(ctx);
    const { cliente, usuario, params, body } = ctx;
    const post = await postDeCliente(params.id, cliente.id);
    if (!post) throw new HttpError(404, "La publicación no existe. Puede que se haya eliminado.");
    const pedidos = Array.isArray(body.clientes) ? body.clientes.filter((s) => typeof s === "string").slice(0, 20) : [];
    const antes = await participantes(post.id);
    const mios = new Map((await clientesDe(usuario)).filter((c) => c.activo).map((c) => [c.slug, c]));
    const actuales = new Set(antes.otros);
    const nuevos = new Set();
    for (const slug of new Set(pedidos)) {
      const c = await db.get("SELECT id, slug, activo FROM clientes WHERE slug = ?", [slug]);
      if (!c || !c.activo) throw new HttpError(400, "Uno de los clientes no existe.");
      if (c.id === antes.dueno) continue; // el dueño no se agrega a sí mismo
      // Para sumar un cliente hay que poder editarlo (quien ya estaba, se queda aunque no lo tengas asignado).
      const mio = mios.get(slug);
      if (!actuales.has(c.id) && !(mio && mio.rol === "editor")) {
        throw new HttpError(403, "Solo puedes sumar clientes de los que eres editor.");
      }
      nuevos.add(c.id);
    }
    for (const id of actuales) {
      if (!nuevos.has(id)) {
        await db.run("DELETE FROM publicaciones_colab WHERE publicacion_id = ? AND cliente_id = ?", [post.id, id]);
      }
    }
    for (const id of nuevos) {
      if (!actuales.has(id)) {
        await db.run("INSERT OR IGNORE INTO publicaciones_colab (publicacion_id, cliente_id) VALUES (?, ?)", [post.id, id]);
      }
    }
    await tocarPost(post.id, [...actuales]);
    return { ok: true, colab: (await infoColab([post.id]))[post.id] || null };
  });
}
