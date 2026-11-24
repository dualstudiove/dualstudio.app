// API de Planifica.
//  · Cuenta (raíz):  /api/login, /api/logout, /api/sesion, /api/cuenta/…
//  · Un cliente:      /<cliente>/api/datos, /publicaciones, /objetivos, /ajustes, /imagenes (opción `cliente: true`)
//  · Administración:  ver admin.js
import {
  cerrarOtrasSesiones,
  comprobarPassword,
  credenciales,
  cuotaDiaria,
  db,
  frenoDeIntentos,
  hashPassword,
  hoy,
  HttpError,
  Raw,
  secretosDeRecuperacionActivos,
  str,
  sumarDias,
  uuid,
  validarPassword,
  verifyPassword,
} from "@dualstudio/comun/servidor";
import { env } from "./env.js";
import {
  accesoACliente,
  clientesDe,
  conSesion,
  exigirEditor,
  SESION,
  usuarioDe,
} from "./sesion.js";
import {
  esClaveObjetivo,
  esIdPublicacion,
  unir,
  validarCambiosObjetivo,
  validarCambiosPublicacion,
} from "./validar.js";
import { borrarImagenes, decodificar, guardarImagen, leerImagen } from "./almacen.js";
import { tocar } from "./cambios.js";
import { datosDeRedes } from "./redes/rutas.js";
import { datosDeAds } from "./ads.js";
import { alCambiarLink } from "./redes/sync.js";

// Topes diarios por cliente (en la base): frenan un uso desbocado antes de que agote la cuota gratuita de la cuenta.
const TOPE_ESCRITURAS_DIA = 5000;
const TOPE_IMAGENES_DIA = 200;

export { tocar };

const escritura = async (ctx) => {
  exigirEditor(ctx);
  await cuotaDiaria(
    `escrituras|${ctx.cliente.id}`,
    TOPE_ESCRITURAS_DIA,
    "Se alcanzó el límite de cambios de hoy para este cliente. Intenta de nuevo mañana.",
  );
};

const json = (t) => {
  try {
    return JSON.parse(t || "{}") || {};
  } catch {
    return {};
  }
};
const publicacion = (f) => ({
  ...json(f.datos),
  id: f.id,
  createdAt: f.creado_en,
  createdBy: f.creado_por,
  updatedAt: f.actualizado_en,
  updatedBy: f.actualizado_por,
});
const objetivo = (f) => ({
  ...json(f.datos),
  id: f.clave,
  createdAt: f.creado_en,
  createdBy: f.creado_por,
  updatedAt: f.actualizado_en,
  updatedBy: f.actualizado_por,
});
const usuarioPublico = (u) => ({
  id: u.id,
  email: u.email,
  nombre: u.nombre,
  es_admin: !!u.es_admin,
});

const ATRASO_MAX = 30; // «Atrasados»: posts sin publicar con fecha de hasta 30 días atrás
const DIAS_PROXIMOS = 7; // hoy y los 7 días siguientes

