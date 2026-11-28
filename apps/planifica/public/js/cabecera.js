// Cabecera común de Planifica (inicio, configuración y parrilla de una marca):
//
//   [▦ Planifica] | [Todos ⇅ / Marca ⇅]  …acciones…  [foto ▾]
//
//  · El selector (nombre con flechitas) abre la lista: «Todos» (el inicio) y tus marcas, cada una con su color.
//  · La foto (o las iniciales) abre el menú de la cuenta: Mi cuenta, Personas y Marcas (administradores) y
//    Cerrar sesión.
// Estilos: parrilla.css (barra superior y selector) y componentes.css (foto y menú de la cuenta).
import { basePath, crearApi } from "../_ds/comun/web/api.js";

const BASE = basePath(import.meta.url, 1);
const apiRaiz = crearApi((ruta) => BASE + ruta);

/** Los 8 colores de marca (los mismos que COLORES_MARCA en src/validar.js y --marca-* en tema.css). */
export const COLORES_MARCA = ["frambuesa", "azul", "verde", "ambar", "morado", "cian", "coral", "oliva"];
export const NOMBRES_COLOR = {
  frambuesa: "Frambuesa",
  azul: "Azul",
  verde: "Verde",
  ambar: "Ámbar",
  morado: "Morado",
  cian: "Cian",
  coral: "Coral",
  oliva: "Oliva",
};
/** Color de una marca: el elegido o, si no tiene, uno por orden (siempre el mismo para la misma lista). */
export function colorDe(marca, i) {
  return COLORES_MARCA.includes(marca.color) ? marca.color : COLORES_MARCA[i % COLORES_MARCA.length];
}
/** Lista de marcas → Map slug → { …marca, color } */
export function marcasConColor(lista) {
  return new Map(lista.map((c, i) => [c.slug, { ...c, color: colorDe(c, i) }]));
}

export const esc = (t) =>
  String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function iniciales(u) {
  const base = String((u && (u.nombre || u.email)) || "?").trim();
  const partes = base.split(/[\s@._-]+/).filter(Boolean);
  return ((partes[0] || "?").charAt(0) + (partes.length > 1 && u.nombre ? partes[1].charAt(0) : "")).toUpperCase();
}
/** Foto de perfil (o iniciales). `cls`: tamaño (av-sm, av-lg). */
export function avatar(u, cls = "") {
  const c = `av${cls ? ` ${cls}` : ""}`;
  if (u && u.foto_v) {
    return `<span class="${c}"><img src="${esc(`${BASE}/api/fotos/${encodeURIComponent(u.id)}?v=${u.foto_v}`)}" alt=""></span>`;
  }
  return `<span class="${c}" aria-hidden="true">${esc(iniciales(u))}</span>`;
}

const FLECHAS =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 6.5l3-3 3 3M5 9.5l3 3 3-3" /></svg>';
const MARCA_PLANIFICA =
  '<i class="on"></i><i></i><i></i><i></i><i class="on"></i><i></i><i></i><i></i><i class="on"></i>';

/**
 * HTML de la barra superior para las páginas que la pintan con JavaScript (inicio y configuración). La parrilla
 * la trae en parrilla.html con los mismos elementos (#volver, #cliente-nombre, #acct, #avatar).
 */
export function barraHtml({ nombre = "Todos", sub = "", acciones = "" } = {}) {
  return `<div class="top-row">
    <div class="brand"><a href="${esc(BASE)}/" class="mark" aria-label="Planifica: inicio">${MARCA_PLANIFICA}</a><span class="brand-name">Planifica</span></div>
    <span class="tsep" aria-hidden="true"></span>
    <div class="cli"><a class="cli-name" id="volver" href="${esc(BASE)}/" title="Cambiar de marca"><span class="cli-l1"><b id="cliente-nombre">${
    esc(nombre)
  }</b>${FLECHAS}</span><span class="cli-acct" id="acct"${sub ? "" : " hidden"}>${esc(sub)}</span><span class="sr">Cambiar de marca</span></a></div>
    <div class="tacts">${acciones}<span id="avatar"></span></div>
  </div>`;
}

