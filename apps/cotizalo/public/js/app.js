// Aplicación del paciente: arma un presupuesto, lo genera y lo exporta (PDF, imagen o texto).
import {
  $,
  api,
  aplicarColor,
  bs,
  conBoton,
  confirmar,
  diaLocal,
  dispositivo,
  esc,
  fmtFecha,
  fmtTasa,
  icon,
  modal,
  ref,
  toast,
} from "./common.js";
import { aliasDe, aliasEncontrado, buscar, palabrasBuscadas, pidePerfiles } from "./busqueda.js";
import { enLista, frasePromo } from "./frase-promo.js";
import {
  buildDoc,
  compartir,
  copiarTexto,
  descargar,
  paperHTML,
  puedeCompartir,
  toPdfBlob,
  toPngBlob,
  toText,
} from "./export.js";

const S = {
  cfg: null,
  cat: null,
  vista: "catalogo",
  tab: "examenes",
  q: "",
  catId: "",
  ex: [],
  cant: {},
  pf: [],
  pac: { nombre: "", cedula: "", telefono: "", medico: "" },
  origen: "",
  res: null,
  firma: null,
  tabAuto: false, // la pestaña Perfiles la eligió la búsqueda («perfil…»), no la persona
};
let exMap = new Map();
let pfMap = new Map();
let K = "pe:?";
// Celular y pantallas táctiles: la tarjeta no agrega (solo su botón) y al buscar se esconde lo de arriba
const MOVIL = matchMedia("(max-width: 719px), (pointer: coarse)");
/** Fecha corta «30/11» (con año solo si no es el actual). */
const diaMes = (dia) => {
  const f = fmtFecha(dia);
  return dia.slice(0, 4) === String(new Date().getFullYear()) ? f.slice(0, 5) : f;
};

// ───────────── Datos derivados ─────────────
// Cantidad de cada examen (S.cant solo guarda las mayores que 1). Cuántas veces se puede pedir
// un mismo examen lo decide su categoría: max_por_examen (vacío o 1 = una sola vez).
const cant = (id) => S.cant[id] || 1;
const maxPor = (e) => {
  const c = S.cat.categorias.find((k) => k.id === e?.categoria_id);
  return Number(c?.max_por_examen) > 1 ? Number(c.max_por_examen) : 1;
};
const nItems = () => S.ex.reduce((s, id) => s + cant(id), 0) + S.pf.length;
const totalRef = () =>
  S.ex.reduce((s, id) => s + (exMap.get(id)?.precio_cent || 0) * cant(id), 0) +
  S.pf.reduce((s, id) => s + (pfMap.get(id)?.precio_cent || 0), 0);
const cubiertoPor = (exId) => {
  for (const pid of S.pf) {
    const p = pfMap.get(pid);
    if (p?.ids.has(exId)) return p;
  }
  return null;
};
const items = () => [
  ...S.ex.map((
    id,
  ) => (cant(id) > 1 ? { tipo: "examen", id, cantidad: cant(id) } : { tipo: "examen", id })),
  ...S.pf.map((id) => ({ tipo: "perfil", id })),
];
/** Deja las cantidades coherentes: solo de exámenes elegidos y sin pasar el máximo de su categoría. */
function ajustarCantidades() {
  const c = {};
  for (const id of S.ex) {
    const n = Math.min(Number(S.cant[id]) || 1, maxPor(exMap.get(id)));
    if (n > 1) c[id] = n;
  }
  S.cant = c;
}

function indexar() {
  exMap = new Map(S.cat.examenes.map((e) => [e.id, e]));
  pfMap = new Map(
    S.cat.perfiles.map((p) => [p.id, { ...p, ids: new Set(p.examenes.map((m) => m.id)) }]),
  );
}

// ───────────── Persistencia local (solo en este dispositivo) ─────────────
const leer = (store, k) => {
  try {
    return JSON.parse(store.getItem(`${K}:${k}`));
  } catch {
    return null;
  }
};
const guardar = (store, k, v) => {
  try {
    store.setItem(`${K}:${k}`, JSON.stringify(v));
  } catch { /* almacenamiento no disponible */ }
};
function cargarEstado() {
  const c = leer(localStorage, "carro");
  if (c) {
    S.ex = [...new Set((c.ex || []).filter((id) => exMap.has(id)))];
    S.pf = (c.pf || []).filter((id) => pfMap.has(id));
    S.cant = c.cant || {};
  }
  // Seguridad: si el carro guardado tuviera repetidos, se limpia
  const usados = new Set();
  for (const id of S.pf) {
    for (const x of pfMap.get(id).ids) {
      if (usados.has(x)) {
        S.pf = [];
        break;
      }
      usados.add(x);
    }
  }
  S.ex = S.ex.filter((id) => !cubiertoPor(id));
  ajustarCantidades();
  const r = leer(localStorage, "res");
  if (r) {
    S.res = r.res;
    S.firma = r.firma;
  }
  const p = leer(sessionStorage, "pac"); // los datos personales duran solo mientras la pestaña esté abierta
  if (p) S.pac = { ...S.pac, ...p };
  S.origen = leer(sessionStorage, "origen") || "";
  S.origenDetalle = leer(sessionStorage, "origenD") || "";
  S.origenRespondido = !!leer(sessionStorage, "origenR");
}
const guardarCarro = () => guardar(localStorage, "carro", { ex: S.ex, pf: S.pf, cant: S.cant });

// ───────────── Arranque ─────────────
async function init() {
  const app = $("#app");
  app.innerHTML =
    '<div class="wrap" style="padding-top:24px"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>';
  try {
    [S.cfg, S.cat] = await Promise.all([api("/api/publico/config"), api("/api/publico/catalogo")]);
  } catch (e) {
    app.innerHTML =
      `<div class="wrap" style="padding-top:40px"><div class="card centro"><h1>No pudimos cargar la página</h1><p class="muted">${
        esc(e.message)
      }</p><button class="btn btn-primary" onclick="location.reload()">Reintentar</button></div></div>`;
    return;
  }
  K = `pe:${S.cfg.negocio.slug}`;
  indexar();
  aplicarColor(S.cfg.negocio.color, S.cfg.negocio.tema);
  document.title = `${S.cfg.negocio.nombre} · Presupuesto de exámenes`;
  cargarEstado();
  montar();
  medirCabecera();
  // Si ya había un presupuesto generado (p. ej. al recargar la página), se muestra ese
  if (S.res) S.vista = "ok";
  history.replaceState({ v: S.vista }, "");
  window.addEventListener("popstate", (e) => {
    // Con un presupuesto generado no se vuelve a la lista ni al resumen: solo «Nuevo presupuesto» sale de ahí
    if (S.res) {
      S.vista = "ok";
      history.replaceState({ v: "ok" }, "");
      renderVista();
      return;
    }
    S.vista = e.state?.v || "catalogo";
    if (S.vista === "ok") S.vista = "resumen";
    renderVista();
  });
  renderTodo();
  if (!sessionStorage.getItem(`${K}:visita`)) {
    sessionStorage.setItem(`${K}:visita`, "1");
    api("/api/publico/visita", { method: "POST", body: { dispositivo: dispositivo() } }).catch(
      () => {},
    );
  }
}

