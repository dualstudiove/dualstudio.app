// Inicio de Planifica: iniciar sesión y, con sesión, «Todos»: Próximos y Calendario de todas tus marcas.
// Usa los componentes de la parrilla (parrilla.css): barra superior, pestañas, filtros, filas, calendario y menú
// de estados. La cabecera (selector de marca y foto) es cabecera.js.
import { basePath, crearApi } from "../_ds/comun/web/api.js";
import { $, esc } from "../_ds/comun/web/dom.js";
import { icon } from "../_ds/diseno/js/iconos.js";
import { toast } from "../_ds/diseno/js/componentes.js";
import { barraHtml, marcasConColor, montarCabecera } from "./cabecera.js";

const BASE = basePath(import.meta.url, 1);
const api = crearApi((ruta) => BASE + ruta);
const apiMarca = (slug, ruta, opciones) => crearApi((r) => `${BASE}/${encodeURIComponent(slug)}${r}`)(ruta, opciones);
const root = $("#root");

/** ?volver=<ruta>: solo rutas dentro de la app (nunca otro sitio). */
function volver() {
  const v = new URLSearchParams(location.search).get("volver") || "";
  return v.startsWith(`${BASE}/`) && !v.startsWith("//") && !/[\\]/.test(v) ? v : null;
}

const marcaPlanifica =
  '<span class="marca" aria-hidden="true"><i class="on"></i><i></i><i></i><i></i><i class="on"></i><i></i><i></i><i></i><i class="on"></i></span>';

function vistaLogin() {
  document.title = "Iniciar sesión · Planifica";
  root.innerHTML = `<div class="login"><div class="card">
    ${marcaPlanifica}
    <h1>Planifica</h1><p class="muted">Parrilla de contenido de Dual Studio. Entra con tu correo y tu contraseña.</p>
    <form id="f" novalidate>
      <div class="field"><label for="e">Correo</label><input id="e" type="email" autocomplete="username" required></div>
      <div class="field"><label for="p">Contraseña</label><input id="p" type="password" autocomplete="current-password" required></div>
      <div id="err" class="notice bad" role="alert" hidden></div>
      <button class="btn btn-primary btn-lg" type="submit">Entrar</button>
    </form>
    <p class="muted small login-pie">¿No tienes cuenta? Pídesela a un administrador de Dual Studio.</p>
  </div></div>`;
  $("#e").focus();
  $("#f").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const err = $("#err");
    err.hidden = true;
    const b = $("button[type=submit]", ev.target);
    b.disabled = true;
    try {
      const r = await api("/api/login", {
        method: "POST",
        body: { email: $("#e").value, password: $("#p").value },
      });
      const v = volver();
      if (v) return location.assign(v);
      if (r.destino) return location.assign(r.destino);
      await boot();
    } catch (e) {
      err.innerHTML = `${icon("warn")}<div>${esc(e.message)}</div>`;
      err.hidden = false;
      b.disabled = false;
    }
  });
}

// ── Textos e iconos (los mismos de la parrilla) ──
const ESTADOS = {
  idea: "Idea",
  contenido: "Contenido",
  porproducir: "Pautado",
  produccion: "En producción",
  terminado: "Listo",
  listo: "Por publicar",
  publicado: "Publicado",
};
const FORMATOS = { reel: "Reel", carrusel: "Carrusel", foto: "Foto", historia: "Historia", diseno: "Diseño" };
const REDES = { ig: "IG", tt: "TT" };
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre",
  "Noviembre", "Diciembre"];