export function registrarRutas(r) {
  const C = { cliente: true, auth: accesoACliente };

  // ── Cuenta ──
  r.add("POST", "/api/login", async (ctx) => {
    const { email, password } = credenciales(ctx.body);
    if (!email || !password) throw new HttpError(400, "Escribe tu correo y tu contraseña.");
    const freno = frenoDeIntentos(`p|${email}|${ctx.ip}`, ctx.ip);
    const u = await db.get(
      "SELECT id, email, nombre, password_hash, es_admin, activo, sesion_version FROM usuarios WHERE email = ?",
      [email],
    );
    if (!(await comprobarPassword(password, u?.password_hash)) || !u.activo) {
      freno.fallo();
      throw new HttpError(401, "Correo o contraseña incorrectos.");
    }
    freno.exito();
    ctx.setCookies.push(SESION.emitir(u));
    const clientes = await clientesDe(u);
    // Con un solo cliente se entra directo; si no, la página de inicio deja elegir.
    const destino = !u.es_admin && clientes.length === 1
      ? `${env.basePath}/${clientes[0].slug}`
      : null;
    return { usuario: usuarioPublico(u), destino };
  });

  r.add("POST", "/api/logout", async (ctx) => {
    ctx.setCookies.push(SESION.cerrar());
    return { ok: true };
  });

  r.add("GET", "/api/sesion", async (ctx) => {
    const u = await usuarioDe(ctx.cookies);
    if (!u) return { usuario: null };
    const clientes = (await clientesDe(u)).map((c) => ({
      slug: c.slug,
      nombre: c.nombre,
      handle: c.handle,
      activo: !!c.activo,
      rol: c.rol,
    }));
    return {
      usuario: usuarioPublico(u),
      clientes,
      secretos_recuperacion: u.es_admin ? secretosDeRecuperacionActivos() : false,
    };
  });

  // «Próximos» del inicio: posts sin publicar de los clientes activos que tienes asignados, con fecha desde hace
  // ATRASO_MAX días (los atrasados) hasta dentro de DIAS_PROXIMOS días.
  r.add("GET", "/api/proximos", { auth: conSesion }, async ({ usuario }) => {
    const dia = hoy();
    const clientes = usuario.es_admin
      ? "SELECT id FROM clientes WHERE activo = 1"
      : "SELECT a.cliente_id FROM accesos a JOIN clientes c ON c.id = a.cliente_id WHERE a.usuario_id = ? AND c.activo = 1";
    const filas = await db.all(
      `SELECT p.id, p.datos, c.slug, c.nombre
         FROM publicaciones p JOIN clientes c ON c.id = p.cliente_id
        WHERE p.cliente_id IN (${clientes})
          AND json_extract(p.datos, '$.date') BETWEEN ? AND ?
          AND COALESCE(json_extract(p.datos, '$.status'), 'idea') <> 'publicado'
        ORDER BY json_extract(p.datos, '$.date'), c.nombre`,
      [...(usuario.es_admin ? [] : [usuario.id]), sumarDias(dia, -ATRASO_MAX), sumarDias(dia, DIAS_PROXIMOS)],
    );
    const posts = [];
    for (const f of filas) {
      let d;
      try {
        d = JSON.parse(f.datos);
      } catch {
        continue;
      }
      posts.push({
        id: f.id,
        cliente: { slug: f.slug, nombre: f.nombre },
        title: typeof d.title === "string" ? d.title.slice(0, 200) : "",
        format: d.format || "reel",
        platforms: Array.isArray(d.platforms) ? d.platforms : [],
        date: d.date,
        status: d.status || "idea",
      });
    }
    return { hoy: dia, hasta: sumarDias(dia, DIAS_PROXIMOS), posts };
  });

  r.add("PUT", "/api/cuenta", { auth: conSesion }, async ({ usuario, body }) => {
    const nombre = str(body.nombre, 80);
    if (!nombre) throw new HttpError(400, "Escribe tu nombre.");
    await db.run("UPDATE usuarios SET nombre = ? WHERE id = ?", [nombre, usuario.id]);
    return { ok: true };
  });

  r.add(
    "POST",
    "/api/cuenta/password",
    { auth: conSesion },
    async ({ usuario, body, setCookies }) => {
      if (
        !(await verifyPassword(String(body.actual || ""), usuario.password_hash))
      ) throw new HttpError(400, "La contraseña actual no es correcta.");
      const hash = await hashPassword(validarPassword(body.nueva));
      await db.run("UPDATE usuarios SET password_hash = ? WHERE id = ?", [hash, usuario.id]);
      setCookies.push(SESION.emitir({ ...usuario, password_hash: hash }));
      return { ok: true };
    },
  );

  r.add(
    "POST",
    "/api/cuenta/sesiones/cerrar",
    { auth: conSesion },
    async ({ usuario, setCookies }) => {
      const sv = await cerrarOtrasSesiones("usuarios", usuario);
      setCookies.push(SESION.emitir({ ...usuario, sesion_version: sv }));
      return { ok: true };
    },
  );

  // ── Datos de un cliente ──
  // ?desde=<version>: si no hubo cambios desde esa versión, responde sin_cambios (una sola lectura en la base).
  r.add("GET", "/api/datos", C, async ({ cliente, rol, usuario, query }) => {
    const version = Number(cliente.cambiado_en) || 0;
    if (query.desde !== undefined && Number(query.desde) === version) {
      return { sin_cambios: true, version };
    }
    const publicaciones =
      (await db.all("SELECT * FROM publicaciones WHERE cliente_id = ?", [cliente.id])).map(
        publicacion,
      );
    const objetivos = (await db.all("SELECT * FROM objetivos WHERE cliente_id = ?", [cliente.id]))
      .map(objetivo);
    const ids = new Set(
      [...publicaciones, ...objetivos].flatMap((x) => [x.createdBy, x.updatedBy]).filter(Boolean),
    );
    const nombres = {};
    if (ids.size) {
      const lista = [...ids].slice(0, 90);
      for (
        const u of await db.all(
          `SELECT id, nombre, email FROM usuarios WHERE id IN (${lista.map(() => "?").join(",")})`,
          lista,
        )
      ) {
        nombres[u.id] = u.nombre || u.email;
      }
    }
    return {
      version,
      cliente: {
        slug: cliente.slug,
        nombre: cliente.nombre,
        handle: cliente.handle || "",
        activo: !!cliente.activo,
      },
      rol,
      yo: usuario.id,
      publicaciones,
      objetivos,
      ajustes: { handle: cliente.handle || "" },
      nombres,
      // Métricas de redes: conexiones, métricas de cada post vinculado y cifras de la cuenta por mes.
      ...(await datosDeRedes(cliente.id)),
      // Ads: presupuesto de cada mes y posts impulsados.
      ads: await datosDeAds(cliente.id),
      // Para la barra superior: si puede cambiar de cliente o ir a la administración.
      navegacion: { clientes: (await clientesDe(usuario)).length, es_admin: !!usuario.es_admin },
    };
  });

  r.add("POST", "/api/publicaciones", C, async (ctx) => {
    await escritura(ctx);
    const { cliente, usuario, body } = ctx;
    const id = body.id === undefined ? `p${uuid().replace(/-/g, "").slice(0, 16)}` : body.id;
    if (!esIdPublicacion(id)) throw new HttpError(400, "El identificador no es válido.");
    const datos = unir({}, validarCambiosPublicacion(body.datos), "publicacion");
    const ahora = Date.now();
    try {
      await db.run(
        "INSERT INTO publicaciones (id, cliente_id, datos, creado_en, creado_por, actualizado_en, actualizado_por) VALUES (?,?,?,?,?,?,?)",
        [id, cliente.id, JSON.stringify(datos), ahora, usuario.id, ahora, usuario.id],
      );
    } catch (e) {
      if (/UNIQUE|PRIMARY KEY/i.test(String(e?.message))) {
        throw new HttpError(409, "Ya existe una publicación con ese identificador.");
      }
      throw e;
    }
    if (datos.igLink) await alCambiarLink(cliente.id, id, "ig", datos.igLink);
    await tocar(cliente.id);
    return { id };
  });

  r.add("PATCH", "/api/publicaciones/:id", C, async (ctx) => {
    await escritura(ctx);
    const { cliente, usuario, body, params } = ctx;
    const f = await db.get("SELECT datos FROM publicaciones WHERE id = ? AND cliente_id = ?", [
      params.id,
      cliente.id,
    ]);
    if (!f) throw new HttpError(404, "La publicación no existe. Puede que se haya eliminado.");
    const cambios = validarCambiosPublicacion(body.cambios);
    const datos = unir(json(f.datos), cambios, "publicacion");
    await db.run(
      "UPDATE publicaciones SET datos = ?, actualizado_en = ?, actualizado_por = ? WHERE id = ? AND cliente_id = ?",
      [JSON.stringify(datos), Date.now(), usuario.id, params.id, cliente.id],
    );
    if ("igLink" in cambios) await alCambiarLink(cliente.id, params.id, "ig", cambios.igLink);
    await tocar(cliente.id);
    return { ok: true };
  });

  r.add("DELETE", "/api/publicaciones/:id", C, async (ctx) => {
    await escritura(ctx);
    const { cliente, params } = ctx;
    const f = await db.get("SELECT datos FROM publicaciones WHERE id = ? AND cliente_id = ?", [
      params.id,
      cliente.id,
    ]);
    if (!f) return { ok: true };
    // Las miniaturas de sus métricas también se van.
    const miniaturas = (await db.all(
      "SELECT miniatura_id FROM redes_posts WHERE publicacion_id = ? AND miniatura_id IS NOT NULL",
      [params.id],
    )).map((x) => x.miniatura_id);
    await db.run("DELETE FROM publicaciones WHERE id = ? AND cliente_id = ?", [
      params.id,
      cliente.id,
    ]);
    // Sus imágenes se van con ella, para no ocupar espacio de más.
    const imgs = (json(f.datos).refImgs || []).map((x) => x && x.id).concat(miniaturas);
    await borrarImagenes(cliente.id, imgs);
    await tocar(cliente.id);
    return { ok: true };
  });

  // Objetivos: se crean al primer cambio (m-AAAA-MM o q-AAAA-N)
  r.add("PATCH", "/api/objetivos/:clave", C, async (ctx) => {
    await escritura(ctx);
    const { cliente, usuario, body, params } = ctx;
    if (!esClaveObjetivo(params.clave)) throw new HttpError(400, "El periodo no es válido.");
    const cambios = validarCambiosObjetivo(body.cambios);
    const f = await db.get("SELECT datos FROM objetivos WHERE cliente_id = ? AND clave = ?", [
      cliente.id,
      params.clave,
    ]);
    const datos = unir(f ? json(f.datos) : {}, cambios, "objetivo");
    const ahora = Date.now();
    if (f) {
      await db.run(
        "UPDATE objetivos SET datos = ?, actualizado_en = ?, actualizado_por = ? WHERE cliente_id = ? AND clave = ?",
        [JSON.stringify(datos), ahora, usuario.id, cliente.id, params.clave],
      );
    } else {
      await db.run(
        "INSERT INTO objetivos (cliente_id, clave, datos, creado_en, creado_por, actualizado_en, actualizado_por) VALUES (?,?,?,?,?,?,?)",
        [cliente.id, params.clave, JSON.stringify(datos), ahora, usuario.id, ahora, usuario.id],
      );
    }
    await tocar(cliente.id);
    return { ok: true };
  });

  // La cuenta de Instagram del cliente solo la cambia un administrador (en la parrilla se ve, no se edita).
  r.add("PATCH", "/api/ajustes", C, async (ctx) => {
    await escritura(ctx);
    if (!ctx.usuario.es_admin) {
      throw new HttpError(403, "Solo un administrador puede cambiar la cuenta de Instagram del cliente.");
    }
    const handle = str(ctx.body.handle, 60);
    await db.run("UPDATE clientes SET handle = ? WHERE id = ?", [handle || null, ctx.cliente.id]);
    await tocar(ctx.cliente.id);
    return { ok: true };
  });

  // ── Imágenes de referencia ──
  r.add("POST", "/api/imagenes", { ...C, maxBody: 600_000 }, async (ctx) => {
    exigirEditor(ctx);
    await cuotaDiaria(
      `imagenes|${ctx.cliente.id}`,
      TOPE_IMAGENES_DIA,
      "Se alcanzó el límite de imágenes de hoy para este cliente.",
    );
    const { tipo, bytes } = decodificar(ctx.body.datos, ctx.body.tipo);
    return guardarImagen({ clienteId: ctx.cliente.id, tipo, bytes, usuarioId: ctx.usuario.id });
  });

  r.add("GET", "/api/imagenes/:id", C, async ({ cliente, params }) => {
    const img = await leerImagen(cliente.id, params.id);
    if (!img) throw new HttpError(404, "La imagen no existe.");
    // El contenido de una imagen nunca cambia (cada una tiene su id): el navegador la guarda y no la vuelve a pedir.
    return new Raw(img.bytes, img.tipo, {
      "cache-control": "private, max-age=31536000, immutable",
    });
  });

  r.add("DELETE", "/api/imagenes/:id", C, async (ctx) => {
    exigirEditor(ctx);
    await borrarImagenes(ctx.cliente.id, [ctx.params.id]);
    return { ok: true };
  });
}
