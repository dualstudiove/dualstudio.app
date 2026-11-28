// Configuración de Planifica: Mi cuenta (todos), Personas y Marcas (administradores).
// Barra lateral a la izquierda; cada sección es una pestaña (#cuenta, #personas, #marcas).
import { basePath, crearApi } from "../_ds/comun/web/api.js";
import { $, $$, esc } from "../_ds/comun/web/dom.js";
import { icon } from "../_ds/diseno/js/iconos.js";
import { conBoton, confirmar, modal, toast } from "../_ds/diseno/js/componentes.js";
import {
  actualizarUsuario,
  avatar,
  barraHtml,
  COLORES_MARCA,
  ICONOS,
  marcasConColor,
  montarCabecera,
  NOMBRES_COLOR,
} from "./cabecera.js";

const BASE = basePath(import.meta.url, 1);
const api = crearApi((ruta) => BASE + ruta);
const root = $("#root");
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const mb = (b) =>
  b < 1024 * 1024 ? `${Math.max(0, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;

let S = null; // /api/sesion
let D = null; // /api/admin/resumen (administradores)

const SECCIONES = [
  ["cuenta", "Mi cuenta", "cuenta", false],
  ["personas", "Personas", "personas", true],
  ["marcas", "Marcas", "marcas", true],
];
function seccion() {
  const h = location.hash.replace(/^#/, "");
  const ok = SECCIONES.find(([k, , , admin]) => k === h && (!admin || S.usuario.es_admin));
  return ok ? h : "cuenta";
}

async function boot() {
  try {
    S = await api("/api/sesion");
  } catch (e) {
    root.innerHTML = `<div class="login"><div class="card"><h1>No se pudo cargar</h1><p class="muted">${
      esc(e.message)
    }</p></div></div>`;
    return;
  }
  if (!S.usuario) {
    return location.replace(`${BASE}/?volver=${encodeURIComponent(location.pathname + location.search + location.hash)}`);
  }
  root.className = "";
  const activas = S.clientes.filter((c) => c.activo).length;
  root.innerHTML = `<div class="wrap"><header class="top top-cfg">${
    barraHtml({ nombre: "Todos", sub: plural(activas, "marca", "marcas") })
  }</header><div class="cfg"><nav class="cfg-nav" aria-label="Configuración"><a class="cfg-volver" href="${
    esc(BASE)
  }/">← Volver a Planifica</a><span class="cfg-k">Configuración</span>${
    SECCIONES.filter(([, , , admin]) => !admin || S.usuario.es_admin).map(([k, t, ico]) =>
      `<a href="#${k}" data-sec="${k}">${ICONOS[ico]}<span>${t}</span></a>`
    ).join("")
  }</nav><main class="cfg-main" id="sec"></main></div></div>`;
  montarCabecera({ sesion: S, actual: null });
  if (S.usuario.es_admin) D = await api("/api/admin/resumen");
  window.addEventListener("hashchange", pintar);
  pintar();
  if (S.usuario.es_admin) {
    await vueltaDeMeta();
    // Desde la parrilla («Conectar Instagram»): abre directo la conexión de esa marca.
    const slug = new URLSearchParams(location.search).get("instagram");
    const c = slug && D.clientes.find((x) => x.slug === slug);
    if (c) {
      history.replaceState(null, "", `${location.pathname}#marcas`);
      pintar();
      formInstagram(c);
    }
  }
}

async function recargar() {
  D = await api("/api/admin/resumen");
  pintar();
}

