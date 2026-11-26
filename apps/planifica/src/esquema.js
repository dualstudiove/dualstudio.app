// Tablas de Planifica. La app las crea sola en una base vacía (mecanismo de @dualstudio/comun).
// Para columnas nuevas más adelante, añádelas a COLUMNAS: [['tabla', 'columna', 'TIPO'], …].
//
// Multicliente: todo lo que se planifica cuelga de un cliente (cliente_id) y ninguna consulta cruza clientes.
// Las publicaciones y los objetivos guardan su contenido como JSON (datos) con campos permitidos y tamaño máximo
// (ver validar.js): así la interfaz puede evolucionar sin migraciones para cada campo nuevo.
import { crearEsquema, d1Actual, guardarAjuste, leerAjuste } from "@dualstudio/comun/servidor";

export const ESQUEMA_BASE = `
CREATE TABLE IF NOT EXISTS usuarios (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  nombre         TEXT NOT NULL DEFAULT '',
  password_hash  TEXT NOT NULL,
  es_admin       INTEGER NOT NULL DEFAULT 0,  -- administrador de Dual Studio: ve todos los clientes y gestiona el equipo
  activo         INTEGER NOT NULL DEFAULT 1,
  sesion_version INTEGER NOT NULL DEFAULT 0,  -- al subirla, las sesiones abiertas dejan de valer
  creado_en      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clientes (
  id          TEXT PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,           -- dirección: /planifica/<slug>
  nombre      TEXT NOT NULL,
  handle      TEXT,                           -- cuenta de Instagram, p. ej. @laboratoriorh
  activo      INTEGER NOT NULL DEFAULT 1,     -- 0 = archivado (solo lo ven los administradores)
  cambiado_en INTEGER NOT NULL DEFAULT 0,     -- marca de tiempo del último cambio (para refrescar sin descargar todo)
  creado_en   TEXT NOT NULL
);

-- Qué usuario ve qué cliente y con qué papel
CREATE TABLE IF NOT EXISTS accesos (
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cliente_id TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  rol        TEXT NOT NULL CHECK (rol IN ('editor', 'lector')),
  PRIMARY KEY (usuario_id, cliente_id)
);

CREATE TABLE IF NOT EXISTS publicaciones (
  id              TEXT PRIMARY KEY,
  cliente_id      TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  datos           TEXT NOT NULL,                -- JSON: título, formato, fecha, estado, copy, tomas…
  creado_en       INTEGER NOT NULL,
  creado_por      TEXT,
  actualizado_en  INTEGER NOT NULL,
  actualizado_por TEXT
);
CREATE INDEX IF NOT EXISTS idx_publicaciones_cliente ON publicaciones (cliente_id);

-- Objetivos del mes (m-AAAA-MM) y del trimestre (q-AAAA-N)
CREATE TABLE IF NOT EXISTS objetivos (
  cliente_id      TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  clave           TEXT NOT NULL,
  datos           TEXT NOT NULL,
  creado_en       INTEGER NOT NULL,
  creado_por      TEXT,
  actualizado_en  INTEGER NOT NULL,
  actualizado_por TEXT,
  PRIMARY KEY (cliente_id, clave)
);

-- Imágenes de referencia. almacen dice dónde está el contenido: 'd1' (aquí mismo) o, más adelante, otro
-- almacenamiento (p. ej. Google Drive), con la misma tabla para los datos de la imagen.
CREATE TABLE IF NOT EXISTS imagenes (
  id         TEXT PRIMARY KEY,
  cliente_id TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL,
  bytes      INTEGER NOT NULL,
  almacen    TEXT NOT NULL DEFAULT 'd1',
  contenido  BLOB,
  creado_en  TEXT NOT NULL,
  creado_por TEXT
);
CREATE INDEX IF NOT EXISTS idx_imagenes_cliente ON imagenes (cliente_id);
`;

export const COLUMNAS = [];