const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DOW_LARGO = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const ST_ICON = {
  idea: '<circle cx="8" cy="8" r="6.25" stroke-dasharray="2.4 2.5"/>',
  contenido: '<circle cx="8" cy="8" r="6.25"/><path class="fl" d="M8 8V3.75A4.25 4.25 0 0 1 11.005 4.995z"/>',
  porproducir: '<circle cx="8" cy="8" r="6.25"/><path class="fl" d="M8 8V3.75A4.25 4.25 0 0 1 12.25 8z"/>',
  produccion: '<circle cx="8" cy="8" r="6.25"/><path class="fl" d="M8 3.75a4.25 4.25 0 0 1 0 8.5z"/>',
  terminado: '<circle cx="8" cy="8" r="6.25"/><path class="fl" d="M8 8V3.75A4.25 4.25 0 1 1 3.75 8z"/>',
  listo: '<circle cx="8" cy="8" r="6.25"/><circle class="fl" cx="8" cy="8" r="4.25"/>',
  publicado: '<circle class="fl" cx="8" cy="8" r="7"/><path class="ck" d="M5.2 8.2l1.9 1.9 3.7-4"/>',
};
const SVG = (d, w = 1.5) =>
  `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const stIcono = (k) => SVG(ST_ICON[k] || ST_ICON.idea).replace("<svg ", '<svg class="sti" ');
const CHEV =
  '<svg class="chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg>';
const FILTRO_SVG = SVG('<path d="M2 3.5h12l-4.6 5.4v3.6L6.6 14V8.9z"/>', 1.6);
const OJO_SVG = SVG('<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>');
const OJO_NO_SVG = SVG(
  '<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/><path d="M2.5 13.5l11-11"/>',
);
const TAB_PROX = SVG('<circle cx="8" cy="8" r="6"/><path d="M8 4.75V8l2.25 1.5"/>');
const TAB_CAL = SVG('<rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 6.5h12M5.5 1.75v2.5M10.5 1.75v2.5"/>');
const fmtIcono = (k) => `<img class="fi" src="${esc(`${BASE}/img/formatos/${k}.png`)}" alt="" aria-hidden="true">`;
const horaCorta = (t) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || "");
  if (!m) return "";
  const h = +m[1];
  return `${h % 12 || 12}${m[2] === "00" ? "" : `:${m[2]}`}${h < 12 ? "am" : "pm"}`;
};
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const dosD = (n) => String(n).padStart(2, "0");
const ymd = (y, m, d) => `${y}-${dosD(m + 1)}-${dosD(d)}`;
const fecha = (s) => new Date(`${s}T12:00:00`);
const dowLun = (d) => (d.getDay() + 6) % 7;
const sumarDias = (dia, n) => {
  const d = fecha(dia);
  d.setDate(d.getDate() + n);
  return ymd(d.getFullYear(), d.getMonth(), d.getDate());
};
const fechaLarga = (s) => {
  const d = fecha(s);
  const t = `${DOW_LARGO[dowLun(d)]} ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`;
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const orden = (x, y) =>
  (x.date || "9999").localeCompare(y.date || "9999") || (x.time || "99:99").localeCompare(y.time || "99:99");

// ── Estado ──
// El filtro de marca es el mismo en Próximos y en el Calendario (y se recuerda en este navegador).
const leer = (k, def) => {
  try {
    return localStorage.getItem(k) ?? def;
  } catch {
    return def;
  }
};
const guardar = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};
const E = {
  sesion: null,
  datos: null, // /api/agenda
  marcas: new Map(), // slug → marca con su color (de la lista de la sesión: el mismo color en todas partes)
  marca: leer("pl_ini_marca", "all"),
  filtrosAbiertos: false,
  verPublicados: leer("pl_ini_pub", "1") === "1",
  y: 0,
  m: 0,
  sel: null,
};

const pestana = () => (location.hash === "#calendario" || location.hash === "#agenda" ? "calendario" : "proximos");

function vistaInicio(s) {
  E.sesion = s;
  E.marcas = marcasConColor(s.clientes);
  if (E.marca !== "all" && !E.marcas.has(E.marca)) E.marca = "all";
  document.title = "Planifica";
  root.className = "";
  const activas = s.clientes.filter((c) => c.activo).length;
  root.innerHTML = `<div class="wrap" id="app"><header class="top">${
    barraHtml({ nombre: "Todos", sub: plural(activas, "marca", "marcas") })
  }<nav class="tabs" aria-label="Vistas">
      <a href="#proximos" data-nav="proximos">${TAB_PROX}<span>Próximos<i class="n" id="n-prox"></i></span></a>
      <a href="#calendario" data-nav="calendario">${TAB_CAL}<span>Calendario</span></a>
    </nav></header>${
    s.secretos_recuperacion
      ? `<div class="notice warn">${
        icon("warn")
      }<div>Los secretos <b>SUPER_EMAIL</b> y <b>SUPER_PASSWORD</b> siguen guardados en Cloudflare. Ya se usaron y no volverán a cambiar ninguna contraseña, pero conviene borrarlos: Workers y Pages → planifica → Configuración → Variables y secretos.</div></div>`
      : ""
  }<main id="main"><p class="cargando">Cargando…</p></main></div>`;
  montarCabecera({ sesion: s, actual: null });
  window.onhashchange = pintar;
  if (!s.clientes.length) {
    $("#main").innerHTML = `<div class="empty"><h3>Aún no tienes marcas</h3><p>${
      s.usuario.es_admin
        ? `Crea la primera en <a href="${esc(BASE)}/configuracion#marcas">Configuración → Marcas</a>.`
        : "Pídele a un administrador que te dé acceso."
    }</p></div>`;
    marcarPestana();
    return;
  }
  cargarDatos();
}

function marcarPestana() {
  const t = pestana();
  for (const a of root.querySelectorAll("[data-nav]")) {
    if (a.dataset.nav === t) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
}

async function cargarDatos() {
  try {
    E.datos = await api("/api/agenda");
  } catch (e) {
    const main = $("#main");
    if (main && !E.datos) main.innerHTML = `<div class="notice bad">${icon("warn")}<div>${esc(e.message)}</div></div>`;
    return;
  }
  if (!E.y) {
    const h = fecha(E.datos.hoy);
    E.y = h.getFullYear();
    E.m = h.getMonth();
  }
  pintar();
}
// Al volver a la pestaña del navegador, datos frescos (otro pudo mover posts).
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && E.datos && !DR) cargarDatos();
});

const marcaDe = (p) => E.marcas.get(p.cliente) || { nombre: p.cliente, color: "azul", rol: "lector" };
const rolDe = (slug) => (E.datos.clientes.find((c) => c.slug === slug) || {}).rol;
const editables = () => E.datos.clientes.filter((c) => c.rol === "editor" && (E.marca === "all" || c.slug === E.marca));
const visibles = () => E.datos.posts.filter((p) => E.marca === "all" || p.cliente === E.marca);

let pendientePintar = false;
function pintar() {
  if (DR) {
    pendientePintar = true; // no se repinta a mitad de un arrastre
    return;
  }
  marcarPestana();
  const main = $("#main");
  if (!main || !E.datos) return;
  const n = $("#n-prox");
  if (n) n.textContent = String(proximos().length || "");
  main.innerHTML = pestana() === "calendario" ? vistaCalendario() : vistaProximos();
}

// ── Filtros (el componente de la parrilla, con un solo filtro: Marca) ──
function barraFiltros(calendario) {
  const n = E.marca === "all" ? 0 : 1;
  let h = `<div class="toolbar"><button class="btn filter-btn" type="button" data-ag="filtros" aria-expanded="${E.filtrosAbiertos}" aria-controls="fpanel">${FILTRO_SVG}<span>Filtros</span>${
    n ? '<span class="badge" aria-label="1 filtro activo">1</span>' : ""
  }</button>${n ? '<button class="btn ghost sm" type="button" data-ag="limpiar">Limpiar</button>' : ""}`;
  if (calendario) {
    h += `<button class="tog eye" type="button" data-ag="publicados" aria-pressed="${E.verPublicados}" title="Mostrar u ocultar los posts publicados">${
      E.verPublicados ? OJO_SVG : OJO_NO_SVG
    }<span>Publicados</span></button>`;
    const lista = [...E.marcas.values()].filter((c) => (E.marca === "all" ? c.activo : c.slug === E.marca));
    h += `<div class="legend" aria-label="Marcas">${
      lista.map((c) => `<span class="mtag m-${c.color}"><i class="mdot"></i>${esc(c.nombre)}</span>`).join("")
    }</div>`;
  }
  h += "</div>";
  if (E.filtrosAbiertos) {
    h += `<div class="fpanel" id="fpanel"><div class="fld"><label for="fq-marca">Marca</label><select id="fq-marca" class="in" data-agf="marca"><option value="all">Todas</option>${
      E.datos.clientes.map((c) =>
        `<option value="${esc(c.slug)}"${E.marca === c.slug ? " selected" : ""}>${esc(c.nombre)}</option>`
      ).join("")
    }</select></div></div>`;
  }
  return h;
}

// ── Fila (la tarjeta de la Lista de la parrilla, con la marca) ──
function fila(p, arrastrable) {
  const d = p.date ? fecha(p.date) : null;
  const f = FORMATOS[p.format] ? p.format : "reel";
  const st = ESTADOS[p.status] ? p.status : "idea";
  const m = marcaDe(p);
  const redes = (p.platforms || []).map((r) => REDES[r]).filter(Boolean).join(", ");
  const estado = rolDe(p.cliente) === "editor"
    ? `<button class="st stsel st-${st}" type="button" data-ag="stmenu" data-id="${esc(p.id)}" data-cli="${
      esc(p.cliente)
    }" aria-haspopup="menu" aria-expanded="false" aria-label="Estado: ${esc(ESTADOS[st])}. Cambiar estado de ${
      esc(p.title || "Sin título")
    }">${stIcono(st)}<span>${esc(ESTADOS[st])}</span>${CHEV}</button>`
    : `<span class="st st-${st}">${stIcono(st)}${esc(ESTADOS[st])}</span>`;
  return `<div class="row f-${f}${st === "publicado" ? " pub" : ""}"${
    arrastrable && rolDe(p.cliente) === "editor" ? ` data-drag="${esc(`${p.cliente}|${p.id}`)}"` : ""
  }><div class="rd">${
    d
      ? `<b>${d.getDate()}</b><span>${DOW[dowLun(d)]}</span>${p.time ? `<span class="rt">${esc(horaCorta(p.time))}</span>` : ""}`
      : "<b>–</b><span>idea</span>"
  }</div><div><div class="t"><a class="rlink" href="${esc(`${BASE}/${p.cliente}#post-${p.id}`)}" draggable="false">${
    p.title ? esc(p.title) : "<em>Sin título</em>"
  }</a></div><div class="meta"><span class="mlabel m-${m.color}"><i class="mdot"></i>${esc(m.nombre)}</span><span class="tag">${
    fmtIcono(f)
  }${FORMATOS[f]}</span>${redes ? `<span class="pl">${esc(redes)}</span>` : ""}${
    p.colab ? `<span class="tag colab" title="${esc(p.colab.join(", "))}">🤝 ${plural(p.colab.length, "cuenta", "cuentas")}</span>` : ""
  }</div></div>${estado}</div>`;
}

// ── Próximos: atrasados (hasta 30 días), por publicar y aún no listos (de hoy a 7 días) ──
function proximos() {
  const a = E.datos, desde = sumarDias(a.hoy, -30), hasta = sumarDias(a.hoy, 7);
  return visibles().filter((p) => p.status !== "publicado" && p.date && p.date >= desde && p.date <= hasta)
    .sort(orden);
}
function vistaProximos() {
  const a = E.datos, posts = proximos();
  const grupo = (clase, titulo, ayuda, lista) =>
    lista.length
      ? `<section class="prox-g"><h3 class="day-h${clase}">${titulo} <span>· ${plural(lista.length, "post", "posts")} · ${ayuda}</span></h3>` +
        `<div class="rows">${lista.map((p) => fila(p)).join("")}</div></section>`
      : "";
  return barraFiltros(false) + (posts.length
    ? grupo(" tarde", "Atrasados", "ya pasó su fecha y aún no se publican", posts.filter((p) => p.date < a.hoy)) +
      grupo("", "Por publicar", "listos para hoy y los próximos 7 días", posts.filter((p) => p.date >= a.hoy && p.status === "listo")) +
      grupo("", "Aún no listos", "con fecha en los próximos 7 días", posts.filter((p) => p.date >= a.hoy && p.status !== "listo"))
    : `<div class="empty"><h3>Nada pendiente</h3><p>No hay posts sin publicar con fecha en los próximos 7 días${
      E.marca === "all" ? "" : " de esta marca"
    }.</p></div>`);
}

// ── Calendario: el de la parrilla, con cada post del color de su marca ──
function chip(p) {
  const st = ESTADOS[p.status] ? p.status : "idea";
  const f = FORMATOS[p.format] ? p.format : "reel";
  const m = marcaDe(p);
  const redes = (p.platforms || []).map((r) => REDES[r]).filter(Boolean).join(", ");
  return `<a class="chip mc m-${m.color} s-${st}${st === "publicado" ? " pub" : ""}" href="${
    esc(`${BASE}/${p.cliente}#post-${p.id}`)
  }"${rolDe(p.cliente) === "editor" ? ` data-drag="${esc(`${p.cliente}|${p.id}`)}"` : ""} draggable="false" title="${
    esc(`${p.title || "Sin título"} · ${m.nombre}`)
  }"><span class="ct">${p.title ? esc(p.title) : "Sin título"}</span><span class="cm">${
    p.time ? `<em>${esc(horaCorta(p.time))}</em>` : ""
  }<i>${fmtIcono(f)}${FORMATOS[f]}</i>${redes ? `<b>${esc(redes)}</b>` : ""}</span><span class="cs cs-${st}">${stIcono(st)}${
    esc(ESTADOS[st])
  }</span></a>`;
}
function vistaCalendario() {
  const { y, m } = E, hoy = E.datos.hoy;
  const primero = new Date(y, m, 1), lead = dowLun(primero), dias = new Date(y, m + 1, 0).getDate();
  const total = Math.ceil((lead + dias) / 7) * 7;
  const porDia = {};
  for (const p of visibles()) {
    if (!p.date || (!E.verPublicados && p.status === "publicado")) continue;
    (porDia[p.date] ||= []).push(p);
  }
  for (const k in porDia) porDia[k].sort(orden);
  const mes = `${y}-${dosD(m + 1)}`;
  if (!E.sel || !E.sel.startsWith(mes)) E.sel = hoy.startsWith(mes) ? hoy : `${mes}-01`;
  const puedeCrear = editables().length > 0;
  let celdas = DOW.map((d) => `<div class="dow">${d}</div>`).join("");
  for (let i = 0; i < total; i++) {
    const dt = new Date(y, m, i - lead + 1), ds = ymd(dt.getFullYear(), dt.getMonth(), dt.getDate());
    celdas += `<div class="day${dt.getMonth() !== m ? " out" : ""}${ds === hoy ? " today" : ""}${
      ds === E.sel ? " sel" : ""
    }" data-date="${ds}" data-ag="dia"><div class="day-top"><span class="dn">${dt.getDate()}</span>${
      puedeCrear
        ? `<button class="add" type="button" data-ag="add" data-date="${ds}" aria-label="Nuevo post el ${dt.getDate()} de ${
          MESES[dt.getMonth()].toLowerCase()
        }">+</button>`
        : ""
    }</div><div class="chips">${(porDia[ds] || []).map(chip).join("")}</div></div>`;
  }
  const delDia = porDia[E.sel] || [];
  return `<div class="monthbar"><div class="mb-nav"><button class="icon-btn" type="button" data-ag="prev" aria-label="Mes anterior">‹</button><h2>${
    MESES[m]
  } <span>${y}</span></h2><button class="icon-btn" type="button" data-ag="next" aria-label="Mes siguiente">›</button></div><button class="btn ghost" type="button" data-ag="hoy">Hoy</button></div>` +
    barraFiltros(true) + `<div class="cal">${celdas}</div>` +
    `<section class="agenda"><h3 class="day-h">${fechaLarga(E.sel)}</h3>${
      delDia.some((p) => rolDe(p.cliente) === "editor")
        ? '<p class="tip">Mantén presionada una tarjeta y arrástrala a otro día para cambiar su fecha.</p>'
        : ""
    }<div class="rows">${
      delDia.length ? delDia.map((p) => fila(p, true)).join("") : '<p class="muted">Nada planificado este día.</p>'
    }</div>${
      puedeCrear ? `<button class="btn" type="button" data-ag="add" data-date="${E.sel}">+ Nuevo post este día</button>` : ""
    }</section>`;
}

// ── «+»: ¿para qué marca? (el mismo popup del selector de marca) y se abre su parrilla con «Nuevo post» ──
function cerrarNuevo() {
  document.getElementById("agNuevo")?.remove();
  document.removeEventListener("mousedown", fueraNuevo, true);
}
function fueraNuevo(e) {
  const pop = document.getElementById("agNuevo");
  if (pop && !pop.contains(e.target) && !e.target.closest('[data-ag="add"]')) cerrarNuevo();
}
function menuNuevoPost(boton, dia) {
  const lista = editables();
  const destino = (slug) => `${BASE}/${encodeURIComponent(slug)}#nuevo${dia ? `-${dia}` : ""}`;
  if (lista.length === 1) {
    location.href = destino(lista[0].slug);
    return;
  }
  const abierto = document.getElementById("agNuevo");
  cerrarNuevo();
  if (abierto && abierto.dataset.dia === dia) return;
  const pop = document.createElement("div");
  pop.id = "agNuevo";
  pop.dataset.dia = dia;
  pop.className = "cli-pop";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "¿Para qué marca?");
  pop.innerHTML = `<p class="cp-vacio">Nuevo post${dia ? ` el ${fechaLarga(dia).toLowerCase()}` : ""} · ¿para qué marca?</p><div class="cp-list">${
    lista.map((c) => {
      const m = E.marcas.get(c.slug) || {};
      return `<a class="cp-it" href="${esc(destino(c.slug))}"><i class="mdot m-${m.color}" aria-hidden="true"></i><b>${
        esc(c.nombre)
      }</b>${c.handle ? `<span>@${esc(String(c.handle).replace(/^@/, ""))}</span>` : ""}</a>`;
    }).join("")
  }</div>`;
  document.body.appendChild(pop);
  const r = boton.getBoundingClientRect();
  let top = r.bottom + 6;
  if (top + pop.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - pop.offsetHeight - 6);
  pop.style.top = `${Math.round(top)}px`;
  pop.style.left = `${Math.round(Math.max(8, Math.min(r.left, window.innerWidth - pop.offsetWidth - 8)))}px`;
  pop.querySelector(".cp-it")?.focus();
  document.addEventListener("mousedown", fueraNuevo, true);
}