// ── Estado compartido ──
let sesion = null; // última respuesta de /api/sesion
let pidiendo = null;
function cargarSesion(forzar) {
  if (sesion && !forzar) return Promise.resolve(sesion);
  if (!pidiendo) {
    pidiendo = apiRaiz("/api/sesion").then((s) => {
      sesion = s;
      return s;
    }).finally(() => {
      pidiendo = null;
    });
  }
  return pidiendo;
}

let opciones = { actual: null, preview: false };

/**
 * Engancha el selector y la foto. `actual`: el slug de la marca abierta (null en el inicio y la configuración).
 * `sesion`: si ya la tienes (si no, se pide). Se puede llamar varias veces (repinta la foto; el selector se
 * engancha una sola vez).
 */
export async function montarCabecera(o = {}) {
  opciones = { ...opciones, ...o };
  if (o.sesion) sesion = o.sesion;
  const volver = document.getElementById("volver");
  // Una sola vez: con dos oyentes, uno abre el popup y el otro lo cierra en el mismo clic.
  if (volver && !volver.dataset.selector) {
    volver.dataset.selector = "1";
    volver.href = `${BASE}/`;
    volver.setAttribute("aria-haspopup", "dialog");
    volver.setAttribute("aria-expanded", "false");
    volver.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; // otra pestaña: el inicio, como siempre
      e.preventDefault();
      if (document.getElementById("cliPop")) cerrarSelector();
      else abrirSelector(volver);
    });
  }
  const s = await cargarSesion().catch(() => null);
  if (s && s.usuario) pintarAvatar(s.usuario);
  return s;
}
/** Tras cambiar la foto o el nombre en Mi cuenta. */
export function actualizarUsuario(u) {
  if (sesion) sesion.usuario = { ...sesion.usuario, ...u };
  if (sesion) pintarAvatar(sesion.usuario);
}

// ── Foto y menú de la cuenta ──
function pintarAvatar(u) {
  const slot = document.getElementById("avatar");
  if (!slot) return;
  slot.innerHTML = `<button type="button" class="av-btn" id="avBtn" aria-haspopup="menu" aria-expanded="false" aria-label="Tu cuenta: ${
    esc(u.nombre || u.email)
  }">${avatar(u)}<svg class="av-chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg></button>`;
  slot.firstChild.addEventListener("click", (e) => {
    e.preventDefault();
    if (document.getElementById("avMenu")) cerrarMenuCuenta();
    else abrirMenuCuenta(e.currentTarget, u);
  });
}

const ICONOS = {
  cuenta:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="5.5" r="2.75"/><path d="M2.75 13.75c.6-2.5 2.7-4 5.25-4s4.65 1.5 5.25 4"/></svg>',
  personas:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="5.5" r="2.25"/><path d="M1.75 13c.45-2.1 2.1-3.4 4.25-3.4s3.8 1.3 4.25 3.4"/><path d="M10.5 3.4a2.25 2.25 0 0 1 0 4.2M12 9.9c1.1.5 1.9 1.5 2.25 3.1"/></svg>',
  marcas:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="5" height="5" rx="1.25"/><rect x="9" y="2" width="5" height="5" rx="1.25"/><rect x="2" y="9" width="5" height="5" rx="1.25"/><rect x="9" y="9" width="5" height="5" rx="1.25"/></svg>',
  oscuro:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.5 9.5A5.75 5.75 0 0 1 6.5 2.5a5.75 5.75 0 1 0 7 7z"/></svg>',
  claro:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06"/></svg>',
  salir:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2.75H3.75a1 1 0 0 0-1 1v8.5a1 1 0 0 0 1 1H6M10.5 11l3-3-3-3M13.25 8H6"/></svg>',
};
export { ICONOS };