function pintar() {
  const s = seccion();
  for (const a of $$("[data-sec]")) {
    if (a.dataset.sec === s) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  document.title = `${SECCIONES.find(([k]) => k === s)[1]} · Planifica`;
  ({ cuenta: pintarCuenta, personas: pintarPersonas, marcas: pintarMarcas })[s]();
}

const cabeza = (titulo, sub, boton = "") =>
  `<div class="cfg-h"><div class="grow"><h1>${titulo}</h1><p class="muted">${sub}</p></div>${boton}</div>`;

// ── Mi cuenta ──
function pintarCuenta() {
  const u = S.usuario;
  $("#sec").innerHTML = cabeza("Mi cuenta", "Tu foto, tu nombre y cómo entras a Planifica.") +
    `<section class="cfg-card"><h2 class="cfg-k">Perfil</h2><div class="cfg-perfil">
      <div class="cfg-foto">${avatar(u, "av-xl")}<div class="acts"><label class="btn" for="foto-in">${
      u.foto_v ? "Cambiar foto" : "Subir foto"
    }</label>${
      u.foto_v ? '<button class="btn ghost danger" type="button" id="foto-x">Quitar</button>' : ""
    }</div><input id="foto-in" type="file" accept="image/*" hidden><span class="hint">JPG o PNG · se recorta en círculo</span></div>
      <form id="fn" class="cfg-form" novalidate>
        <div class="fld"><label for="nn">Nombre</label><input class="in" id="nn" type="text" value="${
      esc(u.nombre || "")
    }" autocomplete="name"></div>
        <div class="fld"><label for="ne">Correo</label><input class="in" id="ne" type="email" value="${
      esc(u.email)
    }" readonly><span class="hint">El correo lo cambia un administrador.</span></div>
        <div class="acts"><button class="btn primary" type="submit">Guardar</button></div>
      </form></div></section>
    <section class="cfg-card"><h2 class="cfg-k">Contraseña</h2>
      <form id="fpw" class="cfg-pw" novalidate>
        <div class="fld"><label for="pa">Contraseña actual</label><input class="in" id="pa" type="password" autocomplete="current-password"></div>
        <div class="fld"><label for="pn">Contraseña nueva</label><input class="in" id="pn" type="password" autocomplete="new-password" minlength="8"></div>
        <button class="btn" type="submit">Cambiar</button>
      </form><p class="hint">Mínimo 8 caracteres.</p></section>
    <section class="cfg-card"><h2 class="cfg-k">Sesiones</h2><div class="cfg-linea"><p>¿Entraste desde un equipo ajeno? Cierra la sesión en todos los demás dispositivos; aquí sigues dentro.</p><button class="btn" type="button" id="cerrar-otras">Cerrar los demás</button></div></section>`;

  $("#fn").addEventListener("submit", (ev) => {
    ev.preventDefault();
    conBoton($("button[type=submit]", ev.target), async () => {
      const nombre = $("#nn").value.trim();
      await api("/api/cuenta", { method: "PUT", body: { nombre } });
      S.usuario.nombre = nombre;
      actualizarUsuario({ nombre });
      toast("Nombre guardado", "ok");
    });
  });
  $("#fpw").addEventListener("submit", (ev) => {
    ev.preventDefault();
    conBoton($("button[type=submit]", ev.target), async () => {
      await api("/api/cuenta/password", { method: "POST", body: { actual: $("#pa").value, nueva: $("#pn").value } });
      ev.target.reset();
      toast("Contraseña actualizada", "ok");
    });
  });
  $("#cerrar-otras").addEventListener("click", (ev) =>
    conBoton(ev.currentTarget, async () => {
      await api("/api/cuenta/sesiones/cerrar", { method: "POST" });
      toast("Listo: las demás sesiones quedaron cerradas", "ok");
    }));
  $("#foto-in").addEventListener("change", async (ev) => {
    const f = ev.target.files[0];
    ev.target.value = "";
    if (!f) return;
    try {
      const datos = await recortarFoto(f);
      const r = await api("/api/cuenta/foto", { method: "PUT", body: { datos } });
      S.usuario.foto_v = r.foto_v;
      actualizarUsuario({ foto_v: r.foto_v });
      toast("Foto actualizada", "ok");
      pintarCuenta();
    } catch (e) {
      toast(e.message || "No se pudo subir la foto.");
    }
  });
  $("#foto-x")?.addEventListener("click", (ev) =>
    conBoton(ev.currentTarget, async () => {
      await api("/api/cuenta/foto", { method: "DELETE" });
      S.usuario.foto_v = null;
      actualizarUsuario({ foto_v: null });
      toast("Foto quitada", "ok");
      pintarCuenta();
    }));
}

/** La foto en cuadrado (el centro de la imagen), 256 px, WebP (o JPEG si el navegador no sabe hacer WebP). */
async function recortarFoto(archivo) {
  if (!/^image\//.test(archivo.type)) throw new Error("Elige una imagen (JPG o PNG).");
  const url = URL.createObjectURL(archivo);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("No se pudo leer la imagen."));
      i.src = url;
    });
    const lado = Math.min(img.naturalWidth, img.naturalHeight), T = 256;
    const c = document.createElement("canvas");
    c.width = c.height = T;
    c.getContext("2d").drawImage(
      img,
      (img.naturalWidth - lado) / 2,
      (img.naturalHeight - lado) / 2,
      lado,
      lado,
      0,
      0,
      T,
      T,
    );
    let d = c.toDataURL("image/webp", 0.85);
    if (!d.startsWith("data:image/webp")) d = c.toDataURL("image/jpeg", 0.85);
    return d;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ── Personas ──