function montar() {
  const n = S.cfg.negocio;
  $("#app").innerHTML = `
  <header class="top"><div class="wrap">
    <div class="brand">${
    n.logo ? `<img src="${esc(n.logo)}" alt="">` : `<span class="mark">${icon("flask")}</span>`
  }
      <div style="min-width:0"><strong>${
    esc(n.nombre)
  }</strong><small>Presupuesto de exámenes</small></div></div>
    <div class="ratechip" id="rate"></div>
  </div></header>
  <main class="patient wrap">
    <section id="v-catalogo" class="stack">
      <div class="ratebar" id="ratebar"></div>
      <div id="aviso"></div>
      <div class="buscador" id="buscador">
        <div class="search">${
    icon("search")
  }<input id="q" type="search" enterkeyhint="done" placeholder="Buscar examen o perfil…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Buscar examen o perfil" aria-describedby="qhint">
          <button type="button" class="limpiar" data-act="limpiar" aria-label="Borrar la búsqueda" hidden><span aria-hidden="true">×</span></button></div>
        <p class="qhint" id="qhint" aria-live="polite"></p>
      </div>
      <div class="chips" id="chips" aria-label="Categorías"></div>
      <div class="tabs" id="tabs"></div>
      <div id="lista"></div>
    </section>
    <section id="v-resumen" hidden></section>
    <section id="v-ok" hidden></section>
  </main>
  <div class="cartbar" id="cartbar" hidden></div>`;
}

// ───────────── Pintado ─────────────
function renderTodo() {
  renderRate();
  renderAviso();
  renderChips();
  renderLista();
  renderVista();
}

function renderRate() {
  const t = S.cfg.tasa;
  const el = $("#rate"), bar = $("#ratebar");
  if (!t) {
    el.innerHTML = "<b>Tasa no disponible</b>";
    bar.innerHTML = "Tasa no disponible";
    return;
  }
  const cls = t.desactualizada ? " stale" : "";
  const ley = t.manual ? "Tasa del negocio" : `Tasa BCV ${fmtFecha(t.fecha_valor)}`;
  const ej = t.fuente === "ejemplo" ? " · ejemplo" : "";
  el.className = `ratechip${cls}`;
  el.innerHTML = `<b>1 REF = ${fmtTasa(t.valor)} Bs.</b>${ley}${ej}`;
  bar.className = `ratebar${cls}`;
  bar.innerHTML = `<b>1 REF = ${fmtTasa(t.valor)} Bs.</b> · ${ley}${ej}`;
}

// ───────────── Anuncio de promociones ─────────────
/** Promociones de hoy con algo visible para el paciente. */
const promosVisibles = () =>
  (S.cat.promociones || [])
    .map((p) => ({
      ...p,
      frase: frasePromo(p, { categorias: S.cat.categorias, examenes: exMap, perfiles: pfMap }),
    }))
    .filter((p) => p.frase);
const hayPromos = () => S.cat.examenes.some((e) => e.promo) || S.cat.perfiles.some((p) => p.promo);

// Grande o compacto: la primera vez que la persona ve unas promociones, el anuncio sale completo; desde la
// siguiente visita (o en cuanto lo toca) sale en una sola línea. Lo ya visto se recuerda en este teléfono.
let promoGrande = null;
function decidirTamanoPromo(promos) {
  if (promoGrande !== null) return;
  const vistas = new Set(leer(localStorage, "promosVistas") || []);
  promoGrande = promos.some((p) => !vistas.has(p.id));
  guardar(
    localStorage,
    "promosVistas",
    [...new Set([...vistas, ...promos.map((p) => p.id)])].slice(-50),
  );
}

/**
 * Anuncio del inicio.
 *  · grande: 🎉 y, una debajo de otra, las promociones activas (nombre, frase y fecha); abajo «Ver promociones»
 *    (filtra la lista y lo compacta) y arriba a la derecha una flecha para plegarlo sin filtrar
 *  · compacto: una línea («Mes Rosa · −20% en…» o «2 promociones: Mes Rosa y …»); al tocarla se despliega
 *    otra vez, por si se plegó sin querer y se quiere leer de qué se tratan
 */
function anuncioPromos(promos) {
  const frase = (p) => `<strong>${esc(p.frase.pct)}</strong> ${esc(p.frase.texto)}`;
  if (!promoGrande) {
    const linea = promos.length === 1
      ? `<b>${esc(promos[0].nombre)}</b> · ${frase(promos[0])}`
      : `<b>${promos.length} promociones:</b> ${esc(enLista(promos.map((p) => p.nombre)))}`;
    return `<button type="button" class="promo-anuncio compacta" data-act="abrirpromo" aria-expanded="false">
      <span class="emoji" aria-hidden="true">🎉</span><span class="linea">${linea}</span>
      <span class="flecha abajo" aria-hidden="true">›</span><span class="sr">Ver detalles</span></button>`;
  }
  return `<div class="promo-anuncio" role="region" aria-label="Promociones">
    <span class="emoji" aria-hidden="true">🎉</span>
    <div class="txt">${
    promos.map((p) =>
      `<div class="una"><b>${esc(p.nombre)}</b><span>${frase(p)}</span><small>Hasta el ${
        diaMes(p.hasta)
      }</small></div>`
    ).join("")
  }
      <button type="button" class="btn ver" data-act="verpromo">Ver promociones</button></div>
    <button type="button" class="plegar" data-act="plegarpromo" aria-expanded="true" aria-label="Plegar el anuncio"><span class="flecha arriba" aria-hidden="true">›</span></button>
  </div>`;
}

function renderAviso() {
  const fecha = S.cfg.precios_actualizados_en ? diaLocal(S.cfg.precios_actualizados_en) : null;
  const promos = promosVisibles();
  if (promos.length) decidirTamanoPromo(promos);
  $("#aviso").innerHTML = (promos.length ? anuncioPromos(promos) : "") + (
    fecha
      ? `<div class="notice">${icon("info")}<div>Última actualización de precios: <b>${
        fmtFecha(fecha)
      }</b></div></div>`
      : ""
  );
}

