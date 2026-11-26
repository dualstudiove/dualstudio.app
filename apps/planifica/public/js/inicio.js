// Inicio de Planifica: iniciar sesión, elegir cliente y «Tu cuenta».
import { basePath, crearApi } from "../_ds/comun/web/api.js";
import { $, esc } from "../_ds/comun/web/dom.js";
import { icon } from "../_ds/diseno/js/iconos.js";
import { conBoton, toast } from "../_ds/diseno/js/componentes.js";

const BASE = basePath(import.meta.url, 1);
const api = crearApi((ruta) => BASE + ruta);
const apiCliente = (slug, ruta, opciones) => crearApi((r) => `${BASE}/${encodeURIComponent(slug)}${r}`)(ruta, opciones);
const root = $("#root");

/** ?volver=<ruta>: solo rutas dentro de la app (nunca otro sitio). */
function volver() {
  const v = new URLSearchParams(location.search).get("volver") || "";
  return v.startsWith(`${BASE}/`) && !v.startsWith("//") && !/[\\]/.test(v) ? v : null;
}

const marca =
  '<span class="marca" aria-hidden="true"><i class="on"></i><i></i><i></i><i></i><i class="on"></i><i></i><i></i><i></i><i class="on"></i></span>';

function vistaLogin() {
  document.title = "Iniciar sesión · Planifica";
  root.innerHTML = `<div class="login"><div class="card">
    ${marca}
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

function vistaClientes(s) {
  const u = s.usuario;
  document.title = "Tus clientes · Planifica";
  const clientes = s.clientes;
  const tarjetas = clientes.map((c) =>
    `<a class="cliente ${c.activo ? "" : "off"}" href="${esc(`${BASE}/${c.slug}`)}">
      <span class="ini" aria-hidden="true">${
      esc((c.nombre || "?").trim().charAt(0).toUpperCase())
    }</span>
      <span class="txt"><b>${esc(c.nombre)}</b><span>${
      esc(c.handle || "Sin cuenta de Instagram")
    }</span></span>
      ${
      c.activo
        ? (c.rol === "lector" ? '<span class="badge off">Solo lectura</span>' : "")
        : '<span class="badge off">Archivado</span>'
    }
      <span class="go" aria-hidden="true">→</span></a>`
  ).join("");
  root.innerHTML = `<div class="pag">
    <header class="cab">${marca}<div class="grow"><h1>Hola${
    u.nombre ? `, ${esc(u.nombre)}` : ""
  }</h1><p class="muted">${esc(u.email)}${u.es_admin ? " · Administrador" : ""}</p></div>
      ${
    u.es_admin
      ? `<a class="btn" href="${esc(BASE)}/admin">${icon("edit")} Clientes y equipo</a>`
      : ""
  }
      <button class="btn btn-ghost" id="salir" type="button">${icon("out")} Salir</button></header>
    ${
    s.secretos_recuperacion
      ? `<div class="notice warn">${
        icon("warn")
      }<div>Los secretos <b>SUPER_EMAIL</b> y <b>SUPER_PASSWORD</b> siguen guardados en Cloudflare. Ya se usaron y no volverán a cambiar ninguna contraseña, pero conviene borrarlos: Workers y Pages → planifica → Configuración → Variables y secretos.</div></div>`
      : ""
  }
    <nav class="tabs ini-tabs" aria-label="Inicio">
      <a href="#proximos" data-tab="proximos">Próximos <span class="n" id="n-prox"></span></a>
      <a href="#agenda" data-tab="agenda">Agenda</a>
      <a href="#clientes" data-tab="clientes">Clientes <span class="n">${clientes.filter((c) => c.activo).length}</span></a>
    </nav>
    <section id="tab-proximos" class="ini-panel"><p class="muted">Cargando…</p></section>
    <section id="tab-agenda" class="ini-panel" hidden><p class="muted">Cargando…</p></section>
    <section id="tab-clientes" class="ini-panel">
    ${
    clientes.length
      ? `<div class="clientes">${tarjetas}</div>`
      : `<div class="empty">${icon("empty")}<p>Aún no tienes clientes asignados</p><span>${
        u.es_admin
          ? "Crea el primero en «Clientes y equipo»."
          : "Pídele a un administrador que te dé acceso."
      }</span></div>`
  }
    <div class="card cuenta"><h3>Tu cuenta</h3>
      <form id="fn" class="fila" novalidate><div class="field"><label for="nn">Tu nombre</label><input id="nn" type="text" value="${
    esc(u.nombre || "")
  }" autocomplete="name"></div><button class="btn" type="submit">Guardar</button></form>
      <form id="fpw" novalidate><div class="row"><div class="field"><label for="pa">Contraseña actual</label><input id="pa" type="password" autocomplete="current-password"></div>
        <div class="field"><label for="pn">Contraseña nueva</label><input id="pn" type="password" autocomplete="new-password" minlength="8"><span class="hint">Mínimo 8 caracteres.</span></div></div>
        <button class="btn" type="submit">Cambiar contraseña</button></form>
      <p class="muted small" style="margin:16px 0 8px">¿Entraste desde un equipo ajeno o crees que alguien más tiene tu sesión? Ciérrala en todos los demás navegadores; aquí sigues dentro.</p>
      <button class="btn" type="button" id="cerrar-otras">${
    icon("out")
  } Cerrar sesión en los demás dispositivos</button>
    </div></section></div>`;

  const pestana = () =>
    location.hash === "#clientes" ? "clientes" : location.hash === "#agenda" ? "agenda" : "proximos";
  const mostrar = () => {
    const t = pestana();
    for (const a of root.querySelectorAll(".ini-tabs a")) {
      a.classList.toggle("on", a.dataset.tab === t);
      if (a.dataset.tab === t) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    }
    $("#tab-proximos").hidden = t !== "proximos";
    $("#tab-agenda").hidden = t !== "agenda";
    $("#tab-clientes").hidden = t !== "clientes";
    if (t === "agenda" && !agenda.datos && !agenda.cargando) cargarAgenda();
  };
  window.onhashchange = mostrar;
  mostrar();
  cargarProximos();

  $("#salir").addEventListener("click", async () => {
    await api("/api/logout", { method: "POST" }).catch(() => {});
    boot();
  });
  $("#fn").addEventListener("submit", (ev) => {
    ev.preventDefault();
    conBoton($("button", ev.target), async () => {
      await api("/api/cuenta", { method: "PUT", body: { nombre: $("#nn").value } });
      toast("Nombre guardado", "ok");
    });
  });
  $("#fpw").addEventListener("submit", (ev) => {
    ev.preventDefault();
    conBoton($("button", ev.target), async () => {
      await api("/api/cuenta/password", {
        method: "POST",
        body: { actual: $("#pa").value, nueva: $("#pn").value },
      });
      ev.target.reset();
      toast("Contraseña actualizada", "ok");
    });
  });
  $("#cerrar-otras").addEventListener("click", (ev) =>
    conBoton(ev.currentTarget, async () => {
      await api("/api/cuenta/sesiones/cerrar", { method: "POST" });
      toast("Listo: las demás sesiones quedaron cerradas", "ok");
    }));
}

// ── Próximos: lo que hay que publicar en los próximos días, de todos tus clientes ──
const ESTADOS = { idea: "Idea", contenido: "Contenido", porproducir: "Por producir", produccion: "En producción", listo: "Por publicar" };
const FORMATOS = { reel: "Reel", carrusel: "Carrusel", foto: "Foto", historia: "Historia", diseno: "Diseño" };
const REDES = { ig: "IG", tt: "TT" };

function fechaCorta(dia, hoy) {
  const d = new Date(`${dia}T12:00:00`), h = new Date(`${hoy}T12:00:00`);
  const dif = Math.round((d - h) / 86_400_000);
  if (dif === 0) return "Hoy";
  if (dif === 1) return "Mañana";
  if (dif === -1) return "Ayer";
  const t = d.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function filaProximo(p, hoy) {
  const redes = p.platforms.map((r) => REDES[r]).filter(Boolean).join(" · ");
  return `<a class="prox" href="${esc(`${BASE}/${p.cliente.slug}#post-${p.id}`)}">
    <span class="prox-dia">${esc(fechaCorta(p.date, hoy))}</span>
    <span class="prox-txt"><b>${p.title ? esc(p.title) : "<em>Sin título</em>"}</b>
      <span>${esc(p.colab ? `🤝 ${p.colab.join(", ")}` : p.cliente.nombre)} · ${esc(FORMATOS[p.format] || "Post")}${
    redes ? ` · ${esc(redes)}` : ""
  }</span></span>
    <span class="prox-st st-${esc(p.status)}">${esc(ESTADOS[p.status] || "Idea")}</span></a>`;
}

function grupoProximos(clase, titulo, ayuda, lista, hoy) {
  if (!lista.length) return "";
  return `<div class="prox-grupo ${clase}"><h3>${titulo} <span class="n">${lista.length}</span></h3>
    <p class="muted small">${ayuda}</p>
    <div class="prox-lista">${lista.map((p) => filaProximo(p, hoy)).join("")}</div></div>`;
}

async function cargarProximos() {
  const caja = $("#tab-proximos");
  let r;
  try {
    r = await api("/api/proximos");
  } catch (e) {
    caja.innerHTML = `<div class="notice bad">${icon("warn")}<div>${esc(e.message)}</div></div>`;
    return;
  }
  if (!document.body.contains(caja)) return;
  const atrasados = r.posts.filter((p) => p.date < r.hoy);
  const porPublicar = r.posts.filter((p) => p.date >= r.hoy && p.status === "listo");
  const noListos = r.posts.filter((p) => p.date >= r.hoy && p.status !== "listo");
  const n = $("#n-prox");
  if (n) n.textContent = r.posts.length ? String(r.posts.length) : "";
  caja.innerHTML = r.posts.length
    ? grupoProximos("atrasados", "Atrasados", "Ya pasó su fecha y aún no se publican.", atrasados, r.hoy) +
      grupoProximos("listos", "Por publicar", "Listos para salir hoy y en los próximos 7 días.", porPublicar, r.hoy) +
      grupoProximos(
        "pendientes",
        "Aún no listos",
        "Tienen fecha en los próximos 7 días pero todavía no están por publicar.",
        noListos,
        r.hoy,
      )
    : `<div class="empty">${icon("empty")}<p>Nada pendiente</p><span>No hay posts sin publicar con fecha en los próximos 7 días.</span></div>`;
}

// ── Agenda: los posts de todos tus clientes, en una sola lista por meses ──
// Cada post lleva el color de su cliente; arriba, chips para mostrar u ocultar clientes. Lo publicado va recogido
// arriba y las ideas sin fecha al final. Desde aquí se cambia el estado y se crean posts (se abre la parrilla del
// cliente elegido con la ventana de «Nuevo post»).
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre",
  "Noviembre", "Diciembre"];
const ESTADOS_TODOS = { ...ESTADOS, publicado: "Publicado" };
const COLORES = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)", "var(--cat-5)", "var(--info)",
  "var(--warn)", "var(--danger)"];
const agenda = { datos: null, cargando: false, pubAbierto: false, ideasAbiertas: false, ocultos: new Set() };
try {
  for (const s of JSON.parse(localStorage.getItem("pl_agenda_ocultos") || "[]")) agenda.ocultos.add(s);
} catch {}

function guardarOcultos() {
  try {
    localStorage.setItem("pl_agenda_ocultos", JSON.stringify([...agenda.ocultos]));
  } catch {}
}

async function cargarAgenda() {
  const caja = $("#tab-agenda");
  agenda.cargando = true;
  try {
    agenda.datos = await api("/api/agenda");
  } catch (e) {
    caja.innerHTML = `<div class="notice bad">${icon("warn")}<div>${esc(e.message)}</div></div>`;
    return;
  } finally {
    agenda.cargando = false;
  }
  pintarAgenda();
  // Al abrir, se ubica en el mes actual
  const sec = document.getElementById(`ag-${agenda.datos.hoy.slice(0, 7)}`);
  if (sec) window.scrollTo(0, sec.getBoundingClientRect().top + window.scrollY - 12);
}

// Tarjetas como las de la Lista de la parrilla: fecha a la izquierda, título, etiquetas y estado (con su menú).
const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const ST_ICON = {
  idea: '<circle cx="8" cy="8" r="6.25" stroke-dasharray="2.4 2.5"/>',
  contenido: '<circle cx="8" cy="8" r="6.25"/><path class="fl" d="M8 8V3.75A4.25 4.25 0 0 1 11.005 4.995z"/>',
  porproducir: '<circle cx="8" cy="8" r="6.25"/><path class="fl" d="M8 8V3.75A4.25 4.25 0 0 1 12.25 8z"/>',
  produccion: '<circle cx="8" cy="8" r="6.25"/><path class="fl" d="M8 3.75a4.25 4.25 0 0 1 0 8.5z"/>',
  listo: '<circle cx="8" cy="8" r="6.25"/><path class="fl" d="M8 8V3.75A4.25 4.25 0 1 1 3.75 8z"/>',
  publicado: '<circle class="fl" cx="8" cy="8" r="7"/><path class="ck" d="M5.2 8.2l1.9 1.9 3.7-4"/>',
};
const CHEV =
  '<svg class="chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg>';
const stIcono = (k) =>
  `<svg class="sti" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${
    ST_ICON[k] || ST_ICON.idea
  }</svg>`;
const fmtIcono = (k) =>
  FORMATOS[k] ? `<img class="ag-fi" src="${esc(`${BASE}/img/formatos/${k}.png`)}" alt="" aria-hidden="true">` : "";
const horaCorta = (t) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || "");
  if (!m) return "";
  const h = +m[1];
  return `${h % 12 || 12}${m[2] === "00" ? "" : `:${m[2]}`}${h < 12 ? "am" : "pm"}`;
};
const diaLargo = (dia) => {
  const d = new Date(`${dia}T12:00:00`);
  const t = `${DIAS_LARGOS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`;
  return t.charAt(0).toUpperCase() + t.slice(1);
};

function filaAgenda(p, a, cli) {
  const d = p.date ? new Date(`${p.date}T12:00:00`) : null;
  const f = FORMATOS[p.format] ? p.format : "reel";
  const redes = p.platforms.map((r) => REDES[r]).filter(Boolean).join(", ");
  const st = ESTADOS_TODOS[p.status] ? p.status : "idea";
  const estado = cli.rol === "editor"
    ? `<button type="button" class="ag-st st-${st}" data-ag="stmenu" data-id="${esc(p.id)}" data-cli="${esc(p.cliente)}" aria-haspopup="menu" aria-expanded="false" aria-label="Estado: ${
      esc(ESTADOS_TODOS[st])
    }">${stIcono(st)}<span>${esc(ESTADOS_TODOS[st])}</span>${CHEV}</button>`
    : `<span class="ag-st st-${st}">${stIcono(st)}<span>${esc(ESTADOS_TODOS[st])}</span></span>`;
  return `<div class="ag-card${st === "publicado" ? " pub" : ""}" style="--cc:${cli.color}">
    <div class="ag-rd">${
    d
      ? `<b>${d.getDate()}</b><span>${DIAS_CORTOS[d.getDay()]}</span>${p.time ? `<span class="ag-rt">${esc(horaCorta(p.time))}</span>` : ""}`
      : "<b>–</b><span>idea</span>"
  }</div>
    <div class="ag-main"><a class="ag-t" href="${esc(`${BASE}/${p.cliente}#post-${p.id}`)}">${
    p.title ? esc(p.title) : "<em>Sin título</em>"
  }</a>
      <div class="ag-meta"><span class="ag-cli"><i aria-hidden="true"></i>${esc(cli.nombre)}</span><span class="ag-tag f-${f}">${fmtIcono(f)}${
    esc(FORMATOS[f])
  }</span>${redes ? `<span class="ag-pl">${esc(redes)}</span>` : ""}${
    p.colab ? `<span class="ag-tag ag-colab" title="${esc(p.colab.join(", "))}">🤝 ${p.colab.length} cuentas</span>` : ""
  }</div></div>
    ${estado}</div>`;
}

/** Tarjetas agrupadas por día, con el día como título (como la Lista por mes). */
function porDia(lista, fila) {
  let h = "", dia = null;
  for (const p of lista) {
    if (p.date !== dia) {
      if (dia !== null) h += "</div>";
      dia = p.date;
      h += `<h3 class="ag-dia">${esc(diaLargo(p.date))}</h3><div class="ag-rows">`;
    }
    h += fila(p);
  }
  return dia !== null ? `${h}</div>` : h;
}

function pintarAgenda() {
  const caja = $("#tab-agenda"), a = agenda.datos;
  if (!caja || !a) return;
  const clientes = new Map(a.clientes.map((c, i) => [c.slug, { ...c, color: COLORES[i % COLORES.length] }]));
  const editables = a.clientes.filter((c) => c.rol === "editor");
  const posts = a.posts.filter((p) => clientes.has(p.cliente) && !agenda.ocultos.has(p.cliente))
    .sort((x, y) => (x.date || "9999").localeCompare(y.date || "9999") || (x.time || "").localeCompare(y.time || ""));
  const fila = (p) => filaAgenda(p, a, clientes.get(p.cliente));
  const pub = posts.filter((p) => p.status === "publicado");
  const abiertos = posts.filter((p) => p.status !== "publicado");
  const sinFecha = abiertos.filter((p) => !p.date);
  const meses = {};
  const mesHoy = a.hoy.slice(0, 7);
  meses[mesHoy] = [];
  for (const p of abiertos) if (p.date) (meses[p.date.slice(0, 7)] ||= []).push(p);
  let h = `<div class="ag-bar"><div class="ag-chips" role="group" aria-label="Clientes">${
    a.clientes.map((c) => {
      const on = !agenda.ocultos.has(c.slug);
      return `<button type="button" class="ag-chip" data-ag="cli" data-v="${esc(c.slug)}" aria-pressed="${on}" style="--cc:${
        clientes.get(c.slug).color
      }"><i aria-hidden="true"></i>${esc(c.nombre)}</button>`;
    }).join("")
  }</div>${
    editables.length ? `<button type="button" class="btn btn-primary" data-ag="nuevo">${icon("plus")} Nuevo post</button>` : ""
  }</div>`;
  if (pub.length) {
    h += `<div class="ag-plegable"><button type="button" class="ag-tg" data-ag="pub" aria-expanded="${agenda.pubAbierto}">${
      plural(pub.length, "publicado", "publicados")
    } <span class="muted">· últimos 3 meses</span></button>${
      agenda.pubAbierto ? `<div class="ag-rows">${pub.slice().reverse().map(fila).join("")}</div>` : ""
    }</div>`;
  }
  for (const ym of Object.keys(meses).sort()) {
    const lista = meses[ym];
    const [y, m] = ym.split("-").map(Number);
    h += `<section class="ag-mes" id="ag-${ym}"><h2>${MESES[m - 1]} <span>${y}</span>${
      ym === mesHoy ? ' <em class="ag-now">este mes</em>' : ""
    } <small>${plural(lista.length, "post pendiente", "posts pendientes")}</small></h2>${
      lista.length ? porDia(lista, fila) : '<p class="muted">Nada pendiente.</p>'
    }</section>`;
  }
  if (sinFecha.length) {
    h += `<div class="ag-plegable"><button type="button" class="ag-tg" data-ag="ideas" aria-expanded="${agenda.ideasAbiertas}">${
      plural(sinFecha.length, "idea sin fecha", "ideas sin fecha")
    }</button>${agenda.ideasAbiertas ? `<div class="ag-rows">${sinFecha.map(fila).join("")}</div>` : ""}</div>`;
  }
  caja.innerHTML = h;
}

function plural(n, uno, varios) {
  return `${n} ${n === 1 ? uno : varios}`;
}

function menuNuevoPost(boton) {
  const editables = agenda.datos.clientes.filter((c) => c.rol === "editor");
  if (editables.length === 1) {
    location.href = `${BASE}/${editables[0].slug}#nuevo`;
    return;
  }
  let pop = document.getElementById("agNuevo");
  if (pop) return pop.remove();
  pop = document.createElement("div");
  pop.id = "agNuevo";
  pop.className = "ag-pop";
  pop.innerHTML = `<p class="muted small">¿Para qué cliente?</p>${
    editables.map((c) => `<a href="${esc(`${BASE}/${c.slug}#nuevo`)}">${esc(c.nombre)}</a>`).join("")
  }`;
  const r = boton.getBoundingClientRect();
  pop.style.top = `${Math.round(r.bottom + 6)}px`;
  pop.style.left = `${Math.max(8, Math.round(Math.min(r.right - 240, window.innerWidth - 248)))}px`;
  document.body.appendChild(pop);
  const fuera = (e) => {
    if (!pop.contains(e.target) && !boton.contains(e.target)) {
      pop.remove();
      document.removeEventListener("mousedown", fuera, true);
    }
  };
  document.addEventListener("mousedown", fuera, true);
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-ag]");
  if (!b || !agenda.datos) return;
  const t = b.dataset.ag;
  if (t === "cli") {
    if (agenda.ocultos.has(b.dataset.v)) agenda.ocultos.delete(b.dataset.v);
    else agenda.ocultos.add(b.dataset.v);
    guardarOcultos();
    pintarAgenda();
  } else if (t === "pub") {
    agenda.pubAbierto = !agenda.pubAbierto;
    pintarAgenda();
  } else if (t === "ideas") {
    agenda.ideasAbiertas = !agenda.ideasAbiertas;
    pintarAgenda();
  } else if (t === "nuevo") menuNuevoPost(b);
  else if (t === "stmenu") {
    if (b.getAttribute("aria-expanded") === "true") cerrarMenuEstado();
    else abrirMenuEstado(b);
  } else if (t === "stpick") {
    cerrarMenuEstado();
    cambiarEstado(b.dataset.id, b.dataset.cli, b.dataset.v);
  }
});