function pintarPersonas() {
  const colores = marcasConColor(S.clientes);
  const marca = (id) => D.clientes.find((c) => c.id === id);
  const fila = (u) => {
    const marcas = u.es_admin
      ? '<span class="muted">Todas</span>'
      : u.accesos.length
      ? `<div class="pmarcas">${
        u.accesos.map((a) => {
          const c = marca(a.cliente_id);
          if (!c) return "";
          return `<span class="pmarca"><i class="mdot m-${colores.get(c.slug)?.color || "azul"}"></i>${esc(c.nombre)}<em>${
            a.rol === "editor" ? "edita" : "solo ve"
          }</em></span>`;
        }).join("")
      }</div>`
      : '<span class="muted">Sin marcas</span>';
    return `<tr class="${u.activo ? "" : "off"}"><td><div class="persona">${avatar(u)}<div><b>${
      esc(u.nombre || u.email)
    }${u.es_admin ? ' <span class="pchip">Administrador</span>' : ""}${
      u.activo ? "" : ' <span class="pchip gris">Desactivada</span>'
    }</b><span>${esc(u.email)}${u.id === S.usuario.id ? " · tú" : ""}</span></div></div></td><td class="tc-marcas">${marcas}</td><td class="tc-acc">${
      u.id === S.usuario.id
        ? `<a class="btn ghost sm" href="#cuenta">Mi cuenta</a>`
        : `<button class="btn ghost sm" type="button" data-editar="${esc(u.id)}">Editar</button>`
    }</td></tr>`;
  };
  $("#sec").innerHTML = cabeza(
    "Personas",
    "Quién entra a Planifica y a qué marcas: si las edita o solo las ve. Los administradores ven todas.",
    `<button class="btn primary" type="button" id="nueva-persona">+ Agregar persona</button>`,
  ) + `<table class="ptabla"><thead><tr><th>Persona</th><th>Marcas</th><th></th></tr></thead><tbody>${
    D.usuarios.map(fila).join("")
  }</tbody></table>`;
  $("#nueva-persona").addEventListener("click", () => formPersona());
  for (const b of $$("[data-editar]")) {
    b.addEventListener("click", () => formPersona(D.usuarios.find((u) => u.id === b.dataset.editar)));
  }
}