// ── Menú de estados (el de la parrilla: las mismas píldoras, una debajo de otra) ──
function cerrarMenuEstado() {
  document.getElementById("agStMenu")?.remove();
  for (const b of document.querySelectorAll('.stsel[aria-expanded="true"]')) b.setAttribute("aria-expanded", "false");
}
function abrirMenuEstado(boton) {
  cerrarMenuEstado();
  const p = E.datos.posts.find((x) => x.id === boton.dataset.id && x.cliente === boton.dataset.cli);
  const m = document.createElement("div");
  m.id = "agStMenu";
  m.className = "stmenu";
  m.setAttribute("role", "menu");
  m.innerHTML = Object.entries(ESTADOS).map(([k, v]) =>
    `<button class="st st-${k}" type="button" role="menuitemradio" aria-checked="${!!p && p.status === k}" data-ag="stpick" data-v="${k}" data-id="${
      esc(boton.dataset.id)
    }" data-cli="${esc(boton.dataset.cli)}">${stIcono(k)}<span>${v}</span></button>`
  ).join("");
  document.body.appendChild(m);
  const r = boton.getBoundingClientRect();
  let top = r.bottom + 6;
  if (top + m.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - m.offsetHeight - 6);
  m.style.top = `${Math.round(top)}px`;
  m.style.left = `${Math.round(Math.max(8, Math.min(r.left, window.innerWidth - m.offsetWidth - 8)))}px`;
  boton.setAttribute("aria-expanded", "true");
  (m.querySelector('[aria-checked="true"]') || m.firstElementChild)?.focus();
}
document.addEventListener("mousedown", (e) => {
  const m = document.getElementById("agStMenu");
  if (m && !m.contains(e.target) && !e.target.closest('[data-ag="stmenu"]')) cerrarMenuEstado();
}, true);
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  cerrarMenuEstado();
  cerrarNuevo();
});
window.addEventListener("scroll", () => {
  cerrarMenuEstado();
  cerrarNuevo();
}, true);

