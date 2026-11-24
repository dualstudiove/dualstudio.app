// Conexión de la parrilla con el servidor de Planifica.
//
// La parrilla (parrilla.js) nació como artefacto de claude.ai y habla con «window.claude.use(…)»: una base de datos
// compartida en vivo (db), el usuario (user), las imágenes (assets) y las descargas (downloads). Este archivo ofrece
// esa misma interfaz sobre la API de Planifica, así la parrilla conserva su comportamiento sin reescribirse:
//
//   db.collection('posts' | 'goals').onSnapshot(cb)       → /<cliente>/api/datos (y refresco cada 30 s)
//   db.doc('posts/<id>').set / update / delete             → /<cliente>/api/publicaciones
//   db.doc('goals/<clave>').set / update                   → /<cliente>/api/objetivos/<clave>
//   db.doc('settings/account').update({ handle })          → /<cliente>/api/ajustes
//   user.id() · user.can('data.write') · user.profiles()   → quién eres, tu papel y los nombres del equipo
//   assets.upload(blob) / delete(id)                        → /<cliente>/api/imagenes
//   downloads.save({ filename, data })                      → descarga normal del navegador
//
// Los cambios propios que aún no confirmó el servidor se superponen a lo que llega en cada refresco, para que nada
// de lo que escribes «salte hacia atrás».
import { basePath, crearApi } from "../_ds/comun/web/api.js";

const BASE = basePath(import.meta.url, 1);
const CLIENTE = decodeURIComponent(location.pathname.slice(BASE.length).split("/")[1] || "")
  .toLowerCase();
// Vista del cliente (<base>/<cliente>/preview): la misma parrilla en modo lectura, para mostrársela al cliente.
const PREVIEW = location.pathname.slice(BASE.length).split("/")[2] === "preview";
const API = `${BASE}/${CLIENTE}`;
const api = crearApi((ruta) => API + ruta);
const apiRaiz = crearApi((ruta) => BASE + ruta);
const REFRESCO_MS = 30_000;

// Para parrilla.js: dirección de una imagen de referencia (img + id), métricas de redes (redes) y llamadas a la
// API que no son de la base compartida (api: vincular, actualizar, miniaturas, resultados).
window.PLANIFICA = {
  img: `${API}/api/imagenes/`,
  base: BASE,
  cliente: CLIENTE,
  preview: PREVIEW,
  ads: { presupuestos: {}, impulsos: [] },
  redes: { conexiones: {}, metricas: {}, cuentaMes: {} },
  api: (ruta, opciones) => api(ruta, opciones),
  url: (ruta) => API + ruta,
  /** Pide los datos de nuevo (tras vincular o actualizar métricas) y avisa a la parrilla si cambiaron. */
  refrescar: () => refrescar().then(() => programar()),
};

let estado = null; // última respuesta completa de /api/datos
const oyentes = { posts: [], goals: [], account: [] };
const superpuesto = new Map(); // ruta → { op: 'set' | 'patch' | 'delete', datos }

function irAlInicio() {
  location.replace(`${BASE}/?volver=${encodeURIComponent(location.pathname + location.hash)}`);
}

function aplicarSuperpuesto(col, docs) {
  const m = new Map(docs.map((d) => [d.id, { ...d }]));
  for (const [ruta, s] of superpuesto) {
    const [c, id] = ruta.split("/");
    if (c !== col) continue;
    if (s.op === "delete") m.delete(id);
    else if (s.op === "set") m.set(id, { ...s.datos, id });
    else m.set(id, { ...(m.get(id) || { id }), ...s.datos });
  }
  return [...m.values()];
}
const pendientes = (col) => [...superpuesto.keys()].some((r) => r.startsWith(`${col}/`));

function instantanea(col) {
  const base = col === "posts" ? estado.publicaciones : estado.objetivos;
  const docs = aplicarSuperpuesto(col, base).map((d) => {
    const { id, ...datos } = d;
    return { id, data: () => datos };
  });
  return { docs, metadata: { fromCache: false, hasPendingWrites: pendientes(col) } };
}
function instantaneaCuenta() {
  const s = superpuesto.get("settings/account");
  const datos = { ...estado.ajustes, ...(s ? s.datos : {}) };
  return {
    exists: true,
    data: () => datos,
    metadata: { fromCache: false, hasPendingWrites: Boolean(s) },
  };
}
function avisar() {
  if (!estado) return;
  for (const cb of oyentes.posts) cb(instantanea("posts"));
  for (const cb of oyentes.goals) cb(instantanea("goals"));
  for (const cb of oyentes.account) cb(instantaneaCuenta());
}

