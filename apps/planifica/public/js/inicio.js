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

function filaAgenda(p, a, cli) {
  const color = cli.color;
  const redes = p.platforms.map((r) => REDES[r]).filter(Boolean).join(" · ");
  const quien = p.colab ? `🤝 ${p.colab.join(", ")}` : cli.nombre;
  const meta = [quien, FORMATOS[p.format] || "Post", redes, p.time].filter(Boolean).map(esc).join(" · ");
  const editable = cli.rol === "editor";
  const estado = editable
    ? `<label class="sr" for="ag-st-${esc(p.id)}">Estado de ${esc(p.title || "Sin título")}</label><select id="ag-st-${
      esc(p.id)
    }" class="prox-st ag-st st-${esc(p.status)}" data-id="${esc(p.id)}" data-cli="${esc(p.cliente)}">${
      Object.entries(ESTADOS_TODOS).map(([k, v]) =>
        `<option value="${k}"${k === p.status ? " selected" : ""}>${v}</option>`
      ).join("")
    }</select>`
    : `<span class="prox-st st-${esc(p.status)}">${esc(ESTADOS_TODOS[p.status] || "Idea")}</span>`;
  return `<div class="prox ag-row" style="--cc:${color}">
    <span class="prox-dia">${p.date ? esc(fechaCorta(p.date, a.hoy)) : "Sin fecha"}</span>
    <a class="prox-txt" href="${esc(`${BASE}/${p.cliente}#post-${p.id}`)}"><b>${
    p.title ? esc(p.title) : "<em>Sin título</em>"
  }</b><span>${meta}</span></a>${estado}</div>`;
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
      agenda.pubAbierto ? `<div class="prox-lista">${pub.slice().reverse().map(fila).join("")}</div>` : ""
    }</div>`;
  }
  for (const ym of Object.keys(meses).sort()) {
    const lista = meses[ym];
    const [y, m] = ym.split("-").map(Number);
    h += `<section class="ag-mes" id="ag-${ym}"><h2>${MESES[m - 1]} <span>${y}</span>${
      ym === mesHoy ? ' <em class="ag-now">este mes</em>' : ""
    } <small>${plural(lista.length, "post pendiente", "posts pendientes")}</small></h2>${
      lista.length ? `<div class="prox-lista">${lista.map(fila).join("")}</div>` : '<p class="muted">Nada pendiente.</p>'
    }</section>`;
  }
  if (sinFecha.length) {
    h += `<div class="ag-plegable"><button type="button" class="ag-tg" data-ag="ideas" aria-expanded="${agenda.ideasAbiertas}">${
      plural(sinFecha.length, "idea sin fecha", "ideas sin fecha")
    }</button>${agenda.ideasAbiertas ? `<div class="prox-lista">${sinFecha.map(fila).join("")}</div>` : ""}</div>`;
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
});

document.addEventListener("change", async (e) => {
  const sel = e.target.closest(".ag-st");
  if (!sel || !agenda.datos) return;
  const p = agenda.datos.posts.find((x) => x.id === sel.dataset.id && x.cliente === sel.dataset.cli);
  if (!p) return;
  const antes = p.status;
  p.status = sel.value;
  sel.className = `prox-st ag-st st-${p.status}`;
  try {
    await apiCliente(p.cliente, `/api/publicaciones/${encodeURIComponent(p.id)}`, {
      method: "PATCH",
      body: { cambios: { status: p.status } },
    });
    toast(`${p.title || "Post"}: ${ESTADOS_TODOS[p.status]}`, "ok");
  } catch (err) {
    p.status = antes;
    toast(err.message || "No se pudo cambiar el estado.");
  }
  pintarAgenda();
});

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