async function guardarCambio(p, cambios, aviso) {
  const antes = Object.fromEntries(Object.keys(cambios).map((k) => [k, p[k]]));
  Object.assign(p, cambios);
  pintar();
  try {
    await apiMarca(p.cliente, `/api/publicaciones/${encodeURIComponent(p.id)}`, { method: "PATCH", body: { cambios } });
    toast(aviso, "ok");
  } catch (err) {
    Object.assign(p, antes);
    toast(err.message || "No se pudo guardar el cambio.");
    pintar();
  }
}

// ── Clics ──
document.addEventListener("click", (e) => {
  if (noClic) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  const b = e.target.closest("[data-ag]");
  if (!b || !E.datos) return;
  const t = b.dataset.ag;
  if (t === "dia") {
    if (e.target.closest("a, button")) return; // el clic era en un post o en «+»
    E.sel = b.dataset.date;
    pintar();
  } else if (t === "filtros") {
    E.filtrosAbiertos = !E.filtrosAbiertos;
    pintar();
  } else if (t === "limpiar") {
    E.marca = "all";
    guardar("pl_ini_marca", "all");
    pintar();
  } else if (t === "publicados") {
    E.verPublicados = !E.verPublicados;
    guardar("pl_ini_pub", E.verPublicados ? "1" : "0");
    pintar();
  } else if (t === "prev" || t === "next") {
    const d = new Date(E.y, E.m + (t === "next" ? 1 : -1), 1);
    E.y = d.getFullYear();
    E.m = d.getMonth();
    pintar();
  } else if (t === "hoy") {
    const h = fecha(E.datos.hoy);
    E.y = h.getFullYear();
    E.m = h.getMonth();
    E.sel = E.datos.hoy;
    pintar();
  } else if (t === "add") menuNuevoPost(b, b.dataset.date || "");
  else if (t === "stmenu") {
    if (b.getAttribute("aria-expanded") === "true") cerrarMenuEstado();
    else abrirMenuEstado(b);
  } else if (t === "stpick") {
    cerrarMenuEstado();
    const p = E.datos.posts.find((x) => x.id === b.dataset.id && x.cliente === b.dataset.cli);
    if (p && p.status !== b.dataset.v) guardarCambio(p, { status: b.dataset.v }, `${p.title || "Post"}: ${ESTADOS[b.dataset.v]}`);
  }
}, true);
document.addEventListener("change", (e) => {
  if (e.target.dataset.agf !== "marca") return;
  E.marca = e.target.value;
  guardar("pl_ini_marca", E.marca);
  pintar();
});