function pintarCabecera() {
  const c = estado.cliente;
  document.title = `${c.nombre} · Planifica`;
  const nombre = document.getElementById("cliente-nombre");
  if (nombre) nombre.textContent = c.nombre;
  const nuevo = document.getElementById("newPost");
  if (nuevo) nuevo.hidden = estado.rol !== "editor" || PREVIEW; // solo lectura: no puede crear
  const acct = document.getElementById("acct");
  if (acct) acct.readOnly = estado.rol !== "editor" || PREVIEW;
  // «Ver como cliente» (para quien edita) y, dentro de esa vista, la franja para salir.
  const ver = document.getElementById("verCliente");
  if (ver) {
    ver.hidden = estado.rol !== "editor" || PREVIEW;
    ver.href = `${API}/preview${location.hash}`;
  }
  if (PREVIEW && !document.getElementById("franjaPreview")) {
    const f = document.createElement("div");
    f.id = "franjaPreview";
    f.className = "franja-preview";
    f.innerHTML = '<span><b>Vista del cliente.</b> Así ve el cliente su parrilla: sin botones para editar.</span>';
    const a = document.createElement("a");
    a.className = "btn sm";
    a.textContent = "Salir de la vista";
    a.addEventListener("click", (e) => {
      e.preventDefault();
      location.href = `${API}${location.hash}`;
    });
    a.href = API;
    f.appendChild(a);
    document.body.prepend(f);
  }
  // «← Mis clientes» vuelve al inicio (lista de clientes, tu cuenta y, si eres administrador, el equipo);
  // «Salir» cierra la sesión.
  const volver = document.getElementById("volver");
  // La cabecera se repinta con cada refresco: el selector se engancha una sola vez (si no, con dos oyentes uno abre
  // el popup y el otro lo cierra en el mismo clic).
  if (volver && !volver.dataset.selector) {
    volver.dataset.selector = "1";
    volver.href = `${BASE}/`;
    volver.setAttribute("aria-haspopup", "dialog");
    volver.setAttribute("aria-expanded", "false");
    volver.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; // abrir en otra pestaña: el inicio, como siempre
      e.preventDefault();
      if (document.getElementById("cliPop")) cerrarSelector();
      else abrirSelector(volver);
    });
  }
}