function formPersona(u) {
  const colores = marcasConColor(S.clientes);
  const actual = Object.fromEntries((u?.accesos || []).map((a) => [a.cliente_id, a.rol]));
  const m = modal({
    titulo: u ? `Editar a ${u.nombre || u.email}` : "Agregar persona",
    html: `<div class="cfg-form">
      <div class="cfg-row"><div class="fld"><label for="un">Nombre</label><input class="in" id="un" type="text" value="${
      esc(u?.nombre || "")
    }" autocomplete="off"></div>
      <div class="fld"><label for="ue">Correo</label><input class="in" id="ue" type="email" value="${
      esc(u?.email || "")
    }" autocomplete="off">${u ? '<span class="hint">Si lo cambias, entra con el nuevo y se cierran sus sesiones.</span>' : ""}</div></div>
      <div class="fld"><label for="up">${
      u ? 'Contraseña nueva <span class="muted">(opcional; cierra sus sesiones abiertas)</span>' : "Contraseña"
    }</label><input class="in" id="up" type="text" autocomplete="off" minlength="8"><span class="hint">Mínimo 8 caracteres. Compártela por un canal privado.</span></div>
      <label class="check"><input id="ua" type="checkbox" ${u?.es_admin ? "checked" : ""}> Administrador (ve y edita todas las marcas, y gestiona personas y marcas)</label>
      <div class="fld" id="u-marcas"${u?.es_admin ? " hidden" : ""}><span class="lbl">Marcas</span><div class="cfg-accesos">${
      D.clientes.length
        ? D.clientes.map((c) =>
          `<div class="cfg-acceso"><b><i class="mdot m-${colores.get(c.slug)?.color || "azul"}"></i>${esc(c.nombre)}${
            c.activo ? "" : ' <span class="muted small">(archivada)</span>'
          }</b><select class="in" data-c="${c.id}" aria-label="Acceso a ${esc(c.nombre)}"><option value="">Sin acceso</option><option value="editor"${
            actual[c.id] === "editor" ? " selected" : ""
          }>Edita</option><option value="lector"${actual[c.id] === "lector" ? " selected" : ""}>Solo ve</option></select></div>`
        ).join("")
        : '<p class="muted">Aún no hay marcas.</p>'
    }</div></div>
      ${
      u
        ? `<label class="check"><input id="uact" type="checkbox" ${
          u.activo ? "checked" : ""
        }> Cuenta activa (si la desactivas, no puede entrar y se cierran sus sesiones)</label>`
        : ""
    }</div>`,
    acciones: [
      { texto: "Cancelar", onClick: (cerrar) => cerrar() },
      {
        texto: u ? "Guardar" : "Agregar",
        clase: "btn-primary",
        onClick: (cerrar, b) =>
          conBoton(b, async () => {
            const nombre = $("#un", m.el).value;
            const email = $("#ue", m.el).value;
            const password = $("#up", m.el).value;
            const es_admin = $("#ua", m.el).checked;
            let id = u?.id;
            if (u) {
              const body = { nombre, email, es_admin, activo: $("#uact", m.el).checked };
              if (password) body.password = password;
              await api(`/api/admin/usuarios/${u.id}`, { method: "PUT", body });
            } else {
              id = (await api("/api/admin/usuarios", { method: "POST", body: { nombre, email, password, es_admin } })).id;
            }
            if (!es_admin) {
              for (const sel of $$("select[data-c]", m.el)) {
                const rol = sel.value || null;
                if ((actual[sel.dataset.c] || null) === rol) continue;
                await api("/api/admin/accesos", { method: "PUT", body: { usuario_id: id, cliente_id: sel.dataset.c, rol } });
              }
            }
            cerrar();
            toast(u ? "Cambios guardados" : "Persona agregada", "ok");
            await recargar();
          }),
      },
    ],
  });
  $("#ua", m.el).addEventListener("change", (e) => {
    $("#u-marcas", m.el).hidden = e.target.checked;
  });
  $("#un", m.el)?.focus();
}

// ── Marcas ──
const fechaCorta = (ms) =>
  ms ? new Date(ms).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "nunca";