function renderChips() {
  const cats = [
    { id: "", nombre: "Todas" },
    ...(hayPromos() ? [{ id: "promo", nombre: "🏷️ Promociones" }] : []),
    ...S.cat.categorias,
  ];
  const el = $("#chips");
  const x = el.scrollLeft; // en el celular la línea se desliza: no volver al inicio al elegir
  el.innerHTML = cats.map((c) =>
    `<button type="button" class="chip ${S.catId === c.id ? "on" : ""}" data-act="cat" data-id="${
      esc(c.id)
    }" aria-pressed="${S.catId === c.id}">${esc(c.nombre)}</button>`
  ).join("");
  el.scrollLeft = x;
  marcarFinChips();
}

/** Sin desvanecido a la derecha cuando ya se ve la última categoría. */
function marcarFinChips() {
  const el = $("#chips");
  if (el) el.classList.toggle("al-final", el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
}

/** La categoría elegida queda a la vista (en el celular, la línea se desliza hasta ella). */
function mostrarChipElegido() {
  const el = $("#chips");
  const on = el?.querySelector(".chip.on");
  if (!on || el.scrollWidth <= el.clientWidth) return;
  const centro = on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2;
  el.scrollTo({ left: Math.max(0, centro), behavior: "smooth" });
}

// ───────────── Búsqueda ─────────────
// La lógica (tolerancia a errores, otros nombres, «perfil») está en busqueda.js; aquí, el estado de la pantalla.
/** «perfil…» en la búsqueda: pasa a la pestaña Perfiles (y vuelve a Exámenes si se borra y fue automático). */
function pestanaPorBusqueda() {
  const pide = pidePerfiles(S.q);
  if (pide && S.tab !== "perfiles") {
    S.tab = "perfiles";
    S.tabAuto = true;
  } else if (!pide && S.tabAuto) {
    S.tab = "examenes";
    S.tabAuto = false;
  }
}

function filtrar() {
  const palabras = palabrasBuscadas(S.q);
  const ex = buscar(
    S.cat.examenes.filter((e) =>
      !S.catId || (S.catId === "promo" ? !!e.promo : e.categoria_id === S.catId)
    ),
    palabras,
    (e) => [`${e.nombre} ${e.descripcion || ""}`, ...aliasDe(e)],
  );
  const pf = buscar(
    S.cat.perfiles.filter((p) =>
      !S.catId ||
      (S.catId === "promo"
        ? !!p.promo
        : p.examenes.some((m) => (m.categoria_id ?? exMap.get(m.id)?.categoria_id) === S.catId))
    ),
    palabras,
    (p) => [p.nombre, ...p.examenes.flatMap((m) => [m.nombre, ...aliasDe(m)])],
  );
  return { ex, pf };
}

/** Precio de una tarjeta: con promoción, el de antes tachado y el nuevo. */
function precioConPromo(x, sufijo = "") {
  if (!x.promo) return `<div class="price">${ref(x.precio_cent)}${sufijo}</div>`;
  return `<div class="price promo"><s aria-label="Antes">${ref(x.precio_lista_cent)}</s> ${
    ref(x.precio_cent)
  }${sufijo}</div>`;
}
/**
 * Chip de promoción: el emoji de promociones y el descuento («🏷️ −20 %»). El nombre y la fecha van en el
 * anuncio de arriba.
 */
function etiquetaPromo(x) {
  if (!x.promo) return "";
  return `<span class="promo-tag" title="${
    esc(x.promo.nombre || "Promoción")
  }"><span aria-hidden="true">🏷️</span> −${x.promo.porcentaje} %</span>`;
}

/**
 * Botón de agregar de una tarjeta. En el celular es un círculo grande solo con el ícono (+ / ✓) y el texto
 * queda para los lectores de pantalla; en pantallas grandes se ve «+ Agregar» / «✓ Agregado».
 */
function botonAgregar(act, x, sel) {
  return `<button type="button" class="btn agregar ${
    sel ? "btn-primary" : "btn-soft"
  }" data-act="${act}" data-id="${esc(x.id)}" aria-pressed="${sel}" aria-label="${
    sel ? "Quitar" : "Agregar"
  } ${esc(x.nombre)}">${icon(sel ? "check" : "plus")}<span class="txt">${
    sel ? "Agregado" : "Agregar"
  }</span></button>`;
}

/**
 * Debajo del nombre, cada cosa en su línea: en un examen, las indicaciones y luego la promoción; en un perfil,
 * la promoción primero (las indicaciones, si hay, después).
 */
function metaTarjeta(x, promoPrimero = false) {
  const ind = x.indicaciones
    ? `<div class="meta ind">${icon("info")}<span>${esc(x.indicaciones)}</span></div>`
    : "";
  const promo = x.promo ? `<div class="meta">${etiquetaPromo(x)}</div>` : "";
  return promoPrimero ? promo + ind : ind + promo;
}

// Tarjeta sencilla: nombre, precio y botón; debajo, descripción, indicaciones y promoción. Sin categoría.
function cardExamen(e) {
  const sel = S.ex.includes(e.id);
  const cub = !sel && cubiertoPor(e.id);
  const max = maxPor(e);
  const tambien = aliasEncontrado(e, palabrasBuscadas(S.q));
  const cabeza = `<h3>${esc(e.nombre)}</h3>${
    tambien ? `<p class="alias">También llamado <b>${esc(tambien)}</b></p>` : ""
  }${e.descripcion ? `<p class="desc">${esc(e.descripcion)}</p>` : ""}`;
  // Ya viene en un perfil elegido: no se cobra aparte, así que sin precio ni promoción; un ✓ en lugar del botón
  if (cub) {
    return `<article class="item dis">
    <div>${cabeza}<div class="meta incluido">${icon("check")}<span>Incluido en ${
      esc(cub.nombre)
    }</span></div></div>
    <div class="side"><span class="ya-incluido" role="img" aria-label="Incluido en ${
      esc(cub.nombre)
    }">${icon("check")}</span></div>
  </article>`;
  }
  const accion = sel && max > 1 ? contador(e, "tarjeta") : botonAgregar("ex", e, sel);
  return `<article class="item ${sel ? "sel" : ""}">
    <div>${cabeza}${metaTarjeta(e)}</div>
    <div class="side">${precioConPromo(e, max > 1 ? "<small> c/u</small>" : "")}${accion}</div>
  </article>`;
}

/** Contador − n + para los exámenes que se pueden pedir varias veces. */
function contador(e, donde) {
  const n = cant(e.id);
  const max = maxPor(e);
  return `<div class="contador ${donde}" role="group" aria-label="Cantidad de ${esc(e.nombre)}">
    <button type="button" class="btn btn-sm btn-icon" data-act="menos" data-id="${
    esc(e.id)
  }" aria-label="${n === 1 ? "Quitar" : "Uno menos"}">${n === 1 ? icon("trash") : "−"}</button>
    <span aria-live="polite">${n}</span>
    <button type="button" class="btn btn-sm btn-icon" data-act="mas" data-id="${
    esc(e.id)
  }" aria-label="Uno más" ${n >= max ? "disabled" : ""}>+</button>
  </div>`;
}

function cardPerfil(p) {
  const sel = S.pf.includes(p.id);
  const info = pfMap.get(p.id);
  const n = info.ids.size;
  return `<article class="item perfil ${sel ? "sel" : ""}">
    <div><h3>${esc(p.nombre)}</h3>${metaTarjeta(p, true)}</div>
    <div class="side">${precioConPromo(p)}${botonAgregar("pf", p, sel)}</div>
    <p class="incluye"><b>${n === 1 ? "Incluye 1 examen" : `Incluye ${n} exámenes`}:</b> ${
    [...info.ids].map((id) => esc(p.examenes.find((m) => m.id === id)?.nombre)).join(", ")
  }</p>
  </article>`;
}

function renderLista() {
  const { ex, pf } = filtrar();
  $("#tabs").innerHTML = `<button type="button" class="${
    S.tab === "examenes" ? "on" : ""
  }" data-act="tab" data-id="examenes">Exámenes <span class="n">(${ex.length})</span></button>
    <button type="button" class="${
    S.tab === "perfiles" ? "on" : ""
  }" data-act="tab" data-id="perfiles">Perfiles <span class="n">(${pf.length})</span></button>`;
  const lista = S.tab === "examenes" ? ex : pf;
  const otro = S.tab === "examenes" ? pf.length : ex.length;
  let html;
  if (!S.cat.examenes.length) {
    html = `<div class="empty">${
      icon("empty")
    }<p>Este negocio aún no tiene exámenes publicados.</p></div>`;
  } else if (!lista.length) {
    html = `<div class="empty">${icon("search")}<p>No encontramos ${
      S.tab === "examenes" ? "exámenes" : "perfiles"
    } con ese criterio.</p>
      ${
      otro
        ? `<button type="button" class="btn btn-soft btn-sm" data-act="tab" data-id="${
          S.tab === "examenes" ? "perfiles" : "examenes"
        }">Ver ${otro} en ${S.tab === "examenes" ? "Perfiles" : "Exámenes"}</button>`
        : ""
    }</div>`;
  } else {
    // El catálogo llega ordenado por lo más pedido; al buscar, primero lo que coincide tal cual
    html = lista.map(S.tab === "examenes" ? cardExamen : cardPerfil).join("");
    // Si la categoría elegida tiene límite, se avisa antes de que el paciente choque con él
    const cat = S.tab === "examenes" && S.catId && S.cat.categorias.find((c) => c.id === S.catId);
    // Categorías con exámenes repetibles (p. ej. Patología): aviso del negocio o uno general, sin decir el máximo.
    const max = Number(cat?.max_por_examen) || 0;
    if (max > 1) {
      const aviso = cat.aviso_repetible ||
        `En exámenes de ${cat.nombre} se pueden analizar varias muestras.`;
      html = `<p class="limite">${icon("info")}<span>${esc(aviso)}</span></p>${html}`;
    }
  }
  $("#lista").innerHTML = html;
  renderCartBar();
}

function renderCartBar() {
  const bar = $("#cartbar");
  const n = nItems();
  bar.hidden = !(n > 0 && S.vista === "catalogo");
  if (bar.hidden) return;
  bar.innerHTML =
    `<div class="cart-in"><button type="button" class="vaciar" data-act="vaciar" aria-label="Vaciar presupuesto" title="Vaciar presupuesto">${
      icon("trash")
    }</button>
    <button type="button" class="ir" data-act="resumen"><span class="count">${n}</span><span class="grow">Ver mi presupuesto</span><span>${
      ref(totalRef())
    }</span></button></div>`;
}

function renderVista() {
  for (const v of ["catalogo", "resumen", "ok"]) $(`#v-${v}`).hidden = S.vista !== v;
  if (S.vista === "resumen") renderResumen();
  if (S.vista === "ok") renderOk();
  renderCartBar();
  window.scrollTo({ top: 0 });
}

