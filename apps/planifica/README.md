# Planifica

Parrilla de contenido para redes sociales: publicaciones de Instagram y TikTok (formato, fecha, estado, copy, tomas a grabar, referencias), calendario, objetivos del mes y del trimestre con métricas, y la pauta audiovisual en PDF. Es **multicliente** y siempre pide iniciar sesión.

Nació como el artefacto «Parrilla de Contenido» de claude.ai (del que también salió el sistema de diseño de Dual Studio). Vive en **dualstudio.app/planifica** (Worker `planifica`).

## Direcciones

| Dirección                            | Qué es                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `dualstudio.app/planifica`           | Iniciar sesión. Con un solo cliente se entra directo; con varios, se elige. También está «Tu cuenta» (nombre, contraseña, cerrar sesiones). |
| `dualstudio.app/planifica/<cliente>` | La parrilla del cliente: Rendimiento (con Ads), Lista, Calendario, Objetivos y Pauta. Con `/preview` al final, la vista del cliente.        |
| `dualstudio.app/planifica/admin`     | Clientes y equipo (solo administradores).                                                                                                   |

## Papeles

| Papel             | Qué puede hacer                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Administrador** | Es del equipo de Dual Studio. Ve todos los clientes como editor, crea y archiva clientes, gestiona el equipo y los accesos, e importa datos. |
| **Editor**        | Trabaja en los clientes que tiene asignados.                                                                                                 |
| **Solo lectura**  | Ve los clientes asignados sin poder cambiar nada. Sirve, por ejemplo, para que el cliente revise su parrilla.                                |

Un cliente sin acceso responde como si no existiera, y ninguna consulta cruza clientes. El primer administrador se crea con los secretos `SUPER_EMAIL` y `SUPER_PASSWORD` (ver «Publicar»).

## Estructura

| Archivo                                                        | Qué es                                                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/server.js`                                                | El Worker: `crearServidor()` de `@dualstudio/comun` y las páginas.                                                                         |
| `src/rutas.js`                                                 | La API de la cuenta y de cada cliente: datos, publicaciones, objetivos, ajustes e imágenes.                                                |
| `src/admin.js`                                                 | La API de administración: clientes, equipo, accesos e importación.                                                                         |
| `src/sesion.js`                                                | Sesión y permisos sobre las cuentas compartidas (`comun/servidor/cuentas.js`).                                                             |
| `src/esquema.js`                                               | Las tablas, que la app crea sola: `usuarios`, `clientes`, `accesos`, `publicaciones`, `objetivos`, `imagenes`.                             |
| `src/validar.js`                                               | Qué campos y tamaños se aceptan. Publicaciones y objetivos se guardan como JSON.                                                           |
| `src/redes/`                                                   | Métricas de Instagram: conexión con token (`sync.js`), cliente de la API (`instagram.js`), cifrado de tokens y rutas.                      |
| `src/almacen.js`                                               | Las imágenes, con un almacenamiento intercambiable (hoy D1).                                                                               |
| `public/parrilla.html` + `js/parrilla.js` + `css/parrilla.css` | La parrilla, portada del artefacto casi sin cambios.                                                                                       |
| `public/js/conexion.js`                                        | Puente entre la parrilla y la API. Ofrece la misma interfaz que claude.ai daba al artefacto: datos en vivo, usuario, imágenes y descargas. |
| `public/index.html`, `admin.html`                              | Inicio y administración, con los componentes del sistema de diseño.                                                                        |
| `public/css/tema.css`                                          | Acento morado. Los formatos usan los colores de categoría del padre, salvo Diseño, que lleva su propio cian.                               |
| `construir.js`                                                 | Copia jsPDF (local, sin CDN) a `/vendor` al compilar.                                                                                      |

## Cómo funciona

- **Cambios de otras personas:** la parrilla se refresca cada 30 s mientras la pestaña está visible, al volver a ella y tras cada cambio propio. Cuando no hubo cambios, el servidor responde con una sola lectura en la base.
- **Guardado:** es automático, igual que en el artefacto. Lo que escribes se ve al instante y se confirma con el servidor.
- **Carpeta de Drive:** cada publicación tiene un campo para pegar el link de su carpeta de Drive con los contenidos. Se abre desde el post, desde la Lista y la Pauta (ícono «Drive») y queda como enlace en el PDF de la pauta. Si se pega sin `https://`, se añade solo.
- **Imágenes de referencia:** el navegador las reduce a 1080 px y las guarda en WebP, de unos 40 a 90 KB cada una. Hay un tope de 400 KB por imagen y de 50 MB por cliente (el uso aparece en Clientes y equipo), y se borran con su publicación.
  - Hoy se guardan en D1. Para pasarlas a otro sitio (por ejemplo Google Drive, una carpeta por cliente) se añade un almacén en `src/almacen.js`; el resto de la app no cambia. Para Drive hará falta conectar una cuenta de Google.
- **Topes diarios por cliente**, guardados en la base: 5 000 cambios y 200 imágenes. Frenan un uso desbocado antes de que agote la cuota gratuita de la cuenta.

