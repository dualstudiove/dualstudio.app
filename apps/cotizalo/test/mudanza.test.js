// Mudanza de dualstudio.app/cotizalo a cotizalab.app: las direcciones de antes se redirigen a las nuevas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { redireccionMudanza } from "../src/mudanza.js";

const VARS = { DIRECCION: "cotizalab.app", DIRECCION_ANTERIOR: "dualstudio.app/cotizalo" };
const ir = (url, method = "GET", vars = VARS) =>
  redireccionMudanza(new Request(url, { method }), vars);

test("mudanza: cada dirección de antes va a la misma en el dominio nuevo, con su búsqueda", () => {
  for (
    const [antes, despues] of [
      ["https://dualstudio.app/cotizalo", "https://cotizalab.app/"],
      ["https://dualstudio.app/cotizalo/", "https://cotizalab.app/"],
      ["https://dualstudio.app/cotizalo/super", "https://cotizalab.app/super"],
      ["https://dualstudio.app/cotizalo/demo", "https://cotizalab.app/demo"],
      [
        "https://dualstudio.app/cotizalo/demo/admin?x=1#/precios",
        "https://cotizalab.app/demo/admin?x=1",
      ],
      ["https://dualstudio.app/cotizalo/css/app.css", "https://cotizalab.app/css/app.css"],
    ]
  ) {
    const r = ir(antes);
    assert.equal(r?.status, 301, antes);
    assert.equal(r.headers.get("location"), despues, antes);
  }
});

test("mudanza: lo que no es la dirección de antes sigue de largo", () => {
  assert.equal(ir("https://cotizalab.app/demo"), null);
  assert.equal(ir("https://dualstudio.app/"), null, "la página central no se toca");
  assert.equal(
    ir("https://dualstudio.app/cotizalon"),
    null,
    "solo la ruta exacta y lo que cuelga de ella",
  );
  assert.equal(ir("https://dualstudio.app/planifica/x"), null);
  assert.equal(ir("http://localhost:8787/demo"), null);
  assert.equal(
    ir("https://dualstudio.app/cotizalo/demo", "GET", {}),
    null,
    "sin variables, no hace nada",
  );
});

test("mudanza: un POST se redirige con 308 (conserva el método y el cuerpo)", () => {
  const r = ir("https://dualstudio.app/cotizalo/demo/api/publico/presupuesto", "POST");
  assert.equal(r.status, 308);
  assert.equal(r.headers.get("location"), "https://cotizalab.app/demo/api/publico/presupuesto");
});

test("mudanza: el Worker redirige antes de todo lo demás (sin base de datos ni secretos)", async () => {
  const { fetch } = await import("../src/server.js");
  const r = await fetch(new Request("https://dualstudio.app/cotizalo/demo"), VARS, {});
  assert.equal(r.status, 301);
  assert.equal(r.headers.get("location"), "https://cotizalab.app/demo");
});