function irA(v) {
  if (S.vista === v) return;
  S.vista = v;
  history.pushState({ v }, "");
  renderVista();
}

// ───────────── Resumen ─────────────
function formPaciente() {
  const c = (k, label, extra = "") =>
    `<div class="field"><label for="p-${k}">${label}</label><input id="p-${k}" type="text" data-pac="${k}" maxlength="80" value="${
      esc(S.pac[k])
    }" ${extra}></div>`;
  return `<div class="row">${c("nombre", "Nombre y apellido", 'autocomplete="name"')}${
    c("cedula", "Cédula de identidad", 'inputmode="text"')
  }</div>
    <div class="row">${c("telefono", "Teléfono", 'inputmode="tel" autocomplete="tel"')}${
    c("medico", "Médico referente")
  }</div>`;
}

function renderResumen() {
  const el = $("#v-resumen");
  if (!nItems()) {
    el.innerHTML = `<div class="empty">${
      icon("cart")
    }<p>Tu presupuesto está vacío.</p><button class="btn btn-primary" data-act="volver">Elegir exámenes</button></div>`;
    return;
  }
  const t = S.cfg.tasa;
  const total = totalRef();
  const lineas = [
    ...S.pf.map((id) => pfMap.get(id)).map((p) => ({
      tipo: "pf",
      id: p.id,
      nombre: p.nombre,
      precio: p.precio_cent,
      sub: [
        p.promo && `Promoción −${p.promo.porcentaje} %`,
        `Incluye ${p.examenes.length} exámenes: ${p.examenes.map((m) => m.nombre).join(", ")}`,
        p.indicaciones,
      ].filter(Boolean).join(" · "),
    })),
    ...S.ex.map((id) => exMap.get(id)).map((e) => {
      const n = cant(e.id);
      const sub = [
        e.promo && `Promoción −${e.promo.porcentaje} %`,
        n > 1 && `${n} × ${ref(e.precio_cent)}`,
        e.indicaciones,
      ].filter(Boolean).join(
        " · ",
      );
      return {
        tipo: "ex",
        id: e.id,
        nombre: e.nombre,
        precio: e.precio_cent * n,
        sub,
        e,
        repetible: maxPor(e) > 1,
      };
    }),
  ];
  el.innerHTML = `
    <div class="res-head"><button type="button" class="btn btn-ghost back" data-act="volver">${
    icon("back")
  } Seguir agregando</button>
      <button type="button" class="btn btn-ghost btn-sm vaciar-txt" data-act="vaciar">${
    icon("trash")
  } Vaciar</button></div>
    <ol class="pasos" aria-label="Pasos"><li class="hecho"><i>${
    icon("check")
  }</i>Elige</li><li class="actual" aria-current="step"><i>2</i>Revisa</li><li><i>3</i>Genera</li></ol>
    <h2 style="margin:4px 0 10px">Revisa tu presupuesto</h2>
    <div class="notice falta">${
    icon("info")
  }<div><b>Aún no está listo.</b> Revisa los exámenes y pulsa <b>Generar presupuesto</b>: así obtienes tu código y puedes descargarlo para presentarlo en el laboratorio.</div></div>
    <div class="card lines">${
    lineas.map((l) =>
      `<div class="line ${l.repetible ? "con-contador" : ""}"><div><b>${esc(l.nombre)}</b>${
        l.sub ? `<small>${esc(l.sub)}</small>` : ""
      }</div><div class="price">${ref(l.precio)}</div>
      ${
        l.repetible
          ? contador(l.e, "linea")
          : `<button type="button" class="btn btn-icon btn-ghost" aria-label="Quitar ${
            esc(l.nombre)
          }" data-act="${l.tipo}" data-id="${esc(l.id)}">${icon("trash")}</button>`
      }</div>`
    ).join("")
  }</div>
    <div class="card totals">
      <div class="tr"><span>Total en REF</span><span class="big">${ref(total)}</span></div>
      ${
    t
      ? `<div class="tr main"><span>Total en bolívares</span><span class="big">${
        bs(Math.round(total * t.valor))
      }</span></div>
        <div class="sub">${
        t.manual
          ? `Tasa aplicada: ${fmtTasa(t.valor)} Bs. por REF`
          : `Tasa BCV del ${fmtFecha(t.fecha_valor)}: ${fmtTasa(t.valor)} Bs. por REF`
      }. El monto en bolívares puede variar según la tasa vigente al momento del pago.</div>
        ${
        t.desactualizada
          ? `<div class="notice warn" style="margin-top:10px">${
            icon("warn")
          }<div>No pudimos actualizar la tasa recientemente; usamos la última conocida (${
            fmtFecha(t.fecha_valor)
          }).</div></div>`
          : ""
      }`
      : `<div class="notice warn" style="margin-top:10px">${
        icon("warn")
      }<div>La tasa de cambio no está disponible en este momento. Puedes generar tu presupuesto en REF.</div></div>`
  }
    </div>
    <div class="card"><h3>Datos del paciente <span class="muted small" style="font-weight:500">(opcional)</span></h3>${formPaciente()}</div>
    <p class="muted small" style="text-align:center;margin-top:12px">No guardamos tus datos personales: solo aparecen en el documento que descargues o copies.</p>
    <div class="genbar"><button type="button" data-act="generar"><span class="grow">Generar presupuesto</span><span>${
    ref(total)
  }</span>${icon("back")}</button></div>`;
}