// ── Selector rápido de clientes (el nombre con las flechitas) ──
// Abre una lista de tus clientes para saltar de uno a otro sin pasar por el inicio. Se mantiene la pestaña en la
// que estabas (Rendimiento, Lista…), salvo el detalle de un post, que es de este cliente.
let clientesCache = null;
const escHtml = (t) =>
  String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function cerrarSelector() {
  const pop = document.getElementById("cliPop");
  if (pop) pop.remove();
  document.removeEventListener("mousedown", fueraDelSelector, true);
  document.removeEventListener("keydown", teclaSelector, true);
  window.removeEventListener("resize", cerrarSelector);
  const v = document.getElementById("volver");
  if (v) v.setAttribute("aria-expanded", "false");
}
function fueraDelSelector(e) {
  const pop = document.getElementById("cliPop"), v = document.getElementById("volver");
  if (pop && !pop.contains(e.target) && !(v && v.contains(e.target))) cerrarSelector();
}
function teclaSelector(e) {
  const pop = document.getElementById("cliPop");
  if (!pop) return;
  if (e.key === "Escape") {
    e.preventDefault();
    cerrarSelector();
    document.getElementById("volver")?.focus();
    return;
  }
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  const items = [...pop.querySelectorAll(".cp-it:not([hidden])")];
  if (!items.length) return;
  e.preventDefault();
  const i = items.indexOf(document.activeElement);
  const j = e.key === "ArrowDown" ? (i + 1) % items.length : i <= 0 ? items.length - 1 : i - 1;
  items[j].focus();
}
function destinoDe(slug) {
  const h = location.hash.startsWith("#post-") ? "" : location.hash;
  return `${BASE}/${encodeURIComponent(slug)}${PREVIEW ? "/preview" : ""}${h}`;
}
function pintarSelector(pop, clientes) {
  const activos = clientes.filter((c) => c.activo || c.slug === CLIENTE);
  const buscar = activos.length > 6;
  pop.innerHTML =
    (buscar
      ? '<input class="in cp-q" type="search" placeholder="Buscar cliente…" aria-label="Buscar cliente" autocomplete="off">'
      : "") +
    `<div class="cp-list" role="list">${activos
      .map(
        (c) =>
          `<a class="cp-it" role="listitem" href="${escHtml(destinoDe(c.slug))}" data-q="${escHtml(
            `${c.nombre} ${c.handle || ""}`.toLowerCase(),
          )}"${c.slug === CLIENTE ? ' aria-current="page"' : ""}><b>${escHtml(c.nombre)}</b>${
            c.handle ? `<span>@${escHtml(String(c.handle).replace(/^@/, ""))}</span>` : ""
          }${c.slug === CLIENTE ? '<i aria-hidden="true">✓</i>' : ""}</a>`,
      )
      .join("")}</div>` +
    '<p class="cp-vacio" hidden>Ningún cliente con ese nombre.</p>' +
    `<a class="cp-todos" href="${BASE}/">Ver todos los clientes</a>`;
  const q = pop.querySelector(".cp-q");
  if (q) {
    q.addEventListener("input", () => {
      const t = q.value.trim().toLowerCase();
      let n = 0;
      for (const it of pop.querySelectorAll(".cp-it")) {
        it.hidden = !!t && !it.dataset.q.includes(t);
        if (!it.hidden) n++;
      }
      pop.querySelector(".cp-vacio").hidden = n > 0;
    });
    q.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const it = pop.querySelector(".cp-it:not([hidden])");
      if (it) location.href = it.href;
    });
    q.focus();
  } else {
    (pop.querySelector('.cp-it[aria-current="page"]') || pop.querySelector(".cp-it"))?.focus();
  }
}
async function abrirSelector(boton) {
  const pop = document.createElement("div");
  pop.id = "cliPop";
  pop.className = "cli-pop";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "Cambiar de cliente");
  const r = boton.getBoundingClientRect();
  pop.style.top = `${Math.round(r.bottom + 6)}px`;
  pop.style.left = `${Math.max(8, Math.min(Math.round(r.left), window.innerWidth - 288))}px`;
  pop.innerHTML = '<p class="cp-vacio">Cargando clientes…</p>';
  document.body.appendChild(pop);
  boton.setAttribute("aria-expanded", "true");
  document.addEventListener("mousedown", fueraDelSelector, true);
  document.addEventListener("keydown", teclaSelector, true);
  window.addEventListener("resize", cerrarSelector);
  if (clientesCache) pintarSelector(pop, clientesCache);
  try {
    const s = await apiRaiz("/api/sesion");
    if (!document.body.contains(pop)) return;
    const antes = JSON.stringify(clientesCache);
    clientesCache = s.clientes || [];
    if (antes !== JSON.stringify(clientesCache) || !pop.querySelector(".cp-list")) pintarSelector(pop, clientesCache);
  } catch {
    if (document.body.contains(pop) && !clientesCache) {
      pop.innerHTML = `<p class="cp-vacio">No se pudo cargar la lista.</p><a class="cp-todos" href="${BASE}/">Ver todos los clientes</a>`;
    }
  }
}

async function refrescar() {
  const desde = estado ? `?desde=${estado.version}` : "";
  let r;
  try {
    r = await api(`/api/datos${desde}`);
  } catch (e) {
    if (e.status === 401) return irAlInicio();
    if (!estado) throw e;
    return; // sin conexión: se reintenta en el próximo refresco
  }
  if (r.sin_cambios) return;
  estado = r;
  window.PLANIFICA.redes = {
    conexiones: r.redes || {},
    metricas: r.metricas || {},
    cuentaMes: r.cuentaMes || {},
  };
  // Para los avisos «Conectar Instagram»: solo un administrador puede conectarla.
  window.PLANIFICA.esAdmin = !PREVIEW && !!(r.navegacion && r.navegacion.es_admin);
  window.PLANIFICA.ads = r.ads || { presupuestos: {}, impulsos: [] };
  pintarCabecera();
  avisar();
}

// Refresco: cada 30 s con la pestaña visible, al volver a ella y poco después de cada cambio propio.
let temporizador = null;
function programar(ms = REFRESCO_MS) {
  clearTimeout(temporizador);
  temporizador = setTimeout(async () => {
    if (document.visibilityState === "visible") await refrescar();
    programar();
  }, ms);
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") programar(200);
});

function error(e) {
  const err = new Error(e.message);
  err.code = e.status === 404
    ? "invalid_argument"
    : e.status === 413 || e.status === 429
    ? "quota_exceeded"
    : e.status === 403
    ? "permission_denied"
    : "unavailable";
  return err;
}

/** Ejecuta una escritura: se ve al instante (superpuesta) y se confirma con el servidor. */
async function escribir(ruta, op, datos, peticion) {
  const previo = superpuesto.get(ruta);
  const nuevo = op === "patch" && previo && previo.op !== "delete"
    ? { op: previo.op, datos: { ...previo.datos, ...datos } }
    : { op, datos };
  superpuesto.set(ruta, nuevo);
  avisar();
  try {
    await peticion();
  } catch (e) {
    if (superpuesto.get(ruta) === nuevo) superpuesto.delete(ruta);
    avisar();
    throw error(e);
  }
  await refrescar().catch(() => {});
  if (superpuesto.get(ruta) === nuevo) superpuesto.delete(ruta);
  avisar();
  programar(); // reinicia la cuenta: acabamos de refrescar
}