function cerrarMenuCuenta() {
  document.getElementById("avMenu")?.remove();
  document.getElementById("avBtn")?.setAttribute("aria-expanded", "false");
  document.removeEventListener("mousedown", fueraDelMenu, true);
  document.removeEventListener("keydown", teclaMenu, true);
}
function fueraDelMenu(e) {
  const m = document.getElementById("avMenu"), b = document.getElementById("avBtn");
  if (m && !m.contains(e.target) && !(b && b.contains(e.target))) cerrarMenuCuenta();
}
function teclaMenu(e) {
  const m = document.getElementById("avMenu");
  if (!m) return;
  if (e.key === "Escape") {
    e.preventDefault();
    cerrarMenuCuenta();
    document.getElementById("avBtn")?.focus();
    return;
  }
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  const items = [...m.querySelectorAll("[role=menuitem]")];
  e.preventDefault();
  const i = items.indexOf(document.activeElement);
  items[e.key === "ArrowDown" ? (i + 1) % items.length : i <= 0 ? items.length - 1 : i - 1].focus();
}
function abrirMenuCuenta(boton, u) {
  cerrarMenuCuenta();
  cerrarSelector();
  const m = document.createElement("div");
  m.id = "avMenu";
  m.className = "av-menu";
  m.setAttribute("role", "menu");
  const it = (href, ico, txt) => `<a role="menuitem" href="${esc(href)}">${ICONOS[ico]}<span>${txt}</span></a>`;
  m.innerHTML = `<div class="av-yo">${avatar(u, "av-lg")}<div><b>${esc(u.nombre || "Sin nombre")}</b><span>${esc(u.email)}</span></div></div>` +
    it(`${BASE}/configuracion#cuenta`, "cuenta", "Mi cuenta") +
    (u.es_admin ? it(`${BASE}/configuracion#personas`, "personas", "Personas") + it(`${BASE}/configuracion#marcas`, "marcas", "Marcas") : "") +
    `<hr><button type="button" role="menuitem" class="av-tema">${ICONOS[oscuro() ? "claro" : "oscuro"]}<span>${
      oscuro() ? "Modo claro" : "Modo oscuro"
    }</span></button>` +
    `<button type="button" role="menuitem" class="av-salir">${ICONOS.salir}<span>Cerrar sesión</span></button>`;
  document.body.appendChild(m);
  const r = boton.getBoundingClientRect();
  m.style.top = `${Math.round(r.bottom + 6)}px`;
  m.style.left = `${Math.round(Math.max(8, Math.min(r.right - m.offsetWidth, window.innerWidth - m.offsetWidth - 8)))}px`;
  boton.setAttribute("aria-expanded", "true");
  m.querySelector(".av-tema").addEventListener("click", () => {
    cambiarTema(oscuro() ? "light" : "dark");
    cerrarMenuCuenta();
  });
  m.querySelector(".av-salir").addEventListener("click", async () => {
    await apiRaiz("/api/logout", { method: "POST" }).catch(() => {});
    location.replace(`${BASE}/`);
  });
  // Mi cuenta / Personas / Marcas dentro de la configuración: solo cambia la pestaña (hashchange).
  for (const a of m.querySelectorAll("a")) a.addEventListener("click", () => cerrarMenuCuenta());
  document.addEventListener("mousedown", fueraDelMenu, true);
  document.addEventListener("keydown", teclaMenu, true);
  m.querySelector("[role=menuitem]")?.focus();
}

// ── Modo claro / oscuro ── (tema.js lo aplica al cargar cada página; aquí se cambia y se recuerda)
function oscuro() {
  const t = document.documentElement.getAttribute("data-theme");
  if (t === "dark" || t === "light") return t === "dark";
  return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}
function cambiarTema(t) {
  document.documentElement.setAttribute("data-theme", t);
  try {
    localStorage.setItem("pl_tema", t);
  } catch {}
}

