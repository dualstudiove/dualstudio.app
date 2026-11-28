# Planifica

Parrilla de contenido para redes sociales: publicaciones de Instagram y TikTok (formato, fecha, estado, copy, tomas a grabar, referencias), calendario, objetivos del mes y del trimestre con métricas, y la pauta audiovisual en PDF. Es **multicliente** y siempre pide iniciar sesión.

Nació como el artefacto «Parrilla de Contenido» de claude.ai (del que también salió el sistema de diseño de Dual Studio). Vive en **dualstudio.app/planifica** (Worker `planifica`).

## Direcciones

| Dirección                            | Qué es                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `dualstudio.app/planifica`           | Iniciar sesión. Con una sola marca se entra directo; si no, el inicio «Todos»: Próximos y Calendario de todas tus marcas. |
| `dualstudio.app/planifica/<cliente>` | La parrilla de la marca: Rendimiento, Objetivos, Lista, Calendario y Pauta. Con `/preview` al final, la vista del cliente.        |
| `dualstudio.app/planifica/configuracion` | Configuración: Mi cuenta (todos), Personas y Marcas (administradores). `/admin` lleva aquí.                   |

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
| `src/colab.js`                                                 | Colaboraciones: un post compartido entre varios clientes (`publicaciones_colab`).                                                       |
| `src/almacen.js`                                               | Las imágenes, con un almacenamiento intercambiable (hoy D1).                                                                               |
| `public/parrilla.html` + `js/parrilla.js` + `css/parrilla.css` | La parrilla, portada del artefacto casi sin cambios.                                                                                       |
| `public/js/conexion.js`                                        | Puente entre la parrilla y la API. Ofrece la misma interfaz que claude.ai daba al artefacto: datos en vivo, usuario, imágenes y descargas. |
| `public/index.html`, `config.html` + `js/inicio.js`, `js/config.js` | Inicio («Todos») y configuración, con los mismos componentes que la parrilla.                              |
| `public/js/cabecera.js` + `css/componentes.css` | Cabecera común (selector de marca y foto con el menú de la cuenta), colores de marca y área de configuración. Todas las páginas cargan `parrilla.css` (componentes de la app) y `componentes.css`. |
| `public/css/tema.css`                                          | Acento morado. Los formatos usan los colores de categoría del padre, salvo Diseño, que lleva su propio cian.                               |
| `construir.js`                                                 | Copia jsPDF (local, sin CDN) a `/vendor` al compilar.                                                                                      |

## Cómo funciona

- **Cambios de otras personas:** la parrilla se refresca cada 30 s mientras la pestaña está visible, al volver a ella y tras cada cambio propio. Cuando no hubo cambios, el servidor responde con una sola lectura en la base.
- **Guardado:** es automático, igual que en el artefacto. Lo que escribes se ve al instante y se confirma con el servidor.
- **Carpeta de Drive:** cada publicación tiene un campo para pegar el link de su carpeta de Drive con los contenidos. Se abre desde el post, desde la Lista y la Pauta (ícono «Drive») y queda como enlace en el PDF de la pauta. Si se pega sin `https://`, se añade solo.
- **Imágenes de referencia:** el navegador las reduce a 1080 px y las guarda en WebP, de unos 40 a 90 KB cada una. Hay un tope de 400 KB por imagen y de 50 MB por cliente (el uso aparece en Configuración → Marcas), y se borran con su publicación.
  - Hoy se guardan en D1. Para pasarlas a otro sitio (por ejemplo Google Drive, una carpeta por cliente) se añade un almacén en `src/almacen.js`; el resto de la app no cambia. Para Drive hará falta conectar una cuenta de Google.
- **Topes diarios por cliente**, guardados en la base: 5 000 cambios y 200 imágenes. Frenan un uso desbocado antes de que agote la cuota gratuita de la cuenta.

**Crear y editar un post:** «+ Nuevo post» (o «+» en un día del calendario) abre una ventana corta con título, formato, plataformas y fecha; el post se guarda solo al pulsar «Crear post» (sin título no se crea). Ya creado, todo se autoguarda y arriba se ve «Autoguardado ✓» («Guardando…» mientras hay cambios). El detalle tiene una cabecera con título y, en una fila, estado y formato (los dos como selectores), plataformas y fecha/hora; arriba a la derecha, «⋯» con **Duplicar** (la copia queda en Idea, sin fecha ni link, con «(copia)» en el título) y **Eliminar** (pide confirmar) (selector propio: calendario con «Hoy», «Mañana» y «Quitar»; horas cada 30 minutos o una escrita a mano). Debajo, en computadora, dos pestañas: **Contenido y producción** (copy, hashtags y Drive a la izquierda; a la derecha un interruptor «En la pauta», dirección creativa, lista de tomas y, solo si se usan, referencias, guion de voz, locación y props como botones «+ …») y **Métricas y ads** (link de Instagram, métricas e impulsos), que aparece en todo post de Instagram (menos las historias) o con impulsos registrados. En móvil son tres pestañas: Contenido · Producción · Resultados.