function pintarMarcas() {
  const colores = marcasConColor(S.clientes);
  const personas = (c) =>
    D.usuarios.filter((u) => u.activo && !u.es_admin && u.accesos.some((a) => a.cliente_id === c.id)).length;
  const tarjeta = (c) => {
    const i = c.instagram;
    const ig = !i
      ? '<span class="muted"><i class="anillo"></i>Conectar Instagram</span>'
      : i.estado === "error"
      ? `<span class="warn" title="${esc(i.error || "")}"><i class="mdot"></i>Reconectar Instagram</span>`
      : `<span class="ok" title="@${esc(i.usuario)} · actualizado ${esc(fechaCorta(i.sincronizado_en))}"><i class="mdot"></i>Instagram conectado</span>`;
    const n = personas(c);
    return `<div class="mcard${c.activo ? "" : " off"}"><i class="mdot m-${colores.get(c.slug)?.color || "azul"}"></i>
      <div class="mcard-n"><b>${esc(c.nombre)}</b><span>${
      c.handle ? `@${esc(String(c.handle).replace(/^@/, ""))} · ` : ""
    }<a href="${esc(`${BASE}/${c.slug}`)}">planifica/${esc(c.slug)}</a></span></div>
      <button class="mcard-ig" type="button" data-m="instagram" data-id="${c.id}">${ig}</button>
      <div class="mcard-p"><b>${n}</b><span>${n === 1 ? "persona" : "personas"}</span></div>
      <button class="icon-btn sm" type="button" data-m="menu" data-id="${c.id}" aria-haspopup="menu" aria-label="Más acciones de ${
      esc(c.nombre)
    }">⋯</button></div>`;
  };
  const activas = D.clientes.filter((c) => c.activo), archivadas = D.clientes.filter((c) => !c.activo);
  $("#sec").innerHTML = cabeza(
    "Marcas",
    `Las marcas que llevan: su nombre, su color, su Instagram y quién entra. Máximo ${mb(D.tope_bytes)} de imágenes por marca.`,
    '<button class="btn primary" type="button" id="nueva-marca">+ Nueva marca</button>',
  ) + (activas.length
    ? `<div class="mcards">${activas.map(tarjeta).join("")}</div>`
    : '<div class="empty"><h3>Aún no hay marcas</h3><p>Crea la primera con «Nueva marca».</p></div>') +
    (archivadas.length
      ? `<details class="archivadas"><summary>${plural(archivadas.length, "marca archivada", "marcas archivadas")}</summary><div class="mcards">${
        archivadas.map(tarjeta).join("")
      }</div></details>`
      : "");
  $("#nueva-marca").addEventListener("click", () => formMarca());
  for (const b of $$("[data-m]")) {
    b.addEventListener("click", () => {
      const c = D.clientes.find((x) => x.id === b.dataset.id);
      if (b.dataset.m === "instagram") formInstagram(c);
      else menuMarca(b, c);
    });
  }
}

function cerrarMenuMarca() {
  document.getElementById("mMenu")?.remove();
  document.removeEventListener("mousedown", fueraMenuMarca, true);
}
function fueraMenuMarca(e) {
  const m = document.getElementById("mMenu");
  if (m && !m.contains(e.target) && !e.target.closest('[data-m="menu"]')) cerrarMenuMarca();
}
function menuMarca(boton, c) {
  const abierto = document.getElementById("mMenu");
  cerrarMenuMarca();
  if (abierto && abierto.dataset.id === c.id) return;
  const m = document.createElement("div");
  m.id = "mMenu";
  m.dataset.id = c.id;
  m.className = "av-menu";
  m.setAttribute("role", "menu");
  const it = (k, t, cls = "") => `<button type="button" role="menuitem" data-k="${k}"${cls ? ` class="${cls}"` : ""}>${t}</button>`;
  m.innerHTML = it("editar", "Editar (nombre, @, color)") + it("instagram", "Instagram") + it("importar", "Importar parrilla") +
    "<hr>" + it("estado", c.activo ? "Archivar" : "Reactivar") + it("borrar", "Eliminar…", "peligro");
  document.body.appendChild(m);
  const r = boton.getBoundingClientRect();
  let top = r.bottom + 6;
  if (top + m.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - m.offsetHeight - 6);
  m.style.top = `${Math.round(top)}px`;
  m.style.left = `${Math.round(Math.max(8, r.right - m.offsetWidth))}px`;
  m.addEventListener("click", (e) => {
    const b = e.target.closest("[data-k]");
    if (!b) return;
    cerrarMenuMarca();
    ({ editar: formMarca, instagram: formInstagram, importar, estado: estadoMarca, borrar: borrarMarca })[b.dataset.k](c);
  });
  document.addEventListener("mousedown", fueraMenuMarca, true);
  m.querySelector("button")?.focus();
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarMenuMarca();
});