// ── Selector de marca ──
// «Todos» lleva al inicio; una marca, a su parrilla. Dentro de una marca se mantiene la pestaña en la que estabas
// (Rendimiento, Lista…), salvo el detalle de un post, que es de esa marca.
function cerrarSelector() {
  document.getElementById("cliPop")?.remove();
  document.removeEventListener("mousedown", fueraDelSelector, true);
  document.removeEventListener("keydown", teclaSelector, true);
  window.removeEventListener("resize", cerrarSelector);
  document.getElementById("volver")?.setAttribute("aria-expanded", "false");
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
  items[e.key === "ArrowDown" ? (i + 1) % items.length : i <= 0 ? items.length - 1 : i - 1].focus();
}
function destinoDe(slug) {
  const dentro = !!opciones.actual;
  const h = !dentro || location.hash.startsWith("#post-") ? "" : location.hash;
  return `${BASE}/${encodeURIComponent(slug)}${opciones.preview ? "/preview" : ""}${h}`;
}
function pintarSelector(pop, clientes) {
  const actual = opciones.actual;
  const colores = marcasConColor(clientes);
  const activos = clientes.filter((c) => c.activo || c.slug === actual);
  const buscar = activos.length > 6;
  const check = '<i aria-hidden="true">✓</i>';
  pop.innerHTML = (buscar
    ? '<input class="in cp-q" type="search" placeholder="Buscar marca…" aria-label="Buscar marca" autocomplete="off">'
    : "") +
    `<div class="cp-list" role="list"><a class="cp-it cp-todos-it" role="listitem" href="${esc(BASE)}/" data-q=""${
      actual ? "" : ' aria-current="page"'
    }><b>Todos</b><span>inicio</span>${actual ? "" : check}</a><hr>${
      activos.map((c) =>
        `<a class="cp-it" role="listitem" href="${esc(destinoDe(c.slug))}" data-q="${
          esc(`${c.nombre} ${c.handle || ""}`.toLowerCase())
        }"${c.slug === actual ? ' aria-current="page"' : ""}><i class="mdot m-${colores.get(c.slug).color}" aria-hidden="true"></i><b>${
          esc(c.nombre)
        }</b>${c.handle ? `<span>@${esc(String(c.handle).replace(/^@/, ""))}</span>` : ""}${c.slug === actual ? check : ""}</a>`
      ).join("")
    }</div><p class="cp-vacio" hidden>Ninguna marca con ese nombre.</p>`;
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
  cerrarMenuCuenta();
  const pop = document.createElement("div");
  pop.id = "cliPop";
  pop.className = "cli-pop";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "Cambiar de marca");
  const r = boton.getBoundingClientRect();
  pop.style.top = `${Math.round(r.bottom + 6)}px`;
  pop.style.left = `${Math.max(8, Math.min(Math.round(r.left), window.innerWidth - 328))}px`;
  pop.innerHTML = '<p class="cp-vacio">Cargando marcas…</p>';
  document.body.appendChild(pop);
  boton.setAttribute("aria-expanded", "true");
  document.addEventListener("mousedown", fueraDelSelector, true);
  document.addEventListener("keydown", teclaSelector, true);
  window.addEventListener("resize", cerrarSelector);
  if (sesion) pintarSelector(pop, sesion.clientes || []);
  try {
    const antes = JSON.stringify(sesion && sesion.clientes);
    const s = await cargarSesion(true);
    if (!document.body.contains(pop)) return;
    if (antes !== JSON.stringify(s.clientes) || !pop.querySelector(".cp-list")) pintarSelector(pop, s.clientes || []);
  } catch {
    if (document.body.contains(pop) && !sesion) {
      pop.innerHTML = `<p class="cp-vacio">No se pudo cargar la lista.</p><a class="cp-todos" href="${esc(BASE)}/">Ir al inicio</a>`;
    }
  }
}