**Pauta entre meses.** La pauta de un mes trae los posts en la pauta cuyo **mes de grabación** es ese: el de su fecha de publicación o el elegido en **«Grabar en»** (en Producción del post, para adelantarlo a un mes anterior). Lo que no se tomó ni se publicó **se arrastra** solo a las pautas siguientes, sin límite, con la etiqueta «Pendiente de octubre» (y sigue en la de su mes como no tomado). Los adelantados llevan «Se publica en diciembre». En la pauta, **«+ Traer de diciembre»** lista los posts del mes siguiente para sumarlos (o devolverlos) con un clic. Las etiquetas salen también en el PDF. Campo `grabarEn` (AAAA-MM).

**Estados de un post:** Idea → Contenido → Pautado → En producción → Listo → Por publicar → Publicado. (Internamente, Pautado se guarda como `porproducir`, su nombre anterior, y Listo como `terminado`; Por publicar es `listo`.)

**Fecha = Contenido:** un post en «Idea» que recibe fecha (en el detalle, al arrastrarlo en el calendario o al crearlo desde un día) pasa solo a «Contenido» (el estado entre Idea y Pautado: falta desarrollarle copy, hashtags, dirección…). Los que ya están más avanzados no cambian.

**Lista.** Siempre continua: todos los meses en una sola lista. En **Filtros**, además de plataforma, formato, estado y búsqueda: **Agrupar** por mes (cada mes con su cabecera: tema, «Posts X de Y», **Objetivos**, que abre el resumen del mes en una ventana con «Editar objetivos», y «+ Post») o por estado. El ojito **Detallada** cambia entre la vista **simplificada** (tarjetas; en Filtros se ordena por fecha o formato) y la **detallada**, al estilo de ClickUp: una sola tabla con el encabezado fijo bajo la cabecera de la app (fecha, título, formato, redes, pauta, Drive y estado) que se **ordena tocando los encabezados** (otra vez invierte el orden). Las celdas se ven como texto y al pasar el mouse se nota qué se edita: el título abre el post y su lápiz lo renombra ahí (Enter guarda, Escape deshace); fecha y hora van juntas («Jue, 19 nov / 7pm» o «Jue, 19 nov / 7:13pm») con un popup de calendario y hora opcional; redes («IG, TT») abre una selección múltiple; formato y estado, sus menús; pauta, una casilla. En móvil solo hay simplificada. Lo publicado va recogido (arriba por mes, al final por estado) y las ideas sin fecha al final. Las elecciones se recuerdan en el navegador.

**Inicio «Todos»: Próximos y Calendario.** Con sesión, el inicio muestra todas tus marcas activas (el administrador ve todas) en dos pestañas, con los componentes de la parrilla (filas, filtros, calendario y menú de estado). **Próximos**: los posts sin publicar en tres grupos, **Atrasados** (fecha de hasta 30 días atrás), **Por publicar** (listos, de hoy a 7 días) y **Aún no listos** (con fecha de hoy a 7 días). **Calendario**: el mismo calendario de la parrilla, con cada post del color de su marca, el ojito «Publicados» y la leyenda de marcas; arrastrar un post a otro día cambia su fecha y el «+» de cada día pregunta la marca y abre su parrilla con «Nuevo post» en ese día (`#nuevo-AAAA-MM-DD`). Las dos pestañas comparten el botón **Filtros** (Marca), que se recuerda en el navegador. Ambas salen de una sola consulta (`GET /api/agenda`, todos los posts de tus marcas).

**Colaboraciones.** Un post puede compartirse con otros clientes (campo **Colaboración** en la cabecera del post): es **un solo post**, sin copias, que aparece en la parrilla de cada cliente con la etiqueta 🤝 y se edita igual desde cualquiera (quien sea editor de alguno de ellos). Su dueño es el cliente que lo creó: desde esa cuenta «se publica», su link y sus métricas se leen con su conexión y se ven en todas. Cuenta para las metas de todos. Los impulsos registrados en otra cuenta se ven en el post («de otra cuenta») pero no suman al presupuesto de este cliente. Quien comparte puede **quitarlo de su cuenta** (sigue en las demás); el dueño lo **elimina** para todos. En la Agenda y Próximos sale una sola vez. Tabla `publicaciones_colab`; `PUT /<cliente>/api/publicaciones/:id/colab { clientes: [slug…] }` (para sumar un cliente hay que ser editor de él).