// ───────────── Presupuesto generado ─────────────
// La página de este negocio (p. ej. cotizalab.app/demo): sale de la dirección actual, así sigue
// valiendo si la app se muda a su propio dominio.
const enlaceNegocio = () => `${location.host}${location.pathname}`.replace(/\/+$/, "");
const docActual = () =>
  buildDoc({ res: S.res, negocio: S.cfg.negocio, paciente: S.pac, enlace: enlaceNegocio() });

function renderOk() {
  const el = $("#v-ok");
  if (!S.res) {
    el.innerHTML = "";
    return;
  }
  const nom = `presupuesto-${S.res.codigo}`;
  // Un presupuesto generado ya no se edita (tiene su código): arriba solo queda empezar uno nuevo
  el.innerHTML = `
    <div class="res-head ok-head"><button type="button" class="btn btn-soft" data-act="nuevo">${
    icon("plus")
  } Nuevo presupuesto</button></div>
    <ol class="pasos" aria-label="Pasos"><li class="hecho"><i>${
    icon("check")
  }</i>Elige</li><li class="hecho"><i>${
    icon("check")
  }</i>Revisa</li><li class="hecho" aria-current="step"><i>${icon("check")}</i>Genera</li></ol>
    <div class="notice ok">${icon("check")}<div>Presupuesto <b>${
    esc(S.res.codigo)
  }</b> generado. Guárdalo en tu teléfono y muéstralo en el laboratorio.</div></div>
    <div class="actions" data-nombre="${esc(nom)}">
      <button type="button" class="btn btn-primary" data-act="pdf">${
    icon("pdf")
  } Descargar PDF</button>
      <button type="button" class="btn btn-primary" data-act="png">${
    icon("image")
  } Descargar imagen</button>
      <button type="button" class="btn" data-act="texto">${icon("copy")} Copiar texto</button>
      ${
    puedeCompartir()
      ? `<button type="button" class="btn" data-act="compartir">${icon("share")} Compartir</button>`
      : ""
  }
    </div>
    <details class="card" style="padding:0 16px"><summary style="cursor:pointer;font-weight:600;min-height:48px;display:flex;align-items:center">Agregar o cambiar datos del paciente</summary><div style="padding-bottom:6px">${formPaciente()}</div></details>
    <div class="paper" id="paper" style="margin-top:14px">${paperHTML(docActual())}</div>`;
}

/**
 * Paso intermedio antes de generar: ¿cómo se enteró de nosotros? Se pregunta una vez por visita.
 * Devuelve true para seguir (eligió una opción o prefirió no decirlo) o false si cerró la ventana.
 */
function preguntarOrigen() {
  if (!S.cfg.origenes.length || S.origenRespondido) return Promise.resolve(true);
  return new Promise((resolve) => {
    let elegido = false;
    const m = modal({
      titulo: "Un último paso",
      html: `<p>¿Cómo se enteró de nosotros?</p>
        <div class="origenes">${
        S.cfg.origenes.map((o) =>
          `<button type="button" class="btn btn-lg" data-o="${esc(o.id)}" ${
            o.pide_detalle ? 'data-detalle="1"' : ""
          }>${esc(o.nombre)}</button>`
        ).join("")
      }</div>
        <div class="otro-detalle" hidden>
          <div class="field"><label for="od">¿Dónde fue?</label><input id="od" type="text" maxlength="80" placeholder="Ej.: un volante, la radio, otra red social…" autocomplete="off"></div>
          <button type="button" class="btn btn-primary btn-lg" data-continuar>Continuar</button>
        </div>
        <button type="button" class="btn btn-ghost btn-sm sin-origen" data-o="">Prefiero no decirlo</button>`,
      onClose: () => resolve(elegido),
    });
    const responder = (id, detalle = "") => {
      S.origen = id;
      S.origenDetalle = detalle.trim();
      S.origenRespondido = true;
      guardar(sessionStorage, "origen", S.origen);
      guardar(sessionStorage, "origenD", S.origenDetalle);
      guardar(sessionStorage, "origenR", 1);
      elegido = true;
      m.cerrar();
    };
    const caja = m.el.querySelector(".otro-detalle");
    let otro = null;
    m.el.querySelector(".mb").addEventListener("click", (ev) => {
      if (ev.target.closest("[data-continuar]")) {
        responder(otro, $("#od", m.el).value);
        return;
      }
      const b = ev.target.closest("[data-o]");
      if (!b) return;
      // «Otro»: antes de seguir, se le pide que escriba dónde (opcional)
      if (b.dataset.detalle) {
        otro = b.dataset.o;
        m.el.querySelectorAll(".origenes .btn").forEach((x) => x.classList.toggle("on", x === b));
        caja.hidden = false;
        $("#od", m.el).focus();
        return;
      }
      responder(b.dataset.o);
    });
    $("#od", m.el).addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        responder(otro, ev.target.value);
      }
    });
    m.el.querySelector("[data-o]")?.focus();
  });
}

