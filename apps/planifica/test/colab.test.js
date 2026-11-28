// Colaboraciones: un post compartido entre varios clientes, sin copias.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { crearD1Local } from "@dualstudio/comun/servidor/d1-local";
import { olvidarCacheDeSecretos } from "@dualstudio/comun/servidor";
import worker from "../src/server.js";

const bindings = {
  DB: crearD1Local(":memory:"),
  SESSION_SECRET: "secreto-de-prueba-secreto-de-prueba-123",
  BASE_PATH: "/planifica",
  SUPER_EMAIL: "admin@dualstudio.app",
  SUPER_PASSWORD: "AdminDePrueba1",
};

function navegador() {
  const jar = {};
  return async function pedir(ruta, { method = "GET", body } = {}) {
    const h = { "x-app": "1" };
    if (body !== undefined) h["content-type"] = "application/json";
    if (Object.keys(jar).length) h.cookie = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
    const res = await worker.fetch(
      new Request(`http://localhost/planifica${ruta}`, {
        method,
        headers: h,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),
      bindings,
      { waitUntil: () => {} },
    );
    for (const c of res.headers.getSetCookie()) {
      const [par] = c.split(";");
      const i = par.indexOf("=");
      jar[par.slice(0, i)] = par.slice(i + 1);
    }
    const tipo = res.headers.get("content-type") || "";
    return { status: res.status, json: tipo.includes("json") ? await res.json() : null };
  };
}

const admin = navegador();
const ana = navegador(); // editora de A y B
const luis = navegador(); // editor solo de C
const ids = {};
const posts = async (quien, slug) => (await quien(`/${slug}/api/datos`)).json.publicaciones;

before(async () => {
  olvidarCacheDeSecretos();
  await admin("/api/login", { method: "POST", body: { email: "admin@dualstudio.app", password: "AdminDePrueba1" } });
  for (const [k, nombre] of [["a", "Cuenta A"], ["b", "Cuenta B"], ["c", "Cuenta C"]]) {
    ids[k] = (await admin("/api/admin/clientes", { method: "POST", body: { nombre } })).json.id;
  }
  for (const [k, email] of [["ana", "ana@x.co"], ["luis", "luis@x.co"]]) {
    ids[k] = (await admin("/api/admin/usuarios", { method: "POST", body: { email, nombre: k, password: "Clave12345" } })).json.id;
  }
  for (const [u, c] of [["ana", "a"], ["ana", "b"], ["luis", "c"]]) {
    await admin("/api/admin/accesos", { method: "PUT", body: { usuario_id: ids[u], cliente_id: ids[c], rol: "editor" } });
  }
  await ana("/api/login", { method: "POST", body: { email: "ana@x.co", password: "Clave12345" } });
  await luis("/api/login", { method: "POST", body: { email: "luis@x.co", password: "Clave12345" } });
  await ana("/cuenta-a/api/publicaciones", {
    method: "POST",
    body: { id: "pcolab0001", datos: { title: "Compartir navideño", format: "carrusel", platforms: ["ig"], date: "2026-12-20", status: "contenido" } },
  });
});

test("compartir: el mismo post aparece en cada cliente, con su dueño y cuentas", async () => {
  // Ana no puede sumar C (no es editora de C)
  assert.equal((await ana("/cuenta-a/api/publicaciones/pcolab0001/colab", { method: "PUT", body: { clientes: ["cuenta-c"] } })).status, 403);
  const r = await ana("/cuenta-a/api/publicaciones/pcolab0001/colab", { method: "PUT", body: { clientes: ["cuenta-b"] } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.colab.cuentas.map((c) => c.slug), ["cuenta-a", "cuenta-b"]);
  // El admin suma C
  await admin("/cuenta-a/api/publicaciones/pcolab0001/colab", { method: "PUT", body: { clientes: ["cuenta-b", "cuenta-c"] } });
  for (const [quien, slug] of [[ana, "cuenta-a"], [ana, "cuenta-b"], [luis, "cuenta-c"]]) {
    const p = (await posts(quien, slug)).find((x) => x.id === "pcolab0001");
    assert.ok(p, `aparece en ${slug}`);
    assert.equal(p.colab.dueno, "cuenta-a");
    assert.equal(p.colab.cuentas.length, 3);
  }
});

test("editar desde cualquiera cambia el único post; el cambio avisa a todos", async () => {
  const antes = (await luis("/cuenta-c/api/datos")).json.version;
  assert.equal(
    (await ana("/cuenta-b/api/publicaciones/pcolab0001", { method: "PATCH", body: { cambios: { copy: "¡Feliz Navidad!" } } })).status,
    200,
  );
  const c = await luis("/cuenta-c/api/datos");
  assert.notEqual(c.json.version, antes, "C se entera del cambio");
  assert.equal(c.json.publicaciones.find((x) => x.id === "pcolab0001").copy, "¡Feliz Navidad!");
  // Luis (solo C) también lo edita
  assert.equal(
    (await luis("/cuenta-c/api/publicaciones/pcolab0001", { method: "PATCH", body: { cambios: { status: "porproducir" } } })).status,
    200,
  );
  assert.equal((await posts(ana, "cuenta-a")).find((x) => x.id === "pcolab0001").status, "porproducir");
});

test("Agenda y Próximos: el post compartido sale una sola vez", async () => {
  const ag = (await ana("/api/agenda")).json.posts.filter((p) => p.id === "pcolab0001");
  assert.equal(ag.length, 1);
  assert.equal(ag[0].cliente, "cuenta-a");
  assert.deepEqual(ag[0].colab, ["Cuenta A", "Cuenta B", "Cuenta C"]);
  // Luis no tiene A: lo ve en su cliente C
  const lu = (await luis("/api/agenda")).json.posts.filter((p) => p.id === "pcolab0001");
  assert.equal(lu.length, 1);
  assert.equal(lu[0].cliente, "cuenta-c");
  // El filtro de marca del inicio: el post sale en cada marca tuya en la que aparece, no solo en la dueña
  assert.deepEqual(lu[0].marcas, ["cuenta-c"]);
  const deAna = (await ana("/api/sesion")).json.clientes.map((c) => c.slug);
  assert.deepEqual(ag[0].marcas, ["cuenta-a", "cuenta-b", "cuenta-c"].filter((s) => deAna.includes(s)));
  assert.ok(ag[0].marcas.length > 1);
});

test("impulsos: el de otra cuenta se ve en el post marcado «ajeno»", async () => {
  const imp = await luis("/cuenta-c/api/ads/impulsos", {
    method: "POST",
    body: { publicacion_id: "pcolab0001", inicio: "2026-12-20", gastado: 20 },
  });
  assert.equal(imp.status, 200);
  const enA = (await ana("/cuenta-a/api/datos")).json.ads.impulsos.find((i) => i.publicacion_id === "pcolab0001");
  assert.ok(enA && enA.ajeno, "A lo ve, como ajeno");
  const enC = (await luis("/cuenta-c/api/datos")).json.ads.impulsos.find((i) => i.publicacion_id === "pcolab0001");
  assert.ok(enC && !enC.ajeno, "C lo ve como suyo");
});

test("borrar: quien comparte lo quita de su parrilla; el dueño lo borra para todos", async () => {
  const q = await luis("/cuenta-c/api/publicaciones/pcolab0001", { method: "DELETE" });
  assert.equal(q.json.quitado, true);
  assert.ok(!(await posts(luis, "cuenta-c")).some((x) => x.id === "pcolab0001"));
  assert.ok((await posts(ana, "cuenta-b")).some((x) => x.id === "pcolab0001"), "sigue en B");
  await ana("/cuenta-a/api/publicaciones/pcolab0001", { method: "DELETE" });
  assert.ok(!(await posts(ana, "cuenta-b")).some((x) => x.id === "pcolab0001"), "ya no está en B");
  assert.ok(!(await posts(ana, "cuenta-a")).some((x) => x.id === "pcolab0001"));
});