// Estado: la píldora abre un menú con todos los estados (como en la parrilla)
function cerrarMenuEstado() {
  document.getElementById("agStMenu")?.remove();
  for (const b of document.querySelectorAll('.ag-st[aria-expanded="true"]')) b.setAttribute("aria-expanded", "false");
}
function abrirMenuEstado(boton) {
  cerrarMenuEstado();
  const m = document.createElement("div");
  m.id = "agStMenu";
  m.className = "ag-stmenu";
  m.setAttribute("role", "menu");
  const p = agenda.datos.posts.find((x) => x.id === boton.dataset.id && x.cliente === boton.dataset.cli);
  m.innerHTML = Object.entries(ESTADOS_TODOS).map(([k, v]) =>
    `<button type="button" role="menuitemradio" aria-checked="${p && p.status === k}" class="ag-st st-${k}" data-ag="stpick" data-v="${k}" data-id="${
      esc(boton.dataset.id)
    }" data-cli="${esc(boton.dataset.cli)}">${stIcono(k)}<span>${v}</span></button>`
  ).join("");
  document.body.appendChild(m);
  const r = boton.getBoundingClientRect();
  let top = r.bottom + 6;
  if (top + m.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - m.offsetHeight - 6);
  m.style.top = `${Math.round(top)}px`;
  m.style.left = `${Math.round(Math.min(r.left, window.innerWidth - m.offsetWidth - 8))}px`;
  boton.setAttribute("aria-expanded", "true");
  (m.querySelector('[aria-checked="true"]') || m.firstElementChild)?.focus();
}
document.addEventListener("mousedown", (e) => {
  const m = document.getElementById("agStMenu");
  if (m && !m.contains(e.target) && !e.target.closest('[data-ag="stmenu"]')) cerrarMenuEstado();
}, true);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.getElementById("agStMenu")) cerrarMenuEstado();
});
window.addEventListener("scroll", cerrarMenuEstado, true);

async function cambiarEstado(id, cli, estado) {
  const p = agenda.datos.posts.find((x) => x.id === id && x.cliente === cli);
  if (!p || p.status === estado) return;
  const antes = p.status;
  p.status = estado;
  pintarAgenda();
  try {
    await apiCliente(p.cliente, `/api/publicaciones/${encodeURIComponent(p.id)}`, {
      method: "PATCH",
      body: { cambios: { status: p.status } },
    });
    toast(`${p.title || "Post"}: ${ESTADOS_TODOS[p.status]}`, "ok");
  } catch (err) {
    p.status = antes;
    toast(err.message || "No se pudo cambiar el estado.");
    pintarAgenda();
  }
}

async function boot() {
  let s;
  try {
    s = await api("/api/sesion");
  } catch (e) {
    root.innerHTML =
      `<div class="login"><div class="card"><h1>No se pudo cargar</h1><p class="muted">${
        esc(e.message)
      }</p></div></div>`;
    return;
  }
  if (!s.usuario) return vistaLogin();
  const v = volver();
  if (v) return location.replace(v);
  vistaClientes(s);
}

boot();