async function generar(btn) {
  if (!(await preguntarOrigen())) return;
  const lista = items();
  const firma = `${
    JSON.stringify([...lista].sort((a, b) => a.id.localeCompare(b.id)))
  }|${S.origen}|${S.origenDetalle}`;
  if (S.res && S.firma === firma) {
    irA("ok");
    return;
  } // mismo presupuesto: no se cuenta dos veces
  await conBoton(btn, async () => {
    try {
      S.res = await api("/api/publico/presupuesto", {
        method: "POST",
        body: {
          items: lista,
          origen_id: S.origen || null,
          origen_detalle: S.origenDetalle || null,
          dispositivo: dispositivo(),
        },
      });
      S.firma = firma;
      guardar(localStorage, "res", { res: S.res, firma });
      irA("ok");
    } catch (e) {
      if (e.status === 409) await recargar();
      throw e;
    }
  });
}

/** Si el catálogo cambió mientras el paciente armaba su presupuesto, se actualiza y se depura. */
async function recargar() {
  try {
    [S.cfg, S.cat] = await Promise.all([api("/api/publico/config"), api("/api/publico/catalogo")]);
    indexar();
    S.ex = S.ex.filter((id) => exMap.has(id) && !cubiertoPor(id));
    S.pf = S.pf.filter((id) => pfMap.has(id));
    ajustarCantidades();
    guardarCarro();
    renderTodo();
  } catch { /* se mostrará el error original */ }
}

async function exportar(tipo, btn) {
  const doc = docActual();
  const nombre = `presupuesto-${S.res.codigo}`;
  await conBoton(btn, async () => {
    if (tipo === "pdf") {
      descargar(await toPdfBlob(doc), `${nombre}.pdf`);
      toast("PDF descargado", "ok");
    } else if (tipo === "png") {
      descargar(await toPngBlob(doc), `${nombre}.png`);
      toast("Imagen descargada", "ok");
    } else if (tipo === "texto") {
      if (await copiarTexto(toText(doc))) {
        toast("Texto copiado. Ya puedes pegarlo en un mensaje o nota.", "ok");
      } else {modal({
          titulo: "Copia el texto",
          html: `<textarea readonly style="min-height:240px" onfocus="this.select()">${
            esc(toText(doc))
          }</textarea>`,
          acciones: [{
            texto: "Cerrar",
            clase: "btn-primary",
            onClick: (c) => c(),
          }],
        });}
    } else if (tipo === "compartir") {
      try {
        // La imagen vertical: es lo que se puede mandar a un estado de WhatsApp o a Instagram
        await compartir({
          blob: await toPngBlob(doc),
          nombre: `${nombre}.png`,
          titulo: `Presupuesto ${S.res.codigo}`,
          texto: toText(doc),
        });
      } catch (e) {
        if (e.name !== "AbortError") throw e;
      }
    }
  });
}

// ───────────── Acciones sobre el carrito (con la regla anti-duplicados) ─────────────
function cambio() {
  guardarCarro();
  renderLista();
  if (S.vista === "resumen") renderResumen();
}

function alternarExamen(id) {
  const e = exMap.get(id);
  if (!e) return;
  if (S.ex.includes(id)) {
    S.ex = S.ex.filter((x) => x !== id);
    delete S.cant[id];
  } else {
    const p = cubiertoPor(id);
    if (p) {
      toast(`«${e.nombre}» ya está incluido en ${p.nombre}.`);
      return;
    }
    S.ex.push(id);
  }
  cambio();
}

/** Uno más / uno menos de un examen que se puede pedir varias veces (al bajar de 1, se quita). */
function cambiarCantidad(id, delta) {
  const e = exMap.get(id);
  if (!e || !S.ex.includes(id)) return;
  const n = cant(id) + delta;
  const max = maxPor(e);
  if (n < 1) {
    alternarExamen(id);
    return;
  }
  if (n > max) {
    toast(`«${e.nombre}» se puede pedir hasta ${max} veces.`);
    return;
  }
  if (n === 1) delete S.cant[id];
  else S.cant[id] = n;
  cambio();
}

function agregarPerfil(p) {
  const sueltos = S.ex.filter((id) => p.ids.has(id));
  if (sueltos.length) {
    S.ex = S.ex.filter((id) => !p.ids.has(id));
    const nombres = sueltos.map((id) => exMap.get(id)?.nombre);
    toast(
      sueltos.length === 1
        ? `«${nombres[0]}» ya está incluido en ${p.nombre}; lo quitamos de tus exámenes sueltos.`
        : `${sueltos.length} exámenes (${
          nombres.join(", ")
        }) ya están incluidos en ${p.nombre}; los quitamos de tus exámenes sueltos.`,
    );
  }
  S.pf.push(p.id);
  cambio();
}