**Fecha = Por producir:** un post en «Idea» que recibe fecha (en el detalle, al arrastrarlo en el calendario o al crearlo desde un día) pasa solo a «Por producir». Los que ya están más avanzados no cambian.

**Inicio: Próximos y Clientes.** Al entrar, el inicio abre la pestaña **Próximos**: los posts sin publicar de todos los clientes activos que tienes asignados (el administrador ve todos), en tres grupos: **Atrasados** (fecha de hasta 30 días atrás y aún sin publicar), **Por publicar** (listos, de hoy a 7 días) y **Aún no listos** (con fecha de hoy a 7 días en idea, por producir o en producción), cada uno ordenado por fecha. Cada fila lleva al post en su parrilla. La pestaña **Clientes** tiene la lista de siempre y «Tu cuenta» (`GET /api/proximos`).

**Cambiar de cliente:** en la parrilla, el nombre del cliente con las flechitas abre una lista para saltar a otro cliente sin volver al inicio (se queda en la misma pestaña: Rendimiento, Lista…); con más de 6 clientes trae un buscador. El logo sigue llevando al inicio.

## Métricas de Instagram

Planifica trae las métricas de la cuenta de Instagram de cada cliente y las muestra en cada post, en la pestaña **Rendimiento** y en **Objetivos**.

Las **historias** no tienen métricas ni impulsos: no muestran el link de Instagram, no cuentan en Rendimiento ni en Objetivos y no se pueden elegir al registrar un impulso.

- **Conectar con Meta:** en Clientes y equipo → **Instagram → Conectar con Meta**. Lleva a Meta (app «Planifica Dual Studio», configuración de inicio de sesión unificado), donde se elige la cuenta de Instagram del cliente y su cuenta publicitaria; al volver, Planifica guarda el token de usuario del sistema (no vence) cifrado y lee todo de `graph.facebook.com` (`src/redes/meta.js`). Si se autorizan varias cuentas, pregunta cuál es la del cliente.
  - Hace falta el secreto **`META_APP_SECRET`** (la clave secreta de la app de Meta) en Cloudflare, en producción y en las vistas previas. `META_APP_ID` y `META_CONFIG_ID` están en `wrangler.jsonc`.
  - En la configuración de Meta se registra la dirección de vuelta: `https://dualstudio.app/planifica/redes/meta/vuelta` (y la de las vistas previas, con su dominio).
  - Alternativa: **pegar un token** del inicio de sesión de Instagram (dura 60 días y Planifica lo renueva sola).
- **Vincular cada post:** en el post, campo **Link en Instagram**. Al pegarlo se busca la publicación en la cuenta y se traen sus métricas al momento: alcance, reproducciones, interacciones, likes, comentarios, compartidos y guardados. La miniatura se guarda como imagen propia (WebP de 320 px) y cuenta dentro de los 50 MB del cliente.
- **Cada mañana:** una tarea programada (`triggers` en `wrangler.jsonc`) corre cada 10 minutos entre las 6:00 y las 7:50 (hora de Venezuela). Guarda los seguidores del día, las cifras de la cuenta del día anterior, la audiencia por hora (una vez por semana) y las métricas de todos los posts vinculados. Cada ejecución hace como mucho 45 llamadas a Instagram (el plan gratuito permite 50) y deja lo que falte para la siguiente.
- **Botón Actualizar:** en el post y en Rendimiento, una vez cada 15 minutos por cliente.
- **Historial de 3 meses:** si a una cuenta le faltan días de los últimos 90 (cifras de la cuenta) o de los últimos 30 (seguidores netos, que Meta no da más atrás), Actualizar y la tarea de la mañana los piden con las llamadas que sobren, del día más reciente hacia atrás. Meta da un día por llamada, así que el historial se completa en unas pocas actualizaciones; mientras falte, Actualizar se puede volver a pulsar al minuto y el aviso dice cuántos días faltan. Con el historial completo solo se pide lo del día. Un día que Meta no tiene se marca para no volver a pedirlo.
- **Resumen de Rendimiento:** seis tarjetas: 👥 seguidores netos (los que siguieron menos los que dejaron de seguir, día por día según Meta; si la cuenta tiene menos de 100 seguidores, la diferencia entre el total final y el inicial), 👀 alcance, ❤️ media de likes, 💬 interacciones, 👤 visitas al perfil y 🔗 clics en la bio, cada una contra el periodo anterior. Las visitas al perfil y los clics en la bio (toques en los enlaces del perfil) se guardan desde que se agregaron; los días anteriores no los tienen.
- **Meta en número o en %:** cada meta puede ser un número («llegar a 5.000») o un % de aumento sobre «Hoy» («que los clics al enlace aumenten un 10 %»). Con %, la meta en número se calcula sola y se actualiza si cambia «Hoy».
- **Objetivos:** en una meta de Instagram se elige de dónde sale el valor real: seguidores, alcance, reproducciones, interacciones o publicaciones del mes, o la media por post de likes, comentarios, guardados, compartidos, alcance o interacciones; y de los ads: clics al enlace, mensajes y visitas al perfil (la suma de lo registrado en los impulsos que empezaron ese mes). Las metas sin origen elegido lo toman de su nombre («Seguidores», «Media de likes»…). En las que vienen de Instagram, los cierres de cada mes se llenan solos; lo escrito a mano solo cuenta en meses sin datos. Rendimiento muestra las metas del mes o del trimestre con un círculo de avance y si se cumplieron.
- **Secretos:** `TOKENS_KEY` (opcional) cifra los tokens; si falta, se usa `SESSION_SECRET`. Si cambias ese secreto, hay que volver a pegar los tokens.
- **TikTok:** pendiente (su conexión necesita el botón «Conectar» con inicio de sesión).