// ── Arrastrar un post a otro día (ratón y dedo), como en la parrilla ──
let DR = null, autoScroll = null, noClic = false;
const diaEn = (x, y) => document.elementFromPoint(x, y)?.closest?.(".day") || null;
function moverFantasma() {
  if (DR?.fantasma) {
    DR.fantasma.style.left = `${DR.x - 30}px`;
    DR.fantasma.style.top = `${DR.y - 16}px`;
  }
}
function marcarDestino() {
  const d = diaEn(DR.x, DR.y);
  if (DR.sobre && DR.sobre !== d) DR.sobre.classList.remove("drop");
  if (d) d.classList.add("drop");
  DR.sobre = d;
}
function empezarArrastre() {
  if (!DR || DR.activo) return;
  DR.activo = true;
  clearTimeout(DR.timer);
  const r = DR.src.getBoundingClientRect();
  const g = DR.src.cloneNode(true);
  g.removeAttribute("href");
  g.removeAttribute("data-drag");
  g.classList.add("drag-ghost");
  g.style.width = `${Math.max(150, Math.min(r.width || 200, 300))}px`;
  document.body.appendChild(g);
  DR.fantasma = g;
  DR.src.classList.add("drag-src");
  document.body.classList.add("dragging");
  moverFantasma();
  try {
    navigator.vibrate?.(12);
  } catch {}
  autoScroll = setInterval(() => {
    if (!DR?.activo) return;
    const h = window.innerHeight || 600;
    if (DR.y < 70) window.scrollBy(0, -14);
    else if (DR.y > h - 70) window.scrollBy(0, 14);
    marcarDestino();
  }, 30);
}
function terminarArrastre(soltar) {
  if (!DR) return;
  const d = DR;
  DR = null;
  clearTimeout(d.timer);
  clearInterval(autoScroll);
  if (d.activo) {
    noClic = true;
    setTimeout(() => (noClic = false), 400);
    d.sobre?.classList.remove("drop");
    d.fantasma?.remove();
    d.src.classList.remove("drag-src");
    document.body.classList.remove("dragging");
    const dia = soltar ? diaEn(d.x, d.y) : null;
    const [cli, id] = d.id.split("|");
    const p = E.datos.posts.find((x) => x.id === id && x.cliente === cli);
    if (dia?.dataset.date && p && p.date !== dia.dataset.date) {
      E.sel = dia.dataset.date;
      const f = fecha(dia.dataset.date);
      guardarCambio(p, { date: dia.dataset.date }, `Movido al ${f.getDate()} de ${MESES[f.getMonth()].toLowerCase()}`);
      pendientePintar = false;
      return;
    }
  }
  if (pendientePintar) {
    pendientePintar = false;
    pintar();
  }
}
document.addEventListener("pointerdown", (e) => {
  if (pestana() !== "calendario" || DR || (e.pointerType === "mouse" && e.button !== 0)) return;
  if (e.target.closest(".stsel, select")) return;
  const src = e.target.closest("[data-drag]");
  if (!src) return;
  DR = {
    id: src.dataset.drag,
    src,
    x: e.clientX,
    y: e.clientY,
    sx: e.clientX,
    sy: e.clientY,
    dedo: e.pointerType !== "mouse",
    activo: false,
    pid: e.pointerId,
    sobre: null,
    fantasma: null,
    timer: null,
  };
  if (DR.dedo) DR.timer = setTimeout(empezarArrastre, 300);
});
document.addEventListener("pointermove", (e) => {
  if (!DR || e.pointerId !== DR.pid) return;
  DR.x = e.clientX;
  DR.y = e.clientY;
  if (!DR.activo) {
    const dx = Math.abs(DR.x - DR.sx), dy = Math.abs(DR.y - DR.sy);
    if (DR.dedo) {
      if (dx > 10 || dy > 10) terminarArrastre(false);
    } else if (dx > 5 || dy > 5) empezarArrastre();
    return;
  }
  moverFantasma();
  marcarDestino();
});
document.addEventListener("pointerup", (e) => {
  if (DR && e.pointerId === DR.pid) terminarArrastre(true);
});
document.addEventListener("pointercancel", (e) => {
  if (DR && e.pointerId === DR.pid) terminarArrastre(false);
});
document.addEventListener("touchmove", (e) => {
  if (DR?.activo && e.cancelable) e.preventDefault();
}, { passive: false });
document.addEventListener("contextmenu", (e) => {
  if (DR?.activo) e.preventDefault();
});

async function boot() {
  let s;
  try {
    s = await api("/api/sesion");
  } catch (e) {
    root.innerHTML = `<div class="login"><div class="card"><h1>No se pudo cargar</h1><p class="muted">${
      esc(e.message)
    }</p></div></div>`;
    return;
  }
  if (!s.usuario) return vistaLogin();
  const v = volver();
  if (v) return location.replace(v);
  vistaInicio(s);
}

boot();