**Cabecera y configuración.** Todas las páginas llevan la misma barra: logo, el selector de marca («Todos» lleva al inicio; cada marca, con su punto de color, a su parrilla) y la foto de perfil (o las iniciales), que abre Mi cuenta, Personas y Marcas (estas dos, solo administradores) y Cerrar sesión. **Configuración** (`/configuracion`) tiene una barra lateral: **Mi cuenta** (foto, que el navegador recorta en cuadrado de 256 px; nombre; contraseña; cerrar las demás sesiones), **Personas** (cada persona con sus marcas, «edita» o «solo ve»; Editar cambia nombre, correo, administrador, marcas, contraseña y activa) y **Marcas** (color, @cuenta, Instagram, personas; el menú ⋯ tiene Editar, Instagram, Importar parrilla, Archivar y Eliminar; las archivadas van plegadas). El color de una marca se elige entre 8 (`COLORES_MARCA` en `src/validar.js`, tokens `--marca-*` en `tema.css`); sin elegir, se asigna por orden. Fotos: tabla `usuarios_fotos`, `PUT`/`DELETE /api/cuenta/foto`, `GET /api/fotos/:id?v=…` (con sesión).

**Cambiar de marca:** dentro de una marca, el selector salta a otra sin volver al inicio (se queda en la misma pestaña: Rendimiento, Lista…); con más de 6 marcas trae un buscador. La @cuenta de Instagram de la marca solo la cambia un administrador, en Configuración → Marcas.

## Métricas de Instagram

Planifica trae las métricas de la cuenta de Instagram de cada cliente y las muestra en cada post, en la pestaña **Rendimiento** y en **Objetivos**.

Las **historias** no tienen métricas ni impulsos: no muestran el link de Instagram, no cuentan en Rendimiento ni en Objetivos y no se pueden elegir al registrar un impulso.

- **Conectar con Meta:** en Configuración → Marcas → **⋯ → Instagram → Conectar con Meta**. Lleva a Meta (app «Planifica Dual Studio», configuración de inicio de sesión unificado), donde se elige la cuenta de Instagram del cliente y su cuenta publicitaria; al volver, Planifica guarda el token de usuario del sistema (no vence) cifrado y lee todo de `graph.facebook.com` (`src/redes/meta.js`). Si se autorizan varias cuentas, pregunta cuál es la del cliente.
  - Hace falta el secreto **`META_APP_SECRET`** (la clave secreta de la app de Meta) en Cloudflare, en producción y en las vistas previas. `META_APP_ID` y `META_CONFIG_ID` están en `wrangler.jsonc`.
  - En la configuración de Meta se registra la dirección de vuelta: `https://dualstudio.app/planifica/redes/meta/vuelta` (y la de las vistas previas, con su dominio).
  - Alternativa: **pegar un token** del inicio de sesión de Instagram (dura 60 días y Planifica lo renueva sola).
- **Vincular cada post:** en el post, campo **Link en Instagram**. Al pegarlo se busca la publicación en la cuenta y se traen sus métricas al momento: alcance, reproducciones, interacciones, likes, comentarios, compartidos y guardados. La miniatura se guarda como imagen propia (WebP de 320 px) y cuenta dentro de los 50 MB del cliente.
- **Cada mañana:** una tarea programada (`triggers` en `wrangler.jsonc`) corre cada 10 minutos entre las 6:00 y las 7:50 (hora de Venezuela). Guarda los seguidores del día, las cifras de la cuenta del día anterior, la audiencia por hora (una vez por semana) y las métricas de todos los posts vinculados. Cada ejecución hace como mucho 45 llamadas a Instagram (el plan gratuito permite 50) y deja lo que falte para la siguiente.
- **Botón Actualizar:** en el post y en Rendimiento, una vez cada 15 minutos por cliente.
- **Historial de 3 meses:** si a una cuenta le faltan días de los últimos 90 (cifras de la cuenta) o de los últimos 30 (seguidores netos, que Meta no da más atrás), Actualizar y la tarea de la mañana los piden con las llamadas que sobren, del día más reciente hacia atrás. Meta da un día por llamada, así que el historial se completa en unas pocas actualizaciones; mientras falte, Actualizar se puede volver a pulsar al minuto y el aviso dice cuántos días faltan. Con el historial completo solo se pide lo del día. Un día que Meta no tiene se marca para no volver a pedirlo.
- **Resumen de Rendimiento:** cinco tarjetas: 👥 seguidores netos (los que siguieron menos los que dejaron de seguir, día por día según Meta; si la cuenta tiene menos de 100 seguidores, la diferencia entre el total final y el inicial), 👀 alcance, ❤️ media de likes, 💬 interacciones y 👤 visitas al perfil, cada una contra el periodo anterior. Las visitas al perfil se guardan desde que se agregaron; los días anteriores no las tienen. Los clics al link de la bio no están: Meta quitó esa métrica de la API (`website_clicks`, enero de 2025) y `profile_links_taps` solo cuenta los botones de contacto.
- **Meta en número o en %:** cada meta puede ser un número («llegar a 5.000») o un % de aumento sobre «Hoy» («que los clics al enlace aumenten un 10 %»). Con %, la meta en número se calcula sola y se actualiza si cambia «Hoy».
- **Objetivos:** en una meta de Instagram se elige de dónde sale el valor real: seguidores, alcance, reproducciones, interacciones o publicaciones del mes, o la media por post de likes, comentarios, guardados, compartidos, alcance o interacciones; y de los ads: clics al enlace, mensajes y visitas al perfil (la suma de lo registrado en los impulsos que empezaron ese mes). Las metas sin origen elegido lo toman de su nombre («Seguidores», «Media de likes»…). En las que vienen de Instagram, los cierres de cada mes se llenan solos; lo escrito a mano solo cuenta en meses sin datos. Rendimiento muestra las metas del mes o del trimestre con un círculo de avance y si se cumplieron.
- **Secretos:** `TOKENS_KEY` (opcional) cifra los tokens; si falta, se usa `SESSION_SECRET`. Si cambias ese secreto, hay que volver a pegar los tokens.
- **TikTok:** pendiente (su conexión necesita el botón «Conectar» con inicio de sesión).

