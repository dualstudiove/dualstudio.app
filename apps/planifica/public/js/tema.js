// Modo claro u oscuro elegido en el menú de la cuenta (cabecera.js). Se carga en el <head>, antes de pintar, para
// que la página no parpadee con el otro modo. Sin elección, manda el sistema (prefers-color-scheme).
(function () {
  try {
    var t = localStorage.getItem("pl_tema");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
})();
