// Ads: el presupuesto de publicidad que el cliente aprueba cada mes y los posts que se impulsan con él.
// Por ahora todo se registra a mano (origen 'manual'); más adelante se podrán leer desde Meta Ads (origen 'meta').
//
//   PUT    /<cliente>/api/ads/presupuestos/:mes   { monto, notas }   (monto vacío = quitar el presupuesto)
//   POST   /<cliente>/api/ads/impulsos            { publicacion_id, inicio, fin, gastado, objetivo, resultados, notas }
//   PATCH  /<cliente>/api/ads/impulsos/:id        (los mismos campos, los que cambien)
//   DELETE /<cliente>/api/ads/impulsos/:id
// Lo que la parrilla muestra viaja con /api/datos (datosDeAds). Todo en dólares.
import { cuotaDiaria, db, HttpError, str, uuid } from "@dualstudio/comun/servidor";
import { accesoACliente, exigirEditor } from "./sesion.js";
import { tocar } from "./cambios.js";
import { postDeCliente, SQL_COLAB_DE } from "./colab.js";

const MAX_MONTO = 1_000_000;
export const OBJETIVOS = new Set(["mensajes", "perfil", "alcance", "clics"]);
export const RESULTADOS = ["alcance", "clics", "mensajes", "visitas", "seguidores"];

