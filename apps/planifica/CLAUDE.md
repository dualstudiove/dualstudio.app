# Planifica: reglas de trabajo

## Versiones (cada día o sesión de trabajo es una versión)

- **Al empezar** una sesión con cambios: la versión nueva es la siguiente menor de la última en `CHANGELOG.md`
  (0.2.0 → 0.3.0; un arreglo suelto en el mismo día, el parche: 0.3.0 → 0.3.1). Ponle un **nombre** corto en
  español que resuma la sesión (p. ej. «Marcas»).
- **Durante** la sesión, cada cambio publicado se anota en `CHANGELOG.md`, en la entrada de la versión, en una de
  estas secciones: **Nuevo**, **Cambios**, **Eliminado**, **Arreglos**. Se escribe para quien usa la app, no en
  términos de código.
- **Al cerrar** (o cuando se pida subir a master):
  1. `version` de `package.json` = la versión de la sesión.
  2. La entrada del `CHANGELOG.md` con fecha y el rango de commits.
  3. En la entrada, el commit de `master` que es la versión. Si el entorno deja subir etiquetas, además
     `git tag -a planifica-vX.Y.Z <commit>` y `git push origin planifica-vX.Y.Z` (en las sesiones en la nube de
     Claude Code la subida de etiquetas da 403: basta con el CHANGELOG).
- Si se pide el informe en PDF: portada con número y nombre, la lista Nuevo / Cambios / Eliminado / Arreglos, y
  después las capturas de antes y después de cada cambio visible (la versión anterior es el commit de la versión anterior en el CHANGELOG).