function paleta(actual) {
  return `<div class="paleta" role="radiogroup" aria-label="Color">${
    COLORES_MARCA.map((k) =>
      `<button type="button" role="radio" class="m-${k}" data-color="${k}" aria-checked="${k === actual}" title="${
        NOMBRES_COLOR[k]
      }" aria-label="${NOMBRES_COLOR[k]}"></button>`
    ).join("")
  }</div>`;
}

function formMarca(c) {
  const colores = marcasConColor(S.clientes);
  // Una marca nueva propone el primer color que nadie usa.
  const usados = new Set([...colores.values()].map((x) => x.color));
  let color = c ? colores.get(c.slug)?.color : COLORES_MARCA.find((k) => !usados.has(k)) || COLORES_MARCA[0];
  const m = modal({
    titulo: c ? `Editar ${c.nombre}` : "Nueva marca",
    html: `<div class="cfg-form">
      <div class="fld"><label for="cn">Nombre</label><input class="in" id="cn" type="text" value="${
      esc(c?.nombre || "")
    }" placeholder="Ej. Laboratorio RH"></div>
      <div class="fld"><label for="ch">Cuenta de Instagram <span class="muted">(opcional)</span></label><input class="in" id="ch" type="text" value="${
      esc(c?.handle || "")
    }" placeholder="@cuenta"></div>
      ${
      c
        ? ""
        : '<div class="fld"><label for="cs">Dirección <span class="muted">(opcional)</span></label><input class="in" id="cs" type="text" placeholder="se crea sola a partir del nombre"><span class="hint" id="cs-h"></span></div>'
    }
      <div class="fld"><span class="lbl">Color</span>${paleta(color)}<span class="hint">Así se ve la marca en el Calendario y en el selector.</span></div></div>`,
    acciones: [
      { texto: "Cancelar", onClick: (cerrar) => cerrar() },
      {
        texto: c ? "Guardar" : "Crear marca",
        clase: "btn-primary",
        onClick: (cerrar, b) =>
          conBoton(b, async () => {
            const body = { nombre: $("#cn", m.el).value, handle: $("#ch", m.el).value, color };
            if (c) await api(`/api/admin/clientes/${c.id}`, { method: "PUT", body });
            else {
              const slug = $("#cs", m.el).value.trim().toLowerCase();
              const r = await api("/api/admin/clientes", { method: "POST", body: slug ? { ...body, slug } : body });
              toast(`Marca creada: ${BASE}/${r.slug}`, "ok");
            }
            cerrar();
            await refrescarSesion();
            await recargar();
          }),
      },
    ],
  });
  for (const b of $$(".paleta [data-color]", m.el)) {
    b.addEventListener("click", () => {
      color = b.dataset.color;
      for (const x of $$(".paleta [data-color]", m.el)) x.setAttribute("aria-checked", String(x === b));
    });
  }
  const cs = $("#cs", m.el);
  if (cs) {
    const h = $("#cs-h", m.el);
    const mostrar = () => {
      h.textContent = `${location.origin}${BASE}/${cs.value.trim() || "…"}`;
    };
    cs.addEventListener("input", mostrar);
    mostrar();
  }
  $("#cn", m.el).focus();
}

/** La sesión trae las marcas con su color (para el selector y los colores por orden). */
async function refrescarSesion() {
  S = await api("/api/sesion");
  montarCabecera({ sesion: S, actual: null });
}

async function estadoMarca(c) {
  const ok = c.activo
    ? await confirmar(`¿Archivar «${c.nombre}»? Las personas asignadas dejan de verla; tú sí la verás y podrás reactivarla.`, {
      ok: "Archivar",
      titulo: "Archivar marca",
    })
    : await confirmar(`¿Reactivar «${c.nombre}»?`, { ok: "Reactivar", titulo: "Reactivar marca" });
  if (!ok) return;
  try {
    await api(`/api/admin/clientes/${c.id}`, { method: "PUT", body: { activo: !c.activo } });
    await refrescarSesion();
    await recargar();
  } catch (e) {
    toast(e.message);
  }
}

function borrarMarca(c) {
  const m = modal({
    titulo: `Eliminar ${c.nombre}`,
    html: `<div class="notice bad">${
      icon("warn")
    }<div>Se borran para siempre sus publicaciones, objetivos e imágenes, y los accesos de las personas. No se puede deshacer. Si solo quieres que no se vea, archívala.</div></div>
      <div class="field" style="margin-top:12px"><label for="xn">Escribe el nombre exacto de la marca para confirmar</label><input class="in" id="xn" type="text" autocomplete="off" placeholder="${
      esc(c.nombre)
    }"></div>`,
    acciones: [
      { texto: "Cancelar", onClick: (cerrar) => cerrar() },
      {
        texto: "Eliminar para siempre",
        clase: "btn-danger solid",
        onClick: (cerrar, b) =>
          conBoton(b, async () => {
            await api(`/api/admin/clientes/${c.id}`, { method: "DELETE", body: { nombre: $("#xn", m.el).value } });
            cerrar();
            toast(`«${c.nombre}» eliminada`, "ok");
            await refrescarSesion();
            await recargar();
          }),
      },
    ],
  });
}

