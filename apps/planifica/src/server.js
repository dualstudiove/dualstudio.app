// Planifica en Cloudflare Workers, sobre crearServidor() de @dualstudio/comun.
// Páginas: <base> (iniciar sesión / elegir cliente), <base>/admin (clientes y equipo), <base>/<cliente> (la parrilla).
// API: ver rutas.js (cuenta y cliente) y admin.js.
import { crearServidor, env, Router } from "@dualstudio/comun/servidor";
import { configurarEnv } from "./env.js";
import { asegurarEsquema } from "./esquema.js";
import { registrarRutas } from "./rutas.js";
import { registrarAdmin } from "./admin.js";
import { registrarRedes } from "./redes/rutas.js";
import { registrarAds } from "./ads.js";
import { registrarColab } from "./colab.js";
import { registrarMeta, vueltaMeta } from "./redes/meta.js";
import { tareaDiaria } from "./redes/sync.js";
import { asegurarAdminDesdeSecretos, RESERVADOS } from "./sesion.js";

const router = new Router();
registrarRutas(router);
registrarAdmin(router);
registrarRedes(router);
registrarAds(router);
registrarColab(router);
registrarMeta(router);

export const { app, fetch, scheduled } = crearServidor({
  router,
  configurar: configurarEnv,
  asegurarEsquema,
  // Si falla (p. ej. la base no responde un momento), no tumba la petición: se reintenta en el próximo arranque
  alIniciar: () =>
    asegurarAdminDesdeSecretos().catch((e) =>
      console.error(
        "[cuentas] No se pudieron revisar los secretos de recuperación:",
        e?.message || e,
      )
    ),
  // Cada mañana (ver «triggers» en wrangler.jsonc): métricas de Instagram de los clientes conectados.
  programado: async () => {
    await asegurarEsquema();
    const r = await tareaDiaria();
    if (r.pendientes) console.log("[redes] tarea de la mañana", JSON.stringify(r));
  },
  // Las rutas de un cliente cuelgan de /:cliente (p. ej. /laboratorio-rh/api/datos); las demás, de la raíz.
  rutaApi: (r) => (r.opts.cliente ? `/:cliente${r.path}` : r.path),
  estaticos: ["/css/*", "/js/*", "/img/*", "/vendor/*", "/_ds/*"],
  paginas(app, { asset, noEncontrada }) {
    app.get("/", (c) => asset(c, "/index.html"));
    app.get("/admin", (c) => asset(c, "/admin.html"));
    // Vuelta de «Conectar con Meta» (ver redes/meta.js). Esta dirección se registra en la configuración de Meta.
    app.get("/redes/meta/vuelta", (c) => vueltaMeta(c));
    // La parrilla de un cliente. Quién puede verla lo decide la API (sin sesión, la página lleva a iniciar sesión).
    const parrilla = (c) => {
      const url = new URL(c.req.url);
      const slug = String(c.req.param("cliente") || "");
      if (RESERVADOS.has(slug.toLowerCase()) || !/^[a-z0-9-]{2,40}$/i.test(slug)) {
        return noEncontrada();
      }
      if (url.pathname !== `/${slug.toLowerCase()}`) {
        return new Response(null, {
          status: 301,
          headers: { location: `${env.basePath}/${slug.toLowerCase()}${url.search}` },
        });
      }
      return asset(c, "/parrilla.html");
    };
    app.get("/:cliente", parrilla);
    app.get("/:cliente/", parrilla);
    // Vista del cliente: la misma parrilla en modo lectura (la página lo deduce de la dirección).
    app.get("/:cliente/preview", (c) => {
      const slug = String(c.req.param("cliente") || "");
      if (RESERVADOS.has(slug.toLowerCase()) || !/^[a-z0-9-]{2,40}$/i.test(slug)) return noEncontrada();
      return asset(c, "/parrilla.html");
    });
  },
});

export default { fetch, scheduled };