function documento(ruta) {
  const [col, id] = ruta.split("/");
  const enc = encodeURIComponent(id);
  if (col === "posts") {
    return {
      set: (datos) =>
        escribir(
          ruta,
          "set",
          datos,
          () => api("/api/publicaciones", { method: "POST", body: { id, datos } }),
        ),
      update: (cambios) =>
        escribir(
          ruta,
          "patch",
          cambios,
          () => api(`/api/publicaciones/${enc}`, { method: "PATCH", body: { cambios } }),
        ),
      delete: () =>
        escribir(
          ruta,
          "delete",
          null,
          () => api(`/api/publicaciones/${enc}`, { method: "DELETE" }),
        ),
    };
  }
  if (col === "goals") {
    const guardar = (cambios) =>
      escribir(
        ruta,
        "patch",
        cambios,
        () => api(`/api/objetivos/${enc}`, { method: "PATCH", body: { cambios } }),
      );
    return { set: guardar, update: guardar, delete: () => guardar({}) };
  }
  if (ruta === "settings/account") {
    const guardar = (cambios) =>
      escribir(
        ruta,
        "patch",
        cambios,
        () =>
          api("/api/ajustes", {
            method: "PATCH",
            body: { handle: cambios.handle ?? estado.ajustes.handle },
          }),
      );
    return {
      set: guardar,
      update: guardar,
      onSnapshot(cb) {
        oyentes.account.push(cb);
        if (estado) cb(instantaneaCuenta());
        return () => {};
      },
    };
  }
  throw new Error(`Documento desconocido: ${ruta}`);
}

const db = {
  collection(nombre) {
    return {
      onSnapshot(cb) {
        oyentes[nombre].push(cb);
        if (estado) cb(instantanea(nombre));
        return () => {};
      },
    };
  },
  doc: documento,
};

const user = {
  id: () => estado.yo,
  can: (permiso) => (permiso === "data.write" ? estado.rol === "editor" && !PREVIEW : false),
  profiles: async (ids) =>
    Object.fromEntries(ids.map((id) => [id, { name: estado.nombres[id] || "" }])),
};

const leerComoDataUrl = (blob) =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej(new Error("No se pudo leer la imagen."));
    fr.readAsDataURL(blob);
  });

const assets = {
  async upload(blob) {
    try {
      return await api("/api/imagenes", {
        method: "POST",
        body: { datos: await leerComoDataUrl(blob) },
      });
    } catch (e) {
      throw error(e);
    }
  },
  delete: (id) =>
    api(`/api/imagenes/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {}),
};

const downloads = {
  async save({ filename, data }) {
    const blob = data instanceof Blob ? data : new Blob([data], {
      type: filename.endsWith(".pdf") ? "application/pdf" : "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  },
};

// Primera carga. Si no hay sesión, a iniciar sesión; si no hay acceso a este cliente, se explica.
const listo = refrescar().then(() => {
  programar();
  return true;
}, (e) => {
  const main = document.getElementById("main");
  if (main) {
    main.innerHTML =
      '<div class="empty" style="margin-top:24px"><h3></h3><p></p><div class="acts"><a class="btn" href="">Ir a mis clientes</a></div></div>';
    main.querySelector("h3").textContent = e.status === 404
      ? "No tienes acceso a este cliente"
      : "No se pudo cargar";
    main.querySelector("p").textContent = e.status === 404
      ? "Puede que no exista o que no te hayan dado acceso. Pídeselo a un administrador."
      : e.message;
    main.querySelector("a").href = `${BASE}/`;
  }
  return false;
});

const capacidades = { db, user, assets, downloads };
window.claude = {
  // Si la carga falló, la parrilla se queda esperando: así no tapa el mensaje de arriba.
  use: (nombre) =>
    listo.then((ok) => {
      if (!ok) return new Promise(() => {});
      if (!capacidades[nombre]) throw new Error(`No disponible: ${nombre}`);
      return capacidades[nombre];
    }),
};

document.getElementById("salir")?.addEventListener("click", async () => {
  await apiRaiz("/api/logout", { method: "POST" }).catch(() => {});
  location.replace(`${BASE}/`);
});

// «Ver como cliente» abre la misma vista (pestaña) en la que estás.
window.addEventListener("hashchange", () => {
  const v = document.getElementById("verCliente");
  if (v) v.href = `${API}/preview${location.hash}`;
});
