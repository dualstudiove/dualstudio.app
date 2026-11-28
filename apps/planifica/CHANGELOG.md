# Versiones de Planifica

Cada día o sesión de trabajo es una versión. Cada una dice qué es **nuevo**, qué **cambió**, qué se **eliminó** y qué
**arreglos** trae. La versión está en `package.json` y cada una se marca en git con la etiqueta `planifica-vX.Y.Z`
sobre lo publicado en `master`. Reglas en [CLAUDE.md](CLAUDE.md).

## 0.2.0 «Marcas» · 28 de noviembre de 2026

Una cabecera común, el inicio «Todos» con Próximos y Calendario de todas las marcas, un área de Configuración,
Rendimiento por periodo y Objetivos por mes o trimestre.

### Nuevo
- **Cabecera común** en todas las páginas: logo, selector de marca («Todos» o una marca, cada una con su color) y foto
  de perfil con el menú de la cuenta (Mi cuenta, Personas, Marcas, modo claro/oscuro, Cerrar sesión).
- **Foto de perfil:** cada persona sube la suya; sin foto se ven sus iniciales.
- **Configuración** (`/configuracion`) con barra lateral: Mi cuenta, Personas y Marcas.
- **Colores de marca:** 8 para elegir (frambuesa, azul, verde, ámbar, morado, cian, coral, oliva).
- **Calendario del inicio:** el calendario de la parrilla con los posts de todas las marcas, cada uno del color de su
  marca; arrastrar un post cambia su fecha y el «+» de cada día pregunta la marca.
- **Filtros por marca** en Próximos y Calendario del inicio (el mismo filtro en las dos pestañas).
- **Modo claro / oscuro** desde el menú de la cuenta; se recuerda en el navegador.
- **Rendimiento por periodo:** 7, 30 o 90 días, o Personalizado (este mes, mes pasado o desde–hasta).
- **Filtros en Rendimiento:** red (Instagram o TikTok) y formato (para Contenido).
- **Objetivos por mes:** tema y objetivos, metas y presupuesto de ads del mes.
- Los administradores pueden **cambiar el correo** de una persona.

### Cambios
- «Clientes» se llama **Marcas** en toda la app.
- La **Agenda** del inicio pasa a ser **Calendario**.
- **Próximos** usa las filas de la Lista de la parrilla, sin el borde de color.
- **Personas:** sin categorías (solo la etiqueta «Administrador»); «Editar» reúne nombre, correo, rol, marcas,
  contraseña y si la cuenta está activa.
- **Marcas:** tarjetas con menú ⋯ (Editar, Instagram, Importar parrilla, Archivar, Eliminar); las archivadas van
  plegadas.
- **Objetivos** va al lado de Rendimiento y se ve por Mes o Trimestre.
- **Rendimiento** compara cada cifra con el periodo anterior del mismo largo («vs. 30 días anteriores»).
- **Ads:** los impulsos se ven en Rendimiento; el presupuesto y lo que aportaron a las metas, en Objetivos.
- **Teléfono:** los títulos de mes de la Lista van en una línea (mes, «este mes» y 12/14).
- `/admin` lleva a Configuración; «Conectar con Meta» vuelve a Configuración → Marcas.
- El inicio y la configuración usan los mismos componentes que la parrilla (sin duplicados).

### Eliminado
- De la cabecera: el saludo, el correo, «Clientes y equipo» y «Salir» (ahora en el menú de la foto).
- Del inicio: la pestaña Clientes y la tarjeta «Tu cuenta».
- La página «Clientes y equipo» (reemplazada por Configuración).
- La tarjeta del mes encima del Calendario de una marca (ahora en Objetivos).
- De Rendimiento: la navegación por mes, Instagram/TikTok, Mes/Trimestre, los chips de secciones y la sección de metas.
- La métrica **«Clics en la bio»**: Meta quitó los clics al link de la bio de su API (enero de 2025) y la que quedaba
  solo cuenta los botones de contacto.

### Arreglos
- El filtro de marca del inicio no mostraba los posts en colaboración de los que la marca no es autora.
- La página se movía de lado al cambiar de pestaña (aparecía la barra de scroll).
- En el teléfono, el nombre largo de una marca se salía de la cabecera.

Cambios publicados: `82f5c3e`…`e03dc8c`.

## 0.1.0 · antes del 28 de noviembre de 2026

Versión base, antes de llevar el control de versiones: parrilla por cliente (Rendimiento, Lista, Calendario,
Objetivos, Pauta), métricas de Instagram, ads, colaboraciones, inicio con Próximos, Agenda y Clientes, y la página
«Clientes y equipo».