function alternarPerfil(id) {
  const p = pfMap.get(id);
  if (!p) return;
  if (S.pf.includes(id)) {
    S.pf = S.pf.filter((x) => x !== id);
    cambio();
    return;
  }
  const conflictos = S.pf.map((q) => pfMap.get(q)).map((pq) => ({
    perfil: pq,
    comunes: pq.examenes.filter((m) => p.ids.has(m.id)),
  })).filter((c) => c.comunes.length);
  if (!conflictos.length) {
    agregarPerfil(p);
    return;
  }
  const varios = conflictos.length > 1;
  // Exámenes del perfil nuevo que el paciente todavía no tiene (ni en otro perfil ni sueltos):
  // se pueden agregar como exámenes sueltos para no perder ninguno.
  const pendientes = p.examenes.filter((m) => !cubiertoPor(m.id) && !S.ex.includes(m.id));
  const faltan = pendientes.map((m) => exMap.get(m.id)).filter(Boolean);
  const sinSuelto = pendientes.filter((m) => !exMap.has(m.id)); // no se ofrecen por separado
  const sumaFaltan = faltan.reduce((t, e) => t + e.precio_cent, 0);
  const opciones = [{ texto: "Cancelar", onClick: (c) => c() }];
  if (faltan.length) {
    opciones.push({
      texto: `Reemplazar por «${p.nombre}»`,
      onClick: (c) => {
        reemplazar();
        c();
      },
    });
    opciones.push({
      texto: faltan.length === 1
        ? "Agregar el que falta"
        : `Agregar los ${faltan.length} que faltan`,
      clase: "btn-primary",
      onClick: (c) => {
        for (const e of faltan) if (!S.ex.includes(e.id)) S.ex.push(e.id);
        toast(
          faltan.length === 1
            ? `Agregamos «${faltan[0].nombre}» como examen suelto.`
            : `Agregamos ${faltan.length} exámenes sueltos: ${
              faltan.map((e) => e.nombre).join(", ")
            }.`,
          "ok",
        );
        cambio();
        c();
      },
    });
  } else {
    opciones.push({
      texto: `Reemplazar por «${p.nombre}»`,
      clase: "btn-primary",
      onClick: (c) => {
        reemplazar();
        c();
      },
    });
  }
  function reemplazar() {
    const fuera = new Set(conflictos.map((x) => x.perfil.id));
    S.pf = S.pf.filter((x) => !fuera.has(x));
    agregarPerfil(p);
  }
  modal({
    titulo: "Este perfil repite exámenes",
    html: `<p>«${esc(p.nombre)}» incluye exámenes que ya están en ${
      varios ? "otros perfiles" : "otro perfil"
    } de tu presupuesto. Un examen no puede repetirse.</p>
      ${
      conflictos.map((c) =>
        `<div class="notice warn" style="margin-bottom:8px">${icon("warn")}<div><b>${
          esc(c.perfil.nombre)
        }</b> ya incluye: ${c.comunes.map((m) => esc(m.nombre)).join(", ")}.</div></div>`
      ).join("")
    }
      ${
      faltan.length
        ? `<div class="faltan"><p><b>Para no perder ninguno</b>, puedes agregar solo ${
          faltan.length === 1 ? "el que te falta" : `los ${faltan.length} que te faltan`
        } como ${faltan.length === 1 ? "examen suelto" : "exámenes sueltos"}:</p>
            <ul>${
          faltan.map((e) =>
            `<li><span>${esc(e.nombre)}</span><span>${ref(e.precio_cent)}</span></li>`
          ).join("")
        }</ul>
            <p class="suma"><span>${faltan.length === 1 ? "Precio" : "Suman"}</span><b>${
          ref(sumaFaltan)
        }</b></p></div>`
        : `<p class="muted small">Ya tienes todos los exámenes de «${
          esc(p.nombre)
        }» en tu presupuesto.</p>`
    }
      ${
      sinSuelto.length
        ? `<p class="muted small">No se ofrece${sinSuelto.length === 1 ? "" : "n"} por separado: ${
          sinSuelto.map((m) => esc(m.nombre)).join(", ")
        }.</p>`
        : ""
    }
      <p class="muted small">O, si lo prefieres, reemplaza ${
      varios ? "esos perfiles" : "ese perfil"
    } por «${esc(p.nombre)}».</p>`,
    acciones: opciones,
  });
}

/** Vacía el presupuesto (con confirmación). */
async function vaciar() {
  const n = nItems();
  if (!n) return;
  const texto = n === 1
    ? "¿Vaciar tu presupuesto? Se quitará lo que elegiste."
    : `¿Vaciar tu presupuesto? Se quitarán los ${n} exámenes o perfiles que elegiste.`;
  if (!(await confirmar(texto, { ok: "Vaciar", peligro: true, titulo: "Vaciar presupuesto" }))) {
    return;
  }
  S.ex = [];
  S.cant = {};
  S.pf = [];
  cambio();
  renderCartBar();
  toast("Presupuesto vacío");
}

// ───────────── Buscador en el celular ─────────────
// En el teléfono, agregar varios exámenes era: escribir, cerrar el teclado, tocar «Agregar», volver al buscador,
// borrar y escribir otra vez. Ahora, si el buscador tenía el foco, al agregar se queda abierto con el texto
// seleccionado: lo siguiente que se escriba reemplaza la búsqueda anterior, sin borrar a mano.
const ACCIONES_LISTA = new Set(["ex", "pf", "mas", "menos"]);
let buscandoAlTocar = false;

function pintarBuscador(mensaje = "") {
  const lim = $("#buscador .limpiar");
  if (lim) lim.hidden = !S.q;
  const h = $("#qhint");
  if (h) h.innerHTML = mensaje;
}

/** Tras agregar o quitar algo desde la lista con el buscador abierto: foco de vuelta y texto seleccionado. */
const elegido = (act, id) => (act === "pf" ? S.pf.includes(id) : S.ex.includes(id));
function seguirBuscando(act, id, antes) {
  const inp = $("#q");
  // Si se abrió una ventana (p. ej. «Este perfil repite exámenes»), el foco es suyo
  if (!inp || S.vista !== "catalogo" || !S.q || document.querySelector(".overlay")) return;
  inp.focus({ preventScroll: true });
  inp.setSelectionRange(0, inp.value.length);
  const x = act === "pf" ? pfMap.get(id) : exMap.get(id);
  const ahora = elegido(act, id);
  if (!x || ahora === antes) return;
  pintarBuscador(
    ahora
      ? `${icon("check")}<span><b>${
        esc(x.nombre)
      }</b> agregado · ${nItems()} en tu presupuesto. Escribe el siguiente.</span>`
      : `<span>Quitaste <b>${esc(x.nombre)}</b>.</span>`,
  );
}

/** Al escribir se vuelve al inicio de los resultados (de la lista, o de la página si el buscador quedó pegado). */
function subirAResultados() {
  // Buscando en el celular, la que se desplaza es la lista
  if (document.body.classList.contains("buscando")) {
    const lista = $("#lista");
    if (lista) lista.scrollTop = 0;
    return;
  }
  const aviso = $("#aviso");
  const top = $("header.top");
  if (!aviso || !top) return;
  const destino = aviso.getBoundingClientRect().bottom + window.scrollY - top.offsetHeight;
  if (window.scrollY > destino + 1) window.scrollTo({ top: Math.max(0, destino) });
}

/** Alto de la cabecera, para que el buscador se pegue justo debajo. */
function medirCabecera() {
  const top = $("header.top");
  if (top) document.documentElement.style.setProperty("--alto-top", `${top.offsetHeight}px`);
}
window.addEventListener("resize", () => {
  medirCabecera();
  marcarFinChips();
});
// scroll no burbujea: se escucha en fase de captura para no atarlo a cada pintado de #chips
document.addEventListener("scroll", (e) => {
  if (e.target?.id === "chips") marcarFinChips();
}, { capture: true, passive: true });