// Métricas de redes (Instagram hoy; TikTok después). Tablas añadidas después del esquema base: se crean también
// en bases que ya existían. Ver src/redes/.
export const TABLAS_REDES = `
-- Una cuenta conectada por cliente y red. El token va cifrado (cifrado.js) y nunca sale del servidor.
CREATE TABLE IF NOT EXISTS redes_conexiones (
  cliente_id      TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  red             TEXT NOT NULL CHECK (red IN ('ig', 'tt')),
  cuenta_id       TEXT NOT NULL,                 -- id de la cuenta en la red
  usuario         TEXT NOT NULL DEFAULT '',      -- @usuario
  token           TEXT,                          -- cifrado
  token_creado    INTEGER,                       -- ms: Instagram no deja renovar un token de menos de 24 h
  token_vence     INTEGER,                       -- ms
  origen          TEXT NOT NULL DEFAULT 'token', -- 'token' (pegado a mano) | 'oauth' (botón «Conectar»)
  estado          TEXT NOT NULL DEFAULT 'ok',    -- 'ok' | 'error'
  error           TEXT,
  sincronizado_en INTEGER,                       -- ms de la última actualización correcta
  cuenta_dia      TEXT,                          -- día (local) en que ya se guardaron las cifras de la cuenta
  completo_dia    TEXT,                          -- día (local) en que ya se actualizaron todos sus posts
  manual_en       INTEGER,                       -- ms del último «Actualizar» (freno de 15 minutos)
  audiencia       TEXT,                          -- JSON: seguidores conectados por día de la semana y hora
  audiencia_en    INTEGER,
  conectado_en    INTEGER NOT NULL,
  conectado_por   TEXT,
  PRIMARY KEY (cliente_id, red)
);

-- Cifras diarias de la cuenta: seguidores (foto del día) y lo que pasó ese día (alcance, reproducciones…).
CREATE TABLE IF NOT EXISTS redes_cuenta_dia (
  cliente_id TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  red        TEXT NOT NULL,
  dia        TEXT NOT NULL,                      -- AAAA-MM-DD (hora local)
  seguidores INTEGER,
  datos      TEXT,                               -- JSON: alcance, reproducciones, cuentas, interacciones
  PRIMARY KEY (cliente_id, red, dia)
);

-- Cada post de la parrilla vinculado a su publicación en la red, con sus métricas actuales.
CREATE TABLE IF NOT EXISTS redes_posts (
  publicacion_id TEXT NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  red            TEXT NOT NULL,
  cliente_id     TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  link           TEXT NOT NULL,
  medio_id       TEXT,                           -- id en la red (null: aún sin encontrar)
  tipo           TEXT,                           -- REELS, FEED, CAROUSEL_ALBUM…
  publicado_en   TEXT,                           -- fecha y hora real de publicación (ISO)
  metricas       TEXT,                           -- JSON: likes, comentarios, compartidos, guardados, alcance…
  dia            TEXT,                           -- día (local) de la última actualización
  actualizado_en INTEGER,
  error          TEXT,
  miniatura_url  TEXT,                           -- dirección que da la red (vence); de ahí sale la miniatura propia
  miniatura_id   TEXT,                           -- imagen propia (tabla imagenes), WebP de 320 px
  PRIMARY KEY (publicacion_id, red)
);
CREATE INDEX IF NOT EXISTS idx_redes_posts_cliente ON redes_posts (cliente_id, red);

-- Historial: una foto por post y día, solo cuando algo cambió.
CREATE TABLE IF NOT EXISTS redes_posts_dia (
  publicacion_id TEXT NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  red            TEXT NOT NULL,
  dia            TEXT NOT NULL,
  metricas       TEXT NOT NULL,
  PRIMARY KEY (publicacion_id, red, dia)
);
`;

