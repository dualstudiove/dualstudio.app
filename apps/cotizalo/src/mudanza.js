// Mudanza de dirección: la app vivía en dualstudio.app/cotizalo y ahora vive en su propio dominio.
// Las direcciones viejas siguen llegando a este Worker (por las rutas de wrangler.jsonc) y se redirigen,
// para que no se rompan los enlaces que ya circulan (imágenes y textos compartidos, marcadores, QR):
//   dualstudio.app/cotizalo/demo/admin?x=1  →  https://cotizalab.app/demo/admin?x=1
//
// Se configura con dos variables (wrangler.jsonc → vars). Sin ellas no hace nada.
//   DIRECCION_ANTERIOR  dominio y ruta de antes, sin https://  (p. ej. "dualstudio.app/cotizalo")
//   DIRECCION           dominio nuevo, sin https://             (p. ej. "cotizalab.app")

/** Respuesta de redirección si la petición llegó por la dirección anterior; si no, null. */
export function redireccionMudanza(req, bindings = {}) {
  const anterior = String(bindings.DIRECCION_ANTERIOR || "").trim().replace(/\/+$/, "");
  const nueva = String(bindings.DIRECCION || "").trim().replace(/\/+$/, "");
  if (!anterior || !nueva) return null;
  const url = new URL(req.url);
  const corte = anterior.indexOf("/");
  const host = corte < 0 ? anterior : anterior.slice(0, corte);
  const ruta = corte < 0 ? "" : anterior.slice(corte);
  if (url.host !== host) return null;
  if (ruta && url.pathname !== ruta && !url.pathname.startsWith(`${ruta}/`)) return null;
  const destino = `https://${nueva}${url.pathname.slice(ruta.length) || "/"}${url.search}`;
  // 301 para abrir páginas; 308 para lo demás, que conserva el método y el cuerpo (un POST sigue siendo POST)
  const status = req.method === "GET" || req.method === "HEAD" ? 301 : 308;
  return new Response(null, { status, headers: { location: destino } });
}