function importar(c) {
  const m = modal({
    titulo: `Importar parrilla en ${c.nombre}`,
    html:
      `<p>Elige el archivo de exportación de una <b>Parrilla de Contenido</b> (.json). Se suman sus publicaciones, objetivos e imágenes a esta marca; los objetivos del mismo mes o trimestre se reemplazan.</p>
      <div class="field"><label for="fi">Archivo</label><input id="fi" type="file"><span class="hint">El archivo .json de la exportación. Si no lo ves, revisa la carpeta de Descargas.</span></div>`,
    acciones: [
      { texto: "Cancelar", onClick: (cerrar) => cerrar() },
      {
        texto: "Importar",
        clase: "btn-primary",
        onClick: (cerrar, b) =>
          conBoton(b, async () => {
            const f = $("#fi", m.el).files[0];
            if (!f) throw new Error("Elige un archivo.");
            if (f.size > 7_500_000) throw new Error("El archivo es demasiado grande (máximo 7 MB).");
            let datos;
            // Sin filtro de tipo en el selector (algunos móviles ocultan los .json): se valida aquí.
            try {
              datos = JSON.parse(await f.text());
            } catch {
              throw new Error("Ese archivo no es una exportación de la Parrilla de Contenido (debe ser el .json que se descargó).");
            }
            const r = await api("/api/admin/importar", { method: "POST", body: { cliente_id: c.id, datos } });
            cerrar();
            toast(
              `Importado: ${plural(r.publicaciones, "publicación", "publicaciones")}, ${
                plural(r.objetivos, "objetivo", "objetivos")
              } y ${plural(r.imagenes, "imagen", "imágenes")}`,
              "ok",
            );
            await recargar();
          }),
      },
    ],
  });
}