// Ads: presupuesto mensual y posts impulsados (se registran a mano; origen/meta_ad_id dejan listo el paso a leerlos
// desde Meta Ads). Ver src/ads.js.
export const TABLAS_ADS = `
CREATE TABLE IF NOT EXISTS ads_presupuestos (
  cliente_id      TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  mes             TEXT NOT NULL,                 -- AAAA-MM
  monto           REAL NOT NULL,                 -- USD
  notas           TEXT,
  actualizado_en  INTEGER NOT NULL,
  actualizado_por TEXT,
  PRIMARY KEY (cliente_id, mes)
);

CREATE TABLE IF NOT EXISTS ads_impulsos (
  id              TEXT PRIMARY KEY,
  cliente_id      TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  publicacion_id  TEXT NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  inicio          TEXT NOT NULL,                 -- AAAA-MM-DD; el gasto cuenta en el mes en que empieza
  fin             TEXT,
  gastado         REAL NOT NULL DEFAULT 0,       -- USD
  objetivo        TEXT,                          -- mensajes | perfil | alcance
  resultados      TEXT,                          -- JSON: alcance, clics, mensajes, visitas, seguidores
  notas           TEXT,
  origen          TEXT NOT NULL DEFAULT 'manual', -- manual | meta
  meta_ad_id      TEXT,
  creado_en       INTEGER NOT NULL,
  creado_por      TEXT,
  actualizado_en  INTEGER NOT NULL,
  actualizado_por TEXT
);
CREATE INDEX IF NOT EXISTS idx_ads_impulsos_cliente ON ads_impulsos (cliente_id, inicio);
`;

// Colaboraciones: otros clientes que comparten un post (el dueño es publicaciones.cliente_id).
export const TABLAS_COLAB = `
CREATE TABLE IF NOT EXISTS publicaciones_colab (
  publicacion_id TEXT NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  cliente_id     TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  PRIMARY KEY (publicacion_id, cliente_id)
);
CREATE INDEX IF NOT EXISTS idx_publicaciones_colab_cliente ON publicaciones_colab (cliente_id);
`;

const esquemaCompleto = crearEsquema({
  base: ESQUEMA_BASE,
  testigo: "usuarios",
  columnas: COLUMNAS,
  tablas: TABLAS_REDES + TABLAS_ADS + TABLAS_COLAB,
});

/** Huella del esquema: cambia sola cuando cambia algo de lo que se aplica (tablas, columnas, índices). */
function huella(texto) {
  let h = 0x811c9dc5; // FNV-1a de 32 bits
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16);
}
export const VERSION_ESQUEMA = huella(
  [ESQUEMA_BASE, TABLAS_REDES, TABLAS_ADS, TABLAS_COLAB, JSON.stringify(COLUMNAS)].join("\n"),
);

/**
 * La revisión completa (tablas, columnas e índices: muchas consultas) solo corre si la base no tiene la versión
 * actual del esquema (_ajustes «esquema_version»), o sea, la primera vez tras publicar un cambio que la toca. En
 * los demás arranques es 1 consulta: así un fallo pasajero de la base al arrancar ya casi no puede pasar.
 */
async function aplicarEsquema(binding) {
  try {
    if ((await leerAjuste("esquema_version")) === VERSION_ESQUEMA) return;
  } catch { /* base nueva (aún sin _ajustes): se hace la revisión completa */ }
  await esquemaCompleto(binding);
  await guardarAjuste("esquema_version", VERSION_ESQUEMA);
}

const revisadas = new WeakMap();
/**
 * Aplica el esquema una vez por base y por instancia del Worker. Si falla (p. ej. un error pasajero de D1), no
 * tumba la petición: queda en el registro y se reintenta en la siguiente.
 */
export function asegurarEsquema(binding = d1Actual()) {
  const previa = revisadas.get(binding);
  if (previa) return previa;
  const p = aplicarEsquema(binding).catch((e) => {
    revisadas.delete(binding); // se reintenta en la próxima petición
    console.error(
      "[esquema] No se pudo revisar el esquema; se reintenta en la próxima petición:",
      e?.message || e,
    );
  });
  revisadas.set(binding, p);
  return p;
}