## Ads

El equipo registra la inversión en publicidad de cada marca y el cliente la ve tal cual (en dólares): los **impulsos** en **Rendimiento → Ads** (los que empezaron en el periodo) y el **presupuesto del mes** con lo que aportaron los ads a las metas en **Objetivos → Presupuesto de ads**.

- **Presupuesto del mes:** el monto que aprobó el cliente, con una nota opcional. Planifica muestra lo invertido y el saldo, avisa al pasar el 80 % y marca en rojo si se pasa.
- **Impulsos:** cada post de la parrilla que se impulsa en Meta, con fechas, monto gastado, objetivo y los resultados que da Meta (alcance, clics al enlace, mensajes, visitas al perfil, seguidores). El gasto cuenta en el mes en que empezó el impulso.
- **Enfocado en las metas:** lo que se muestra de los ads son las métricas de los objetivos del trimestre. Si las metas son seguidores y media de likes, «Lo que consiguieron los ads» dice cuántos seguidores llegaron por los ads (y su costo) y cuánto más alta es la media de likes en los posts impulsados que en los demás; los impulsos se ordenan por cada meta. Seguidores, alcance, clics al enlace, mensajes y visitas salen de lo que reporta Meta en cada impulso; interacciones, reproducciones y las medias, de las métricas de Instagram de los posts impulsados. Sin metas así, se muestran clics al enlace, mensajes y alcance. El presupuesto va de primero; se puede expandir (por defecto está contraído) para ver la lista de posts impulsados en el periodo y cuánto se invirtió en cada uno.
- **Por ahora es manual** (`src/ads.js`, tablas `ads_presupuestos` y `ads_impulsos`). Las columnas `origen` y `meta_ad_id` dejan listo leerlo desde Meta Ads más adelante.

**Rendimiento** muestra lo que pasó en un periodo: arriba, **Filtros** (red: Instagram o TikTok; formato, para Contenido) y el periodo, **7 días · 30 días · 90 días · Personalizado** (siempre arranca en 30 días hasta hoy; Personalizado trae «Este mes», «Mes pasado» o un rango desde–hasta de hasta un año). Cada cifra se compara con el periodo del mismo largo justo antes («vs. 30 días anteriores»). Secciones seguidas: Resumen, Ads (la lista de impulsos), Contenido y Audiencia.

**Objetivos** muestra lo planeado y cómo va, por **Mes** (al entrar) o **Trimestre**: tema y objetivos del mes con sus posts, los círculos de las metas y el presupuesto de ads. «Editar» abre el formulario del trimestre (tema, objetivos, metas por red y los tres meses).

## Vista del cliente

Quien edita tiene el botón **Ver como cliente**: abre `dualstudio.app/planifica/<cliente>/preview`, la misma parrilla en modo lectura (sin botones de edición ni avisos internos), para mostrarle al cliente sus resultados desde tu cuenta. Sigue pidiendo iniciar sesión.

## Importar una Parrilla de Contenido

Ve a Configuración → Marcas → **⋯ → Importar parrilla** en una marca y elige el archivo `.json` de exportación (`formato: "parrilla-v1"`). La importación:

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
5. **Datos:** en Configuración → Marcas, crea la marca e importa su Parrilla.
6. **Central:** en `apps/central/apps.json`, cambia el estado de Planifica a `"pruebas"` para que aparezca con enlace en dualstudio.app.