// ── Instagram (métricas) ──
function formInstagram(c) {
  const i = c.instagram;
  const estado = i
    ? `<div class="notice ${i.estado === "error" ? "bad" : "ok"}">${icon(i.estado === "error" ? "warn" : "check")}<div>
        ${i.estado === "error" ? `<b>Hay que volver a conectarla.</b> ${esc(i.error || "")}` : `Conectada como <b>@${esc(i.usuario)}</b>.`}
        <br><span class="small">Última actualización: ${esc(fechaCorta(i.sincronizado_en))}${
      i.token_vence ? " · El token se renueva solo." : ""
    }</span></div></div>`
    : "";
  const m = modal({
    titulo: `Instagram de ${c.nombre}`,
    html: `${estado}
      <p class="small" style="margin-top:12px">${
      i
        ? "Para cambiar la cuenta o arreglar la conexión, vuelve a conectarla con Meta."
        : "Conecta la cuenta de Instagram de la marca. Planifica traerá sus métricas cada mañana."
    }</p>
      <p class="small muted">Te llevará a Meta: inicia sesión, elige la cuenta de Instagram de la marca (y su cuenta publicitaria, si la tiene) y autoriza. Al terminar vuelves aquí.</p>
      <button class="btn primary" type="button" id="igmeta" style="margin:6px 0 14px">${
      i ? "Volver a conectar con Meta" : "Conectar con Meta"
    }</button>
      <details class="small"><summary class="muted" style="cursor:pointer">Pegar un token a mano (inicio de sesión de Instagram)</summary>
        <div class="field" style="margin-top:8px"><label for="igt">Token</label><textarea class="in" id="igt" rows="3" autocomplete="off" spellcheck="false" placeholder="IGAA…"></textarea>
        <span class="hint">Se guarda cifrado y nadie lo puede volver a ver, ni siquiera tú.</span></div>
        <button class="btn sm" type="button" id="igtok">Guardar token</button>
      </details>`,
    acciones: [
      ...(i
        ? [{
          texto: "Desconectar",
          clase: "btn-danger",
          onClick: async (cerrar, b) => {
            if (!(await confirmar(`¿Desconectar @${i.usuario}? Las métricas ya guardadas se conservan.`, { ok: "Desconectar" }))) return;
            await conBoton(b, async () => {
              await api(`/api/admin/clientes/${c.id}/redes/ig`, { method: "DELETE" });
              cerrar();
              toast("Instagram desconectado", "ok");
              await recargar();
            });
          },
        }]
        : []),
      { texto: "Cerrar", onClick: (cerrar) => cerrar() },
    ],
  });
  $("#igmeta", m.el).addEventListener("click", (e) =>
    conBoton(e.currentTarget, async () => {
      const r = await api(`/api/admin/clientes/${c.id}/redes/meta`);
      location.href = r.url;
    }));
  $("#igtok", m.el).addEventListener("click", (e) =>
    conBoton(e.currentTarget, async () => {
      const r = await api(`/api/admin/clientes/${c.id}/redes/ig`, { method: "PUT", body: { token: $("#igt", m.el).value } });
      m.cerrar();
      toast(`Conectado como @${r.usuario}`, "ok");
      await recargar();
    }));
}

/** Al volver de Meta: conectada, error o elegir entre varias cuentas autorizadas. */
async function vueltaDeMeta() {
  const q = new URLSearchParams(location.search);
  const ok = q.get("meta_ok"), err = q.get("meta_error"), pend = q.get("meta_elegir");
  if (!ok && !err && !pend) return;
  history.replaceState(null, "", `${location.pathname}#marcas`);
  pintar();
  if (ok) toast(`Instagram conectado como @${ok}`, "ok");
  if (err) toast(err, "bad");
  if (!pend) return;
  let p;
  try {
    p = await api(`/api/admin/redes/meta/pendiente/${encodeURIComponent(pend)}`);
  } catch (e) {
    toast(e.message, "bad");
    return;
  }
  const m = modal({
    titulo: `¿Qué cuenta es de ${p.cliente}?`,
    html: `<p class="small">Autorizaste varias cuentas de Instagram. Elige la de esta marca.</p>
      <div class="field">${
      p.cuentas.map((x, n) =>
        `<label style="display:flex;gap:8px;align-items:center;margin:6px 0"><input type="radio" name="igc" value="${esc(x.id)}"${
          n ? "" : " checked"
        }> @${esc(x.usuario || x.id)}</label>`
      ).join("")
    }</div>`,
    acciones: [
      { texto: "Cancelar", onClick: (cerrar) => cerrar() },
      {
        texto: "Conectar",
        clase: "btn-primary",
        onClick: (cerrar, b) =>
          conBoton(b, async () => {
            const cuenta_id = $('input[name="igc"]:checked', m.el)?.value;
            const r = await api("/api/admin/redes/meta/elegir", { method: "POST", body: { state: pend, cuenta_id } });
            cerrar();
            toast(`Instagram conectado como @${r.usuario}`, "ok");
            await recargar();
          }),
      },
    ],
  });
}

boot();