const json = (t) => {
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
};
const esMes = (m) => typeof m === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
const esDia = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`));

/** Un monto en USD con dos decimales, o lanza 400. */
function monto(v, campo) {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  if (!Number.isFinite(n) || n < 0 || n > MAX_MONTO) throw new HttpError(400, `${campo} no es válido.`);
  return Math.round(n * 100) / 100;
}

/** Resultados del impulso: solo cifras conocidas, enteros de 0 en adelante (vacío = sin dato). */
function resultados(r) {
  if (r === undefined || r === null) return {};
  if (typeof r !== "object" || Array.isArray(r)) throw new HttpError(400, "Los resultados no son válidos.");
  const out = {};
  for (const k of RESULTADOS) {
    const v = r[k];
    if (v === undefined || v === null || v === "") continue;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > 1e9) throw new HttpError(400, `El valor de «${k}» no es válido.`);
    out[k] = n;
  }
  return out;
}

const impulso = (f) => ({
  id: f.id,
  publicacion_id: f.publicacion_id,
  inicio: f.inicio,
  fin: f.fin || null,
  gastado: Number(f.gastado) || 0,
  objetivo: f.objetivo || null,
  resultados: json(f.resultados) || {},
  notas: f.notas || "",
  origen: f.origen,
  actualizado_en: f.actualizado_en,
  actualizado_por: f.actualizado_por,
});

/** Para /api/datos: presupuestos e impulsos de los últimos dos años. */
export async function datosDeAds(clienteId) {
  const presupuestos = {};
  for (
    const f of await db.all(
      "SELECT mes, monto, notas FROM ads_presupuestos WHERE cliente_id = ? AND mes >= strftime('%Y-%m', 'now', '-24 months')",
      [clienteId],
    )
  ) {
    presupuestos[f.mes] = { monto: Number(f.monto), notas: f.notas || "" };
  }
  // También los impulsos de otras cuentas en posts compartidos (colaboración): se ven en el post, marcados «ajeno»,
  // y no cuentan en el presupuesto de este cliente.
  const impulsos = (await db.all(
    `SELECT * FROM ads_impulsos
      WHERE inicio >= date('now', '-24 months')
        AND (cliente_id = ?
             OR publicacion_id IN (${SQL_COLAB_DE})
             OR publicacion_id IN (SELECT x.publicacion_id FROM publicaciones_colab x
                                     JOIN publicaciones p ON p.id = x.publicacion_id WHERE p.cliente_id = ?))
      ORDER BY inicio DESC LIMIT 1000`,
    [clienteId, clienteId, clienteId],
  )).map((f) => ({ ...impulso(f), ...(f.cliente_id !== clienteId ? { ajeno: true } : {}) }));
  return { presupuestos, impulsos };
}

export function registrarAds(r) {
  const C = { cliente: true, auth: accesoACliente };
  const escritura = async (ctx) => {
    exigirEditor(ctx);
    await cuotaDiaria(
      `escrituras|${ctx.cliente.id}`,
      5000,
      "Se alcanzó el límite de cambios de hoy para este cliente. Intenta de nuevo mañana.",
    );
  };

  r.add("PUT", "/api/ads/presupuestos/:mes", C, async (ctx) => {
    await escritura(ctx);
    const { cliente, params, body, usuario } = ctx;
    if (!esMes(params.mes)) throw new HttpError(400, "El mes no es válido.");
    if (body.monto === null || body.monto === undefined || body.monto === "") {
      await db.run("DELETE FROM ads_presupuestos WHERE cliente_id = ? AND mes = ?", [cliente.id, params.mes]);
    } else {
      await db.run(
        `INSERT INTO ads_presupuestos (cliente_id, mes, monto, notas, actualizado_en, actualizado_por) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (cliente_id, mes) DO UPDATE SET monto = excluded.monto, notas = excluded.notas,
           actualizado_en = excluded.actualizado_en, actualizado_por = excluded.actualizado_por`,
        [cliente.id, params.mes, monto(body.monto, "El presupuesto"), str(body.notas, 500) || null, Date.now(), usuario.id],
      );
    }
    await tocar(cliente.id);
    return { ok: true };
  });

  /** Valida los campos de un impulso; con `parcial`, solo los que vienen. */
  async function campos(cliente, b, parcial) {
    const out = {};
    if (!parcial || b.publicacion_id !== undefined) {
      const p = await postDeCliente(str(b.publicacion_id, 60), cliente.id);
      if (!p) throw new HttpError(400, "Elige el post que se impulsó.");
      out.publicacion_id = p.id;
    }
    if (!parcial || b.inicio !== undefined) {
      if (!esDia(b.inicio)) throw new HttpError(400, "La fecha de inicio no es válida.");
      out.inicio = b.inicio;
    }
    if (!parcial || b.fin !== undefined) {
      if (b.fin && !esDia(b.fin)) throw new HttpError(400, "La fecha de fin no es válida.");
      out.fin = b.fin || null;
    }
    if (!parcial || b.gastado !== undefined) out.gastado = monto(b.gastado ?? 0, "El monto gastado");
    if (!parcial || b.objetivo !== undefined) {
      if (b.objetivo && !OBJETIVOS.has(b.objetivo)) throw new HttpError(400, "El objetivo no es válido.");
      out.objetivo = b.objetivo || null;
    }
    if (!parcial || b.resultados !== undefined) out.resultados = JSON.stringify(resultados(b.resultados));
    if (!parcial || b.notas !== undefined) out.notas = str(b.notas, 1000) || null;
    return out;
  }
  const revisarFechas = (inicio, fin) => {
    if (fin && inicio && fin < inicio) throw new HttpError(400, "La fecha de fin es anterior a la de inicio.");
  };

  r.add("POST", "/api/ads/impulsos", C, async (ctx) => {
    await escritura(ctx);
    const { cliente, body, usuario } = ctx;
    const c = await campos(cliente, body, false);
    revisarFechas(c.inicio, c.fin);
    const id = `a${uuid().replace(/-/g, "").slice(0, 16)}`;
    const ahora = Date.now();
    await db.run(
      `INSERT INTO ads_impulsos (id, cliente_id, publicacion_id, inicio, fin, gastado, objetivo, resultados, notas, origen,
                                 creado_en, creado_por, actualizado_en, actualizado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?, ?, ?)`,
      [id, cliente.id, c.publicacion_id, c.inicio, c.fin, c.gastado, c.objetivo, c.resultados, c.notas, ahora, usuario.id, ahora, usuario.id],
    );
    await tocar(cliente.id);
    return { id };
  });

  r.add("PATCH", "/api/ads/impulsos/:id", C, async (ctx) => {
    await escritura(ctx);
    const { cliente, body, usuario, params } = ctx;
    const f = await db.get("SELECT inicio, fin FROM ads_impulsos WHERE id = ? AND cliente_id = ?", [params.id, cliente.id]);
    if (!f) throw new HttpError(404, "Ese impulso no existe. Puede que se haya eliminado.");
    const c = await campos(cliente, body, true);
    revisarFechas(c.inicio ?? f.inicio, c.fin !== undefined ? c.fin : f.fin);
    const cols = Object.keys(c);
    if (cols.length) {
      await db.run(
        `UPDATE ads_impulsos SET ${cols.map((k) => `${k} = ?`).join(", ")}, actualizado_en = ?, actualizado_por = ?
          WHERE id = ? AND cliente_id = ?`,
        [...cols.map((k) => c[k]), Date.now(), usuario.id, params.id, cliente.id],
      );
      await tocar(cliente.id);
    }
    return { ok: true };
  });

  r.add("DELETE", "/api/ads/impulsos/:id", C, async (ctx) => {
    await escritura(ctx);
    await db.run("DELETE FROM ads_impulsos WHERE id = ? AND cliente_id = ?", [ctx.params.id, ctx.cliente.id]);
    await tocar(ctx.cliente.id);
    return { ok: true };
  });
}