// Celular: mientras se busca, la cabecera se esconde (CSS: body.buscando) y el buscador sube hasta arriba.
// Al salir se espera un momento: tras agregar un examen el foco vuelve enseguida y no conviene que parpadee.
let salirBusqueda = 0;
document.addEventListener("focusin", (e) => {
  if (e.target.id !== "q" || !MOVIL.matches) return;
  clearTimeout(salirBusqueda);
  if (document.body.classList.contains("buscando")) return;
  medirVisible();
  document.body.classList.add("buscando");
  // Arriba ya no queda nada: la página va al inicio y lo que se desplaza es la lista
  window.scrollTo({ top: 0 });
  const lista = $("#lista");
  if (lista) lista.scrollTop = 0;
});

/** Alto del área visible (sin el teclado) para la lista que se desplaza mientras se busca. */
function medirVisible() {
  const h = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty("--alto-visible", `${Math.round(h)}px`);
}
window.visualViewport?.addEventListener("resize", medirVisible);
// iOS mueve la página al abrir el teclado aunque no haya nada que desplazar: se devuelve al inicio
window.visualViewport?.addEventListener("scroll", () => {
  if (document.body.classList.contains("buscando") && window.scrollY) window.scrollTo({ top: 0 });
});
document.addEventListener("focusout", (e) => {
  if (e.target.id !== "q") return;
  clearTimeout(salirBusqueda);
  salirBusqueda = setTimeout(() => {
    if (document.activeElement?.id !== "q") document.body.classList.remove("buscando");
  }, 250);
});

// Ratón: evita que el buscador pierda el foco al tocar un botón de la lista (en el teléfono, el teclado no
// llega a cerrarse). En pantallas táctiles se recuerda si estaba abierto para devolverle el foco en el clic.
// Lo mismo con las categorías, las pestañas y la ×: mientras se busca, el teclado y la vista sin cabecera
// siguen hasta que la persona cierre el teclado.
const NO_SUELTAN_BUSCADOR = new Set([...ACCIONES_LISTA, "limpiar", "cat", "tab"]);
const mantieneBuscador = (e) => {
  const b = e.target.closest("[data-act]");
  return document.activeElement?.id === "q" && b && NO_SUELTAN_BUSCADOR.has(b.dataset.act);
};
document.addEventListener("pointerdown", (e) => {
  buscandoAlTocar = document.activeElement?.id === "q";
  if (mantieneBuscador(e)) e.preventDefault();
});
document.addEventListener("mousedown", (e) => {
  if (mantieneBuscador(e)) e.preventDefault();
});

document.addEventListener("keydown", (e) => {
  if (e.target.id !== "q" || e.key !== "Enter") return;
  e.preventDefault();
  // Con un solo resultado, Enter lo agrega; si no, cierra el teclado para ver la lista.
  const { ex, pf } = filtrar();
  const lista = S.tab === "examenes" ? ex : pf;
  if (S.q.trim() && lista.length === 1) {
    const x = lista[0];
    const act = S.tab === "examenes" ? "ex" : "pf";
    const ya = act === "pf" ? S.pf.includes(x.id) : S.ex.includes(x.id) || cubiertoPor(x.id);
    if (!ya) {
      if (act === "pf") alternarPerfil(x.id);
      else alternarExamen(x.id);
      seguirBuscando(act, x.id, false);
      return;
    }
  }
  e.target.blur();
});

// ───────────── Eventos ─────────────
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const { act, id } = b.dataset;
  const conBuscador = buscandoAlTocar || document.activeElement?.id === "q";
  buscandoAlTocar = false;
  if (conBuscador && ACCIONES_LISTA.has(act)) {
    const antes = elegido(act === "pf" ? "pf" : "ex", id);
    queueMicrotask(() => seguirBuscando(act === "pf" ? "pf" : "ex", id, antes));
  } else if (conBuscador && (act === "cat" || act === "tab")) {
    // Por si el teléfono le quitó el foco al tocar: vuelve al buscador sin cerrar el teclado
    queueMicrotask(() => $("#q")?.focus({ preventScroll: true }));
  }
  switch (act) {
    case "limpiar": {
      const inp = $("#q");
      inp.value = "";
      S.q = "";
      pestanaPorBusqueda();
      renderLista();
      pintarBuscador();
      inp.focus();
      break;
    }
    case "abrirpromo":
    case "plegarpromo":
      promoGrande = act === "abrirpromo";
      renderAviso();
      $(promoGrande ? ".promo-anuncio .plegar" : ".promo-anuncio.compacta")?.focus({
        preventScroll: true,
      });
      break;
    case "verpromo": {
      // Ya lo vio: el anuncio pasa a ocupar una sola línea
      if (promoGrande) {
        promoGrande = false;
        renderAviso();
      }
      // Filtro «Promociones»; si no hay exámenes en promoción, a la pestaña de perfiles
      S.catId = "promo";
      const { ex, pf } = filtrar();
      if (!ex.length && pf.length) S.tab = "perfiles";
      else if (ex.length && !pf.length) S.tab = "examenes";
      renderChips();
      mostrarChipElegido();
      renderLista();
      $("#chips")?.scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    }
    case "cat":
      S.catId = id;
      renderChips();
      mostrarChipElegido();
      renderLista();
      subirAResultados();
      break;
    case "tab":
      S.tab = id;
      S.tabAuto = false; // la eligió la persona: no se cambia sola
      renderLista();
      subirAResultados();
      break;
    case "ex":
      alternarExamen(id);
      break;
    case "mas":
      cambiarCantidad(id, 1);
      break;
    case "menos":
      cambiarCantidad(id, -1);
      break;
    case "pf":
      alternarPerfil(id);
      break;
    case "resumen":
      irA("resumen");
      break;
    case "vaciar":
      vaciar();
      break;
    case "volver":
      if (history.state?.v && history.state.v !== "catalogo") history.back();
      else {
        S.vista = "catalogo";
        renderVista();
      }
      break;
    case "generar":
      generar(b);
      break;
    case "pdf":
    case "png":
    case "texto":
    case "compartir":
      exportar(act, b);
      break;
    case "nuevo":
      S.ex = [];
      S.cant = {};
      S.pf = [];
      S.res = null;
      S.firma = null;
      S.origen = "";
      S.origenDetalle = "";
      guardarCarro();
      localStorage.removeItem(`${K}:res`);
      S.vista = "catalogo";
      // Se reemplaza la entrada del historial: con «atrás» no se vuelve al presupuesto ya cerrado
      history.replaceState({ v: "catalogo" }, "");
      renderLista();
      renderVista();
      break;
    default:
  }
});

document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id === "q") {
    S.q = t.value;
    pestanaPorBusqueda();
    renderLista();
    pintarBuscador();
    subirAResultados();
    return;
  }
  if (t.dataset?.pac) {
    S.pac[t.dataset.pac] = t.value;
    guardar(sessionStorage, "pac", S.pac);
    if (S.vista === "ok") $("#paper").innerHTML = paperHTML(docActual());
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "origen") {
    S.origen = e.target.value;
    guardar(sessionStorage, "origen", S.origen);
  }
});

init();