## Ads

En **Rendimiento → Ads** el equipo registra la inversión en publicidad de cada cliente y el cliente la ve tal cual (en dólares).

- **Presupuesto del mes:** el monto que aprobó el cliente, con una nota opcional. Planifica muestra lo invertido y el saldo, avisa al pasar el 80 % y marca en rojo si se pasa.
- **Impulsos:** cada post de la parrilla que se impulsa en Meta, con fechas, monto gastado, objetivo y los resultados que da Meta (alcance, clics al enlace, mensajes, visitas al perfil, seguidores). El gasto cuenta en el mes en que empezó el impulso.
- **Enfocado en las metas:** lo que se muestra de los ads son las métricas de los objetivos del trimestre. Si las metas son seguidores y media de likes, «Lo que consiguieron los ads» dice cuántos seguidores llegaron por los ads (y su costo) y cuánto más alta es la media de likes en los posts impulsados que en los demás; los impulsos se ordenan por cada meta. Seguidores, alcance, clics al enlace, mensajes y visitas salen de lo que reporta Meta en cada impulso; interacciones, reproducciones y las medias, de las métricas de Instagram de los posts impulsados. Sin metas así, se muestran clics al enlace, mensajes y alcance. El presupuesto va de primero; se puede expandir (por defecto está contraído) para ver la lista de posts impulsados en el periodo y cuánto se invirtió en cada uno.
- **Por ahora es manual** (`src/ads.js`, tablas `ads_presupuestos` y `ads_impulsos`). Las columnas `origen` y `meta_ad_id` dejan listo leerlo desde Meta Ads más adelante.

Rendimiento está organizado en secciones (Resumen, Objetivos, Ads, Contenido y Audiencia) con un índice arriba.

## Vista del cliente

Quien edita tiene el botón **Ver como cliente**: abre `dualstudio.app/planifica/<cliente>/preview`, la misma parrilla en modo lectura (sin botones de edición ni avisos internos), para mostrarle al cliente sus resultados desde tu cuenta. Sigue pidiendo iniciar sesión.

## Importar una Parrilla de Contenido

Ve a Clientes y equipo → **Importar** en un cliente y elige el archivo `.json` de exportación (`formato: "parrilla-v1"`). La importación:

- suma las publicaciones;
- reemplaza los objetivos del mismo periodo;
- guarda las imágenes con un id nuevo;
- toma la cuenta de Instagram si el cliente no tenía una.

## Probar en local

```bash
cp .dev.vars.example .dev.vars     # y agrega SUPER_EMAIL / SUPER_PASSWORD para tener un administrador
npm run dev                        # http://localhost:8787/planifica
npm test
```

## Publicar por primera vez

1. **Bases de datos:** en Cloudflare → Almacenamiento y bases de datos → D1, crea `planifica` y `planifica-pruebas`. Pega sus ID en `wrangler.jsonc` (en `d1_databases` y en `previews.d1_databases`). La app crea sola sus tablas.
2. **Worker:** en Workers → Crear → Importar un repositorio, elige este repositorio con esta configuración:

   | Campo                       | Valor                                                                   |
   | --------------------------- | ----------------------------------------------------------------------- |
   | Nombre                      | `planifica`                                                             |
   | Directorio raíz             | `apps/planifica`                                                        |
   | Comando de compilación      | `cd ../.. && npm ci`                                                    |
   | Despliegue y vistas previas | `npx wrangler deploy` y `npx wrangler preview`                          |
   | Rutas a vigilar             | `apps/planifica/*`, `packages/*`, `herramientas/*`, `package-lock.json` |

3. **Secretos:** en el Worker → Configuración → Variables y secretos:
   - `SESSION_SECRET`: texto aleatorio de 32 caracteres o más.
   - `SUPER_EMAIL` y `SUPER_PASSWORD`: tu correo y una contraseña. Crean tu cuenta de administrador.

   Los mismos tres van en los secretos de las vistas previas.
4. **Entra y limpia:** entra a `dualstudio.app/planifica` con ese correo y **borra** `SUPER_EMAIL` y `SUPER_PASSWORD`. Se aplican una sola vez; mientras sigan guardados, el inicio muestra un aviso.
5. **Datos:** en Clientes y equipo, crea el cliente e importa su Parrilla.
6. **Central:** en `apps/central/apps.json`, cambia el estado de Planifica a `"pruebas"` para que aparezca con enlace en dualstudio.app.
