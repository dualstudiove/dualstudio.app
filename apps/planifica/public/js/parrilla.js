// Parrilla de Contenido de un cliente (Planifica).
// Portada del artefacto «Parrilla de Contenido» de claude.ai casi sin cambios: habla con el servidor a través de
// window.claude, que aquí ofrece js/conexion.js sobre la API de Planifica. Cambios respecto al artefacto:
//  · las imágenes de referencia se piden a la API (window.PLANIFICA.img + id) y se comprimen a 1080 px en WebP;
//  · los textos de «sin conexión» y «solo lectura» hablan de Planifica.
(function () {
  "use strict";

  /* ---------- Constants ---------- */
  var MONTHS = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  var MON3 = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  var CROWN_SVG =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 5.2l3.2 2.6L8 3.2l2.8 4.6L14 5.2l-1.3 7H3.3z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/></svg>';
  var DOW_LONG = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
  var FORMATS = {
    reel: { label: "Reel", plural: "Reels", list: "Clips a grabar" },
    carrusel: { label: "Carrusel", plural: "Carruseles", list: "Slides y material" },
    foto: { label: "Foto", plural: "Fotos", list: "Fotos a tomar" },
    historia: { label: "Historia", plural: "Historias", list: "Historias a grabar" },
    diseno: { label: "Diseño", plural: "Diseños", list: "Elementos del diseño" },
  };
  var FICON = {
    "reel":
      "data:image/png;base64,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",
    "foto":
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAADAFBMVEVMaXE2NjbLzc5WVlYUFBTIycnBwcE7OzoZGRn+mhMJCQn+oxyLi4xRUVFycXD9nxP7hhleX2D2dBLv8fFFRUb9oBq8vsD+nBbN1+J7fH67vb0XFxf8lBT9nBWboaL9oBf9ixB9fn8EBAT9lBV1eXkSExT+oRv+oRiXmJh8foP6mBcyMjLExcago6bgvJOChYn/mhZoc35oamt3eHnFxMeeoaT8kA9NTU4wMTL+mxi2ubt1dXagqrdWWFmwsrSSiXz9pBnjegDOoW5AP0A6Ojo4ODgAAAAwMDAuLi4/P0A8PDwlJSV9f4ErKytFRUZHR0g1NjYyMzMnJycpKSl7fH6AgoQeHh8+Pj5AQUI1NTVLS0s2Nzf/hQFCQkM0NDQiIiIyMTJISUp4enxDRERRUVHW2NnZ2txTU1TU1tfT1NWDhIbd3t8bGxtoamxOTk5XWVpkZGRmZmirrK5gYGJ4eHlZXGH/fwEXFxdvb3DOz9D/iAGur7FzdXf///z/jQF6fYBKTU+HioxcXFxfZGjQ0tNxcnNCQkKEh4np6ur/lwn/sB9RVVkLCwwHBwf/0AGlpqdtbGzQ09W1t7n/oxNMT1WVjIO5u73/qR3/1gJaYmjDxMV7e3o4PEGoqaqxs7WLjpCbnZ9ESU+YmZuclIv/owH+nA9qbnBYVVUoMTsRERKKjI2goqT/3wX/kgT/xgPk5OX6hQWwqKOTlZf/qRRBRUr/6m7rgw3DzNf/jAn/3me7trH/7EapZhT/71q2r6r/sAH/vAT5vDijmpP/9sv/6DOqopvgrnX//Ov/8rT/2Tpzf4zykynBvbn/3iXyzm3ppFX/yjn/8IOyej3/1Rv/8Jc3Qk8UHCfbgx/Dr5OwucT/9mqNkZXPv67vmz37kRe9w8v6zVPJfy3QdQ6xg1FnUTuWXyNbQh/Ny8iTgm6DbFNOQDFsRh3Vl0NjYFj3+PnFnh//3FFPSER2WTn9ozmFViNeQwXW0s2/bhM0JQDb19O1nHTWxINBMyXWybu9lGImGQDviyIpAAAA73RSTlMA5v70HP77Ai0CNP3v9zT8F/AL/vCzrsL+SuYmPnkc5CzvNGIdE8/w4UmY5+es/pmk/u/cJ0BT7TmKne3+xnZt2Eu3+////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////kSUwFMAAAAJcEhZcwAACxIAAAsSAdLdfvwAABUhSURBVGje7Zp3WBtnmsA5EuzluATH2cS5xD4758ROnE3PJdv37p4ZNDPSjGbUZkZipJFGWCBQQ3TLSAgQFtj0ADadGIMxtjG4gEvc4xZ3O3Z6r5vdZHu79s4I7PWz+1ec3HP3PPsC6ry/7+3ffJCU9Df5fySp37B6kG+Wt3jRN2pDatL8JXP+nDBnzo1vfw3wJX9GSE16dsF1nalJc+fPvXkTFtTOu0aAZ3f9OeB7C27ahNSkRUuvE1KT7lo4d+Yx6F865+Z9BDrbZwjgkyXt8xM6Ibu+V7vsa4hBatLi2rRpgmLOgmlW6rLatPlfC2DOwva02rvmKimzuL39rgRq7hO17Uvm3iwgsdYnatMShNSkZbXtC+fID+beVZvWvuBriEBi2WkJghyCNMUvc0B/2tKbrsHUOakzPkpLlwmLloK3FkC5zQP94Kybj+9d81MTPjrTDoSkZ9tlUNKiJbXp6Wnti7+aAXJ3mz3z5In2eYvnJM1vH3znfHp67bJlEwcPtvzr/CW18YPtLQtvpghSlS4KsZxXO7FwwaIlE2mXdgymt6cNvvNOPG1pe/zgVPrEVyyCuc8uvtZggLFo4cTExMKFLYNTl6YG09PiU1Pxlpb4wfMH4+lftQgWLUtfOu+JBc8uSkT42ZaW9JaWlsGD589PDQ627NjRMhg/d35fesu8uUmz/4qkyq/+FbWzp39kmT9vonaiJX0hYMCaBS3p6e2DcVD92pfxtNdea9987rV95+Iti79yBGYnzf63eRPyuicmWuIL56XD8r+sldW+9uW5ffsOntu3Z097fOlPHv7HhDz8sPzz8MPK83+R5fYHpvX8+G5FHn300ccffzBp9k8e/f61p8uWtgympw+214JH4nHQfuLEvks79uzbAdp3HDk9uPnsPcuX5y4HyVquSFbW8qzs5FltPStWzEq+9wEF8EDyyjtX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",
    "diseno":
      "data:image/png;base64,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",
    "carrusel":
      "data:image/png;base64,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",
    "historia":
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAABv1BMVEVMaXG9vb23t7kFBQUAAACtra2oqalXV1eurq6oqKijo6ONjY2xsbKsrKypqaq4uLmrq6yTk5MDAwMAAAABAQELCwsICAgKCgoFBQUNDQ0HBgarq6v///8VFRUgISFVVVVPT09RUlFFRUVMS0wqKypMR0uIiIh8fH1qamr9/f1lZGQduf5wb28crvhM22RcWV0HDRD/6mFM4mZWTEaampr9bGT83VxVS1SVlZVL1mMICQoZxvYwMS4ZnNM6ODpIi1TiUNvqrfOgoKHuZV1ObFPSvaD/lQDYoeLHx8c6HRXQSsrhyquCgoIVe6lIxl4Vzv9a3vYjFA1P2+NDaHJgLCTqY1xP6WkJHigRMj30aGC/UkypYgI3k5qQkZE3gZEOSWUexv/8igDFsktKztZW0OcQYISCOTVNus4/lqf6+vrp6emLi4uiO50WgbEbrPGfkD1Lrltc7fzx8fE7MxdXIVRDucAxhUD/92bV1dUxFDCYiXRqXiiOapTh4eHSw1KxokVVSyHUegHq0li7qI5Cs7pKV1vWfAHnY1tU9XAkVVx6LXbLdgFKssf//mocv+nQfAEpaDOxhbnFuahvZEGKOGE3V+EkAAAAEnRSTlMA8PD8/MzNAgJENw64c+ngZxMr7Y/sAAAACXBIWXMAAAsSAAALEgHS3X78AAAIIElEQVRo3rWai18TxxbHaau0V63tnfdO2E02D4iwJCFEhDXGirSKgvIwgBZEq2jlig9aqn3rvb76uL3tf3zPmU0wEesnmeAPyed4Nsw3Z2bOmdnJdnW9Xh907f/4wEfvtKSPDny8H/6gLb3ftW9vrNTbokqxvfvgT9pr/2Bv0nNblJfsPdgWAfqne8rTcod4pB1+7fV1t9NLH3R9WCprpw3pcunDtgAHAof/fXMcL/JmT7D3n60T3u/am5evadiryeVgNhNkPLavLUD8Pb5D2wBPOl7akY3XRCL2j44B3KnNGgfN5ku2gKiD61Y0f4zNX7lsCXCkEEJiE06oFFEcPzvXoMiJl0OnA4A2HaJhPJUZgFA4jhCYWhyc8IvXtTXA0X+OnQNBSijv9Pr6+mYMRtb54RToLw+c5X+BVjLIsgHA5z63kCvmXhxXLs32HOqBf0mqyidOnIKfPHVIEBstlcZ7sdusANI5VxwbG1s4rh0a9Nw6dAgBpHICIzCA7Pjo6GhpCt7YASAXAUwEPQ2AI50DOAByJgJVi+DWKxEE4yujKwAIYbytZpG492JhYeHFN8Sh8R7soc0yU+lTJ1AZ6rB8bHx8PNanpS1Ae9+gXAGTJxiH8cwrzlXmB1CeSy7ceH8+n/dwnmrLPCAoAVZIUQydzJhYiTRl8KO4PcBpLhWR+aqTdwDgDevYSysE8eZKYt1FvFAoSOzjUJj/AyIk+LEVOpUsOAVu20XwefXqMdSS5sJJwXDmk1KGPPgP6DtXO2Tp95ugXwhEp1PtA7jgx64MDAxcmSYOSQdZlCdY+izo07PDME2/vD8zM3P/JrzRElA4NjA4ODgwrRxSzvaDsp5m5U9REWDm+vXrMzedjgHkzYBCZ4A7Axt/EwHpGBA2jkEQZIOsK4gZg7NnkxDBshmD30NpB4BZtDQ9Pb0xvah5yCupTCZVFjBfhr8D9UPH68XlL0FLlrMI00mZUqHBEsYiaJlKQbUMpWIoJfGddgCJ+ctlZGIymySWdWdDZlsCIIGhFpi2sCqIqFnDM69GsgMAIUopRrA3KHQQoxo7C3yKQBdBD8IGRhFrgCSPvgD9/BXhyi2dBk1BPOLGJdANR0jtpnyQh4NgA5BC/vRgaGjov3eZQ/thTYafClWTFw+jLjCHJbF+BHktpAVgj5DK+WloZGRk6GfWuKuYvFitVp8DgLMUZl82H2roNwtA2Aio7SpMBCdPnqwaQCYwALEbgNdGkOkwAv3mMeDbY2AJEJLVZhHjpDaLNGBrs0hJVZtFBLLFCiAEw/LACOzR63kghGaYB0zBZZMmsOsQFgB/D94FCPOCr/DJ8a5ANDv19pssASGWitC0Fck4xWuclgBiyiUUBBEVTrbtJEpglYiqrS1AsKVl0OVFEir5623Q19CYWt2ARWIt1ILMfo6aJMIOILR4cn9ubu7+ZZiRX39i9C0hiwOoK6tMks8/Q/0mIBorgCpszV27dm1umUkAnAF98i0jS7gRuDOwykIAXL169bNn3BKgSeFJHUBfAQw2AB5zpW0B9QjCtwNQ4dYMjsEyxQiiMUBAbQwMAMbgf9IWoNkvW1tPtp4sMUHc22du3z7zq1ZarOF+daNABJn87dnjx88uEOs8UCyE3bXA2U+IufdQOPnBVzCrJcEttiTKAtDt78GKI+D4AFIKrCipoHnsDhA4lPmtvTI7gDbbBtNCVBWM08hYUaXoABDdjmH5JNF266WTNF22A2hahqOCUq9Hobe/vwt6BI0RL1mpJMswCMz18a4ELtsBoNXTZh0rwTR99AAWtwcjk4y42QDlUUFr98kwNnYA5j6ElfhWTwza+h5X55GhryjzzEY+SFNNa3f60g5AFHMemgiaAe5LQO2sImSKsEz7AE0RsCOCnQBpCWiOAPcXQwZgbgejLoqV8LxIWAKIogEcc63/mADA7Bf/Bt2VsLwl4YCi33cYTLJePPGCQypiByCEup7rOWZDoWdB0RKJRYPghoOa01tqth5WAKWiREKTRNllGjNrMjpZ/bJtBFFZUPWVvWaZ+mBiMbWIWAESBlCrCtuWMSOLkSbZAdjiGmi1AI2xCzdAk0Cgyam+vqn4rgDIhrlPXoMZOWl2vM9nGfXWITl6elJUdwxg9Tt9quiFw8+rz6sXJymtRMeDwa4B4KzCAKpw3xEBevCItv8tAKoRAG5EIIJsxwBWB1yJABjAYROBOWTO0tp2taakBYDQtcE7oFUAzF46Wa1evCQZdd65tbm5+TBNSacA1CKKgkEdLBUCp6mTTqfLLmVsNwBRdmFpYFF2NVq7AKgNYLPZ4Ow8gtZlBSAtCvvNCkBbFA6IBQBWR68luYTa5UHZjx9BxVH+MMg3JvoiK4Xy4xVBLQA0HU8kJlCpRCKRejoPegpmykefb5zZvqAvSKTyFRuASvqZe8VcLlc8nvGH5/84f/To+WNPEwn/HDiLYxMpPzlqvhZ5N+knuAVAZ/yE+ZKoeA8Al6F9IMwPpyYQCl/sZPxktLP8EaJxbAG5ZsBRBOQQUGwEJOwBxbcNwK+5dnTRGDojAO6NbbsIBjl1b6FYLC6YQT6P+uPpcCI+hs7iBABiJoLTmYTFIPt7aDme8o+jEjg55y+D5tGaQN+EmbC9sPldyWfiME1T42195X4g+x7VlXhDog1vJ9qRl85MEuTHk5zq/u42HhqAxx5G07AOeOmW5MEO01tp77GH/d19sGa1XOyo296DG+bRk6mKy1uUW5k62P7DLd2xlb4WtRLrbrP9+uM/77akNz7+83+6n8/KKEnyzQAAAABJRU5ErkJggg==",
  };
  function fIcon(k) {
    return FICON[k] ? '<img class="fi" src="' + FICON[k] + '" alt="" aria-hidden="true">' : "";
  }
  var FORMAT_ORDER = ["reel", "foto", "carrusel", "historia", "diseno"];
  var STATUS = {
    idea: "Idea",
    contenido: "Contenido",
    porproducir: "Por producir",
    produccion: "En producción",
    listo: "Por publicar",
    publicado: "Publicado",
  };
  var PLATFORMS = { ig: "Instagram", tt: "TikTok" };
  var PLAT_ABBR = { ig: "IG", tt: "TT" };

  /* ---------- Helpers ---------- */
  var main = document.getElementById("main");
  var now = new Date();
  function $(s, r) {
    return (r || document).querySelector(s);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function ymd(y, m, d) {
    return y + "-" + pad(m + 1) + "-" + pad(d);
  }
  function todayStr() {
    var d = new Date();
    return ymd(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function dateObj(s) {
    var p = s.split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }
  function dowMon(dt) {
    return (dt.getDay() + 6) % 7;
  }
  function monthKey(y, m) {
    return y + "-" + pad(m + 1);
  }
  function fmtLong(s) {
    var dt = dateObj(s);
    return DOW_LONG[dowMon(dt)] + " " + dt.getDate() + " de " + MONTHS[dt.getMonth()].toLowerCase();
  }
  function whenTxt(p) {
    if (!p.date) return "sin fecha";
    var dt = dateObj(p.date);
    return DOW[dowMon(dt)].toLowerCase() + " " + dt.getDate() + " " + MON3[dt.getMonth()] +
      (p.time ? " · " + p.time : "");
  }
  function platTxt(p) {
    return (p.platforms || []).map(function (k) {
      return PLATFORMS[k];
    }).filter(Boolean).join(" + ");
  }
  function platAbbr(p) {
    return ["ig", "tt"].filter(function (k) {
      return (p.platforms || []).indexOf(k) >= 0;
    }).map(function (k) {
      return PLAT_ABBR[k];
    }).join(", ");
  }
  function plural(n, one, many) {
    return n + " " + (n === 1 ? one : many);
  }
  function relTime(ts) {
    var s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 60) return "justo ahora";
    if (s < 3600) return "hace " + Math.floor(s / 60) + " min";
    if (s < 86400) return "hace " + Math.floor(s / 3600) + " h";
    var d = new Date(ts);
    return "el " + d.getDate() + " " + MON3[d.getMonth()];
  }
  function isShootDefault(f) {
    return f === "reel" || f === "foto";
  }
  function defaultPlats(f) {
    return f === "reel" ? ["ig", "tt"] : ["ig"];
  }
  function newId(pfx) {
    return pfx + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  var EXT_SVG =
    '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 2.5H3a1 1 0 0 0-1 1v5.5a1 1 0 0 0 1 1h5.5a1 1 0 0 0 1-1V7M7 2h3v3M10 2L5.5 6.5"/></svg>';
  function extractLinks(text) {
    var out = [], seen = {};
    (String(text || "").match(/(?:https?:\/\/|www\.)[^\s<>"]+/gi) || []).forEach(function (raw) {
      var u = raw.replace(/[.,;:!?)\]}'"]+$/, "");
      if (/^www\./i.test(u)) u = "https://" + u;
      try {
        var x = new URL(u);
        if (x.protocol !== "http:" && x.protocol !== "https:") return;
        if (seen[x.href]) return;
        seen[x.href] = 1;
        out.push({
          href: x.href,
          label: x.hostname.replace(/^www\./, "") + (x.pathname.length > 1 ? x.pathname : ""),
        });
      } catch (e) {}
    });
    return out;
  }
  /* Carpeta de Drive del post: un solo link. Acepta que lo peguen sin https://. */
  function driveHref(v) {
    v = String(v || "").trim();
    if (!v || /\s/.test(v)) return "";
    if (!/^https?:\/\//i.test(v)) v = "https://" + v;
    try {
      var x = new URL(v);
      return (x.protocol === "http:" || x.protocol === "https:") && /\.[a-z]{2,}$/i.test(x.hostname)
        ? x.href
        : "";
    } catch (e) {
      return "";
    }
  }
  var DRIVE_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.75 4.25a1 1 0 0 1 1-1h3.4l1.5 1.75h5.6a1 1 0 0 1 1 1v6.75a1 1 0 0 1-1 1H2.75a1 1 0 0 1-1-1z"/></svg>';
  function driveLink(p, cls) {
    var h = driveHref(p.drive);
    if (!h) return "";
    return '<a class="drive' + (cls ? " " + cls : "") + '" href="' + esc(h) +
      '" target="_blank" rel="noopener noreferrer" title="Abrir la carpeta de Drive">' + DRIVE_SVG +
      "<span>Drive</span></a>";
  }
  function linksHtml(text, cls) {
    var l = extractLinks(text);
    if (!l.length) return "";
    return '<div class="links' + (cls ? " " + cls : "") + '">' + l.map(function (x) {
      return '<a href="' + esc(x.href) + '" target="_blank" rel="noopener noreferrer">' + EXT_SVG +
        "<span>" + esc(x.label) + "</span></a>";
    }).join("") + "</div>";
  }

  function getShots(p) {
    if (Array.isArray(p.shots)) return p.shots;
    return String(p.shotList || "").split("\n").map(function (x) {
      return x.trim();
    }).filter(Boolean).map(function (t) {
      return { t: t, d: false };
    });
  }
  function shotCount(p) {
    var a = getShots(p);
    return {
      n: a.length,
      d: a.filter(function (x) {
        return x.d;
      }).length,
    };
  }
  function isTaken(p) {
    var c = shotCount(p);
    return c.n ? c.d === c.n : !!p.shotDone;
  }
  function voiceLines(p) {
    return String(p.voice || "").split("\n").map(function (x) {
      return x.trim();
    }).filter(Boolean);
  }
  function copyShots(p) {
    return getShots(p).map(function (x) {
      return { t: x.t, d: !!x.d };
    });
  }
  function setShots(p, arr, delay) {
    p.shots = arr;
    queueSave("posts/" + p.id, { shots: arr }, delay == null ? 600 : delay);
  }
  function toggleTaken(p) {
    var sh = copyShots(p);
    if (sh.length) {
      var all = sh.every(function (x) {
        return x.d;
      });
      setShots(
        p,
        sh.map(function (x) {
          return { t: x.t, d: !all };
        }),
        0,
      );
    } else {
      p.shotDone = !p.shotDone;
      queueSave("posts/" + p.id, { shotDone: p.shotDone }, 0);
    }
  }

  function refImgs(p) {
    return Array.isArray(p.refImgs)
      ? p.refImgs.filter(function (x) {
        return x && x.id;
      })
      : [];
  }
  function hasRefs(p) {
    return refImgs(p).length > 0 || extractLinks(p.refs).length > 0;
  }
  function lines(t) {
    return String(t || "").split("\n").map(function (x) {
      return x.trim();
    }).filter(Boolean);
  }
  function cap(t) {
    t = String(t || "");
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function fmtShort(ds) {
    var d = dateObj(ds);
    return d.getDate() + " " + MON3[d.getMonth()];
  }

  /* ---------- State ---------- */
  function pref(k, opts) {
    try {
      var v = localStorage.getItem(k);
      return opts.indexOf(v) >= 0 ? v : opts[0];
    } catch (e) {
      return opts[0];
    }
  }
  function setPref(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  }
  var S = {
    posts: new Map(),
    goals: new Map(),
    account: {},
    view: "lista",
    postId: null,
    last: "lista",
    detailBuilt: null,
    dtab: "contenido",
    cy: now.getFullYear(),
    cm: now.getMonth(),
    selDay: null,
    f: { plat: "all", fmt: "all", st: "all", q: "" },
    group: "tipo",
    showDone: true,
    showPub: (function () {
      try {
        return localStorage.getItem("pc_pub") !== "0";
      } catch (e) {
        return true;
      }
    })(),
    filtersOpen: false,
    goalsEdit: false,
    pdfBusy: false,
    assets: null,
    refBusy: false,
    needsRender: false,
    // Lista (siempre continua): agrupar por mes o estado, ordenar por fecha o formato, vista simplificada (tarjetas)
    // o detallada (tabla, solo en computadora). Se recuerdan en el navegador.
    lgroup: pref("pc_lgroup", ["mes", "estado"]),
    lsort: pref("pc_lsort", ["fecha", "formato"]),
    lview: pref("pc_lview", ["simple", "detalle"]),
    pubOpen: false,
    mdel: "",
    mcol: (function () {
      try {
        return JSON.parse(localStorage.getItem("pc_mcol") || "{}") || {};
      } catch (e) {
        return {};
      }
    })(),
    noClick: false,
    loaded: { posts: false, goals: false },
    slow: false,
    booted: false,
    canWrite: true,
    uid: null,
    names: {},
    roToast: false,
  };
  var db = null, userCap = null;

  function allPosts() {
    return Array.from(S.posts.values());
  }
  function cmp(a, b) {
    return (a.date || "9999").localeCompare(b.date || "9999") ||
      (a.time || "99:99").localeCompare(b.time || "99:99") ||
      (a.createdAt || 0) - (b.createdAt || 0);
  }
  function inMonth(p, y, m) {
    return !!p.date && p.date.indexOf(monthKey(y, m) + "-") === 0;
  }
  function passes(p, anyPub) {
    var f = S.f;
    if (f.plat !== "all" && (p.platforms || []).indexOf(f.plat) < 0) return false;
    if (f.fmt !== "all" && p.format !== f.fmt) return false;
    if (f.st !== "all" && p.status !== f.st) return false;
    if (!anyPub && !S.showPub && p.status === "publicado") return false;
    if (f.q) {
      var hay = ((p.title || "") + " " + (p.copy || "") + " " + (p.hashtags || "") + " " +
        (p.direction || "")).toLowerCase();
      if (hay.indexOf(f.q.toLowerCase()) < 0) return false;
    }
    return true;
  }
  function stats(y, m) {
    var o = { total: 0, pub: 0, by: {}, stories: 0 };
    allPosts().forEach(function (p) {
      if (!inMonth(p, y, m)) return;
      if (p.format === "historia") {
        o.stories++;
        return;
      }
      o.total++;
      if (p.status === "publicado") o.pub++;
      o.by[p.format] = (o.by[p.format] || 0) + 1;
    });
    return o;
  }

  /* ---------- Toast ---------- */
  var toastT = null;
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(function () {
      t.classList.remove("on");
    }, 2600);
  }

  /* ---------- Writes ---------- */
  var pending = {}, chain = {}, saving = {};
  function canW() {
    if (S.canWrite) return true;
    toast("Solo lectura: pide a un administrador acceso de editor.");
    return false;
  }
  /** Un post en «Idea» que recibe fecha pasa solo a «Contenido» (los más avanzados no se tocan). */
  function conFechaContenido(path, patch) {
    if (path.indexOf("posts/") !== 0 || !patch.date || patch.status) return patch;
    var p = S.posts.get(path.slice(6));
    if (!p || (p.status || "idea") !== "idea") return patch;
    p.status = "contenido";
    toast("Pasó a «Contenido» porque ya tiene fecha.");
    setTimeout(function () {
      if (S.view === "detalle") paintDetail();
      else render();
    }, 0);
    return Object.assign({}, patch, { status: "contenido" });
  }
  function queueSave(path, patch, delay) {
    if (!db || !canW()) return;
    patch = conFechaContenido(path, patch);
    var e = pending[path] || (pending[path] = { patch: {}, timer: null });
    setTimeout(paintSave, 0);
    Object.assign(e.patch, patch);
    clearTimeout(e.timer);
    if (delay === 0) flush(path);
    else {e.timer = setTimeout(function () {
        flush(path);
      }, delay == null ? 500 : delay);}
  }
  function flush(path) {
    var e = pending[path];
    if (!e) return;
    clearTimeout(e.timer);
    delete pending[path];
    var patch = Object.assign({}, e.patch, { updatedAt: Date.now(), updatedBy: S.uid || null });
    saving[path] = (saving[path] || 0) + 1;
    chain[path] = (chain[path] || Promise.resolve()).then(function () {
      var ref = db.doc(path);
      return ref.update(patch).catch(function (err) {
        if (err && err.code === "invalid_argument") {
          if (path.indexOf("posts/") !== 0) {
            return ref.set(
              Object.assign({ createdAt: Date.now(), createdBy: S.uid || null }, patch),
            ).catch(fail);
          }
          toast("No se pudo guardar. Puede que el post haya sido eliminado.");
          return;
        }
        fail(err);
      });
    }).then(function () {
      saving[path]--;
      if (!saving[path]) delete saving[path];
      paintSave();
    });
  }
  function flushAll() {
    Object.keys(pending).forEach(flush);
  }
  function fail(err) {
    toast(
      err && err.code === "quota_exceeded"
        ? "Se alcanzó el límite de almacenamiento."
        : "No se pudo guardar. Revisa tu conexión.",
    );
  }
  function createPost(data) {
    if (!db || !canW()) return Promise.resolve(null);
    var id = newId("p"), fmt = (data && data.format) || "reel", ts = Date.now();
    var doc = Object.assign({
      title: "",
      format: fmt,
      platforms: defaultPlats(fmt),
      date: "",
      time: "",
      status: "idea",
      direction: "",
      copy: "",
      hashtags: "",
      shoot: isShootDefault(fmt),
      shots: [],
      voice: "",
      location: "",
      props: "",
      refs: "",
      drive: "",
      shotDone: false,
      createdAt: ts,
      createdBy: S.uid || null,
      updatedAt: ts,
      updatedBy: S.uid || null,
    }, data || {});
    if (doc.date && doc.status === "idea") doc.status = "contenido";
    S.posts.set(id, Object.assign({ id: id }, doc));
    return db.doc("posts/" + id).set(doc).then(function () {
      return id;
    }).catch(function (e) {
      S.posts.delete(id);
      fail(e);
      return null;
    });
  }
  function deletePost(id) {
    if (!db || !canW()) return;
    S.posts.delete(id);
    db.doc("posts/" + id).delete().catch(fail);
  }

  /* ---------- Routing ---------- */
  var LISTS = ["lista", "calendario", "objetivos", "pauta", "rendimiento"];
  function route() {
    var h = location.hash.replace(/^#/, ""), prev = S.view;
    if (h === "resultados") h = "rendimiento"; // nombre anterior de la pestaña
    // #nuevo (o #nuevo-AAAA-MM-DD): llegar desde la Agenda del inicio para crear un post aquí
    if (h === "nuevo" || /^nuevo-\d{4}-\d{2}-\d{2}$/.test(h)) {
      S.pendingNew = h.slice(6);
      history.replaceState(null, "", "#lista");
      h = "lista";
    }
    if (h.indexOf("post-") === 0) {
      S.view = "detalle";
      if (S.postId !== h.slice(5)) S.dtab = "contenido";
      S.postId = h.slice(5);
    } else if (LISTS.indexOf(h) >= 0) {
      S.view = h;
      S.postId = null;
    } else {
      S.view = "lista";
      S.postId = null;
    }
    if (S.view === "lista" || S.view === "calendario") S.last = S.view;
    if (S.view !== "objetivos") S.goalsEdit = false;
    // Lista «Todos»: al llegar (no al volver de un post) se ubica en el mes actual
    if (S.view === "lista" && prev !== "lista" && prev !== "detalle") S.lmScroll = true;
  }
  function go(h) {
    if (location.hash === "#" + h) {
      route();
      render(true);
    } else location.hash = h;
  }
  window.addEventListener("hashchange", function () {
    flushAll();
    route();
    render(true);
  });
  window.addEventListener("pagehide", flushAll);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) flushAll();
  });

  function setNav() {
    var cur = S.view === "detalle" ? S.last : S.view;
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      if (a.dataset.nav === cur) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  /* ---------- Shared fragments ---------- */
  function shift(n) {
    var m = S.cm + n, y = S.cy;
    while (m < 0) {
      m += 12;
      y--;
    }
    while (m > 11) {
      m -= 12;
      y++;
    }
    S.cm = m;
    S.cy = y;
    S.selDay = null;
  }
  /** Objetivos y Rendimiento por trimestre avanzan de 3 en 3 meses. */
  function isQ() {
    return S.view === "objetivos" || (S.view === "rendimiento" && S.resPer === "q");
  }
  function monthBar() {
    var q = isQ(), qn = Math.floor(S.cm / 3);
    var title = q
      ? ("T" + (qn + 1) + " <span>" + S.cy + "</span>")
      : (MONTHS[S.cm] + " <span>" + S.cy + "</span>");
    var sub = q ? "<small>" + MONTHS[qn * 3] + " – " + MONTHS[qn * 3 + 2] + "</small>" : "";
    return '<div class="monthbar"><div class="mb-nav">' +
      '<button class="icon-btn" type="button" data-act="prev" aria-label="' +
      (q ? "Trimestre anterior" : "Mes anterior") + '">‹</button>' +
      "<h2>" + title + "</h2>" + sub +
      '<button class="icon-btn" type="button" data-act="next" aria-label="' +
      (q ? "Trimestre siguiente" : "Mes siguiente") + '">›</button></div>' +
      '<button class="btn ghost" type="button" data-act="today">' + (q ? "Este trimestre" : "Hoy") +
      "</button></div>";
  }
  /* Iconos de estado progresivos: círculo punteado → ⅛ → ¼ → ½ → ¾ → hecho. */
  var ST_ICON = {
    idea: '<circle cx="8" cy="8" r="6.25" stroke-dasharray="2.4 2.5"/>',
    contenido: '<circle cx="8" cy="8" r="6.25"/><path class="fl" d="M8 8V3.75A4.25 4.25 0 0 1 11.005 4.995z"/>',
    porproducir: '<circle cx="8" cy="8" r="6.25"/><path class="fl" d="M8 8V3.75A4.25 4.25 0 0 1 12.25 8z"/>',
    produccion: '<circle cx="8" cy="8" r="6.25"/><path class="fl" d="M8 3.75a4.25 4.25 0 0 1 0 8.5z"/>',
    listo: '<circle cx="8" cy="8" r="6.25"/><path class="fl" d="M8 8V3.75A4.25 4.25 0 1 1 3.75 8z"/>',
    publicado: '<circle class="fl" cx="8" cy="8" r="7"/><path class="ck" d="M5.2 8.2l1.9 1.9 3.7-4"/>',
    bad: '<circle class="fl" cx="8" cy="8" r="7"/><path class="ck" d="M5.75 5.75l4.5 4.5M10.25 5.75l-4.5 4.5"/>',
  };
  function stIcon(k) {
    return '<svg class="sti" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ST_ICON[k] || ST_ICON.idea) + "</svg>";
  }
  function stPill(s) {
    return '<span class="st st-' + esc(s || "idea") + '">' + stIcon(s) + esc(STATUS[s] || "Idea") +
      "</span>";
  }
  function notices() {
    var h = "";
    if (!S.canWrite && !(window.PLANIFICA && window.PLANIFICA.preview)) {
      h +=
        '<div class="note"><span>Solo lectura. Pide a un administrador acceso de editor para hacer cambios.</span></div>';
    }
    var ex = allPosts().filter(function (p) {
      return p.example;
    });
    if (ex.length) {
      h += '<div class="note"><span>Hay ' +
        plural(ex.length, "post de ejemplo", "posts de ejemplo") +
        ' en el calendario.</span><button class="btn sm" type="button" data-act="rmexamples">Borrar ejemplos</button></div>';
    }
    return h;
  }
  var FILTER_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3.5h12l-4.6 5.4v3.6L6.6 14V8.9z"/></svg>';
  var EYE_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/></svg>';
  var EYEOFF_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/><path d="M2.5 13.5l11-11"/></svg>';
  function liDone(t, g) {
    return "<li" + (((g && g.objDone) || []).indexOf(t) >= 0 ? ' class="od"' : "") + ">" + esc(t) +
      "</li>";
  }
  function brief(y, m) {
    if (y == null) {
      y = S.cy;
      m = S.cm;
    }
    var qn = Math.floor(m / 3) + 1;
    var g = S.goals.get("m-" + monthKey(y, m)) || {}, qg = S.goals.get("q-" + y + "-" + qn) || {};
    var st = stats(y, m), objs = lines(g.objectives), tgt = Number(g.postTarget) || 0;
    var def = '<p class="hg-empty">Sin definir. <a class="lnk" href="#objetivos">Definir</a></p>';
    var h = '<section class="hd" aria-label="Resumen de ' + MONTHS[m].toLowerCase() + '">';
    h += '<div class="hg"><span class="k">Tema del mes</span>' +
      (g.theme ? '<p class="hg-main">' + esc(g.theme) + "</p>" : def) +
      (qg.theme ? '<p class="hg-sub">T' + qn + " · " + esc(qg.theme) + "</p>" : "") + "</div>";
    h += '<div class="hg"><span class="k">Objetivos</span>';
    if (objs.length) {
      h += '<ul class="objl">' + objs.slice(0, 3).map(function (t) {
        return liDone(t, g);
      }).join("") + "</ul>";
      if (objs.length > 3) {
        h += '<details class="more"><summary>+' + (objs.length - 3) +
          ' más</summary><ul class="objl">' + objs.slice(3).map(function (t) {
            return liDone(t, g);
          }).join("") + "</ul></details>";
      }
    } else h += def;
    h += "</div>";
    var pct = tgt
      ? Math.min(100, Math.round(st.total / tgt * 100))
      : (st.total ? Math.round(st.pub / st.total * 100) : 0);
    var mix = FORMAT_ORDER.filter(function (f) {
      return st.by[f];
    }).map(function (f) {
      return '<span class="tag f-' + f + '">' + fIcon(f) + st.by[f] + " " +
        (st.by[f] === 1 ? FORMATS[f].label : FORMATS[f].plural).toLowerCase() + "</span>";
    }).join("");
    if (st.stories) {
      mix += '<span class="tag f-historia">' + fIcon("historia") +
        plural(st.stories, "historia", "historias") + "</span>";
    }
    var smix = "";
    h += '<div class="hg"><span class="k">Posts</span><p class="hg-main"><b class="big">' +
      st.total + "</b> " +
      (tgt ? "de " + tgt + " planificados" : (st.total === 1 ? "planificado" : "planificados")) +
      "</p>" +
      '<div class="bar" aria-hidden="true"><i style="width:' + pct +
      '%;background:var(--accent)"></i></div>' +
      '<p class="hg-sub">' + plural(st.pub, "publicado", "publicados") + " · " +
      plural(st.total - st.pub, "pendiente", "pendientes") + "</p>" +
      (mix ? '<div class="mix">' + mix + "</div>" : "") + smix + "</div></section>";
    return h;
  }
  function activeFilters() {
    var f = S.f;
    return (f.plat !== "all" ? 1 : 0) + (f.fmt !== "all" ? 1 : 0) + (f.st !== "all" ? 1 : 0) +
      (f.q ? 1 : 0);
  }
  function filters(legend, isList) {
    var f = S.f, n = activeFilters();
    var h =
      '<div class="toolbar"><button class="btn filter-btn" type="button" data-act="togfilters" aria-expanded="' +
      S.filtersOpen + '" aria-controls="fpanel">' + FILTER_SVG + "<span>Filtros</span>" +
      (n
        ? '<span class="badge" aria-label="' + plural(n, "filtro activo", "filtros activos") +
          '">' + n + "</span>"
        : "") +
      "</button>";
    if (n) {
      h += '<button class="btn ghost sm" type="button" data-act="clearfilters">Limpiar</button>';
    }
    if (!isList) {
      h += '<button class="tog eye" type="button" data-act="togpub" aria-pressed="' + S.showPub +
        '" title="Mostrar u ocultar los posts publicados">' + (S.showPub ? EYE_SVG : EYEOFF_SVG) +
        "<span>Publicados</span></button>";
    }
    if (isList) {
      var seg = function (lbl, act, cur, opts, cls) {
        return '<div class="lctl' + (cls ? " " + cls : "") + '"><span class="lctl-l">' + lbl + '</span><div class="seg" role="group" aria-label="' + lbl + '">' +
          opts.map(function (x) {
            return '<button type="button" data-act="' + act + '" data-v="' + x[0] + '" aria-pressed="' + (cur === x[0]) + '">' + x[1] + "</button>";
          }).join("") + "</div></div>";
      };
      h += seg("Agrupar", "lgroup", S.lgroup, [["mes", "Mes"], ["estado", "Estado"]]) +
        seg("Ordenar", "lsort", S.lsort, [["fecha", "Fecha"], ["formato", "Formato"]]) +
        seg("Vista", "lview", S.lview, [["simple", "Simplificada"], ["detalle", "Detallada"]], "lview");
    }
    if (legend) {
      h += '<div class="legend">' + Object.keys(STATUS).map(function (k) {
        return stPill(k);
      }).join("") + "</div>";
    }
    h += "</div>";
    if (S.filtersOpen) {
      h += '<div class="fpanel" id="fpanel">' +
        '<div class="fld"><label for="fq-plat">Plataforma</label><select id="fq-plat" class="in" data-fsel="plat">' +
        [["all", "Todas"], ["ig", "Instagram"], ["tt", "TikTok"]].map(function (x) {
          return '<option value="' + x[0] + '"' + (f.plat === x[0] ? " selected" : "") + ">" + x[1] + "</option>";
        }).join("") + "</select></div>" +
        '<div class="fld"><label for="fq-fmt">Formato</label><select id="fq-fmt" class="in" data-fsel="fmt"><option value="all">Todos</option>' +
        FORMAT_ORDER.map(function (k) {
          return '<option value="' + k + '"' + (f.fmt === k ? " selected" : "") + ">" +
            FORMATS[k].label + "</option>";
        }).join("") + "</select></div>" +
        '<div class="fld"><label for="fq-st">Estado</label><select id="fq-st" class="in" data-fsel="st"><option value="all">Todos</option>' +
        Object.keys(STATUS).map(function (k) {
          return '<option value="' + k + '"' + (f.st === k ? " selected" : "") + ">" + STATUS[k] +
            "</option>";
        }).join("") + "</select></div>" +
        '<div class="fld"><label for="fq">Buscar</label><input id="fq" class="in" type="search" placeholder="Título, copy o hashtags" value="' +
        esc(f.q) + '" autocomplete="off"></div></div>';
    }
    return h;
  }
  function loadingBlock() {
    if (db === null && S.booted) {
      return '<div class="empty"><h3>No se pudo conectar con el servidor</h3><p>Revisa tu conexión y vuelve a cargar la página.</p></div>';
    }
    return '<div class="empty"><p>' +
      (S.slow
        ? "Conectando con los datos compartidos… está tardando más de lo normal."
        : "Cargando el plan…") +
      "</p></div>";
  }
  function emptyAll() {
    return '<div class="empty"><h3>Aún no hay posts planificados</h3><p>Crea el primero o carga unos ejemplos para ver cómo funciona la lista, el calendario y la pauta.</p><div class="acts"><button class="btn primary" type="button" data-act="new">+ Nuevo post</button><button class="btn" type="button" data-act="examples">Cargar ejemplos</button></div></div>';
  }
  var CHEV_SVG =
    '<svg class="chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg>';
  /* Estado editable: un botón con la píldora que abre un menú con todas las píldoras (stMenu). */
  function stSelect(p) {
    var cur = STATUS[p.status] ? p.status : "idea";
    if (!S.canWrite) return stPill(cur);
    return '<button class="st stsel st-' + cur + '" type="button" data-act="stmenu" data-id="' +
      esc(p.id) + '" aria-haspopup="menu" aria-expanded="false" aria-label="Estado: ' +
      esc(STATUS[cur]) + '. Cambiar estado de ' + esc(p.title || "Sin título") + '">' +
      stIcon(cur) + "<span>" + esc(STATUS[cur]) + "</span>" + CHEV_SVG + "</button>";
  }
  var stMenuEl = null, stMenuBtn = null;
  function closeStMenu(focusBack) {
    if (!stMenuEl) return;
    stMenuEl.remove();
    stMenuEl = null;
    if (stMenuBtn) {
      stMenuBtn.setAttribute("aria-expanded", "false");
      if (focusBack && document.contains(stMenuBtn)) stMenuBtn.focus();
    }
    stMenuBtn = null;
  }
  function openStMenu(btn) {
    var p = S.posts.get(btn.dataset.id);
    if (!p) return;
    var cur = STATUS[p.status] ? p.status : "idea";
    openMenu(btn, Object.keys(STATUS).map(function (k) {
      return '<button class="st st-' + k + '" type="button" role="menuitemradio" aria-checked="' +
        (k === cur) + '" data-act="stpick" data-id="' + esc(p.id) + '" data-v="' + k + '">' +
        stIcon(k) + "<span>" + STATUS[k] + "</span></button>";
    }).join(""));
  }
  /** Menú desplegable bajo un botón (estado, formato, «⋯»): mismas teclas y cierre que el de estados. */
  function openMenu(btn, html, cls, alignRight) {
    closeStMenu();
    var m = document.createElement("div");
    m.className = "stmenu" + (cls ? " " + cls : "");
    m.setAttribute("role", "menu");
    m.innerHTML = html;
    document.body.appendChild(m);
    var r = btn.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight;
    var left = Math.min(Math.max(8, alignRight ? r.right - mw : r.left), window.innerWidth - mw - 8);
    var top = r.bottom + 6;
    if (top + mh > window.innerHeight - 8 && r.top - mh - 6 > 8) top = r.top - mh - 6;
    m.style.left = left + "px";
    m.style.top = top + "px";
    stMenuEl = m;
    stMenuBtn = btn;
    btn.setAttribute("aria-expanded", "true");
    var sel = m.querySelector('[aria-checked="true"]') || m.firstChild;
    sel.focus();
  }
  var MORE_SVG = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="3.5" cy="8" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="12.5" cy="8" r="1.4"/></svg>';
  function fmtSelect(p) {
    var f = FORMATS[p.format] ? p.format : "reel";
    if (!S.canWrite) return '<span class="tog fmtbtn fmtsel f-' + f + '" aria-pressed="true">' + fIcon(f) + FORMATS[f].label + "</span>";
    return '<button class="tog fmtbtn fmtsel f-' + f + '" type="button" aria-pressed="true" data-act="fmtmenu" aria-haspopup="menu" aria-expanded="false" aria-label="Formato: ' +
      esc(FORMATS[f].label) + '. Cambiar formato">' + fIcon(f) + "<span>" + FORMATS[f].label + "</span>" + CHEV_SVG + "</button>";
  }
  /* ---------- Colaboración: un post compartido con otros clientes (uno solo, en la parrilla de cada uno) ---------- */
  function soyDueno(p) {
    return !p.colab || p.colab.dueno === window.PLANIFICA.cliente;
  }
  function colabOtros(p) {
    return p.colab ? p.colab.cuentas.filter(function (c) {
      return c.slug !== window.PLANIFICA.cliente;
    }) : [];
  }
  function colabTag(p, short) {
    if (!p.colab) return "";
    var names = colabOtros(p).map(function (c) {
      return c.nombre;
    });
    return '<span class="tag colab" title="En colaboración con ' + esc(names.join(", ")) + '">🤝' +
      (short ? "" : " " + esc(names.length === 1 ? names[0] : plural(names.length, "cuenta", "cuentas"))) + "</span>";
  }
  function paintColab(p) {
    var w = $("#colabWrap");
    if (!w) return;
    var otros = colabOtros(p), sig = JSON.stringify(p.colab || null) + S.canWrite;
    if (w.dataset.sig === sig) return;
    w.dataset.sig = sig;
    var txt = otros.length
      ? "🤝 " + otros.map(function (c) {
        return esc(c.nombre);
      }).join(", ")
      : "Solo esta cuenta";
    var dueno = p.colab && !soyDueno(p)
      ? '<span class="colab-own">Se publica desde ' + esc((p.colab.cuentas[0] || {}).nombre || "otra cuenta") + "</span>"
      : "";
    w.innerHTML = (S.canWrite
      ? '<button class="tog colabsel' + (otros.length ? " on" : "") + '" type="button" data-act="colabmenu" aria-haspopup="menu" aria-expanded="false">' +
        "<span>" + txt + "</span>" + CHEV_SVG + "</button>"
      : '<span class="tog colabsel">' + txt + "</span>") + dueno;
  }
  function openColabMenu(btn) {
    var p = S.posts.get(S.postId);
    if (!p) return;
    window.PLANIFICA.sesion().then(function (ses) {
      if (S.postId !== p.id) return;
      var dueno = p.colab ? p.colab.dueno : window.PLANIFICA.cliente;
      var dentro = {};
      (p.colab ? p.colab.cuentas : []).forEach(function (c) {
        if (c.slug !== dueno) dentro[c.slug] = c.nombre;
      });
      // Tus clientes editables y los que ya están (aunque no los tengas asignados)
      var opts = [];
      (ses.clientes || []).forEach(function (c) {
        if (c.slug === dueno || !c.activo || (c.rol !== "editor" && !dentro[c.slug])) return;
        opts.push({ slug: c.slug, nombre: c.nombre });
      });
      Object.keys(dentro).forEach(function (sl) {
        if (!opts.some(function (o) {
          return o.slug === sl;
        })) opts.push({ slug: sl, nombre: dentro[sl] });
      });
      var html = '<p class="mi-h">Compartir este post con…</p>' + (opts.length
        ? opts.map(function (o) {
          return '<button class="mi ck-mi" type="button" role="menuitemcheckbox" aria-checked="' + !!dentro[o.slug] +
            '" data-act="colabpick" data-v="' + esc(o.slug) + '">' + CHECK_SVG + "<span>" + esc(o.nombre) +
            (o.slug === window.PLANIFICA.cliente ? " (esta cuenta)" : "") + "</span></button>";
        }).join("")
        : '<p class="mi-h">No tienes otros clientes para compartir.</p>') +
        '<p class="mi-n">Es un solo post: se ve y se edita igual desde cada cuenta. Se publica desde ' +
        esc(p.colab ? p.colab.cuentas[0].nombre : "esta cuenta") + ".</p>";
      openMenu(btn, html, "acts-menu colab-menu");
    }, function () {
      toast("No se pudo cargar la lista de clientes.");
    });
  }
  function toggleColab(slug) {
    var p = S.posts.get(S.postId);
    if (!p || !canW()) return;
    var dueno = p.colab ? p.colab.dueno : window.PLANIFICA.cliente;
    var lista = (p.colab ? p.colab.cuentas : []).map(function (c) {
      return c.slug;
    }).filter(function (sl) {
      return sl !== dueno;
    });
    var i = lista.indexOf(slug);
    if (i >= 0) lista.splice(i, 1);
    else lista.push(slug);
    closeStMenu(false);
    flushAll();
    window.PLANIFICA.api("/api/publicaciones/" + encodeURIComponent(p.id) + "/colab", {
      method: "PUT",
      body: { clientes: lista },
    }).then(function (r) {
      p.colab = r.colab || undefined;
      if (!p.colab) delete p.colab;
      toast(p.colab ? "Colaboración actualizada" : "Ya no se comparte");
      if (slug === window.PLANIFICA.cliente && i >= 0) {
        go(S.last || "lista");
      } else paintDetail();
      return window.PLANIFICA.refrescar();
    }, function (e) {
      toast(e.message || "No se pudo actualizar la colaboración.");
    });
  }
  function setFormat(p, v) {
    if (!p || !FORMATS[v] || p.format === v || !canW()) return;
    var patch = { format: v };
    if (isShootDefault(v) && !p.shoot) patch.shoot = true;
    Object.assign(p, patch);
    queueSave("posts/" + p.id, patch, 0);
    if (S.view === "detalle") paintDetail();
    else render();
  }
  /** Duplicar: la copia queda en Idea, sin fecha ni link, con el contenido y la producción del original. */
  function duplicatePost(p) {
    if (!p || !canW()) return;
    var skip = { id: 1, createdAt: 1, createdBy: 1, updatedAt: 1, updatedBy: 1, igLink: 1, refImgs: 1, date: 1, time: 1, status: 1, colab: 1, grabarEn: 1 };
    var data = {};
    Object.keys(p).forEach(function (k) {
      if (!skip[k]) data[k] = p[k];
    });
    data.title = (p.title || "Sin título") + " (copia)";
    data.shots = copyShots(p).map(function (sh) {
      return { t: sh.t, d: false };
    });
    data.shotDone = false;
    flushAll();
    createPost(data).then(function (id) {
      if (!id) return;
      toast("Post duplicado");
      go("post-" + id);
    });
  }
  function pickStatus(id, v) {
    var sp = S.posts.get(id);
    closeStMenu(false);
    if (!sp || !canW() || !STATUS[v] || sp.status === v) return;
    sp.status = v;
    queueSave("posts/" + sp.id, { status: v }, 0);
    if (S.view === "detalle") paintDetail();
    else render();
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && S.impOpen) {
      closeImp();
      return;
    }
    if (e.key === "Escape" && S.trOpen) {
      closeTraer();
      return;
    }
    if (e.key === "Escape" && S.moOpen) {
      closeMonthObj();
      return;
    }
    if (e.key === "Escape" && S.npOpen) {
      closeNewPost();
      return;
    }
    if (e.key === "Enter" && S.npOpen && e.target && e.target.id === "np-title") {
      e.preventDefault();
      saveNewPost();
      return;
    }
    if (!stMenuEl) return;
    var items = Array.prototype.slice.call(stMenuEl.querySelectorAll("button")),
      i = items.indexOf(document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      closeStMenu(true);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      var n = items.length;
      items[((i < 0 ? 0 : i) + (e.key === "ArrowDown" ? 1 : n - 1)) % n].focus();
    } else if (e.key === "Tab") closeStMenu(false);
  });
  document.addEventListener("pointerdown", function (e) {
    if (stMenuEl && !stMenuEl.contains(e.target) && !(stMenuBtn && stMenuBtn.contains(e.target))) {
      closeStMenu(false);
    }
  }, true);
  var lastMovil = esMovil();
  window.addEventListener("resize", function () {
    closeStMenu(false);
    var mv = esMovil();
    if (mv !== lastMovil) {
      lastMovil = mv;
      if (S.view === "lista") render();
    }
  });
  window.addEventListener("scroll", function () {
    closeStMenu(false);
  }, true);
  function row(p, drag) {
    var f = FORMATS[p.format] || FORMATS.reel,
      d = p.date ? dateObj(p.date) : null,
      pl = platAbbr(p);
    return '<div class="row f-' + esc(p.format) + (p.status === "publicado" ? " pub" : "") + '"' +
      (drag ? ' data-drag="' + esc(p.id) + '"' : "") + ">" +
      '<div class="rd">' +
      (d
        ? "<b>" + d.getDate() + "</b><span>" + DOW[dowMon(d)] + "</span>" +
          (p.time ? '<span class="rt">' + esc(p.time) + "</span>" : "")
        : "<b>–</b><span>idea</span>") +
      "</div>" +
      '<div><div class="t"><a class="rlink" href="#post-' + esc(p.id) + '" draggable="false">' +
      (p.title ? esc(p.title) : "<em>Sin título</em>") + "</a></div>" +
      '<div class="meta"><span class="tag">' + fIcon(p.format) + f.label + "</span>" +
      (pl ? '<span class="pl">' + pl + "</span>" : "") + colabTag(p) + driveLink(p) + igSummary(p) + boostBadge(p) + "</div></div>" +
      stSelect(p) + "</div>";
  }

  /* ---------- Views ---------- */
  /* ---------- Lista: siempre continua (todos los meses) ----------
     Agrupar por mes (con su cabecera: tema, posts, Objetivos y + Post) o por estado; ordenar por fecha o formato (lo
     mismo para todos los grupos). Lo publicado va recogido; las ideas sin fecha, al final. Dos formas: simplificada
     (tarjetas) y detallada (tabla editable; solo en computadora). */
  var MOBILE_Q = "(max-width: 860px)";
  function esMovil() {
    return !!(window.matchMedia && window.matchMedia(MOBILE_Q).matches);
  }
  function lsorter(a, b) {
    if (S.lsort === "formato") {
      var fa = FORMAT_ORDER.indexOf(a.format), fb = FORMAT_ORDER.indexOf(b.format);
      if (fa !== fb) return (fa < 0 ? 99 : fa) - (fb < 0 ? 99 : fb);
    }
    return cmp(a, b);
  }
  function itemsHtml(list, detalle) {
    if (!detalle) {
      return '<div class="rows">' + list.map(function (p) {
        return row(p);
      }).join("") + "</div>";
    }
    return '<div class="ltable-wrap"><table class="ltable"><thead><tr><th>Fecha</th><th>Título</th><th>Formato</th><th>Redes</th>' +
      '<th title="Incluir en la pauta">Pauta</th><th>Drive</th><th>Estado</th></tr></thead><tbody>' +
      list.map(trow).join("") + "</tbody></table></div>";
  }
  /** Una fila de la tabla: todo se edita ahí mismo (título, fecha y hora, formato, redes, pauta y estado). */
  function trow(p) {
    var w = S.canWrite, id = esc(p.id), f = FORMATS[p.format] ? p.format : "reel";
    var title = w
      ? '<input class="tin" id="t-title-' + id + '" data-tf="title" data-id="' + id + '" value="' + esc(p.title || "") +
        '" placeholder="Sin título" autocomplete="off" aria-label="Título">'
      : "<span>" + (p.title ? esc(p.title) : "<em>Sin título</em>") + "</span>";
    var dt = w
      ? '<div class="dtf tdt"><input type="hidden" id="t-date-' + id + '" data-tf="date" data-id="' + id + '" value="' + esc(p.date || "") + '">' +
        '<input type="hidden" id="t-time-' + id + '" data-tf="time" data-id="' + id + '" value="' + esc(p.time || "") + '">' +
        '<button type="button" class="dtbtn" data-act="dtopen" data-kind="date" data-for="t-date-' + id + '" aria-haspopup="dialog"><span></span></button>' +
        '<button type="button" class="dtbtn" data-act="dtopen" data-kind="time" data-for="t-time-' + id + '" aria-haspopup="dialog"><span></span></button></div>'
      : esc(p.date ? cap(fmtLong(p.date)) : "Sin fecha") + (p.time ? " · " + esc(p.time) : "");
    var fmt = w
      ? '<button class="tog fmtbtn fmtsel f-' + f + '" type="button" aria-pressed="true" data-act="tfmtmenu" data-id="' + id +
        '" aria-haspopup="menu" aria-expanded="false">' + fIcon(f) + "<span>" + FORMATS[f].label + "</span>" + CHEV_SVG + "</button>"
      : '<span class="tag">' + fIcon(f) + FORMATS[f].label + "</span>";
    var plats = Object.keys(PLATFORMS).map(function (k) {
      var on = (p.platforms || []).indexOf(k) >= 0;
      return w
        ? '<button type="button" class="tog tpl" data-act="tplat" data-id="' + id + '" data-v="' + k + '" aria-pressed="' + on + '" title="' +
          PLATFORMS[k] + '">' + PLAT_ABBR[k] + "</button>"
        : on ? '<span class="pl">' + PLAT_ABBR[k] + "</span>" : "";
    }).join("");
    var shoot = '<button class="ck" type="button" role="checkbox" aria-checked="' + !!p.shoot + '" data-act="tshoot" data-id="' + id +
      '" aria-label="En la pauta"' + (w ? "" : " disabled") + ">" + CHECK_SVG + "</button>";
    var dh = driveHref(p.drive);
    return '<tr class="f-' + esc(p.format) + (p.status === "publicado" ? " pub" : "") + '">' +
      '<td class="tc-dt">' + dt + "</td>" +
      '<td class="tc-t"><div class="tc-tw">' + title + '<a class="topen" href="#post-' + id + '" title="Abrir el post" aria-label="Abrir el post">↗</a>' +
      colabTag(p, true) + "</div></td>" +
      '<td class="tc-f">' + fmt + "</td>" +
      '<td class="tc-p"><div class="tc-pw">' + plats + "</div></td>" +
      '<td class="tc-s">' + shoot + "</td>" +
      '<td class="tc-d">' + (dh ? '<a class="tdrive" href="' + esc(dh) + '" target="_blank" rel="noopener noreferrer" title="Abrir la carpeta de Drive">' +
        DRIVE_SVG + "</a>" : '<span class="mut">–</span>') + "</td>" +
      '<td class="tc-st">' + stSelect(p) + "</td></tr>";
  }
  function monthHead(ym) {
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1;
    var g = S.goals.get("m-" + ym) || {}, st = stats(y, m), tgt = Number(g.postTarget) || 0;
    var cur = ym === todayStr().slice(0, 7);
    var first = cur ? "" : ym + "-01";
    return '<div class="lm-head"><h2>' + MONTHS[m] + " <span>" + y + "</span>" + (cur ? ' <em class="lm-now">este mes</em>' : "") + "</h2>" +
      '<p class="lm-sub">' + (g.theme ? "<b>" + esc(g.theme) + "</b> · " : "") + "Posts " + st.total +
      (tgt ? " de " + tgt : "") + "</p>" +
      '<span class="lm-acts"><button class="btn ghost sm" type="button" data-act="monthobj" data-v="' + ym + '">Objetivos</button>' +
      (S.canWrite ? '<button class="btn ghost sm" type="button" data-act="add" data-date="' + first + '">+ Post</button>' : "") +
      "</span></div>";
  }
  function viewLista() {
    var h = notices() + filters(false, true);
    if (!S.loaded.posts && !S.posts.size) {
      main.innerHTML = h + loadingBlock();
      return;
    }
    if (!S.posts.size) {
      main.innerHTML = h + emptyAll();
      return;
    }
    var detalle = S.lview === "detalle" && !esMovil();
    var vis = allPosts().filter(function (p) {
      return passes(p, true);
    }).sort(lsorter);
    var pub = vis.filter(function (p) {
      return p.status === "publicado";
    });
    var open = vis.filter(function (p) {
      return p.status !== "publicado";
    });
    var nowYm = todayStr().slice(0, 7);
    function pubBlock() {
      if (!pub.length) return "";
      var b = '<section class="lm-pub"><button class="lm-pubtg" type="button" data-act="pubtoggle" aria-expanded="' + S.pubOpen + '">' +
        CHEV_SVG + "<span>" + stIcon("publicado") + plural(pub.length, "publicado", "publicados") + "</span></button>";
      if (S.pubOpen) {
        if (S.lgroup === "mes") {
          var pm = {};
          pub.forEach(function (p) {
            var k = p.date ? p.date.slice(0, 7) : "";
            (pm[k] = pm[k] || []).push(p);
          });
          Object.keys(pm).sort().reverse().forEach(function (k) {
            b += '<div class="lm-pubm"><h3 class="day-h">' + (k ? MONTHS[+k.slice(5, 7) - 1] + " " + k.slice(0, 4) : "Sin fecha") +
              " <span>· " + pm[k].length + "</span></h3>" + itemsHtml(pm[k], detalle) + "</div>";
          });
        } else b += '<div class="lm-pubm">' + itemsHtml(pub, detalle) + "</div>";
      }
      return b + "</section>";
    }
    if (S.lgroup === "estado") {
      Object.keys(STATUS).forEach(function (k) {
        if (k === "publicado") return;
        var g = open.filter(function (p) {
          return (STATUS[p.status] ? p.status : "idea") === k;
        });
        if (!g.length) return;
        h += '<section class="lm"><div class="lm-head"><h2 class="lm-st">' + stPill(k) + "</h2>" +
          '<p class="lm-sub">' + plural(g.length, "post", "posts") + "</p></div>" + itemsHtml(g, detalle) + "</section>";
      });
      h += pubBlock();
    } else {
      h += pubBlock();
      var months = {};
      open.forEach(function (p) {
        if (p.date) (months[p.date.slice(0, 7)] = months[p.date.slice(0, 7)] || []).push(p);
      });
      // El mes actual y el siguiente siempre aparecen (para crear posts ahí)
      var nx = new Date(+nowYm.slice(0, 4), +nowYm.slice(5, 7), 1);
      months[nowYm] = months[nowYm] || [];
      months[monthKey(nx.getFullYear(), nx.getMonth())] = months[monthKey(nx.getFullYear(), nx.getMonth())] || [];
      Object.keys(months).sort().forEach(function (ym) {
        var it = months[ym];
        h += '<section class="lm" id="lm-' + ym + '">' + monthHead(ym) +
          (it.length ? itemsHtml(it, detalle) : '<p class="lm-empty">Nada pendiente este mes' + (activeFilters() ? " con estos filtros" : "") + ".</p>") +
          "</section>";
      });
      var undated = open.filter(function (p) {
        return !p.date;
      });
      if (undated.length) {
        h += '<section class="lm"><div class="lm-head"><h2>Sin fecha</h2><p class="lm-sub">Banco de ideas · ' + undated.length +
          "</p></div>" + itemsHtml(undated, detalle) + "</section>";
      }
    }
    main.innerHTML = h;
    if (detalle) paintDT();
    if (S.lmScroll) {
      S.lmScroll = false;
      var sec = S.lgroup === "mes" && document.getElementById("lm-" + nowYm);
      if (sec) {
        var top = sec.getBoundingClientRect().top + window.scrollY - 12;
        setTimeout(function () {
          window.scrollTo(0, top);
        }, 0);
      }
    }
  }
  /* «Objetivos» de un mes: su resumen (tema, objetivos y posts) en una ventana, con un enlace para editarlos. */
  function closeMonthObj() {
    var o = document.getElementById("moOv");
    if (o) o.remove();
    S.moOpen = null;
  }
  function openMonthObj(ym) {
    closeMonthObj();
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1;
    S.moOpen = ym;
    var ov = document.createElement("div");
    ov.id = "moOv";
    ov.className = "sheet-ov";
    ov.innerHTML = '<div class="sheet mo" role="dialog" aria-modal="true" aria-labelledby="moT"><h2 id="moT">' + MONTHS[m] + " " + y + "</h2>" +
      brief(y, m) + '<div class="acts"><span class="grow"></span><button class="btn" type="button" data-act="moclose">Cerrar</button>' +
      '<button class="btn primary" type="button" data-act="moedit" data-v="' + ym + '">Editar objetivos</button></div></div>';
    ov.addEventListener("mousedown", function (e) {
      if (e.target === ov) closeMonthObj();
    });
    document.body.appendChild(ov);
    var b = ov.querySelector('[data-act="moedit"]');
    if (b) b.focus();
  }
  function chip(p) {
    var pub = p.status === "publicado",
      st = STATUS[p.status] ? p.status : "idea",
      f = FORMATS[p.format] || FORMATS.reel,
      pl = platAbbr(p);
    return '<a class="chip s-' + st + (pub ? " pub" : "") + '" href="#post-' +
      esc(p.id) + '" data-drag="' + esc(p.id) + '" draggable="false" title="' +
      esc(p.title || "Sin título") + '">' +
      '<span class="ct">' + (esc(p.title) || "Sin título") + "</span>" +
      '<span class="cm">' + (p.time ? "<em>" + esc(p.time) + "</em>" : "") + "<i>" +
      fIcon(p.format) + f.label + "</i>" + (pl ? "<b>" + pl + "</b>" : "") + colabTag(p, true) + boostBadge(p, true) + "</span>" +
      '<span class="cs cs-' + st + '">' + stIcon(st) + esc(STATUS[st]) + "</span></a>";
  }
  function viewCal() {
    var y = S.cy,
      m = S.cm,
      first = new Date(y, m, 1),
      lead = dowMon(first),
      dim = new Date(y, m + 1, 0).getDate();
    var total = Math.ceil((lead + dim) / 7) * 7, by = {}, today = todayStr();
    allPosts().filter(passes).forEach(function (p) {
      if (p.date) (by[p.date] = by[p.date] || []).push(p);
    });
    Object.keys(by).forEach(function (k) {
      by[k].sort(cmp);
    });
    if (!S.selDay || S.selDay.indexOf(monthKey(y, m)) !== 0) {
      S.selDay = today.indexOf(monthKey(y, m)) === 0 ? today : ymd(y, m, 1);
    }
    var cells = DOW.map(function (d) {
      return '<div class="dow">' + d + "</div>";
    }).join("");
    for (var i = 0; i < total; i++) {
      var dt = new Date(y, m, i - lead + 1),
        ds = ymd(dt.getFullYear(), dt.getMonth(), dt.getDate()),
        list = by[ds] || [];
      cells += '<div class="day' + (dt.getMonth() !== m ? " out" : "") +
        (ds === today ? " today" : "") + (ds === S.selDay ? " sel" : "") + '" data-date="' + ds +
        '" data-act="selday">' +
        '<div class="day-top"><span class="dn">' + dt.getDate() +
        '</span><button class="add" type="button" data-act="add" data-date="' + ds +
        '" aria-label="Nuevo post el ' + dt.getDate() + " de " +
        MONTHS[dt.getMonth()].toLowerCase() + '">+</button></div>' +
        '<div class="chips">' + list.map(chip).join("") + "</div></div>";
    }
    var sel = by[S.selDay] || [];
    var h = notices() + monthBar() + brief() + filters(true);
    if (!S.loaded.posts && !S.posts.size) h += loadingBlock();
    else {
      h += '<div class="cal">' + cells + "</div>";
      h += '<section class="agenda"><h3 class="day-h">' + cap(fmtLong(S.selDay)) + "</h3>" +
        (S.canWrite && sel.length
          ? '<p class="tip">Mantén presionada una tarjeta y arrástrala a otro día para cambiar su fecha.</p>'
          : "") +
        '<div class="rows">' + (sel.length
          ? sel.map(function (p) {
            return row(p, true);
          }).join("")
          : '<p class="muted">Nada planificado este día.</p>') +
        "</div>" +
        '<button class="btn" type="button" data-act="add" data-date="' + S.selDay +
        '">+ Nuevo post este día</button></section>';
      if (!S.posts.size) h += '<div style="margin-top:16px">' + emptyAll() + "</div>";
    }
    main.innerHTML = h;
  }
  function goalField(id, field, label, kind, ph, val) {
    var fid = "g-" + id + "-" + field, ctl;
    if (kind === "area") {
      ctl = '<textarea class="in" id="' + fid + '" data-g="' + id + '" data-gf="' + field +
        '" rows="4" placeholder="' + esc(ph) + '">' + esc(val || "") + "</textarea>";
    } else {ctl = '<input class="in" id="' + fid + '" data-g="' + id + '" data-gf="' + field +
        '" type="' + (kind === "num" ? "number" : "text") + '"' +
        (kind === "num" ? ' min="0" inputmode="numeric"' : "") + ' placeholder="' + esc(ph) +
        '" value="' + esc(val == null ? "" : val) + '">';}
    return '<div class="fld"><label for="' + fid + '">' + label + "</label>" + ctl + "</div>";
  }
  function gRead(label, html) {
    return '<div class="fld"><span class="lbl">' + label + "</span>" + html + "</div>";
  }
  var G_EMPTY = '<p class="gv-empty">Sin definir</p>';
  function gTheme(id, g, edit, label) {
    return edit
      ? goalField(id, "theme", label, "text", "Ej. Mostrar el proceso detrás del producto", g.theme)
      : gRead(label, g.theme ? '<p class="gv-theme">' + esc(g.theme) + "</p>" : G_EMPTY);
  }
  function gObjs(id, g, edit) {
    var ls = lines(g.objectives), done = g.objDone || [];
    if (edit) {
      return goalField(
        id,
        "objectives",
        "Objetivos (uno por línea)",
        "area",
        "Ej.\nSubir la frecuencia a 4 posts por semana\nConvertir 3 reels en recurrentes",
        g.objectives,
      );
    }
    if (!ls.length) return gRead("Objetivos", G_EMPTY);
    return gRead(
      "Objetivos",
      '<ul class="gv-chk">' + ls.map(function (t, i) {
        var d = done.indexOf(t) >= 0;
        return '<li class="' + (d ? "od" : "") +
          '"><button class="ck" type="button" role="checkbox" aria-checked="' + d +
          '" aria-label="Cumplido: ' + esc(t) + '" data-act="objdone" data-gid="' + esc(id) +
          '" data-i="' + i + '"' + (S.canWrite ? "" : " disabled") + ">" + CHECK_SVG +
          "</button><span>" + esc(t) + "</span></li>";
      }).join("") + "</ul>",
    );
  }
  //CALC-START
  function parseNum(v) {
    if (v == null) return null;
    var t = String(v).trim().replace(/\s/g, "").replace(/%$/, "");
    if (!t) return null;
    if (t.indexOf(",") >= 0) t = t.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
    var n = Number(t);
    return isFinite(n) ? n : null;
  }
  function decOf(n) {
    var s = String(n), i = s.indexOf(".");
    return i < 0 ? 0 : Math.min(2, s.length - i - 1);
  }
  function fmtNum(n, d) {
    if (n == null || !isFinite(n)) return "–";
    var s = Math.abs(n).toFixed(d || 0).split(".");
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (n < 0 ? "−" : "") + s.join(",");
  }
  function sgnNum(n, d) {
    return (n > 0 ? "+" : "") + fmtNum(n, d);
  }
  function valStr(n) {
    return n == null || n === "" ? "" : String(n).replace(".", ",");
  }
  function hasNum(v) {
    return v != null && v !== "" && isFinite(Number(v));
  }
  /* Hitos: crecimiento compuesto (el primer mes es el más lento). Con un mes ajustado, los otros dos se reparten el resto. */
  function calcMilestones(cur, tar, pin) {
    if (!hasNum(cur) || !hasNum(tar)) return null;
    cur = Number(cur);
    tar = Number(tar);
    var pm = -1, pd = 0;
    if (pin && pin.m >= 0 && pin.m <= 2 && hasNum(pin.d)) {
      pm = Number(pin.m);
      pd = Number(pin.d);
    }
    var d = Math.max(decOf(cur), decOf(tar), pm >= 0 ? decOf(pd) : 0), k = Math.pow(10, d);
    function rnd(x) {
      return Math.round(x * k) / k;
    }
    var total = tar - cur, w = [1, 1, 1];
    if (cur > 0 && tar > 0 && cur !== tar) {
      var g = Math.pow(tar / cur, 1 / 3);
      w = [1, g, g * g];
    }
    var delta = [0, 0, 0], warn = false;
    if (pm >= 0) {
      var o = [0, 1, 2].filter(function (i) {
          return i !== pm;
        }),
        rem = total - pd,
        ws = w[o[0]] + w[o[1]];
      delta[pm] = pd;
      o.forEach(function (i) {
        delta[i] = rem * w[i] / ws;
      });
      if (total !== 0 && (rem * total < 0 || pd * total < 0)) warn = true;
    } else {
      var s3 = w[0] + w[1] + w[2];
      for (var i = 0; i < 3; i++) delta[i] = total * w[i] / s3;
    }
    var E = [cur + delta[0], cur + delta[0] + delta[1], tar], R = [];
    for (var j = 0; j < 3; j++) {
      var prev = j ? R[j - 1] : cur;
      R[j] = (j === pm && j < 2) ? rnd(prev + pd) : rnd(E[j]);
    }
    R[2] = rnd(tar);
    return {
      end: R,
      inc: [rnd(R[0] - cur), rnd(R[1] - R[0]), rnd(R[2] - R[1])],
      d: d,
      warn: warn,
      pm: pm,
    };
  }
  function monthEnded(y, mi) {
    return todayStr() > ymd(y, mi, new Date(y, mi + 1, 0).getDate());
  }
  function msStatus(m, i, ms, y, mi) {
    var real = m.real && m.real[i],
      has = hasNum(real),
      dir = Number(m.tar) >= Number(m.cur) ? 1 : -1;
    var reached = has && (dir > 0 ? Number(real) >= ms.end[i] : Number(real) <= ms.end[i]);
    if (reached) return { k: "ok", t: "Cumplido" };
    if (monthEnded(y, mi)) {
      return has ? { k: "bad", t: "No cumplido" } : { k: "miss", t: "Sin registrar" };
    }
    return has ? { k: "run", t: "En curso" } : { k: "pend", t: "Pendiente" };
  }
  function qStatus(m, y, qn) {
    var last = -1;
    for (var i = 0; i < 3; i++) if (hasNum(m.real && m.real[i])) last = i;
    var c = Number(m.cur),
      t = Number(m.tar),
      dir = t >= c ? 1 : -1,
      real = last >= 0 ? Number(m.real[last]) : null;
    var reached = real != null && (dir > 0 ? real >= t : real <= t), pct = null;
    if (real != null && t !== c) {
      pct = Math.max(0, Math.min(100, Math.round((real - c) / (t - c) * 100)));
    }
    var s;
    if (reached) s = { k: "ok", t: "Objetivo cumplido" };
    else if (monthEnded(y, qn * 3 + 2)) {
      s = real != null ? { k: "bad", t: "No cumplido" } : { k: "miss", t: "Sin registrar" };
    } else s = real != null ? { k: "run", t: "En curso" } : { k: "pend", t: "Pendiente" };
    s.pct = pct;
    return s;
  }
  //CALC-END
  function mpill(s) {
    var c = {
      ok: "st-listo",
      bad: "st-bad",
      run: "st-produccion",
      pend: "st-idea",
      miss: "st-porproducir",
    }[s.k];
    var ic = { ok: "publicado", bad: "bad", run: "produccion", pend: "idea", miss: "idea" }[s.k];
    return '<span class="st ' + c + '">' + stIcon(ic) + esc(s.t) + "</span>";
  }
  function metricList(g, pl) {
    return (g && g.metrics && Array.isArray(g.metrics[pl]))
      ? g.metrics[pl].filter(function (m) {
        return m && m.id;
      })
      : [];
  }
  function saveMetrics(gid, fn) {
    if (!canW()) return;
    var g = S.goals.get(gid) || { id: gid }, src = g.metrics || {};
    var nm = {
      ig: JSON.parse(JSON.stringify(src.ig || [])),
      tt: JSON.parse(JSON.stringify(src.tt || [])),
    };
    fn(nm);
    S.goals.set(gid, Object.assign({}, g, { metrics: nm }));
    queueSave("goals/" + gid, { metrics: nm }, 300);
  }
  function editMetric(gid, pl, mid, fn) {
    saveMetrics(gid, function (nm) {
      var a = nm[pl] || [];
      for (var i = 0; i < a.length; i++) {
        if (a[i].id === mid) {
          fn(a[i]);
          return;
        }
      }
    });
  }
  function hitCount(g, y, qn) {
    var tot = 0, ok = 0;
    ["ig", "tt"].forEach(function (pl) {
      metricList(g, pl).forEach(function (m0) {
        var m = effM(m0, pl, y, qn), ms = calcMilestones(m.cur, m.tar, m.pin);
        if (!ms) return;
        for (var i = 0; i < 3; i++) {
          tot++;
          if (msStatus(m, i, ms, y, qn * 3 + i).k === "ok") ok++;
        }
      });
    });
    return { tot: tot, ok: ok };
  }
  /* Métricas de objetivos que se llenan solas desde Instagram (m.src). El valor real que alguien escriba a mano
     manda sobre el automático. */
  var SRC = [
    ["manual", "Manual"],
    ["seguidores", "Seguidores (al cierre del mes)"],
    ["alcance", "Alcance del mes"],
    ["reproducciones", "Reproducciones del mes"],
    ["interacciones", "Interacciones del mes"],
    ["publicaciones", "Publicaciones del mes"],
    ["prom_likes", "Media de likes"],
    ["prom_comentarios", "Media de comentarios"],
    ["prom_guardados", "Media de guardados"],
    ["prom_compartidos", "Media de compartidos"],
    ["prom_alcance", "Media de alcance"],
    ["prom_interacciones", "Media de interacciones"],
    ["ads_clics", "Clics al enlace"],
    ["ads_mensajes", "Mensajes"],
    ["ads_visitas", "Visitas al perfil"],
  ];
  function srcLabel(k) {
    for (var i = 0; i < SRC.length; i++) if (SRC[i][0] === k) return SRC[i][1];
    return "";
  }
  function autoVal(src, y, mi) {
    if (!src || src === "manual") return null;
    var key = monthKey(y, mi);
    if (key > todayStr().slice(0, 7)) return null;
    if (src.indexOf("ads_") === 0) {
      var ka = src.slice(4), sa = null;
      impulsosEn(key + "-01", key + "-31").forEach(function (i) {
        var v = (i.resultados || {})[ka];
        if (v != null) sa = (sa || 0) + v;
      });
      return sa;
    }
    if (src.indexOf("prom_") === 0) {
      var k = src.slice(5), n = 0, t = 0;
      allPosts().forEach(function (p) {
        var x = igMet(p);
        if (p.status === "publicado" && hasIg(p) && inMonth(p, y, mi) && x && x.m && x.m[k] != null) {
          n++;
          t += x.m[k];
        }
      });
      return n ? Math.round(t / n) : null;
    }
    if (src === "publicaciones") {
      return allPosts().filter(function (p) {
        return p.status === "publicado" && hasIg(p) && inMonth(p, y, mi);
      }).length;
    }
    var cm = (RD().cuentaMes.ig || {})[key];
    if (!cm || cm[src] == null) return null;
    return cm[src];
  }
  /**
   * «Hoy» de una meta que se llena sola: el dato del mes anterior al trimestre (el punto de partida). Si ese mes
   * aún no tiene datos (p. ej. la cuenta se conectó después), el mes más reciente que sí los tenga.
   * → { v, mes } o null
   */
  function baseVal(src, y, qn) {
    if (!src || src === "manual") return null;
    var now = new Date(), y0 = y, m0 = qn * 3 - 1;
    if (m0 < 0) {
      m0 += 12;
      y0--;
    }
    var v = autoVal(src, y0, m0);
    if (v != null) return { v: v, mes: m0 };
    for (var k = 1; k <= 12; k++) {
      var d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      v = autoVal(src, d.getFullYear(), d.getMonth());
      if (v != null) return { v: v, mes: d.getMonth() };
    }
    v = autoVal(src, now.getFullYear(), now.getMonth());
    return v != null ? { v: v, mes: now.getMonth() } : null;
  }
  /** De dónde sale una meta según su nombre, para las que nadie eligió origen (p. ej. las creadas antes). */
  function guessSrc(name) {
    var n = String(name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (!n) return null;
    if (!/media|promedio/.test(n)) {
      if (/whatsapp|clic|enlace/.test(n)) return "ads_clics";
      if (/mensaje|consulta/.test(n)) return "ads_mensajes";
      if (/visita|perfil/.test(n)) return "ads_visitas";
    }
    if (/media|promedio/.test(n)) {
      if (/like/.test(n)) return "prom_likes";
      if (/coment/.test(n)) return "prom_comentarios";
      if (/guardad/.test(n)) return "prom_guardados";
      if (/compartid/.test(n)) return "prom_compartidos";
      if (/alcance/.test(n)) return "prom_alcance";
      if (/interacc/.test(n)) return "prom_interacciones";
      return null;
    }
    if (/seguidor/.test(n)) return "seguidores";
    if (/alcance/.test(n)) return "alcance";
    if (/reproducc|vistas|views/.test(n)) return "reproducciones";
    if (/interacc/.test(n)) return "interacciones";
    if (/publicac|posts?\b/.test(n)) return "publicaciones";
    return null;
  }
  /** Origen efectivo: el elegido, o el que se deduce del nombre. «manual» = se escribe a mano. */
  function srcOf(m, pl) {
    if (pl !== "ig") return "manual";
    if (m.src && m.src !== "manual") return m.src;
    if (m.src === "manual") return "manual";
    return guessSrc(m.name) || "manual";
  }
  /**
   * La meta con sus valores reales: si viene de Instagram, el dato automático (lo escrito a mano solo cubre los
   * meses sin dato, p. ej. antes de conectar la cuenta) y «Hoy» desde Instagram si estaba vacío.
   */
  /** Meta como % de aumento (m.tarPct): la meta en número sale de «Hoy» + ese porcentaje. */
  function conPct(m) {
    if (m.tarMode !== "pct" || !hasNum(m.tarPct) || !hasNum(m.cur)) return m;
    var cur = Number(m.cur), d = decOf(cur), k = Math.pow(10, d);
    return Object.assign({}, m, { tar: Math.round(cur * (1 + Number(m.tarPct) / 100) * k) / k });
  }
  function effM(m, pl, y, qn) {
    var src = srcOf(m, pl);
    if (src === "manual") return conPct(m);
    var real = [], auto = [];
    for (var i = 0; i < 3; i++) {
      var a = autoVal(src, y, qn * 3 + i), man = m.real && m.real[i];
      if (a != null) {
        real.push(a);
        auto.push(true);
      } else {
        real.push(hasNum(man) ? man : null);
        auto.push(false);
      }
    }
    var extra = { src: src, real: real, _auto: auto, _isAuto: true };
    if (!hasNum(m.cur)) {
      var b = baseVal(src, y, qn);
      if (b) extra.cur = b.v;
    }
    return conPct(Object.assign({}, m, extra));
  }
  function metricCard(gid, g, pl, m0, edit, y, qn) {
    var m = effM(m0, pl, y, qn);
    var ms = calcMilestones(m.cur, m.tar, m.pin),
      uid = m.id,
      key = gid + "|" + pl + "|" + uid + "|",
      ro = S.canWrite ? "" : " disabled";
    var h = '<div class="mx">';
    if (edit) {
      h += '<div class="mx-edit' + (pl === "ig" ? "" : " no-src") + '"><div class="fld"><label for="mf-' + uid +
        '-name">Métrica</label><input class="in" id="mf-' + uid + '-name" data-mf="' + key +
        'name" type="text" placeholder="Ej. Seguidores" value="' + esc(m.name || "") +
        '" autocomplete="off"></div>' +
        (pl === "ig"
          ? '<div class="fld"><label for="mf-' + uid + '-src">El valor real sale de</label><select class="in" id="mf-' + uid +
            '-src" data-mf="' + key + 'src">' + SRC.map(function (o) {
              return '<option value="' + o[0] + '"' + ((m.src || "manual") === o[0] ? " selected" : "") + ">" +
                (o[0] === "manual" ? "Lo escribo a mano" : (o[0].indexOf("ads_") === 0 ? "Ads: " : "Instagram: ") + o[1].charAt(0).toLowerCase() + o[1].slice(1)) + "</option>";
            }).join("") + "</select></div>"
          : "") +
        '<div class="fld"><label for="mf-' + uid + '-cur">Hoy</label><input class="in" id="mf-' +
        uid + '-cur" data-mf="' + key +
        'cur" type="text" inputmode="decimal" placeholder="1.200" value="' + esc(valStr(m.cur)) +
        '" autocomplete="off">' +
        (m.curAuto && pl === "ig" && m.src && m.src !== "manual"
          ? '<span class="hint" style="min-height:0"><span class="auto">' + IG_SVG + "Dato de Instagram" +
            (m.curMes != null ? " de " + MONTHS[m.curMes].toLowerCase() : "") + "</span></span>"
          : "") + "</div>" +
        '<div class="fld"><label for="mf-' + uid + (m.tarMode === "pct" ? "-tarPct" : "-tar") +
        '">Meta del trimestre</label><div class="tarbox"><select class="in tarmode" data-mf="' + key +
        'tarMode" aria-label="Tipo de meta"><option value="num"' + (m.tarMode !== "pct" ? " selected" : "") +
        '>Número</option><option value="pct"' + (m.tarMode === "pct" ? " selected" : "") + ">% de aumento</option></select>" +
        (m.tarMode === "pct"
          ? '<input class="in" id="mf-' + uid + '-tarPct" data-mf="' + key + 'tarPct" type="text" inputmode="decimal" placeholder="10" value="' +
            esc(valStr(m.tarPct)) + '" autocomplete="off"><span class="pctsuf">%</span>'
          : '<input class="in" id="mf-' + uid + '-tar" data-mf="' + key + 'tar" type="text" inputmode="decimal" placeholder="2.000" value="' +
            esc(valStr(m.tar)) + '" autocomplete="off">') + "</div>" +
        (m.tarMode === "pct" && hasNum(m.tar)
          ? '<span class="hint" style="min-height:0"><span>= ' + fmtNum(Number(m.tar), decOf(Number(m.cur))) + " al cierre del trimestre</span></span>"
          : "") + "</div>" +
        '<div class="del">' + (S.mdel === uid
          ? '¿Quitar? <button class="btn sm danger" type="button" data-act="mdelyes" data-gid="' +
            esc(gid) + '" data-plat="' + pl + '" data-mid="' + uid +
            '">Sí</button><button class="btn sm" type="button" data-act="mdelno">No</button>'
          : '<button class="btn sm ghost danger" type="button" data-act="mdel" data-mid="' + uid +
            '" aria-label="Quitar métrica">Quitar</button>') +
        "</div></div>";
    } else {
      var qs = ms ? qStatus(m, y, qn) : null, col = !!S.mcol[uid];
      h += '<button class="mx-tg" type="button" data-act="mtoggle" data-mid="' + uid +
        '" aria-expanded="' + (!col) +
        '"><svg class="chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg><b>' +
        esc(m.name || "Sin nombre") + "</b>" + (qs ? mpill(qs) : "") + "</button>" +
        '<div class="mx-sub">Actual ' +
        fmtNum(hasNum(m.cur) ? Number(m.cur) : null, ms ? ms.d : 0) + " → objetivo " +
        fmtNum(hasNum(m.tar) ? Number(m.tar) : null, ms ? ms.d : 0) +
        (qs && qs.pct != null ? " · " + qs.pct + "% del camino" : "") +
        (m.src && m.src !== "manual" && pl === "ig" ? ' · <span class="auto">' + IG_SVG + "Se llena solo: " + esc(srcLabel(m.src).toLowerCase()) + "</span>" : "") +
        "</div>";
    }
    if (!edit && S.mcol[uid]) return h + "</div>";
    if (!ms) {
      h +=
        '<p class="gv-empty">Completa el valor actual y el objetivo para calcular los hitos.</p>';
    } else {
      if (ms.warn) {
        h +=
          '<p class="warn-note">Con este ajuste los otros meses tendrían que retroceder. Revisa el número.</p>';
      }
      if (edit) {
        h += '<details class="ms-det"' + (ms.pm >= 0 ? " open" : "") + "><summary>Metas de cada mes: " +
          [0, 1, 2].map(function (j) {
            return cap(MON3[qn * 3 + j]) + " " + fmtNum(ms.end[j], ms.d);
          }).join(" · ") + ' <span class="mut">(ajustar)</span></summary>';
      }
      for (var i = 0; i < 3; i++) {
        var mi = qn * 3 + i,
          st = msStatus(m, i, ms, y, mi),
          pinned = ms.pm === i,
          real = m.real && m.real[i];
        h += '<div class="ms-row' + (edit ? " ed" : "") + '"><span class="ms-m">' + cap(MON3[mi]) +
          "</span>" +
          '<div class="ms-meta"><b>' + fmtNum(ms.end[i], ms.d) + '</b> <span class="mut">' +
          sgnNum(ms.inc[i], ms.d) + "</span>" +
          (pinned ? '<span class="adj">ajustado</span>' : "") + "</div>" +
          '<div class="ms-real">' + (S.canWrite && !m._isAuto
            ? '<label class="sr" for="mr-' + uid + "-" + i + '">Valor real al cierre de ' +
              MONTHS[mi].toLowerCase() + '</label><input class="in" id="mr-' + uid + "-" + i +
              '" data-mreal="' + key + i +
              '" type="text" inputmode="decimal" placeholder="' +
              (m._auto && m._auto[i] ? fmtNum(Number(real), ms.d) + " (auto)" : "Real") + '" value="' +
              esc(valStr(m._auto && m._auto[i] ? null : real)) + '" autocomplete="off"' +
              (m._auto && m._auto[i] ? ' title="Viene de Instagram. Escribe un valor para reemplazarlo."' : "") + ">"
            : '<span class="rv">' + (hasNum(real) ? fmtNum(Number(real), ms.d) : "–") +
              (m._auto && m._auto[i] ? ' <span class="auto">auto</span>' : "") + "</span>") +
          "</div>" +
          '<div class="ms-st">' + mpill(st) + (hasNum(real) && st.k !== "ok"
            ? '<span class="mut">faltan ' + fmtNum(Math.abs(ms.end[i] - Number(real)), ms.d) +
              "</span>"
            : "") +
          "</div>";
        if (edit) {
          h += '<div class="ms-adj"><label for="mp-' + uid + "-" + i +
            '">Ajustar crecimiento del mes</label><input class="in" id="mp-' + uid + "-" + i +
            '" data-mpin="' + key + i + '" type="text" inputmode="decimal" placeholder="' +
            esc(valStr(ms.inc[i])) + '" value="' + (pinned ? esc(valStr(m.pin.d)) : "") +
            '" autocomplete="off">' +
            (pinned
              ? '<button class="btn sm ghost" type="button" data-act="mpinreset" data-gid="' +
                esc(gid) + '" data-plat="' + pl + '" data-mid="' + uid + '">Restablecer</button>'
              : "") +
            "</div>";
        }
        h += "</div>";
      }
      if (edit) h += "</details>";
    }
    return h + "</div>";
  }
  function quarterMetrics(gid, g, edit, y, qn) {
    var hc = hitCount(g, y, qn);
    var h = '<div class="fld"><span class="lbl">Metas del trimestre</span>';
    if (!edit) {
      h += '<p class="hint" style="min-height:0">' +
        (hc.tot
          ? '<span class="hits"><b>' + hc.ok + " de " + hc.tot + "</b> hitos cumplidos</span>"
          : "<span>Define el valor actual y el objetivo; los hitos mensuales se calculan solos.</span>") +
        "</p>";
    }
    if (edit) {
      h +=
        '<p class="muted" style="font-size:12.5px">Para cada meta: dónde está hoy, a dónde quieres llegar al cierre del trimestre y de dónde sale el valor real. Las metas de cada mes se calculan solas.</p>';
    } else if (hc.tot && S.canWrite) {
      h +=
        '<p class="muted" style="font-size:12.5px">Escribe el valor real al cierre de cada mes para ver si se cumplió.</p>';
    }
    h += '<div class="mtr" style="gap:16px">';
    ["ig", "tt"].forEach(function (pl) {
      var list = metricList(g, pl);
      h += '<div class="plat-block"><div class="plat-h"><span class="pl">' + PLAT_ABBR[pl] +
        '</span><span class="lbl">' + PLATFORMS[pl] + "</span></div>";
      if (!list.length) h += G_EMPTY;
      list.forEach(function (m) {
        h += metricCard(gid, g, pl, m, edit, y, qn);
      });
      if (edit && S.canWrite) {
        h += '<div><button class="btn sm" type="button" data-act="madd" data-gid="' + esc(gid) +
          '" data-plat="' + pl + '">+ Añadir métrica</button></div>';
      }
      h += "</div>";
    });
    return h + "</div></div>";
  }
  function gNotes(id, g, edit) {
    if (edit) {
      return goalField(
        id,
        "notes",
        "Ideas y notas de reunión con el cliente (opcional)",
        "area",
        "Acuerdos, ideas, pendientes…",
        g.notes,
      );
    }
    return (g.notes && String(g.notes).trim())
      ? gRead("Ideas y notas de reunión", '<p class="notes">' + esc(g.notes) + "</p>")
      : "";
  }
  function monthGoalCard(y, mi, edit) {
    var id = "m-" + monthKey(y, mi),
      g = S.goals.get(id) || {},
      st = stats(y, mi),
      tgt = Number(g.postTarget) || 0;
    var bar = FORMAT_ORDER.filter(function (f) {
      return st.by[f];
    }).map(function (f) {
      return '<i class="f-' + f + '" style="width:' + (st.by[f] / st.total * 100) + '%" title="' +
        FORMATS[f].plural + ": " + st.by[f] + '"></i>';
    }).join("");
    return '<section class="card"><div class="card-h"><h3>' + MONTHS[mi] +
      '</h3><button class="btn sm" type="button" data-act="gocal" data-m="' + mi +
      '">Ver calendario</button></div>' +
      gTheme(id, g, edit, "Tema del mes") + gObjs(id, g, edit) +
      (edit
        ? goalField(id, "postTarget", "Meta de posts del mes", "num", "Ej. 16", g.postTarget)
        : "") +
      '<div class="fld"><span class="lbl">Posts</span><div class="bar" aria-hidden="true">' + bar +
      '</div><p class="prog">' + st.total + (tgt ? " de " + tgt : "") + " posts planificados · " +
      st.pub + " publicados" +
      (st.stories ? " · " + plural(st.stories, "historia", "historias") : "") + "</p></div>" +
      gNotes(id, g, edit) + "</section>";
  }
  /* ---------- Avance de objetivos (Objetivos y Rendimiento) ---------- */
  // Métricas «de nivel» (seguidores, o lo que se escriba a mano): el avance del mes va desde la meta del mes
  // anterior (o el valor actual) hasta la meta del mes. Métricas «del mes» (alcance, promedios…): real ÷ meta.
  function isLevel(m) {
    return !m.src || m.src === "manual" || m.src === "seguidores";
  }
  function clampPct(v) {
    return v == null || !isFinite(v) ? null : Math.max(0, Math.min(100, Math.round(v)));
  }
  function monthProgress(m, i, ms, y, mi) {
    var real = hasNum(m.real && m.real[i]) ? Number(m.real[i]) : null, target = ms.end[i], pct = null;
    if (real != null) {
      if (isLevel(m)) {
        var base = i ? ms.end[i - 1] : Number(m.cur);
        pct = target === base ? (real >= target ? 100 : 0) : (real - base) / (target - base) * 100;
      } else pct = target ? real / target * 100 : null;
    }
    return { real: real, target: target, pct: clampPct(pct), st: msStatus(m, i, ms, y, mi) };
  }
  function quarterProgress(m, ms, y, qn) {
    var qs = qStatus(m, y, qn), last = -1;
    for (var i = 0; i < 3; i++) if (hasNum(m.real && m.real[i])) last = i;
    var real = last >= 0 ? Number(m.real[last]) : null;
    // Del mes (alcance, promedios…): el último mes con dato contra la meta del trimestre, la misma que se muestra.
    var pct = isLevel(m) ? qs.pct : (real != null && ms.end[2] ? real / ms.end[2] * 100 : null);
    if (qs.k === "ok") pct = 100;
    return { real: real, target: ms.end[2], pct: clampPct(pct), st: qs };
  }
  /** Círculo de avance. Verde con ✓ si se cumplió; rojo si el periodo terminó sin cumplirse. */
  function ring(pct, k) {
    var r = 21, c = 2 * Math.PI * r, p = pct == null ? 0 : pct;
    var cls = k === "ok" ? " ok" : k === "bad" || k === "miss" ? " bad" : "";
    var center = k === "ok" ? "✓" : pct == null ? "–" : pct + "%";
    return '<svg class="ring' + cls + '" viewBox="0 0 54 54" role="img" aria-label="' +
      (pct == null ? "Sin datos" : pct + " % de avance") + '"><circle class="rt" cx="27" cy="27" r="' + r +
      '"/>' + (p > 0
        ? '<circle class="rv" cx="27" cy="27" r="' + r + '" stroke-dasharray="' + (c * p / 100).toFixed(1) + " " +
          c.toFixed(1) + '" transform="rotate(-90 27 27)"/>'
        : "") + '<text x="27" y="31.5" text-anchor="middle">' + center +
      "</text></svg>";
  }
  var ST_OF = { ok: "publicado", bad: "bad", run: "produccion", pend: "idea", miss: "bad" };
  function stDot(st) {
    var c = { ok: "st-listo", bad: "st-bad", run: "st-produccion", pend: "st-idea", miss: "st-bad" }[st.k];
    return '<span class="sdot ' + c + '" title="' + esc(st.t) + '">' + stIcon(ST_OF[st.k]) + "</span>";
  }
  function goalTile(o) {
    return '<div class="gtile">' + ring(o.pct, o.st.k) + '<div class="gt-b"><div class="gt-h">' +
      (o.pl ? '<span class="pl">' + o.pl + "</span>" : "") + "<b>" + esc(o.name) + "</b></div>" +
      '<div class="gt-v">' + (o.nota
        ? "<span>" + esc(o.nota) + "</span>"
        : (o.real == null ? "<b>–</b>" : "<b>" + o.realTxt + "</b>") +
          " <span>de " + o.targetTxt + (o.metaQ ? " (meta del trimestre)" : "") + "</span>") +
      "</div>" + mpill(o.st) + "</div></div>";
  }
  /** Las metas de un periodo como tarjetas con círculo: métricas de IG/TT y la meta de posts del mes. */
  function goalTiles(y, m0, quarter) {
    var qn = Math.floor(m0 / 3), qg = S.goals.get("q-" + y + "-" + (qn + 1)) || {}, tiles = [], i = m0 - qn * 3;
    ["ig", "tt"].forEach(function (pl) {
      metricList(qg, pl).forEach(function (m0b) {
        var m = effM(m0b, pl, y, qn), ms = calcMilestones(m.cur, m.tar, m.pin);
        if (!ms) {
          // Sin punto de partida (o sin meta) no hay metas por mes, pero la meta se muestra igual: el valor real
          // del periodo contra la meta del trimestre.
          var ended = quarter ? monthEnded(y, qn * 3 + 2) : monthEnded(y, m0), real = null;
          if (quarter) {
            for (var j = 0; j < 3; j++) if (hasNum(m.real && m.real[j])) real = Number(m.real[j]);
          } else if (hasNum(m.real && m.real[i])) real = Number(m.real[i]);
          var tar = hasNum(m.tar) ? Number(m.tar) : null, d = tar != null ? decOf(tar) : 0;
          var k = tar == null ? "pend" : real != null && real >= tar ? "ok" : ended ? (real != null ? "bad" : "miss") : real != null ? "run" : "pend";
          tiles.push(goalTile({
            pl: PLAT_ABBR[pl],
            name: m.name || "Sin nombre",
            pct: tar && real != null ? clampPct(real / tar * 100) : null,
            st: { k: k, t: { ok: "Cumplido", bad: "No cumplido", miss: "Sin registrar", run: "En curso", pend: "Pendiente" }[k] },
            real: real,
            realTxt: fmtNum(real, d),
            targetTxt: fmtNum(tar, d),
            metaQ: !quarter,
            nota: tar == null ? "Falta definir la meta" : null,
          }));
          return;
        }
        var pr = quarter ? quarterProgress(m, ms, y, qn) : monthProgress(m, i, ms, y, m0);
        tiles.push(goalTile({
          pl: PLAT_ABBR[pl],
          name: m.name || "Sin nombre",
          pct: pr.pct,
          st: pr.st,
          real: pr.real,
          realTxt: fmtNum(pr.real, ms.d),
          targetTxt: fmtNum(pr.target, ms.d),
        }));
      });
    });
    // Meta de posts: publicados contra la meta del mes (o la suma de los tres meses).
    var months = quarter ? [qn * 3, qn * 3 + 1, qn * 3 + 2] : [m0], tgt = 0, pub = 0, ended = true, started = false;
    months.forEach(function (mi) {
      var g = S.goals.get("m-" + monthKey(y, mi)) || {};
      tgt += Number(g.postTarget) || 0;
      pub += stats(y, mi).pub;
      if (!monthEnded(y, mi)) ended = false;
      if (monthKey(y, mi) <= todayStr().slice(0, 7)) started = true;
    });
    if (tgt) {
      var k = pub >= tgt ? "ok" : ended ? "bad" : started ? "run" : "pend";
      tiles.push(goalTile({
        name: "Posts publicados",
        pct: clampPct(pub / tgt * 100),
        st: { k: k, t: { ok: "Cumplido", bad: "No cumplido", run: "En curso", pend: "Pendiente" }[k] },
        real: pub,
        realTxt: fmtNum(pub),
        targetTxt: fmtNum(tgt),
      }));
    }
    return tiles;
  }
  /** Para Rendimiento: las metas del mes o del trimestre, simplificadas. */
  function goalsSummary(y, m0, quarter, bare) {
    var tiles = goalTiles(y, m0, quarter), qn = Math.floor(m0 / 3);
    if (bare) {
      // Dentro de Rendimiento: la sección ya tiene su título y el botón «Ver objetivos».
      return '<div class="card">' + (tiles.length
        ? '<div class="gtiles">' + tiles.join("") + "</div>"
        : '<p class="gv-empty">Este periodo no tiene metas con números.' + (S.canWrite ? " Defínelas en la pestaña Objetivos." : "") + "</p>") +
        "</div>";
    }
    var title = quarter ? "Objetivos del trimestre T" + (qn + 1) : "Objetivos de " + MONTHS[m0].toLowerCase();
    var h = '<section class="card"><div class="card-h"><h3>' + title +
      '</h3><a class="btn sm" href="#objetivos">Ver objetivos</a></div>';
    if (!tiles.length) {
      return h + '<p class="gv-empty">Este periodo no tiene metas con números. ' +
        (S.canWrite ? "Defínelas en la pestaña Objetivos." : "") + "</p></section>";
    }
    return h + '<div class="gtiles">' + tiles.join("") + "</div></section>";
  }

  /** Objetivos (lectura): una tarjeta por métrica con su avance del trimestre y los tres meses. */
  function metricRead(gid, pl, m0, y, qn) {
    var m = effM(m0, pl, y, qn), ms = calcMilestones(m.cur, m.tar, m.pin), key = gid + "|" + pl + "|" + m.id + "|";
    var igOk = igCon() && igCon().estado !== "error";
    var src = m._isAuto && String(m.src).indexOf("ads_") === 0
      ? '<span class="auto">' + BOOST_SVG + "Se llena con los impulsos</span>"
      : m._isAuto
      ? '<span class="auto">' + IG_SVG + (igOk ? "Se llena solo" : "Se llenará al conectar Instagram") + "</span>"
      : '<span class="auto">Se escribe a mano</span>';
    if (!ms) {
      return '<div class="gm"><div class="gt-h"><span class="pl">' + PLAT_ABBR[pl] + "</span><b>" +
        esc(m.name || "Sin nombre") + '</b></div><p class="gv-empty">' +
        (m._isAuto && hasNum(m.tar) && !(igCon() && igCon().estado !== "error")
          ? "El punto de partida se llenará al conectar Instagram."
          : "Falta el valor de hoy o la meta. Pulsa «Editar».") + "</p></div>";
    }
    var q = quarterProgress(m, ms, y, qn);
    var h = '<div class="gm"><div class="gm-top">' + ring(q.pct, q.st.k) + '<div class="gt-b"><div class="gt-h"><span class="pl">' +
      PLAT_ABBR[pl] + "</span><b>" + esc(m.name || "Sin nombre") + "</b></div>" +
      '<div class="mut">De ' + fmtNum(Number(m.cur), ms.d) + " a <b>" + fmtNum(Number(m.tar), ms.d) + "</b>" +
      (m.tarMode === "pct" && hasNum(m.tarPct) ? " (" + (Number(m.tarPct) >= 0 ? "+" : "") + fmtNum(Number(m.tarPct), decOf(Number(m.tarPct))) + " %)" : "") +
      " · " + src + "</div>" +
      mpill(q.st) + '</div></div><div class="gm-months">';
    for (var i = 0; i < 3; i++) {
      var mi = qn * 3 + i, pr = monthProgress(m, i, ms, y, mi), auto = m._auto && m._auto[i];
      var realHtml;
      if (S.canWrite && !m._isAuto) {
        realHtml = '<label class="sr" for="mr-' + m.id + "-" + i + '">Valor real de ' + MONTHS[mi].toLowerCase() +
          '</label><input class="in" id="mr-' + m.id + "-" + i + '" data-mreal="' + key + i +
          '" type="text" inputmode="decimal" placeholder="Real" value="' + esc(valStr(pr.real)) + '" autocomplete="off">';
      } else {
        realHtml = '<span class="rv">' + (pr.real == null ? "–" : fmtNum(pr.real, ms.d)) + "</span>" +
          (m._isAuto && pr.real == null && y * 12 + mi >= now.getFullYear() * 12 + now.getMonth() && igCon() &&
              igCon().estado !== "error"
            ? '<span class="mut">se llena solo</span>'
            : "");
      }
      h += '<div class="gmm"><div class="gmm-h"><span>' + cap(MON3[mi]) + "</span>" + stDot(pr.st) + "</div>" +
        '<span class="mut">meta ' + fmtNum(pr.target, ms.d) + "</span>" + realHtml + "</div>";
    }
    return h + "</div></div>";
  }

  function monthCardRead(y, mi) {
    var id = "m-" + monthKey(y, mi), g = S.goals.get(id) || {}, st = stats(y, mi), tgt = Number(g.postTarget) || 0;
    var bar = FORMAT_ORDER.filter(function (f) {
      return st.by[f];
    }).map(function (f) {
      return '<i class="f-' + f + '" style="width:' + (st.by[f] / st.total * 100) + '%" title="' +
        FORMATS[f].plural + ": " + st.by[f] + '"></i>';
    }).join("");
    var objs = lines(g.objectives);
    return '<section class="card gmonth"><div class="card-h"><h3>' + MONTHS[mi] +
      '</h3><button class="btn sm ghost" type="button" data-act="gocal" data-m="' + mi + '">Calendario</button></div>' +
      (g.theme ? '<p class="gv-theme">' + esc(g.theme) + "</p>" : "") +
      (objs.length ? gObjs(id, g, false) : "") +
      (!g.theme && !objs.length ? '<p class="gv-empty">Sin tema ni objetivos.</p>' : "") +
      '<div class="fld"><div class="bar" aria-hidden="true">' + bar + '</div><p class="prog"><b>' + st.pub + "</b> publicados" +
      (tgt ? " de " + tgt : "") + " · " + st.total + " planificados" +
      (st.stories ? " · " + plural(st.stories, "historia", "historias") : "") + "</p></div>" +
      gNotes(id, g, false) + "</section>";
  }
  function viewObj() {
    var y = S.cy,
      qn = Math.floor(S.cm / 3),
      qid = "q-" + y + "-" + (qn + 1),
      qg = S.goals.get(qid) || {},
      edit = S.goalsEdit && S.canWrite;
    var h = notices() + monthBar();
    h += '<div class="gbar"><p class="muted">' +
      (edit
        ? "Editando. Los cambios se guardan solos."
        : (S.canWrite ? "Pulsa «Editar» para definir el tema, los objetivos y las metas." : "Solo lectura.")) +
      "</p>" +
      (S.canWrite
        ? '<button class="btn' + (edit ? " primary" : "") +
          '" type="button" data-act="goalsedit">' + (edit ? "Listo" : "Editar") + "</button>"
        : "") +
      "</div>";
    if (edit) {
      h += '<section class="card"><div class="card-h"><h3>Trimestre T' + (qn + 1) + "</h3></div>" +
        gTheme(qid, qg, edit, "Tema del trimestre") + gObjs(qid, qg, edit) +
        quarterMetrics(qid, qg, edit, y, qn) + gNotes(qid, qg, edit) +
        '</section><div class="goal-grid">';
      for (var i = 0; i < 3; i++) h += monthGoalCard(y, qn * 3 + i, edit);
      main.innerHTML = h + "</div>";
      return;
    }
    // Lectura: primero el trimestre (tema, objetivos y metas con su avance), luego los tres meses.
    var metrics = [];
    ["ig", "tt"].forEach(function (pl) {
      metricList(qg, pl).forEach(function (m) {
        metrics.push(metricRead(qid, pl, m, y, qn));
      });
    });
    var qObjs = lines(qg.objectives);
    var empty = !qg.theme && !qObjs.length && !metrics.length;
    var hasManual = metricList(qg, "tt").length > 0 || metricList(qg, "ig").some(function (m) {
      return srcOf(m, "ig") === "manual";
    });
    var needsIg = metricList(qg, "ig").some(function (m) {
      var sr = srcOf(m, "ig");
      return sr !== "manual" && sr.indexOf("ads_") !== 0;
    });
    if (needsIg && (!igCon() || igCon().estado === "error")) {
      h += igConnectNotice("Las metas de Instagram (seguidores, alcance, medias…) se llenarán solas cuando la cuenta esté conectada.");
    }
    h += '<section class="card"><div class="card-h"><h3>Trimestre T' + (qn + 1) + "</h3></div>";
    if (empty) {
      h += '<div class="empty" style="border:0;padding:18px 8px"><h3>Aún no hay objetivos para este trimestre</h3>' +
        "<p>Define un tema, los objetivos y las metas con números (seguidores, alcance, media de likes…). Las de Instagram se llenan solas.</p>" +
        (S.canWrite ? '<div class="acts"><button class="btn primary" type="button" data-act="goalsedit">Definir objetivos</button></div>' : "") +
        "</div>";
    } else {
      if (qg.theme) h += '<p class="gv-theme big">' + esc(qg.theme) + "</p>";
      if (qObjs.length) h += gObjs(qid, qg, false);
      h += metrics.length
        ? '<div class="fld"><span class="lbl">Metas</span><div class="gms">' + metrics.join("") + "</div>" +
          (S.canWrite && hasManual ? '<p class="hint" style="min-height:0"><span>Las que se escriben a mano: anota el valor real al cierre de cada mes.</span></p>' : "") +
          "</div>"
        : '<p class="gv-empty">Sin metas con números. ' + (S.canWrite ? "Pulsa «Editar» para añadirlas." : "") + "</p>";
      h += gNotes(qid, qg, false);
    }
    h += '</section><div class="goal-grid">';
    for (var j = 0; j < 3; j++) h += monthCardRead(y, qn * 3 + j);
    main.innerHTML = h + "</div>";
  }

  /* ---------- Pauta ---------- */
  function weekLabel(ds) {
    var a = dateObj(ds), b = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 6);
    if (a.getMonth() === b.getMonth()) {
      return "Semana del " + a.getDate() + " al " + b.getDate() + " de " +
        MONTHS[b.getMonth()].toLowerCase();
    }
    return "Semana del " + a.getDate() + " " + MON3[a.getMonth()] + " al " + b.getDate() + " " +
      MON3[b.getMonth()];
  }
  function mondayOf(ds) {
    var d = dateObj(ds);
    var k = dowMon(d);
    return ymd(d.getFullYear(), d.getMonth(), d.getDate() - k);
  }
  /* Pauta de un mes: los posts en la pauta cuyo mes de grabación es ese (el de su fecha, o el elegido en «Grabar
     en»), más los de meses anteriores que siguen sin tomar ni publicar (se arrastran sin límite, «Pendiente de …»). */
  function shootYM(p) {
    return p.grabarEn || (p.date ? p.date.slice(0, 7) : "");
  }
  function monthName(ym) {
    return MONTHS[+ym.slice(5, 7) - 1].toLowerCase();
  }
  function pautaOrigen(p, ym) {
    var g = shootYM(p);
    if (g && g < ym) return "Pendiente de " + monthName(g);
    if (p.date && p.date.slice(0, 7) !== ym) return "Se publica en " + monthName(p.date.slice(0, 7));
    return "";
  }
  function enPauta(p, ym) {
    var g = shootYM(p);
    if (!p.shoot || !g) return false;
    if (g === ym) return true;
    return g < ym && !isTaken(p) && p.status !== "publicado";
  }
  function pautaData() {
    var y = S.cy, m = S.cm, ym = monthKey(y, m);
    var all = allPosts().filter(function (p) {
      return enPauta(p, ym);
    }).sort(cmp);
    var done = all.filter(isTaken).length;
    var items = S.showDone ? all : all.filter(function (p) {
      return !isTaken(p);
    });
    var groups = [];
    if (S.group === "locacion") {
      var map = {}, order = [];
      items.forEach(function (p) {
        var key = (p.location || "").trim().toLowerCase();
        if (!map[key]) {
          map[key] = {
            title: key ? (p.location || "").trim() : "Sin locación definida",
            items: [],
            key: key,
          };
          order.push(key);
        }
        map[key].items.push(p);
      });
      order.sort(function (a, b) {
        if (!a) return 1;
        if (!b) return -1;
        return a.localeCompare(b);
      });
      groups = order.map(function (k) {
        return map[k];
      });
    } else if (S.group === "fecha") {
      var wm = {}, wo = [];
      items.forEach(function (p) {
        var k = p.date ? mondayOf(p.date) : "9999";
        if (!wm[k]) {
          wm[k] = { title: p.date ? weekLabel(k) : "Sin fecha", items: [] };
          wo.push(k);
        }
        wm[k].items.push(p);
      });
      wo.sort();
      groups = wo.map(function (k) {
        return wm[k];
      });
    } else {
      FORMAT_ORDER.forEach(function (f) {
        var it = items.filter(function (p) {
          return p.format === f;
        });
        if (it.length) groups.push({ title: FORMATS[f].plural, icon: fIcon(f), items: it });
      });
    }
    return {
      all: all,
      done: done,
      items: items,
      groups: groups,
      noShoot: allPosts().filter(function (p) {
        return !p.shoot && inMonth(p, y, m);
      }).length,
    };
  }
  function summaryTxt(d) {
    var c = {};
    d.all.forEach(function (p) {
      c[p.format] = (c[p.format] || 0) + 1;
    });
    var parts = FORMAT_ORDER.filter(function (f) {
      return c[f];
    }).map(function (f) {
      return c[f] + " " + (c[f] === 1 ? FORMATS[f].label : FORMATS[f].plural).toLowerCase();
    });
    return plural(d.all.length, "pieza", "piezas") +
      (parts.length ? " · " + parts.join(" · ") : "") + " · " + plural(d.done, "tomada", "tomadas");
  }
  var CHECK_SVG =
    '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.5l2.5 2.5 4.5-5.5"/></svg>';
  function refsBlock(p) {
    var imgs = refImgs(p), lk = linksHtml(p.refs, "inline");
    var h = '<div class="plabel">Referencias</div>';
    if (imgs.length) {
      h += '<div class="refimgs">' + imgs.map(function (x) {
        return '<a href="' + window.PLANIFICA.img + esc(x.id) +
          '" target="_blank" rel="noopener noreferrer"><img src="' + window.PLANIFICA.img +
          esc(x.id) + '" alt="Imagen de referencia" loading="lazy"></a>';
      }).join("") + "</div>";
    }
    return h + lk;
  }
  function pautaItem(p) {
    var f = FORMATS[p.format] || FORMATS.reel,
      det = [],
      taken = isTaken(p),
      shots = getShots(p),
      voice = voiceLines(p);
    det.push("<b>Publica:</b> " + esc(whenTxt(p)) + " · " + esc(platTxt(p)));
    if (p.location) det.push("<b>Locación:</b> " + esc(p.location));
    if (p.props) det.push("<b>Props / vestuario:</b> " + esc(p.props));
    if (driveHref(p.drive)) det.push(driveLink(p));
    return '<div class="item f-' + esc(p.format) + (taken ? " done" : "") + '">' +
      '<button class="ck" type="button" role="checkbox" aria-checked="' + taken +
      '" aria-label="Marcar todo como tomado: ' + esc(p.title || "Sin título") +
      '" data-act="done" data-id="' + esc(p.id) + '">' + CHECK_SVG + "</button>" +
      '<div><div class="ih"><a class="it" href="#post-' + esc(p.id) + '">' +
      (esc(p.title) || "Sin título") + '</a><span class="ih-tags">' + (function (o) {
        return o ? '<span class="porig' + (o.indexOf("Pendiente") === 0 ? " late" : "") + '">' + esc(o) + "</span>" : "";
      })(pautaOrigen(p, monthKey(S.cy, S.cm))) + '<span class="tag">' + fIcon(p.format) + f.label + "</span></span></div>" +
      '<div class="det">' + det.join(" · ") + "</div>" +
      (p.direction
        ? '<div class="det"><b>Dirección creativa:</b> ' + esc(p.direction) + "</div>"
        : "") +
      (shots.length
        ? '<div class="plabel">' + esc(f.list) + '</div><ul class="pshots">' +
          shots.map(function (s, i) {
            return '<li class="' + (s.d ? "d" : "") +
              '"><button class="ck" type="button" role="checkbox" aria-checked="' + (!!s.d) +
              '" aria-label="' + esc(s.t) + '" data-act="pshot" data-id="' + esc(p.id) +
              '" data-i="' + i + '">' + CHECK_SVG + "</button><span>" + esc(s.t) + "</span></li>";
          }).join("") + "</ul>"
        : "") +
      (voice.length
        ? '<div class="plabel">Guión de voz</div><ul class="pvoice">' + voice.map(function (l) {
          return "<li>" + esc(l) + "</li>";
        }).join("") + "</ul>"
        : "") +
      (p.refShow !== false && hasRefs(p) ? refsBlock(p) : "") +
      "</div></div>";
  }
  function viewPauta() {
    var d = pautaData(), handle = (S.account.handle || "").trim();
    var h = notices() + monthBar();
    h += '<div class="ptools"><div class="seg" role="group" aria-label="Agrupar por">' +
      [["tipo", "Tipo"], ["locacion", "Locación"], ["fecha", "Fecha"]].map(function (x) {
        return '<button type="button" data-act="group" data-v="' + x[0] + '" aria-pressed="' +
          (S.group === x[0]) + '">' + x[1] + "</button>";
      }).join("") + "</div>" +
      '<button class="tog eye" type="button" data-act="toggledone" aria-pressed="' + S.showDone +
      '" title="Mostrar u ocultar las piezas ya tomadas">' + (S.showDone ? EYE_SVG : EYEOFF_SVG) +
      "<span>Tomados</span></button>" +
      (S.canWrite ? '<button class="btn" type="button" data-act="traer">+ Traer de ' + MONTHS[(S.cm + 1) % 12].toLowerCase() + "</button>" : "") +
      '<button class="btn primary pdfbtn" type="button" data-act="dlpdf">Descargar PDF</button></div>';
    h += '<article class="doc"><h2>Pauta audiovisual</h2><p class="sub">' +
      (handle ? esc(handle) + " · " : "") + MONTHS[S.cm] + " " + S.cy + "</p>";
    if (!S.loaded.posts && !S.posts.size) {
      h += '<p class="muted" style="margin-top:16px">Cargando…</p></article>';
      main.innerHTML = h;
      return;
    }
    if (!d.all.length) {
      h += '<div class="empty" style="margin-top:20px"><h3>No hay piezas para grabar en ' +
        MONTHS[S.cm].toLowerCase() +
        "</h3><p>En cada post activa «Incluir en la pauta» y ponle fecha en este mes. Los reels y las fotos lo traen activado." +
        (d.noShoot
          ? " Hay " + plural(d.noShoot, "post", "posts") + " este mes que no están en la pauta."
          : "") +
        "</p></div>";
    } else {
      h += '<p class="sum">' + esc(summaryTxt(d)) + "</p>";
      if (!d.items.length) {
        h +=
          '<p class="muted" style="margin-top:18px">Todo está tomado. Activa «Tomados» (el ojo) para ver la lista completa.</p>';
      }
      d.groups.forEach(function (g) {
        h += "<h3>" + (g.icon || "") + esc(g.title) + " <span>" + g.items.length + "</span></h3>" +
          g.items.map(pautaItem).join("");
      });
    }
    main.innerHTML = h + "</article>";
  }

  /* ---------- PDF (Dual Studio) ---------- */
  function pdfClean(t) {
    return String(t == null ? "" : t).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(
      /[–—]/g,
      "-",
    )
      .replace(/…/g, "...").replace(/•/g, "-").replace(/ /g, " ").replace(/[^\u0000-ÿ]/g, "");
  }
  function loadImgData(id) {
    return new Promise(function (res) {
      if (typeof Image === "undefined") {
        res(null);
        return;
      }
      var img = new Image();
      img.onload = function () {
        try {
          var s = Math.min(1, 1500 / Math.max(img.naturalWidth, img.naturalHeight)),
            cv = document.createElement("canvas");
          cv.width = Math.max(1, Math.round(img.naturalWidth * s));
          cv.height = Math.max(1, Math.round(img.naturalHeight * s));
          var cx = cv.getContext("2d");
          cx.fillStyle = "#fff";
          cx.fillRect(0, 0, cv.width, cv.height);
          cx.drawImage(img, 0, 0, cv.width, cv.height);
          res({ d: cv.toDataURL("image/jpeg", 0.8), w: cv.width, h: cv.height });
        } catch (e) {
          res(null);
        }
      };
      img.onerror = function () {
        res(null);
      };
      img.src = "" + window.PLANIFICA.img + id;
    });
  }
  function pdfImageIds(d) {
    var ids = [];
    d.items.forEach(function (p) {
      if (p.refShow !== false) {
        refImgs(p).forEach(function (x) {
          if (ids.indexOf(x.id) < 0) ids.push(x.id);
        });
      }
    });
    return ids;
  }
  function buildPdf(d, imgs) {
    var J = window.jspdf && window.jspdf.jsPDF;
    if (!J) return null;
    imgs = imgs || {};
    var doc = new J({ unit: "pt", format: "letter" });
    var W = 612,
      H = 792,
      M = 40,
      CW = W - 2 * M,
      TOP = 46,
      BOT = H - 54,
      y = TOP,
      PAD = 12,
      CKW = 26,
      IX = M + PAD + CKW,
      IW = CW - 2 * PAD - CKW;
    var C = {
      ink: "#14161c",
      ink2: "#4b5160",
      ink3: "#757c8c",
      line: "#dfe2e9",
      soft: "#f3f4f7",
      ok: "#0f7f64",
      accent: "#3342e8",
      white: "#ffffff",
    };
    var FC = {
      reel: ["#cf2f6c", "#fde8f0"],
      carrusel: ["#2561d6", "#e5eefc"],
      foto: ["#0f7f64", "#dff3ec"],
      historia: ["#a86208", "#fcefd9"],
      diseno: ["#6d3fd1", "#efe8fc"],
    };
    var handle = pdfClean((S.account.handle || "").trim());
    function rgb(h) {
      return [
        parseInt(h.slice(1, 3), 16),
        parseInt(h.slice(3, 5), 16),
        parseInt(h.slice(5, 7), 16),
      ];
    }
    function fill(h) {
      var c = rgb(h);
      doc.setFillColor(c[0], c[1], c[2]);
    }
    function stroke(h) {
      var c = rgb(h);
      doc.setDrawColor(c[0], c[1], c[2]);
    }
    function ink(h) {
      var c = rgb(h);
      doc.setTextColor(c[0], c[1], c[2]);
    }
    function font(style, size, color) {
      doc.setFont("helvetica", style);
      doc.setFontSize(size);
      ink(color);
    }
    function newPage() {
      doc.addPage();
      y = TOP;
    }
    function box(x, by, sz, on) {
      if (on) {
        fill(C.ok);
        stroke(C.ok);
        doc.setLineWidth(1);
        doc.roundedRect(x, by, sz, sz, 2.5, 2.5, "FD");
        stroke(C.white);
        doc.setLineWidth(sz > 12 ? 1.8 : 1.4);
        doc.line(x + sz * .24, by + sz * .52, x + sz * .43, by + sz * .72);
        doc.line(x + sz * .43, by + sz * .72, x + sz * .78, by + sz * .28);
      } else {
        fill(C.white);
        stroke(C.ink3);
        doc.setLineWidth(1.1);
        doc.roundedRect(x, by, sz, sz, 2.5, 2.5, "FD");
      }
    }
    function wrap(text, size, style, width, label) {
      font(style, size, C.ink);
      var lw = 0;
      if (label) {
        doc.setFont("helvetica", "bold");
        lw = doc.getTextWidth(label + " ");
        doc.setFont("helvetica", style);
      }
      var out = [];
      pdfClean(text).split("\n").forEach(function (par) {
        var words = par.split(/\s+/).filter(Boolean), line = "";
        if (!words.length) {
          out.push("");
          return;
        }
        words.forEach(function (w) {
          var avail = width - (out.length === 0 ? lw : 0), test = line ? line + " " + w : w;
          if (doc.getTextWidth(test) <= avail) {
            line = test;
            return;
          }
          if (line) {
            out.push(line);
            line = "";
            avail = width;
          }
          if (doc.getTextWidth(w) > avail) {
            var parts = doc.splitTextToSize(w, avail);
            for (var i = 0; i < parts.length - 1; i++) out.push(parts[i]);
            line = parts[parts.length - 1];
          } else line = w;
        });
        out.push(line);
      });
      return { lines: out, lw: lw };
    }
    function strike(x, by, w, col) {
      stroke(col);
      doc.setLineWidth(.8);
      doc.line(x, by, x + w, by);
    }

    function itemOps(p) {
      var f = FORMATS[p.format] || FORMATS.reel,
        fc = FC[p.format] || FC.reel,
        taken = isTaken(p),
        ops = [];
      var tag = pdfClean(f.label), ico = FICON[p.format];
      font("bold", 8.5, C.ink);
      var tw = doc.getTextWidth(tag) + 14 + (ico ? 13 : 0);
      var tt = wrap(p.title || "Sin título", 12.5, "bold", IW - tw - 10), tlh = 16;
      ops.push({
        h: tt.lines.length * tlh + 4,
        keep: true,
        draw: function (yy) {
          box(M + PAD, yy + 1, 14, taken);
          font("bold", 12.5, taken ? C.ink3 : C.ink);
          tt.lines.forEach(function (l, i) {
            doc.text(l, IX, yy + i * tlh + 12);
            if (taken) strike(IX, yy + i * tlh + 8.5, doc.getTextWidth(l), C.ink3);
          });
          fill(fc[1]);
          doc.roundedRect(M + CW - PAD - tw, yy, tw, 15, 4, 4, "F");
          if (ico) doc.addImage(ico, "PNG", M + CW - PAD - tw + 6, yy + 2.5, 10, 10);
          font("bold", 8.5, fc[0]);
          doc.text(tag, M + CW - PAD - tw + 7 + (ico ? 13 : 0), yy + 10.5);
        },
      });
      function para(label, text, keep) {
        var w = wrap(text, 9.5, "normal", IW, label);
        ops.push({
          h: w.lines.length * 13 + 3,
          keep: keep,
          draw: function (yy) {
            w.lines.forEach(function (l, i) {
              if (i === 0 && label) {
                font("bold", 9.5, C.ink);
                doc.text(pdfClean(label), IX, yy + 9.5);
                font("normal", 9.5, C.ink2);
                doc.text(l, IX + w.lw, yy + 9.5);
              } else {
                font("normal", 9.5, C.ink2);
                doc.text(l, IX, yy + i * 13 + 9.5);
              }
            });
          },
        });
      }
      function section(label) {
        ops.push({
          h: 22,
          keep: true,
          draw: function (yy) {
            font("bold", 7.5, C.ink3);
            doc.text(pdfClean(label).toUpperCase(), IX, yy + 15);
          },
        });
      }
      var orig = pautaOrigen(p, monthKey(S.cy, S.cm));
      para("Publica:", whenTxt(p) + " · " + platTxt(p) + (orig ? " · " + orig : ""));
      if (p.location) para("Locación:", p.location);
      if (p.props) para("Props / vestuario:", p.props);
      if (p.direction) para("Dirección creativa:", p.direction);
      var dhref = driveHref(p.drive);
      if (dhref) {
        ops.push({
          h: 16,
          draw: function (yy) {
            font("bold", 9.5, C.ink);
            var lb = "Carpeta de Drive: ", lw = doc.getTextWidth(lb);
            doc.text(lb, IX, yy + 9.5);
            font("normal", 9.5, C.accent);
            var t = doc.splitTextToSize("Abrir carpeta", IW - lw)[0];
            doc.textWithLink(t, IX + lw, yy + 9.5, { url: dhref });
            stroke(C.accent);
            doc.setLineWidth(.5);
            doc.line(IX + lw, yy + 11, IX + lw + doc.getTextWidth(t), yy + 11);
          },
        });
      }
      var shots = getShots(p), voice = voiceLines(p);
      if (shots.length) {
        section(f.list);
        shots.forEach(function (s) {
          var w = wrap(s.t, 9.5, "normal", IW - 20);
          ops.push({
            h: w.lines.length * 13 + 5,
            draw: function (yy) {
              box(IX, yy + 1, 10, !!s.d);
              font("normal", 9.5, s.d ? C.ink3 : C.ink);
              w.lines.forEach(function (l, i) {
                doc.text(l, IX + 20, yy + i * 13 + 9.5);
                if (s.d) strike(IX + 20, yy + i * 13 + 6.5, doc.getTextWidth(l), C.ink3);
              });
            },
          });
        });
      }
      if (voice.length) {
        section("Guión de voz");
        voice.forEach(function (l) {
          var w = wrap(l, 9.5, "normal", IW - 14);
          ops.push({
            h: w.lines.length * 13 + 3,
            draw: function (yy) {
              fill(C.ink3);
              doc.circle(IX + 3, yy + 6, 1.4, "F");
              font("normal", 9.5, C.ink2);
              w.lines.forEach(function (t, i) {
                doc.text(t, IX + 14, yy + i * 13 + 9.5);
              });
            },
          });
        });
      }
      if (p.refShow !== false && hasRefs(p)) {
        var pics = refImgs(p).map(function (x) {
            return imgs[x.id];
          }).filter(Boolean),
          links = extractLinks(p.refs);
        if (pics.length || links.length) {
          section("Referencias");
          var IMGH = 180, rows = [], cur = [], cw = 0, rh = 0;
          pics.forEach(function (im) {
            var h = IMGH, w = h * im.w / im.h;
            if (w > IW) {
              w = IW;
              h = w * im.h / im.w;
            }
            if (cur.length && cw + 8 + w > IW) {
              rows.push({ items: cur, h: rh });
              cur = [];
              cw = 0;
              rh = 0;
            }
            cur.push({ im: im, w: w, h: h });
            cw += (cur.length > 1 ? 8 : 0) + w;
            rh = Math.max(rh, h);
          });
          if (cur.length) rows.push({ items: cur, h: rh });
          rows.forEach(function (r) {
            ops.push({
              h: r.h + 8,
              draw: function (yy) {
                var x = IX;
                r.items.forEach(function (it) {
                  doc.addImage(it.im.d, "JPEG", x, yy, it.w, it.h);
                  stroke(C.line);
                  doc.setLineWidth(.6);
                  doc.roundedRect(x, yy, it.w, it.h, 4, 4, "D");
                  x += it.w + 8;
                });
              },
            });
          });
          links.forEach(function (lk) {
            var lab = pdfClean(lk.label);
            font("normal", 9.5, C.accent);
            var t = doc.splitTextToSize(lab, IW)[0];
            ops.push({
              h: 14,
              draw: function (yy) {
                font("normal", 9.5, C.accent);
                doc.textWithLink(t, IX, yy + 9.5, { url: lk.href });
                stroke(C.accent);
                doc.setLineWidth(.5);
                doc.line(IX, yy + 11, IX + doc.getTextWidth(t), yy + 11);
              },
            });
          });
        }
      }
      return ops;
    }
    function drawItem(p) {
      var ops = itemOps(p),
        total = PAD * 2 + ops.reduce(function (a, o) {
          return a + o.h;
        }, 0);
      if (total <= BOT - TOP && y + total > BOT) newPage();
      var cy0 = y;
      y += PAD;
      function closeCard() {
        stroke(C.line);
        doc.setLineWidth(.8);
        doc.roundedRect(M, cy0, CW, y + PAD - cy0, 8, 8, "D");
      }
      ops.forEach(function (op, i) {
        var need = op.h + (op.keep && ops[i + 1] ? ops[i + 1].h : 0);
        if (y > cy0 + PAD && y + need + PAD > BOT) {
          closeCard();
          newPage();
          cy0 = y;
          y += PAD;
        }
        op.draw(y);
        y += op.h;
      });
      closeCard();
      y += PAD + 8;
    }
    function groupHead(name, count, first, fk) {
      var fo = first ? itemOps(first) : [],
        ftot = PAD * 2 + fo.reduce(function (a, o) {
          return a + o.h;
        }, 0);
      var need = 30 +
        (ftot <= BOT - TOP ? ftot : PAD + (fo[0] ? fo[0].h : 0) + (fo[1] ? fo[1].h : 0));
      if (y > TOP + 4 && y + need > BOT) newPage();
      if (y > TOP + 4) y += 10;
      var gi = fk && FICON[fk];
      if (gi) doc.addImage(gi, "PNG", M, y + 1, 15, 15);
      var gx = M + (gi ? 20 : 0);
      font("bold", 13, C.ink);
      doc.text(pdfClean(name), gx, y + 13);
      var nw = doc.getTextWidth(pdfClean(name));
      font("normal", 9.5, C.ink3);
      doc.text(String(count), gx + nw + 8, y + 13);
      stroke(C.line);
      doc.setLineWidth(.8);
      doc.line(M, y + 21, W - M, y + 21);
      y += 30;
    }

    /* Encabezado */
    font("bold", 26, C.ink);
    doc.text("Pauta audiovisual", M, y + 22);
    font("normal", 11, C.ink2);
    doc.text(pdfClean((handle ? handle + " · " : "") + MONTHS[S.cm] + " " + S.cy), M, y + 40);
    y += 54;
    var sw = wrap(summaryTxt(d), 9.5, "normal", CW - 28), sh = sw.lines.length * 13 + 18;
    fill(C.soft);
    doc.roundedRect(M, y, CW, sh, 6, 6, "F");
    font("normal", 9.5, C.ink2);
    sw.lines.forEach(function (l, i) {
      doc.text(l, M + 14, y + 9 + i * 13 + 9.5);
    });
    y += sh + 6;
    if (!d.items.length) {
      font("normal", 10, C.ink3);
      doc.text("Todo está tomado.", M, y + 16);
    }
    d.groups.forEach(function (g) {
      groupHead(
        g.title,
        g.items.length,
        g.items[0],
        S.group === "tipo" && g.items[0] ? g.items[0].format : null,
      );
      g.items.forEach(drawItem);
    });

    var total = doc.getNumberOfPages();
    for (var i = 1; i <= total; i++) {
      doc.setPage(i);
      font("normal", 8.5, C.ink3);
      doc.text("Dual Studio" + (handle ? "  |  " + handle : ""), M, H - 28);
      doc.text(i + " / " + total, W - M, H - 28, { align: "right" });
    }
    return doc.output("arraybuffer");
  }

  /* ---------- Métricas de Instagram ---------- */
  // Los datos llegan con /api/datos (conexion.js → window.PLANIFICA.redes): la conexión del cliente, las métricas
  // de cada post vinculado y las cifras de la cuenta por mes. El dashboard pide aparte las cifras diarias.
  function RD() {
    return (window.PLANIFICA && window.PLANIFICA.redes) ||
      { conexiones: {}, metricas: {}, cuentaMes: {} };
  }
  function igCon() {
    return RD().conexiones.ig || null;
  }
  function igMet(p) {
    var x = RD().metricas[p.id];
    return (x && x.ig) || null;
  }
  var MET = {
    alcance: "Alcance",
    reproducciones: "Reproducciones",
    interacciones: "Interacciones",
    likes: "Likes",
    comentarios: "Comentarios",
    compartidos: "Compartidos",
    guardados: "Guardados",
  };
  var MET_ORDER = ["alcance", "reproducciones", "interacciones", "likes", "comentarios", "compartidos", "guardados"];
  /** Las historias no tienen métricas ni impulsos: solo cuentan los posts del feed y los reels. */
  function medible(p) {
    return p.format !== "historia";
  }
  function hasIg(p) {
    return medible(p) && (p.platforms || []).indexOf("ig") >= 0;
  }
  /** Resumen corto para la Lista: alcance y likes de un post publicado. */
  function igSummary(p) {
    var x = igMet(p), m = x && x.m;
    if (!m) return "";
    var parts = [];
    if (m.alcance != null) parts.push(fmtNum(m.alcance) + " alcance");
    if (m.likes != null) parts.push(fmtNum(m.likes) + " likes");
    if (m.comentarios != null) parts.push(fmtNum(m.comentarios) + " coment.");
    return parts.length
      ? '<span class="msum" title="Métricas de Instagram">' + IG_SVG + parts.join(" · ") + "</span>"
      : "";
  }
  var IG_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="3.5"/><circle cx="8" cy="8" r="2.8"/><circle cx="11.6" cy="4.4" r=".6" fill="currentColor" stroke="none"/></svg>';
  function minutesLeft(ts) {
    return Math.max(0, Math.ceil((ts - Date.now()) / 60000));
  }
  function igUpdButton(cls) {
    var c = igCon();
    if (!c || !S.canWrite || c.estado === "error") return "";
    var wait = minutesLeft(c.actualizar_desde || 0);
    return '<button class="btn sm ' + (cls || "") + '" type="button" data-act="igupd"' +
      (wait || S.igBusy ? " disabled" : "") + ' title="' +
      (wait ? "Podrás volver a actualizar en " + wait + " min" : "Traer las métricas de Instagram ahora") +
      '">' + (S.igBusy ? "Actualizando…" : "Actualizar") + "</button>";
  }
  function igLastTxt() {
    var c = igCon();
    return c && c.sincronizado_en ? "Actualizado " + relTime(c.sincronizado_en) : "Aún sin actualizar";
  }
  function thumbHtml(p, x, cls) {
    if (x && x.miniatura) {
      return '<img class="' + (cls || "mthumb") + '" src="' + window.PLANIFICA.img + esc(x.miniatura) +
        '" alt="" loading="lazy">';
    }
    return '<span class="' + (cls || "mthumb") + ' ph f-' + esc(p.format) + '" aria-hidden="true">' +
      fIcon(p.format) + "</span>";
  }
  /** Aviso cuando Instagram no está conectado (o falló): qué se gana y cómo conectarlo. */
  function igConnectUrl() {
    return window.PLANIFICA.base + "/admin?instagram=" + encodeURIComponent(window.PLANIFICA.cliente);
  }
  function igConnectNotice(texto, compacto) {
    if (!S.canWrite) return ""; // aviso interno: ni el cliente ni la vista del cliente lo ven
    var c = igCon(), roto = c && c.estado === "error";
    var titulo = roto ? "Hay que volver a conectar Instagram" : "Conecta Instagram";
    var cuerpo = roto
      ? "La conexión con @" + esc(c.usuario) + " dejó de funcionar" + (c.error ? ": " + esc(c.error) : ".")
      : texto;
    var accion = window.PLANIFICA.esAdmin
      ? '<a class="btn sm primary" href="' + esc(igConnectUrl()) + '">' + IG_SVG + (roto ? "Reconectar" : "Conectar Instagram") + "</a>"
      : '<span class="muted small">Pídeselo a un administrador de Dual Studio.</span>';
    return '<div class="connect' + (compacto ? " sm" : "") + '"><span class="cn-ic">' + IG_SVG + '</span><div class="cn-b"><b>' +
      titulo + "</b><p>" + cuerpo + "</p></div>" + accion + "</div>";
  }
  /** Cuerpo de la tarjeta «Métricas de Instagram» en el detalle del post. */
  function igCardBody(p) {
    var c = igCon(), x = igMet(p), link = String(p.igLink || "").trim();
    if (!c || c.estado === "error") {
      return igConnectNotice("Así verás el alcance, los likes y los guardados de este post.", true) +
        (link
          ? '<p class="muted small">El link ya está guardado: se vinculará solo cuando la cuenta esté conectada.</p>'
          : '<p class="muted small">Puedes pegar el link igual: se vinculará solo cuando la cuenta esté conectada.</p>');
    }
    if (!link) {
      return '<p class="muted">' + (p.status === "publicado"
        ? "¿Ya está en Instagram? Pega su link arriba para ver sus métricas."
        : "Cuando se publique, pega su link arriba para ver sus métricas.") + "</p>";
    }
    if (S.igLinking === p.id || (x && !x.encontrado && !x.error) || !x) {
      return '<p class="muted">Buscando el post en @' + esc(c.usuario) + "…</p>";
    }
    if (!x.encontrado || !x.m) {
      return '<p class="warn-note">' + esc(x.error || "Aún no hay métricas de este post.") + "</p>";
    }
    // Alcance y reproducciones van juntos: cuentas distintas que lo vieron y cuántas veces se vio en total.
    var tiles = MET_ORDER.filter(function (k) {
      return x.m[k] != null && k !== "reproducciones";
    }).map(function (k) {
      if (k === "alcance") {
        return '<div class="mtile wide"><b>' + fmtNum(x.m.alcance) + "</b><span>Alcance: cuentas que lo vieron" +
          (x.m.reproducciones != null
            ? ". Se vio " + fmtNum(x.m.reproducciones) + " veces" +
              (x.m.alcance ? " (" + fmtNum(x.m.reproducciones / x.m.alcance, 1) + " por cuenta)" : "")
            : "") + "</span></div>";
      }
      return '<div class="mtile"><b>' + fmtNum(x.m[k]) + "</b><span>" + MET[k] + "</span></div>";
    }).join("");
    return '<div class="mhead">' + thumbHtml(p, x) + '<div class="mtiles">' + tiles + "</div></div>" +
      '<p class="hint"><span>' + (x.at ? "Actualizado " + relTime(x.at) : "") +
      (x.error ? ' · <span class="over">' + esc(x.error) + "</span>" : "") +
      '</span><a class="btn sm ghost" href="' + esc(driveHref(link) || "#") +
      '" target="_blank" rel="noopener noreferrer">Ver en Instagram</a></p>';
  }
  function paintIg(p) {
    var card = $("#igCard");
    if (!card) return;
    card.hidden = !hasIg(p);
    var body = igCardBody(p);
    var b = $("#igBody");
    if (b.dataset.sig !== body) {
      b.innerHTML = body;
      b.dataset.sig = body;
    }
    var act = link4upd(p) ? igUpdButton() : "";
    var a = $("#igAct");
    if (a.dataset.sig !== act) {
      a.innerHTML = act;
      a.dataset.sig = act;
    }
  }
  function link4upd(p) {
    var x = igMet(p);
    return !!(x && x.encontrado);
  }
  /** Al terminar de escribir el link: se guarda y se busca el post al momento. */
  function linkIg(id) {
    var path = "posts/" + id;
    flush(path);
    var cn = igCon();
    if (!cn || cn.estado === "error") return; // se guarda; se vinculará al conectar la cuenta
    S.igLinking = id;
    paintDetail();
    (chain[path] || Promise.resolve()).then(function () {
      return window.PLANIFICA.api("/api/redes/vincular", {
        method: "POST",
        body: { publicacion_id: id, red: "ig" },
      });
    }).catch(function (e) {
      toast(e.message || "No se pudo buscar el post.");
    }).then(function () {
      return window.PLANIFICA.refrescar();
    }).then(function () {
      S.igLinking = null;
      if (S.view === "detalle") paintDetail();
      else render();
    });
  }
  function igUpdate() {
    if (S.igBusy) return;
    S.igBusy = true;
    if (S.view === "detalle") paintDetail();
    else render();
    window.PLANIFICA.api("/api/redes/actualizar", { method: "POST", body: { red: "ig" } })
      .then(function (r) {
        toast(r && r.ok === false ? (r.error || "No se pudo actualizar.") : r && r.faltan
          ? "Trayendo los últimos 3 meses: faltan " + plural(r.faltan, "día", "días") +
            ". Vuelve a pulsar Actualizar en un minuto, o se completa solo en las mañanas."
          : r && r.parcial
          ? "Actualizado en parte: el resto se completa en la próxima actualización."
          : "Métricas actualizadas");
        S.resCache = {};
      }, function (e) {
        toast(e.message || "No se pudo actualizar.");
      }).then(function () {
        return window.PLANIFICA.refrescar();
      }).then(function () {
        S.igBusy = false;
        if (S.view === "detalle") paintDetail();
        else render();
      });
  }

  /* Miniaturas propias: la imagen de Instagram pasa por el Worker, el navegador la achica a 320 px (WebP) y la
     sube. Solo quien puede editar; una a la vez y un intento por post y visita. */
  var thumbQ = [], thumbTried = {}, thumbBusy = false;
  function ensureThumbs() {
    if (!S.canWrite || !window.PLANIFICA || !window.PLANIFICA.url) return;
    var ms = RD().metricas;
    Object.keys(ms).forEach(function (id) {
      var x = ms[id].ig;
      if (x && x.falta_miniatura && !thumbTried[id]) {
        thumbTried[id] = 1;
        thumbQ.push(id);
      }
    });
    runThumbs();
  }
  function runThumbs() {
    if (thumbBusy || !thumbQ.length) return;
    thumbBusy = true;
    var id = thumbQ.shift();
    makeThumb(id).catch(function () {}).then(function () {
      thumbBusy = false;
      if (thumbQ.length) runThumbs();
      else window.PLANIFICA.refrescar();
    });
  }
  function makeThumb(id) {
    return fetch(window.PLANIFICA.url("/api/redes/miniatura-remota/" + encodeURIComponent(id) + "?red=ig"), {
      headers: { "x-app": "1" },
      credentials: "same-origin",
    }).then(function (r) {
      if (!r.ok) throw new Error("sin miniatura");
      return r.blob();
    }).then(function (blob) {
      return createImageBitmap(blob);
    }).then(function (bmp) {
      var k = Math.min(1, 320 / Math.max(bmp.width, bmp.height)),
        cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(bmp.width * k));
      cv.height = Math.max(1, Math.round(bmp.height * k));
      cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
      return new Promise(function (res) {
        cv.toBlob(res, "image/webp", 0.8);
      });
    }).then(function (b) {
      return new Promise(function (res, rej) {
        var fr = new FileReader();
        fr.onload = function () {
          res(fr.result);
        };
        fr.onerror = rej;
        fr.readAsDataURL(b);
      });
    }).then(function (datos) {
      return window.PLANIFICA.api("/api/redes/miniatura", {
        method: "POST",
        body: { publicacion_id: id, red: "ig", datos: datos },
      });
    });
  }

  /* ---------- Rendimiento (dashboard) ---------- */
  // Mes o trimestre del selector, con el periodo anterior para comparar. Las cifras diarias de la cuenta se
  // piden solo al abrir esta pestaña (no entran en el refresco de 30 s) y se guardan en memoria.
  function resQ() {
    return S.resPer === "q";
  }
  function resRange() {
    var y = S.cy, m0, m1;
    if (resQ()) {
      m0 = Math.floor(S.cm / 3) * 3;
      m1 = m0 + 2;
    } else m0 = m1 = S.cm;
    var n = m1 - m0 + 1, today = todayStr();
    var r = {
      desde: ymd(y, m0, 1),
      hasta: ymd(y, m1, new Date(y, m1 + 1, 0).getDate()),
      pDesde: ymd(new Date(y, m0 - n, 1).getFullYear(), new Date(y, m0 - n, 1).getMonth(), 1),
      pHasta: ymd(new Date(y, m0, 0).getFullYear(), new Date(y, m0, 0).getMonth(), new Date(y, m0, 0).getDate()),
      etiqueta: resQ() ? "trimestre anterior" : "mes anterior",
    };
    // Periodo en curso: se compara con el mismo número de días del periodo anterior (no con el periodo entero).
    r.cHasta = r.hasta;
    r.cpHasta = r.pHasta;
    if (today >= r.desde && today < r.hasta) {
      var dias = Math.round((dateObj(today) - dateObj(r.desde)) / 864e5);
      var pd = dateObj(r.pDesde);
      pd.setDate(pd.getDate() + dias);
      var lim = ymd(pd.getFullYear(), pd.getMonth(), pd.getDate());
      r.cHasta = today;
      r.cpHasta = lim < r.pHasta ? lim : r.pHasta;
      // (se compara con el mismo tramo de días, pero se nombra simplemente «mes/trimestre anterior»)
    }
    return r;
  }
  function resLoad(r) {
    var key = "ig|" + r.pDesde + "|" + r.hasta;
    S.resCache = S.resCache || {};
    var c = S.resCache[key];
    if (c) return c;
    c = S.resCache[key] = { loading: true };
    window.PLANIFICA.api("/api/resultados?red=ig&desde=" + r.pDesde + "&hasta=" + r.hasta).then(function (d) {
      c.loading = false;
      c.data = d;
    }, function (e) {
      c.loading = false;
      c.error = e.message || "No se pudieron cargar los resultados.";
      delete S.resCache[key];
      S.resCache["err|" + key] = c;
    }).then(function () {
      if (S.view === "rendimiento") render();
    });
    return c;
  }
  function sumBy(dias, k, a, b) {
    var t = 0, any = false;
    dias.forEach(function (d) {
      if (d.dia >= a && d.dia <= b && typeof d[k] === "number") {
        t += d[k];
        any = true;
      }
    });
    return any ? t : null;
  }
  function lastFollowers(dias, a, b) {
    var v = null;
    dias.forEach(function (d) {
      if (d.dia >= a && d.dia <= b && typeof d.seguidores === "number") v = d.seguidores;
    });
    return v;
  }
  function firstFollowers(dias, a, b) {
    for (var i = 0; i < dias.length; i++) {
      var d = dias[i];
      if (d.dia >= a && d.dia <= b && typeof d.seguidores === "number") return d.seguidores;
    }
    return null;
  }
  /** invert: en costos, bajar es mejorar (verde). */
  function deltaHtml(cur, prev, label, invert) {
    if (cur == null || prev == null || prev === 0) {
      return '<span class="kd">Aún sin datos para comparar</span>';
    }
    var pct = Math.round((cur - prev) / Math.abs(prev) * 100);
    var arrow = pct > 0 ? "↑" : pct < 0 ? "↓" : "=";
    var good = invert ? pct < 0 : pct > 0, bad = invert ? pct > 0 : pct < 0;
    return '<span class="kd' + (good ? " up" : bad ? " down" : "") + '">' + arrow + " " +
      Math.abs(pct) + " % vs. " + label + "</span>";
  }
  function kpi(label, val, delta, hint) {
    return '<div class="kpi"><span class="kl">' + label + "</span><b>" + val + "</b>" + (delta || "") +
      (hint ? '<span class="kh">' + hint + "</span>" : "") + "</div>";
  }

  /* Gráfico de línea de una sola serie (una escala, sin leyenda: el título la nombra). Con hover: línea guía,
     punto y valor del día. */
  var CHARTS = {};
  function lineChart(id, title, pts, bands) {
    // Tres gráficos por fila en escritorio, uno por fila en el teléfono: el tamaño de dibujo sigue al ancho real.
    var W = 380, H = 170, L = 44, R = 12, T = 12, B = 26;
    var vals = pts.filter(function (p) {
      return p.v != null;
    });
    if (vals.length < 2) {
      return '<div class="chart"><h4>' + title + '</h4><p class="gv-empty">Aún no hay suficientes días con datos. Se llena a diario desde que se conectó la cuenta.</p></div>';
    }
    var min = Math.min.apply(null, vals.map(function (p) {
        return p.v;
      })),
      max = Math.max.apply(null, vals.map(function (p) {
        return p.v;
      }));
    if (min === max) {
      min -= 1;
      max += 1;
    }
    var pad = (max - min) * 0.1;
    min = Math.max(0, min - pad);
    max += pad;
    var n = pts.length;
    function x(i) {
      return L + (n === 1 ? 0 : i * (W - L - R) / (n - 1));
    }
    function y(v) {
      return T + (1 - (v - min) / (max - min)) * (H - T - B);
    }
    var d = "", pen = false;
    pts.forEach(function (p, i) {
      if (p.v == null) {
        pen = false;
        return;
      }
      d += (pen ? "L" : "M") + x(i).toFixed(1) + " " + y(p.v).toFixed(1);
      pen = true;
    });
    var grid = "";
    [0, 0.5, 1].forEach(function (f) {
      var v = min + (max - min) * f, yy = y(v);
      grid += '<line class="gl" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy.toFixed(1) + '" y2="' +
        yy.toFixed(1) + '"/><text class="ax" x="' + (L - 6) + '" y="' + (yy + 3.5).toFixed(1) +
        '" text-anchor="end">' + fmtCompact(v) + "</text>";
    });
    var ticks = "";
    [0, Math.floor((n - 1) / 2), n - 1].forEach(function (i, k, arr) {
      if (k && i === arr[k - 1]) return;
      ticks += '<text class="ax" x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' +
        (k === 0 ? "start" : k === 2 ? "end" : "middle") + '">' + esc(fmtShort(pts[i].dia)) + "</text>";
    });
    CHARTS[id] = { pts: pts, x: x, y: y, W: W, title: title };
    var step = n > 1 ? (W - L - R) / (n - 1) : 0;
    var bandSvg = (bands || []).map(function (bd) {
      var x0 = Math.max(L, x(bd[0]) - step / 2), x1 = Math.min(W - R, x(bd[1]) + step / 2);
      return '<rect class="band" x="' + x0.toFixed(1) + '" y="' + T + '" width="' + Math.max(2, x1 - x0).toFixed(1) +
        '" height="' + (H - T - B) + '"/>';
    }).join("");
    return '<div class="chart"><h4>' + title + '</h4><div class="cw"><svg viewBox="0 0 ' + W + " " + H +
      '" role="img" aria-label="' + esc(title) + '" data-chart="' + id + '">' + bandSvg + grid + ticks +
      '<path class="ln" d="' + d + '"/><line class="cx" x1="0" x2="0" y1="' + T + '" y2="' + (H - B) +
      '" hidden/><circle class="cd" r="4.5" cx="0" cy="0" hidden/>' +
      '<rect class="hit" x="' + L + '" y="0" width="' + (W - L - R) + '" height="' + H + '"/></svg>' +
      '<div class="ctip" hidden></div></div></div>';
  }
  function fmtCompact(v) {
    var a = Math.abs(v);
    if (a >= 1e6) return fmtNum(v / 1e6, 1) + " M";
    if (a >= 1e4) return fmtNum(v / 1e3, 0) + " mil";
    return fmtNum(Math.round(v));
  }
  function chartHover(e) {
    var svg = e.target.closest && e.target.closest("svg[data-chart]");
    if (!svg) return;
    var c = CHARTS[svg.dataset.chart];
    if (!c) return;
    var r = svg.getBoundingClientRect(), px = (e.clientX - r.left) * c.W / r.width;
    var best = -1, bd = 1e9;
    c.pts.forEach(function (p, i) {
      if (p.v == null) return;
      var dd = Math.abs(c.x(i) - px);
      if (dd < bd) {
        bd = dd;
        best = i;
      }
    });
    if (best < 0) return;
    var p = c.pts[best], cx = svg.querySelector(".cx"), cd = svg.querySelector(".cd"),
      tip = svg.parentNode.querySelector(".ctip");
    cx.setAttribute("x1", c.x(best));
    cx.setAttribute("x2", c.x(best));
    cd.setAttribute("cx", c.x(best));
    cd.setAttribute("cy", c.y(p.v));
    cx.hidden = cd.hidden = tip.hidden = false;
    cx.removeAttribute("hidden");
    cd.removeAttribute("hidden");
    tip.innerHTML = "<b>" + fmtNum(p.v) + "</b> " + esc(fmtShort(p.dia));
    var left = c.x(best) / c.W * r.width;
    tip.style.left = Math.min(Math.max(0, left - 50), r.width - 110) + "px";
  }
  function chartLeave(e) {
    var svg = e.target.closest && e.target.closest("svg[data-chart]");
    if (!svg) return;
    svg.querySelector(".cx").setAttribute("hidden", "");
    svg.querySelector(".cd").setAttribute("hidden", "");
    svg.parentNode.querySelector(".ctip").hidden = true;
  }
  document.addEventListener("pointermove", chartHover);
  document.addEventListener("pointerout", function (e) {
    if (e.target.classList && e.target.classList.contains("hit")) chartLeave(e);
  });

  var DOW_LONG_DOM = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  /** Mapa de calor de la audiencia: una sola tinta (más oscuro = más seguidores conectados). */
  function heatmap(a) {
    if (!a || a.length !== 7) {
      return '<p class="gv-empty">Instagram da este dato una vez por semana. Aparecerá tras la próxima actualización.</p>';
    }
    var max = 0, min = Infinity, best = [];
    a.forEach(function (row, d) {
      row.forEach(function (v, h) {
        if (v > max) max = v;
        if (v < min) min = v;
        best.push({ d: d, h: h, v: v });
      });
    });
    if (!max) return '<p class="gv-empty">Aún no hay datos de audiencia.</p>';
    best.sort(function (p, q) {
      return q.v - p.v;
    });
    var order = [1, 2, 3, 4, 5, 6, 0], h = '<div class="hm" role="img" aria-label="Seguidores conectados por día y hora">';
    h += '<span></span>' + Array.apply(null, Array(24)).map(function (_, i) {
      return '<span class="hx">' + (i % 3 === 0 ? i : "") + "</span>";
    }).join("");
    order.forEach(function (d) {
      h += '<span class="hy">' + DOW[dowMon(new Date(2024, 0, 7 + d))] + "</span>";
      a[d].forEach(function (v, hr) {
        var k = max > min ? 0.08 + 0.92 * (v - min) / (max - min) : 1;
        h += '<i style="--k:' + (Math.round(k * 100) / 100) + '" title="' + cap(DOW_LONG_DOM[d]) + " " + hr +
          ":00 · " + fmtNum(v) + ' seguidores conectados"></i>';
      });
    });
    h += "</div>";
    var top = best.slice(0, 3).map(function (b) {
      return DOW_LONG_DOM[b.d] + " a las " + b.h + ":00";
    });
    return '<p class="hm-top"><b>Mejores momentos:</b> ' + esc(top.join(", ")) + ".</p>" + h +
      '<p class="hint" style="min-height:0"><span>Promedio de seguidores conectados por hora (hora de Venezuela), de los últimos 30 días.</span></p>';
  }

  /** «Plan contra realidad» sin métricas: planificados y publicados del periodo. */
  function planVsReal(r, withLinks) {
    var planned = allPosts().filter(function (p) {
        return p.date && p.date >= r.desde && p.date <= r.hasta;
      }),
      published = planned.filter(function (p) {
        return p.status === "publicado";
      });
    return '<section class="card" style="margin-top:16px"><h3>Plan contra realidad</h3><div class="pvr two">' +
      "<div><b>" + planned.length + "</b><span>planificados</span></div>" +
      "<div><b>" + published.length + "</b><span>publicados</span></div></div></section>";
  }
  var TT_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 2v8.25a2.75 2.75 0 1 1-2.75-2.75"/><path d="M9.5 2c.3 1.9 1.6 3.1 3.5 3.25"/></svg>';
  var SORT_KEYS = [["alcance", "Alcance"], ["interacciones", "Interacciones"], ["likes", "Likes"], ["guardados", "Guardados"], ["compartidos", "Compartidos"]];
  function postDay(p, x) {
    return (x && x.publicado_en ? String(x.publicado_en).slice(0, 10) : "") || p.date || "";
  }
  /* ---------- Ads (presupuesto e impulsos) ---------- */
  // Llegan con /api/datos (conexion.js → window.PLANIFICA.ads). El gasto de un impulso cuenta en el mes en que empezó.
  function ADS() {
    return (window.PLANIFICA && window.PLANIFICA.ads) || { presupuestos: {}, impulsos: [] };
  }
  function fmtUsd(n) {
    if (n == null || !isFinite(n)) return "–";
    return fmtNum(n, Math.round(n * 100) % 100 === 0 ? 0 : 2) + " USD";
  }
  function monthsIn(desde, hasta) {
    var out = [], y = Number(desde.slice(0, 4)), m = Number(desde.slice(5, 7)) - 1, end = hasta.slice(0, 7);
    while (monthKey(y, m) <= end && out.length < 36) {
      out.push(monthKey(y, m));
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
    return out;
  }
  /** Impulsos de este cliente en el periodo (los de otras cuentas en posts compartidos no cuentan aquí). */
  function impulsosEn(desde, hasta) {
    var a = desde.slice(0, 7), b = hasta.slice(0, 7);
    return ADS().impulsos.filter(function (i) {
      var k = i.inicio.slice(0, 7);
      return !i.ajeno && k >= a && k <= b;
    });
  }
  function impulsosDe(postId) {
    return ADS().impulsos.filter(function (i) {
      return i.publicacion_id === postId;
    });
  }
  function adsTotals(list) {
    var t = { n: list.length, gastado: 0 };
    ["alcance", "clics", "mensajes", "visitas", "seguidores"].forEach(function (k) {
      t[k] = null;
    });
    list.forEach(function (i) {
      t.gastado += i.gastado || 0;
      Object.keys(i.resultados || {}).forEach(function (k) {
        if (k in t) t[k] = (t[k] || 0) + i.resultados[k];
      });
    });
    return t;
  }
  function budgetIn(desde, hasta) {
    var sum = 0, any = false;
    monthsIn(desde, hasta).forEach(function (m) {
      var b = ADS().presupuestos[m];
      if (b) {
        sum += b.monto;
        any = true;
      }
    });
    return any ? sum : null;
  }
  function costPer(g, n) {
    return n ? g / n : null;
  }
  var OBJ_LABEL = { clics: "Clics al enlace", mensajes: "Mensajes", perfil: "Visitas al perfil", alcance: "Alcance" };
  var RES_LABEL = {
    alcance: "Alcance",
    clics: "Clics al enlace",
    mensajes: "Mensajes",
    visitas: "Visitas al perfil",
    seguidores: "Seguidores",
  };
  var RES_CHIP = {
    alcance: "alcance",
    clics: "clics al enlace",
    mensajes: "mensajes",
    visitas: "visitas al perfil",
    seguidores: "seguidores",
  };
  /** Monto para las cifras grandes: el «USD» más pequeño, para que no se parta la línea. */
  function usdBig(n) {
    if (n == null || !isFinite(n)) return "–";
    return fmtNum(n, Math.round(n * 100) % 100 === 0 ? 0 : 2) + ' <small class="cur">USD</small>';
  }
  var BOOST_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 1.75L3.5 9h4l-1 5.25L12.5 7h-4z"/></svg>';
  /** Marca para la Lista y el Calendario: «Impulsado · 35 USD». */
  function boostBadge(p, short) {
    var list = impulsosDe(p.id);
    if (!list.length) return "";
    var g = adsTotals(list).gastado;
    return '<span class="boost" title="Impulsado · ' + esc(fmtUsd(g)) + '">' + BOOST_SVG +
      (short ? "" : "Impulsado · " + esc(fmtUsd(g))) + "</span>";
  }
  function impDates(i) {
    return fmtShort(i.inicio) + (i.fin ? " – " + fmtShort(i.fin) : " · en curso");
  }
  /** Presupuesto: lo invertido y el saldo, en una línea secundaria (con aviso al 80 % y en rojo si se pasó). */
  function budgetBlock(r) {
    var b = budgetIn(r.desde, r.hasta), t = adsTotals(impulsosEn(r.desde, r.hasta)),
      pct = b ? t.gastado / b * 100 : null, mes = monthKey(S.cy, S.cm);
    var cls = pct == null ? "" : pct > 100 ? " over" : pct >= 80 ? " warn" : "";
    if (S.budEdit && !resQ()) {
      var cur = ADS().presupuestos[mes] || {};
      return '<div class="card budget edit"><div class="r2"><div class="fld"><label for="budMonto">Presupuesto de ' +
        MONTHS[S.cm].toLowerCase() + ' (USD)</label><input id="budMonto" class="in" type="text" inputmode="decimal" placeholder="150" value="' +
        esc(cur.monto != null ? valStr(cur.monto) : "") + '" autocomplete="off"></div><div class="fld"><label for="budNotas">Nota (opcional)</label><input id="budNotas" class="in" type="text" placeholder="Ej. aprobaron 50 USD extra el 12 nov" value="' +
        esc(cur.notas || "") + '" autocomplete="off"></div></div><div class="acts"><button class="btn sm" type="button" data-act="budcancel">Cancelar</button><button class="btn sm primary" type="button" data-act="budsave">Guardar</button></div></div>';
    }
    var notas = resQ() ? "" : ((ADS().presupuestos[mes] || {}).notas || "");
    return '<div class="card budget' + cls + '"><div class="bud-h"><div><span class="kl">Presupuesto' + (resQ() ? " del trimestre" : "") +
      "</span><div><b>" + usdBig(t.gastado) + "</b><span> invertidos de " + (b != null ? fmtUsd(b) : "– (sin presupuesto)") + "</span></div></div>" +
      (b != null
        ? '<span class="bud-s">' + (t.gastado <= b ? "Quedan " + fmtUsd(b - t.gastado) : "Se pasó por " + fmtUsd(t.gastado - b)) + "</span>"
        : "") +
      (S.canWrite && !resQ()
        ? '<button class="btn sm ghost" type="button" data-act="budedit">' + (b != null ? "Cambiar" : "Definir presupuesto") + "</button>"
        : "") + "</div>" +
      '<div class="bud-bar" aria-hidden="true"><i style="width:' + Math.min(100, pct || 0).toFixed(1) + '%"></i></div>' +
      (pct != null && pct >= 80
        ? '<p class="bud-w">' + (pct > 100 ? "Se pasó del presupuesto (" + Math.round(pct) + " %)." : "Va en el " + Math.round(pct) + " % del presupuesto.") + "</p>"
        : "") +
      (notas ? '<p class="mut">' + esc(notas) + "</p>" : "") +
      (resQ() && S.canWrite ? '<p class="mut">El presupuesto se define por mes: cámbialo en la vista de cada mes.</p>' : "") +
      budgetList(r) + "</div>";
  }
  /** En qué se invirtió: lista sencilla de los posts impulsados del periodo y su gasto (plegada al principio). */
  function budgetList(r) {
    var list = impulsosEn(r.desde, r.hasta).slice().sort(function (a, b) {
      return b.inicio.localeCompare(a.inicio);
    });
    if (!list.length) return "";
    var abierto = !!S.budOpen;
    var h = '<button class="bud-tg" type="button" data-act="budtoggle" aria-expanded="' + abierto + '">' + CHEV_SVG +
      "<span>" + (abierto ? "Ocultar" : "Ver") + " en qué se invirtió · " + plural(list.length, "post impulsado", "posts impulsados") +
      "</span></button>";
    if (!abierto) return h;
    return h + '<ul class="bud-list">' + list.map(function (i) {
      var p = S.posts.get(i.publicacion_id);
      return '<li><a href="#post-' + esc(i.publicacion_id) + '">' + (p && p.title ? esc(p.title) : "<em>Sin título</em>") +
        '</a><span class="mt">' + esc(impDates(i)) + "</span><b>" + esc(fmtUsd(i.gastado)) + "</b></li>";
    }).join("") + "</ul>";
  }

  /** Lo logrado en el periodo según la cuenta: seguidores ganados o alcance sumado (de las cifras por mes). */
  function logradoCuenta(key, months) {
    var cm = RD().cuentaMes.ig || {};
    if (key === "alcance") {
      var s = 0, any = false;
      months.forEach(function (k) {
        if (cm[k] && cm[k].alcance != null) {
          s += cm[k].alcance;
          any = true;
        }
      });
      return any ? s : null;
    }
    var end = null;
    months.forEach(function (k) {
      if (cm[k] && cm[k].seguidores != null) end = cm[k].seguidores;
    });
    var f = months[0], d = new Date(Number(f.slice(0, 4)), Number(f.slice(5, 7)) - 2, 1),
      prev = cm[monthKey(d.getFullYear(), d.getMonth())];
    var start = prev && prev.seguidores != null ? prev.seguidores : (cm[f] ? cm[f].seguidores_ini : null);
    return end != null && start != null ? end - start : null;
  }
  /* Ads enfocado en las metas: lo que se muestra de los ads son las mismas métricas de los objetivos del periodo.
     Cada meta se traduce a lo que los ads pueden mostrar de ella:
       · tipo «ads»:  lo que Meta reporta del impulso (seguidores, alcance, clics al enlace, mensajes, visitas)
       · tipo «post»: la cifra del post impulsado en Instagram, sumada (interacciones, reproducciones)
       · tipo «avg»:  la media por post: impulsados contra no impulsados (media de likes, de guardados…) */
  var FOCO_ADS = {
    seguidores: { u: "seguidores", u1: "seguidor", via: "llegaron por los ads" },
    alcance: { u: "personas alcanzadas", u1: "mil personas", via: "alcanzadas con los ads", mil: true },
    clics: { u: "clics al enlace", u1: "clic", via: "llegaron por los ads" },
    mensajes: { u: "mensajes", u1: "mensaje", via: "llegaron por los ads" },
    visitas: { u: "visitas al perfil", u1: "visita", via: "llegaron por los ads" },
  };
  function focoDe(m) {
    var src = srcOf(m, "ig");
    if (src === "seguidores" || src === "alcance") return { k: src, tipo: "ads" };
    if (src === "interacciones" || src === "reproducciones") return { k: src, tipo: "post" };
    if (src.indexOf("prom_") === 0) return { k: src.slice(5), tipo: "avg" };
    if (src.indexOf("ads_") === 0) return { k: src.slice(4), tipo: "ads" };
    var n = String(m.name || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    if (/whatsapp|clic/.test(n)) return { k: "clics", tipo: "ads" };
    if (/mensaje|consulta/.test(n)) return { k: "mensajes", tipo: "ads" };
    if (/visita|perfil/.test(n)) return { k: "visitas", tipo: "ads" };
    return null;
  }
  /** Las metas del trimestre que los ads pueden mover, sin repetir. Sin metas así: clics, mensajes y alcance. */
  function adsFocos() {
    var qn = Math.floor(S.cm / 3), qg = S.goals.get("q-" + S.cy + "-" + (qn + 1)) || {}, out = [], seen = {};
    metricList(qg, "ig").forEach(function (m) {
      var f = focoDe(m);
      if (!f || seen[f.tipo + f.k]) return;
      seen[f.tipo + f.k] = 1;
      f.name = m.name || "Sin nombre";
      f.m = m;
      out.push(f);
    });
    return out;
  }
  var FOCOS_BASE = [
    { k: "clics", tipo: "ads", name: "Clics al enlace" },
    { k: "mensajes", tipo: "ads", name: "Mensajes" },
    { k: "alcance", tipo: "ads", name: "Alcance" },
  ];
  /** El valor de un impulso para una meta (o null si no hay dato). */
  function valImp(i, f) {
    if (f.tipo === "ads") {
      var v = (i.resultados || {})[f.k];
      return v == null ? null : v;
    }
    var p = S.posts.get(i.publicacion_id), x = p && igMet(p);
    return x && x.m && x.m[f.k] != null ? x.m[f.k] : null;
  }
  function focoLabel(f) {
    if (f.tipo === "ads") return FOCO_ADS[f.k].u;
    return (MET[f.k] || f.k).toLowerCase();
  }
  /** Una tarjeta por meta: lo que consiguieron los ads en esa meta. */
  function focoTile(f, r, list, t) {
    var idsImp = {}, months = monthsIn(r.desde, r.hasta), v, big = "–", lbl = "", sub = "", cls = "";
    list.forEach(function (i) {
      idsImp[i.publicacion_id] = 1;
    });
    if (f.tipo === "ads") {
      v = t[f.k];
      var d = FOCO_ADS[f.k];
      if (v == null) {
        sub = S.canWrite ? "Anota los " + d.u + " en cada impulso." : "Sin datos de los impulsos.";
      } else {
        big = (f.k === "seguidores" ? sgnNum(v) : fmtNum(v));
        lbl = d.u + " " + d.via;
        var costo = d.mil ? (v ? t.gastado / v * 1000 : null) : costPer(t.gastado, v);
        var logrado = null;
        if (f.k === "seguidores" || f.k === "alcance") logrado = logradoCuenta(f.k, months);
        else if (f.m && srcOf(f.m, "ig").indexOf("ads_") !== 0) {
          var qn = Math.floor(S.cm / 3), em = effM(f.m, "ig", S.cy, qn), idx = resQ() ? [0, 1, 2] : [S.cm - qn * 3];
          idx.forEach(function (j) {
            if (hasNum(em.real && em.real[j])) logrado = (logrado || 0) + Number(em.real[j]);
          });
        }
        sub = (costo != null ? fmtUsd(costo) + " por " + d.u1 : "") +
          (logrado ? (costo != null ? " · " : "") + Math.round(Math.min(100, v / logrado * 100)) + " % de los " + fmtNum(logrado) + " del periodo" : "");
      }
    } else if (f.tipo === "post") {
      var s = 0, any = false;
      Object.keys(idsImp).forEach(function (pid) {
        var p = S.posts.get(pid), x = p && igMet(p);
        if (x && x.m && x.m[f.k] != null) {
          s += x.m[f.k];
          any = true;
        }
      });
      if (any) {
        big = fmtNum(s);
        lbl = focoLabel(f) + " en los posts impulsados";
        var cm = RD().cuentaMes.ig || {}, tot = 0, hay = false;
        months.forEach(function (k) {
          if (cm[k] && cm[k][f.k] != null) {
            tot += cm[k][f.k];
            hay = true;
          }
        });
        sub = (s ? fmtUsd(t.gastado / s) + " por " + (f.k === "reproducciones" ? "reproducción" : "interacción") : "") +
          (hay && tot ? " · " + Math.round(Math.min(100, s / tot * 100)) + " % del periodo" : "");
      } else sub = "Los posts impulsados aún no tienen métricas de Instagram.";
    } else {
      // Media: posts publicados en el periodo, impulsados contra no impulsados.
      var si = 0, ni = 0, so = 0, no = 0;
      allPosts().forEach(function (p) {
        var x = igMet(p), day = postDay(p, x);
        if (!hasIg(p) || !x || !x.m || x.m[f.k] == null || day < r.desde || day > r.hasta) return;
        if (impulsosDe(p.id).length) {
          si += x.m[f.k];
          ni++;
        } else {
          so += x.m[f.k];
          no++;
        }
      });
      if (ni && no && so) {
        var up = (si / ni - so / no) / (so / no) * 100;
        big = (up >= 0 ? "+" : "−") + fmtNum(Math.abs(up)) + " %";
        cls = up >= 0 ? " good" : " bad";
        lbl = f.k === "likes" ? "más likes de media en los posts impulsados" : "de " + focoLabel(f) + " de media en los impulsados";
        if (up < 0) lbl = f.k === "likes" ? "menos likes de media en los posts impulsados" : lbl;
        sub = fmtNum(si / ni) + " de media en los impulsados · " + fmtNum(so / no) + " en los demás";
      } else if (ni) {
        big = fmtNum(si / ni);
        lbl = focoLabel(f) + " de media en los posts impulsados";
        sub = "Aún no hay posts sin impulsar con métricas para comparar.";
      } else sub = "Los posts impulsados aún no tienen métricas de Instagram.";
    }
    return '<div class="ftile' + cls + '"><span class="fk">' + esc(f.name) + "</span><b>" + big + "</b>" +
      (lbl ? '<span class="fl">' + esc(lbl) + "</span>" : "") + (sub ? '<span class="fs">' + esc(sub) + "</span>" : "") + "</div>";
  }
  /** Tarjeta de un impulso: primero las cifras de las metas (la que ordena, destacada), después lo gastado. */
  function impCard(i, best, focos, sk) {
    focos = focos || adsFocos();
    if (!focos.length) focos = FOCOS_BASE;
    var p = S.posts.get(i.publicacion_id) || { id: i.publicacion_id, title: "", format: "reel" }, x = igMet(p);
    var main = null;
    for (var n = 0; n < focos.length; n++) if (focos[n].tipo + focos[n].k === sk) main = focos[n];
    main = main || focos[0];
    var chips = focos.filter(function (f) {
      return f !== main;
    }).map(function (f) {
      var v = valImp(i, f);
      return v == null ? "" : '<span class="rchip"><b>' + fmtNum(v) + "</b> " + esc(focoLabel(f)) + "</span>";
    }).join("");
    var mv = valImp(i, main), unit = main.tipo === "ads" && main.k !== "alcance" ? costPer(i.gastado, mv) : null;
    return '<div class="imp' + (best ? " best" : "") + '">' + thumbHtml(p, x, "tthumb") + '<div class="imp-b"><a href="#post-' + esc(p.id) + '">' +
      (p.title ? esc(p.title) : "<em>Sin título</em>") + "</a>" +
      (best ? '<span class="best-tag">El que más ' + esc(main.tipo === "avg" ? "subió la media" : "aportó") + "</span>" : "") +
      '<div class="meta"><span class="mt">' + esc(impDates(i)) + "</span>" +
      '<span class="mt">· ' + esc(fmtUsd(i.gastado)) + " invertidos</span></div>" +
      (chips ? '<div class="rchips">' + chips + "</div>" : "") +
      (i.notas ? '<p class="mut imp-n">' + esc(i.notas) + "</p>" : "") + '</div><div class="imp-v">' +
      (mv != null
        ? "<b>" + (main.k === "seguidores" ? sgnNum(mv) : fmtNum(mv)) + "</b><span>" + esc(focoLabel(main)) + "</span>" +
          (unit != null ? '<span class="cpc">' + esc(fmtUsd(unit)) + " c/u</span>" : "")
        : '<span class="mut">Sin ' + esc(focoLabel(main)) + "</span>") +
      (i.ajeno
        ? '<span class="mut small">De otra cuenta de la colaboración</span>'
        : S.canWrite ? '<button class="btn sm ghost" type="button" data-act="impedit" data-id="' + esc(i.id) + '">Editar</button>' : "") +
      "</div></div>";
  }
  function adsSection(r) {
    var list = impulsosEn(r.desde, r.hasta), b = budgetIn(r.desde, r.hasta), t = adsTotals(list);
    var h = '<section class="rsec" id="sec-ads"><div class="rsec-h"><h2>Ads</h2>' +
      (S.canWrite ? '<button class="btn sm primary" type="button" data-act="impnew">+ Registrar impulso</button>' : "") + "</div>";
    if (!list.length && b == null && !S.budEdit) {
      return h + '<div class="card"><div class="empty" style="border:0;padding:16px 8px"><h3>' +
        (S.canWrite ? "Registra la inversión en ads de este " + (resQ() ? "trimestre" : "mes") : "Sin inversión en ads en este periodo") +
        "</h3><p>" + (S.canWrite
          ? "Define el presupuesto que aprobó el cliente y registra cada post impulsado con lo gastado y sus resultados. Planifica muestra lo que los ads aportaron a las metas del periodo."
          : "Aquí verás lo que los posts impulsados aportaron a las metas y cuánto se invirtió.") + "</p>" +
        (S.canWrite && !resQ()
          ? '<div class="acts"><button class="btn primary" type="button" data-act="budedit">Definir el presupuesto del mes</button><button class="btn" type="button" data-act="impnew">Registrar impulso</button></div>'
          : "") + "</div></div></section>";
    }
    var focos = adsFocos(), conMetas = focos.length;
    if (!conMetas) focos = FOCOS_BASE;
    h += budgetBlock(r);
    if (list.length) {
      h += '<div class="card"><div class="card-h"><h3>Lo que consiguieron los ads' +
        (conMetas ? " para las metas" : "") + '</h3><a class="btn sm ghost" href="#objetivos">' + (conMetas ? "Ver metas" : "Objetivos") + "</a></div>" +
        (conMetas ? "" : '<p class="muted small">' + (S.canWrite
          ? "Este trimestre no tiene metas que los ads puedan mover. Define en Objetivos una meta de seguidores, alcance, media de likes, clics al enlace… y aquí se medirá contra ella."
          : "Resultados de los posts impulsados.") + "</p>") +
        '<div class="ftiles">' + focos.map(function (f) {
          return focoTile(f, r, list, t);
        }).join("") + "</div></div>";
      // Impulsos: se ordenan por cada meta (o por fecha); el primero es el que más aportó a esa meta.
      var keys = focos.map(function (f) {
        return [f.tipo + f.k, f.name];
      }).concat([["fecha", "Fecha"]]);
      var sk = S.impSort && keys.some(function (k) {
        return k[0] === S.impSort;
      }) ? S.impSort : keys[0][0];
      var fsk = null;
      focos.forEach(function (f) {
        if (f.tipo + f.k === sk) fsk = f;
      });
      list = list.slice().sort(function (a, c) {
        if (!fsk) return c.inicio.localeCompare(a.inicio);
        var va = valImp(a, fsk), vc = valImp(c, fsk);
        return (vc == null ? -1e12 : vc) - (va == null ? -1e12 : va);
      });
      var best = fsk && list.length > 1 && valImp(list[0], fsk) != null ? list[0].id : null;
      h += '<div class="card"><div class="card-h"><h3>Qué consiguió cada impulso</h3><div class="seg" role="group" aria-label="Ordenar por">' +
        keys.map(function (x) {
          return '<button type="button" data-act="impsort" data-v="' + esc(x[0]) + '" aria-pressed="' + (sk === x[0]) + '">' + esc(x[1]) + "</button>";
        }).join("") + '</div></div><div class="imps">' + list.map(function (i) {
          return impCard(i, best === i.id, focos, sk);
        }).join("") + "</div></div>";
    }

    return h + "</section>";
  }
  /* Ventana para registrar o editar un impulso (un post de la parrilla impulsado en Meta). */
  /* ---------- Pauta: traer posts del mes siguiente para grabarlos en este (adelantar) ---------- */
  function closeTraer() {
    var o = document.getElementById("trOv");
    if (o) o.remove();
    S.trOpen = null;
  }
  function openTraer() {
    closeTraer();
    var ym = monthKey(S.cy, S.cm), nx = new Date(S.cy, S.cm + 1, 1), nym = monthKey(nx.getFullYear(), nx.getMonth());
    S.trOpen = { ym: ym, nym: nym };
    var ov = document.createElement("div");
    ov.id = "trOv";
    ov.className = "sheet-ov";
    ov.addEventListener("mousedown", function (e) {
      if (e.target === ov) closeTraer();
    });
    document.body.appendChild(ov);
    paintTraer();
  }
  function paintTraer() {
    var st = S.trOpen, ov = document.getElementById("trOv");
    if (!st || !ov) return;
    var list = allPosts().filter(function (p) {
      return p.shoot && p.date && p.date.slice(0, 7) === st.nym && !isTaken(p) && p.status !== "publicado" &&
        (!p.grabarEn || p.grabarEn === st.ym || p.grabarEn === st.nym);
    }).sort(cmp);
    ov.innerHTML = '<div class="sheet tr" role="dialog" aria-modal="true" aria-labelledby="trT"><h2 id="trT">Traer de ' + monthName(st.nym) +
      "</h2><p class=\"mut\">Marca los posts de " + monthName(st.nym) + " que se graban en la pauta de " + monthName(st.ym) +
      ". Siguen publicándose en su fecha.</p>" +
      (list.length
        ? '<div class="tr-list">' + list.map(function (p) {
          var on = p.grabarEn === st.ym;
          return '<button type="button" class="tr-it" role="checkbox" aria-checked="' + on + '" data-act="traerpick" data-id="' + esc(p.id) + '">' +
            CHECK_SVG + '<span class="tr-t"><b>' + (p.title ? esc(p.title) : "Sin título") + "</b><span>" + esc(cap(fmtLong(p.date))) + " · " +
            esc((FORMATS[p.format] || FORMATS.reel).label) + "</span></span></button>";
        }).join("") + "</div>"
        : '<p class="mut">No hay posts de ' + monthName(st.nym) + " en la pauta pendientes de grabar.</p>") +
      '<div class="acts"><span class="grow"></span><button class="btn primary" type="button" data-act="traerclose">Listo</button></div></div>';
  }
  function traerPick(id) {
    var p = S.posts.get(id), st = S.trOpen;
    if (!p || !st || !canW()) return;
    p.grabarEn = p.grabarEn === st.ym ? "" : st.ym;
    queueSave("posts/" + p.id, { grabarEn: p.grabarEn }, 0);
    paintTraer();
    render();
  }

  /* ---------- Nuevo post: una ventana corta; se guarda solo al pulsar «Crear post» ---------- */
  /* ---------- Selector de fecha y hora (propio; reemplaza los del navegador) ----------
     Cada campo es un botón que muestra la fecha u hora y un input oculto con el valor (AAAA-MM-DD / HH:MM). Al elegir,
     se escribe el input y se dispara «input», así el detalle lo guarda como cualquier otro campo. */
  var CAL_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.25" y="3" width="11.5" height="10.75" rx="2"/><path d="M2.25 6.5h11.5M5.5 1.75v2.5M10.5 1.75v2.5"/></svg>';
  var CLOCK_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6.25"/><path d="M8 4.75V8l2.25 1.5"/></svg>';
  function dtFields(pfx, isPost) {
    var f = function (k) {
      return isPost ? ' data-f="' + k + '"' : "";
    };
    var dis = isPost && !S.canWrite ? " disabled" : "";
    return '<div class="dtf"><input type="hidden" id="' + pfx + '-date"' + f("date") + '><input type="hidden" id="' + pfx + '-time"' + f("time") + ">" +
      '<button type="button" class="dtbtn" data-act="dtopen" data-kind="date" data-for="' + pfx + '-date" data-time="' + pfx + '-time" aria-haspopup="dialog"' + dis +
      ">" + CAL_SVG + "<span></span></button>" +
      '<button type="button" class="dtbtn" data-act="dtopen" data-kind="time" data-for="' + pfx + '-time" aria-haspopup="dialog"' + dis +
      ">" + CLOCK_SVG + "<span></span></button></div>";
  }
  function fmtDateLong(d) {
    var dt = new Date(d + "T12:00:00"), y = new Date().getFullYear();
    var o = { weekday: "short", day: "numeric", month: "short" };
    if (dt.getFullYear() !== y) o.year = "numeric";
    var t = dt.toLocaleDateString("es", o).replace(/\./g, "");
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function fmtTime(t) {
    var m = /^(\d{1,2}):(\d{2})/.exec(t || "");
    if (!m) return "";
    var h = +m[1], ap = h < 12 ? "a. m." : "p. m.";
    return (h % 12 || 12) + ":" + m[2] + " " + ap;
  }
  function paintDT() {
    document.querySelectorAll(".dtbtn").forEach(function (b) {
      var inp = document.getElementById(b.dataset.for), v = inp ? inp.value : "";
      var t = b.dataset.kind === "date" ? (v ? fmtDateLong(v) : "Sin fecha") : (v ? fmtTime(v) : "Sin hora");
      var sp = b.querySelector("span");
      if (sp.textContent !== t) sp.textContent = t;
      b.classList.toggle("empty", !v);
    });
  }
  function closeDT() {
    var o = document.getElementById("dtPop");
    if (o) o.remove();
    if (S.dtPop && S.dtPop.btn) S.dtPop.btn.setAttribute("aria-expanded", "false");
    S.dtPop = null;
  }
  function setDT(id, v) {
    var inp = document.getElementById(id);
    if (!inp) return;
    inp.value = v;
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    paintDT();
  }
  function openDT(btn) {
    if (S.dtPop && S.dtPop.btn === btn) return closeDT();
    closeDT();
    var v = (document.getElementById(btn.dataset.for) || {}).value || "";
    var base = v && btn.dataset.kind === "date" ? v : todayStr();
    S.dtPop = { btn: btn, kind: btn.dataset.kind, id: btn.dataset.for, y: +base.slice(0, 4), m: +base.slice(5, 7) - 1 };
    var pop = document.createElement("div");
    pop.id = "dtPop";
    pop.className = "dtpop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", btn.dataset.kind === "date" ? "Elegir fecha" : "Elegir hora");
    document.body.appendChild(pop);
    btn.setAttribute("aria-expanded", "true");
    renderDT();
    var r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    var top = r.bottom + 6;
    if (top + h > window.innerHeight - 8 && r.top - h - 6 > 8) top = r.top - h - 6;
    pop.style.top = Math.round(top) + "px";
    pop.style.left = Math.round(Math.max(8, Math.min(r.left, window.innerWidth - w - 8))) + "px";
    var f = pop.querySelector(".on") || pop.querySelector(".today") || pop.querySelector("button");
    if (f) {
      f.focus({ preventScroll: true });
      if (S.dtPop.kind === "time" && f.scrollIntoView) f.scrollIntoView({ block: "center" });
    }
  }
  function renderDT() {
    var st = S.dtPop, pop = document.getElementById("dtPop");
    if (!st || !pop) return;
    var v = (document.getElementById(st.id) || {}).value || "";
    if (st.kind === "time") {
      var opts = [];
      for (var h = 0; h < 24; h++) {
        ["00", "30"].forEach(function (mm) {
          opts.push((h < 10 ? "0" : "") + h + ":" + mm);
        });
      }
      if (v && opts.indexOf(v) < 0) opts.push(v), opts.sort();
      var near = v || "09:00";
      pop.innerHTML = '<div class="dt-times" role="listbox">' + opts.map(function (t) {
        return '<button type="button" role="option" data-act="dtset" data-v="' + t + '" aria-selected="' + (t === v) + '" class="' +
          (t === v ? "on" : t === near ? "today" : "") + '">' + fmtTime(t) + "</button>";
      }).join("") + "</div>" +
        '<div class="dt-foot"><label class="sr" for="dtOther">Otra hora</label><input id="dtOther" class="in" type="text" inputmode="numeric" placeholder="Otra: 18:45" autocomplete="off">' +
        '<button type="button" class="btn sm ghost" data-act="dtset" data-v="">Quitar</button></div>';
      return;
    }
    var first = new Date(st.y, st.m, 1), startDow = (first.getDay() + 6) % 7, days = new Date(st.y, st.m + 1, 0).getDate();
    var today = todayStr(), cells = "";
    for (var i = 0; i < startDow; i++) cells += "<span></span>";
    for (var d = 1; d <= days; d++) {
      var ds = st.y + "-" + (st.m < 9 ? "0" : "") + (st.m + 1) + "-" + (d < 10 ? "0" : "") + d;
      cells += '<button type="button" data-act="dtset" data-v="' + ds + '" class="' + (ds === v ? "on " : "") + (ds === today ? "today" : "") +
        '" aria-pressed="' + (ds === v) + '" aria-label="' + esc(fmtDateLong(ds)) + '">' + d + "</button>";
    }
    var mes = new Date(st.y, st.m, 1).toLocaleDateString("es", { month: "long", year: "numeric" });
    var tomorrow = (function () {
      var t = new Date(today + "T12:00:00");
      t.setDate(t.getDate() + 1);
      return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
    })();
    pop.innerHTML = '<div class="dt-head"><button type="button" class="icon-btn" data-act="dtnav" data-v="-1" aria-label="Mes anterior">‹</button><b>' +
      esc(mes.charAt(0).toUpperCase() + mes.slice(1)) + '</b><button type="button" class="icon-btn" data-act="dtnav" data-v="1" aria-label="Mes siguiente">›</button></div>' +
      '<div class="dt-grid"><i>L</i><i>M</i><i>M</i><i>J</i><i>V</i><i>S</i><i>D</i>' + cells + "</div>" +
      '<div class="dt-foot"><button type="button" class="btn sm ghost" data-act="dtset" data-v="' + today + '">Hoy</button>' +
      '<button type="button" class="btn sm ghost" data-act="dtset" data-v="' + tomorrow + '">Mañana</button><span class="grow"></span>' +
      (v ? '<button type="button" class="btn sm ghost" data-act="dtset" data-v="">Quitar</button>' : "") + "</div>";
  }
  document.addEventListener("pointerdown", function (e) {
    if (!S.dtPop) return;
    var pop = document.getElementById("dtPop");
    if (pop && pop.contains(e.target)) return;
    if (S.dtPop.btn && S.dtPop.btn.contains(e.target)) return;
    closeDT();
  }, true);
  document.addEventListener("keydown", function (e) {
    if (!S.dtPop) return;
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      var b = S.dtPop.btn;
      closeDT();
      if (b) b.focus();
    } else if (e.key === "Enter" && e.target && e.target.id === "dtOther") {
      e.preventDefault();
      var m = /^(\d{1,2})[:.h ]?(\d{2})?$/.exec(e.target.value.trim());
      if (!m || +m[1] > 23 || +(m[2] || 0) > 59) {
        e.target.classList.add("bad");
        return;
      }
      var id = S.dtPop.id;
      closeDT();
      setDT(id, (m[1].length < 2 ? "0" : "") + m[1] + ":" + (m[2] || "00"));
    }
  }, true);
  window.addEventListener("resize", function () {
    if (S.dtPop) closeDT();
  });

  /* Pestañas del detalle: en móvil Contenido · Producción · Resultados; en computadora, «Contenido y producción»
     (las dos columnas) y «Métricas y ads». */
  function paintDtabs() {
    var g = $("#dgrid");
    if (!g) return;
    g.dataset.tab = S.dtab;
    document.querySelectorAll('[data-act="dtab"]').forEach(function (b) {
      var on = b.dataset.grp === "d" ? (b.dataset.v === "resultados") === (S.dtab === "resultados") : b.dataset.v === S.dtab;
      if (b.dataset.grp === "d") {
        b.classList.toggle("on", on);
        if (on) b.setAttribute("aria-current", "page");
        else b.removeAttribute("aria-current");
      } else b.setAttribute("aria-pressed", String(on));
    });
  }
  function closeNewPost() {
    closeDT();
    var o = document.getElementById("npOv");
    if (o) o.remove();
    S.npOpen = null;
  }
  function openNewPost(data) {
    if (!canW()) return;
    closeNewPost();
    var fmt = data.format || "reel";
    S.npOpen = { format: fmt, platforms: defaultPlats(fmt), date: data.date || "" };
    var ov = document.createElement("div");
    ov.id = "npOv";
    ov.className = "sheet-ov";
    ov.innerHTML = '<div class="sheet np" role="dialog" aria-modal="true" aria-labelledby="npT"><h2 id="npT">Nuevo post</h2>' +
      '<div class="fld"><label for="np-title">Título</label><input id="np-title" class="in" type="text" placeholder="Título o idea del post" autocomplete="off"></div>' +
      '<div class="fld"><span class="lbl" id="np-lfmt">Formato</span><div class="wrapr" role="group" aria-labelledby="np-lfmt" id="np-fmts"></div></div>' +
      '<div class="fld"><span class="lbl" id="np-lplat">Plataformas</span><div class="wrapr" role="group" aria-labelledby="np-lplat" id="np-plats"></div></div>' +
      '<div class="fld"><span class="lbl">Publicación <span class="mut">(opcional)</span></span>' + dtFields("np", false) + "</div>" +
      '<p class="imp-err" id="npErr" hidden></p>' +
      '<div class="acts"><span class="grow"></span><button class="btn" type="button" data-act="npclose">Cancelar</button>' +
      '<button class="btn primary" type="button" data-act="npsave">Crear post</button></div></div>';
    ov.addEventListener("mousedown", function (e) {
      if (e.target === ov) closeNewPost();
    });
    document.body.appendChild(ov);
    document.getElementById("np-date").value = S.npOpen.date;
    paintNewPost();
    document.getElementById("np-title").focus();
  }
  function paintNewPost() {
    var st = S.npOpen;
    if (!st) return;
    document.getElementById("np-fmts").innerHTML = FORMAT_ORDER.map(function (f) {
      return '<button type="button" class="tog fmtbtn f-' + f + '" data-act="npfmt" data-v="' + f + '" aria-pressed="' +
        (st.format === f) + '">' + fIcon(f) + FORMATS[f].label + "</button>";
    }).join("");
    document.getElementById("np-plats").innerHTML = Object.keys(PLATFORMS).map(function (k) {
      return '<button type="button" class="tog" data-act="npplat" data-v="' + k + '" aria-pressed="' +
        (st.platforms.indexOf(k) >= 0) + '">' + PLATFORMS[k] + "</button>";
    }).join("");
    paintDT();
  }
  function saveNewPost() {
    var st = S.npOpen;
    if (!st || st.busy) return;
    var title = document.getElementById("np-title").value.trim();
    if (!title) {
      var er = document.getElementById("npErr");
      er.textContent = "Escribe un título para crear el post.";
      er.hidden = false;
      document.getElementById("np-title").focus();
      return;
    }
    st.busy = true;
    var date = document.getElementById("np-date").value;
    createPost({
      title: title,
      format: st.format,
      platforms: st.platforms.slice(),
      shoot: isShootDefault(st.format),
      date: date,
      time: date ? document.getElementById("np-time").value : "",
    }).then(function (id) {
      if (!id) {
        st.busy = false;
        return;
      }
      closeNewPost();
      toast("Post creado");
      go("post-" + id);
    });
  }

  function closeImp() {
    var o = document.getElementById("impOv");
    if (o) o.remove();
    S.impOpen = null;
  }
  function openImp(id, postId) {
    closeImp();
    var i = id ? ADS().impulsos.find(function (x) {
      return x.id === id;
    }) : null;
    if (id && !i) return;
    S.impOpen = { id: id || null };
    var sel = i ? i.publicacion_id : postId || "";
    var posts = allPosts().filter(function (p) {
      return p.id === sel || (p.status === "publicado" && p.date && medible(p));
    }).sort(function (a, b) {
      return (b.date || "").localeCompare(a.date || "");
    });
    var r = (i && i.resultados) || {}, hoy = todayStr();
    var ov = document.createElement("div");
    ov.id = "impOv";
    ov.className = "sheet-ov";
    ov.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="impT"><h2 id="impT">' +
      (i ? "Editar impulso" : "Registrar impulso") + "</h2>" +
      '<div class="fld"><label for="imp-post">Post impulsado</label><select id="imp-post" class="in"><option value="">Elige un post publicado…</option>' +
      posts.map(function (p) {
        return '<option value="' + esc(p.id) + '"' + (p.id === sel ? " selected" : "") + ">" +
          esc((p.date ? fmtShort(p.date) + " · " : "") + (p.title || "Sin título")) + "</option>";
      }).join("") + "</select></div>" +
      '<div class="r2"><div class="fld"><label for="imp-ini">Empezó</label><input id="imp-ini" class="in" type="date" value="' +
      esc(i ? i.inicio : hoy) + '"></div><div class="fld"><label for="imp-fin">Terminó <span class="mut">(vacío si sigue activo)</span></label><input id="imp-fin" class="in" type="date" value="' +
      esc(i && i.fin ? i.fin : "") + '"></div></div>' +
      '<div class="r2"><div class="fld"><label for="imp-gas">Gastado (USD)</label><input id="imp-gas" class="in" type="text" inputmode="decimal" placeholder="35,00" value="' +
      esc(i ? valStr(i.gastado) : "") + '" autocomplete="off"></div><div class="fld"><label for="imp-obj">Objetivo en Meta <span class="mut">(opcional)</span></label><select id="imp-obj" class="in"><option value="">—</option>' +
      Object.keys(OBJ_LABEL).map(function (k) {
        return '<option value="' + k + '"' + (i && i.objetivo === k ? " selected" : "") + ">" + OBJ_LABEL[k] + "</option>";
      }).join("") + "</select></div></div>" +
      '<p class="lbl" style="margin-top:4px">Resultados según Meta <span class="mut">(los que tengas; se pueden completar después)</span></p><div class="imp-grid">' +
      ["clics", "mensajes", "alcance", "visitas", "seguidores"].map(function (k) {
        return '<div class="fld"><label for="imp-r-' + k + '">' + RES_LABEL[k] + '</label><input id="imp-r-' + k +
          '" class="in" type="text" inputmode="numeric" value="' + esc(r[k] != null ? String(r[k]) : "") + '" autocomplete="off"></div>';
      }).join("") + "</div>" +
      '<div class="fld"><label for="imp-notas">Notas <span class="mut">(las ve el cliente)</span></label><textarea id="imp-notas" class="in" rows="2" placeholder="Ej. segmentado a Caracas, 25-55 años">' +
      esc(i ? i.notas : "") + "</textarea></div>" +
      '<p class="imp-err" id="impErr" hidden></p><div class="acts">' +
      (i ? '<button class="btn danger" type="button" data-act="impdel">Eliminar</button><span class="grow"></span>' : '<span class="grow"></span>') +
      '<button class="btn" type="button" data-act="impclose">Cancelar</button><button class="btn primary" type="button" data-act="impsave">' +
      (i ? "Guardar" : "Registrar") + "</button></div></div>";
    ov.addEventListener("mousedown", function (e) {
      if (e.target === ov) closeImp();
    });
    document.body.appendChild(ov);
    var f = ov.querySelector(sel ? "#imp-gas" : "#imp-post");
    if (f) f.focus();
  }
  function impErr(msg) {
    var e = document.getElementById("impErr");
    if (e) {
      e.textContent = msg;
      e.hidden = false;
    }
  }
  function saveImp(btn) {
    var st = S.impOpen;
    if (!st) return;
    var res = {}, bad = null;
    ["clics", "mensajes", "alcance", "visitas", "seguidores"].forEach(function (k) {
      var v = document.getElementById("imp-r-" + k).value.trim();
      if (!v) return;
      var n = parseNum(v);
      if (n == null || n < 0 || Math.round(n) !== n) bad = RES_LABEL[k];
      else res[k] = n;
    });
    if (bad) return impErr("«" + bad + "» debe ser un número entero.");
    var gas = parseNum(document.getElementById("imp-gas").value);
    if (gas == null) return impErr("Escribe cuánto se gastó (en USD).");
    var body = {
      publicacion_id: document.getElementById("imp-post").value,
      inicio: document.getElementById("imp-ini").value,
      fin: document.getElementById("imp-fin").value || null,
      gastado: gas,
      objetivo: document.getElementById("imp-obj").value || null,
      resultados: res,
      notas: document.getElementById("imp-notas").value,
    };
    if (!body.publicacion_id) return impErr("Elige el post que se impulsó.");
    btn.disabled = true;
    window.PLANIFICA.api(st.id ? "/api/ads/impulsos/" + encodeURIComponent(st.id) : "/api/ads/impulsos", {
      method: st.id ? "PATCH" : "POST",
      body: body,
    }).then(function () {
      closeImp();
      toast(st.id ? "Impulso actualizado" : "Impulso registrado");
      return window.PLANIFICA.refrescar();
    }, function (e) {
      btn.disabled = false;
      impErr(e.message || "No se pudo guardar.");
    }).then(function () {
      if (S.view === "detalle") paintDetail();
      else render();
    });
  }
  function deleteImp(btn) {
    var st = S.impOpen;
    if (!st || !st.id) return;
    if (btn.dataset.sure !== "1") {
      btn.dataset.sure = "1";
      btn.textContent = "¿Seguro? Eliminar";
      return;
    }
    btn.disabled = true;
    window.PLANIFICA.api("/api/ads/impulsos/" + encodeURIComponent(st.id), { method: "DELETE" }).then(function () {
      closeImp();
      toast("Impulso eliminado");
      return window.PLANIFICA.refrescar();
    }, function (e) {
      btn.disabled = false;
      impErr(e.message || "No se pudo eliminar.");
    }).then(function () {
      if (S.view === "detalle") paintDetail();
      else render();
    });
  }
  function saveBudget(btn) {
    var raw = document.getElementById("budMonto").value.trim(), n = raw ? parseNum(raw) : null;
    if (raw && (n == null || n < 0)) {
      toast("El presupuesto debe ser un número.");
      return;
    }
    btn.disabled = true;
    window.PLANIFICA.api("/api/ads/presupuestos/" + monthKey(S.cy, S.cm), {
      method: "PUT",
      body: { monto: n, notas: document.getElementById("budNotas").value },
    }).then(function () {
      S.budEdit = false;
      return window.PLANIFICA.refrescar();
    }, function (e) {
      btn.disabled = false;
      toast(e.message || "No se pudo guardar.");
    }).then(function () {
      render();
    });
  }
  /** Tarjeta «Impulsos» en el detalle del post: lo pagado al lado de lo orgánico. */
  function adsCardBody(p) {
    var list = impulsosDe(p.id), x = igMet(p);
    if (!list.length) {
      return '<p class="muted">' + (p.status === "publicado"
        ? "Si este post se impulsa en Meta, regístralo aquí para ver lo gastado y sus resultados."
        : "Cuando se publique y se impulse, regístralo aquí.") + "</p>";
    }
    var t = adsTotals(list), org = x && x.m ? x.m.alcance : null;
    var h = '<div class="pvr two"><div><b>' + fmtUsd(t.gastado) + "</b><span>invertido</span></div><div><b>" +
      (t.clics != null ? fmtNum(t.clics) : "–") + "</b><span>clics al enlace" +
      (t.clics ? " · " + esc(fmtUsd(t.gastado / t.clics)) + " c/u" : "") + "</span></div></div>";
    if (t.alcance != null || org != null) {
      h += '<p class="muted small">Alcance pagado <b>' + (t.alcance != null ? fmtNum(t.alcance) : "–") + "</b> · orgánico <b>" +
        (org != null ? fmtNum(org) : "–") + "</b></p>";
    }
    return h + '<div class="imps">' + list.slice().sort(function (a, b) {
      return b.inicio.localeCompare(a.inicio);
    }).map(function (i) {
      return impCard(i);
    }).join("") + "</div>";
  }
  function paintAds(p) {
    var card = $("#adsCard");
    if (!card) return;
    var list = impulsosDe(p.id);
    card.hidden = !list.length && !(S.canWrite && p.status === "publicado" && medible(p));
    var body = adsCardBody(p), b = $("#adsBody");
    if (b.dataset.sig !== body) {
      b.innerHTML = body;
      b.dataset.sig = body;
    }
    var act = S.canWrite ? '<button class="btn sm" type="button" data-act="impnew" data-post="' + esc(p.id) + '">+ Registrar impulso</button>' : "";
    var a = $("#adsAct");
    if (a.dataset.sig !== act) {
      a.innerHTML = act;
      a.dataset.sig = act;
    }
  }

  /** Rendimiento, por secciones: Resumen · Objetivos · Ads · Contenido · Audiencia y evolución. */
  function rsec(id, title, inner, extra) {
    return '<section class="rsec" id="' + id + '"><div class="rsec-h"><h2>' + title + "</h2>" + (extra || "") + "</div>" +
      inner + "</section>";
  }
  function resNav(items) {
    return '<nav class="secnav" aria-label="Secciones de Rendimiento">' + items.map(function (x) {
      return '<button type="button" data-act="secgo" data-v="' + x[0] + '">' + x[1] + "</button>";
    }).join("") + "</nav>";
  }
  /** Media de likes por post: los posts publicados entre a y b (una media no se recorta al mismo tramo de días). */
  function likesAvg(a, b) {
    var n = 0, t = 0;
    allPosts().forEach(function (p) {
      var x = igMet(p), day = postDay(p, x);
      if (hasIg(p) && x && x.m && x.m.likes != null && day >= a && day <= b) {
        n++;
        t += x.m.likes;
      }
    });
    return n ? { v: t / n, n: n } : null;
  }
  function resumen(r, L, c) {
    var t = adsTotals(impulsosEn(r.desde, r.hasta));
    var dias = (c && L && L.data && L.data.dias) || [];
    var fEnd = lastFollowers(dias, r.desde, r.hasta),
      fPrevEnd = lastFollowers(dias, r.pDesde, r.pHasta),
      fStart = fPrevEnd != null ? fPrevEnd : firstFollowers(dias, r.desde, r.hasta),
      gained = fEnd != null && fStart != null ? fEnd - fStart : null,
      fPrevStart = firstFollowers(dias, r.pDesde, r.pHasta),
      fPrevCut = lastFollowers(dias, r.pDesde, r.cpHasta),
      gainedPrev = fPrevCut != null && fPrevStart != null ? fPrevCut - fPrevStart : null;
    function suma(k) {
      return { v: sumBy(dias, k, r.desde, r.hasta), p: sumBy(dias, k, r.pDesde, r.cpHasta) };
    }
    function cifra(k, label, hint) {
      var s = suma(k), ok = s.v != null;
      return kpi(label, ok ? fmtNum(s.v) : "–", ok ? deltaHtml(s.v, s.p, r.etiqueta) : "", hint);
    }
    var reach = suma("alcance"), inter = suma("interacciones");
    var rate = reach.v ? inter.v / reach.v * 100 : null;
    var la = likesAvg(r.desde, r.hasta), laP = likesAvg(r.pDesde, r.pHasta);
    // Seguidores netos: los que siguieron menos los que dejaron de seguir, día por día según Meta; si la cuenta no
    // lo tiene, la diferencia entre el total de seguidores del final y del inicio.
    var neto = suma("neto"), sig = suma("siguieron"), dej = suma("dejaron");
    if (neto.v != null) {
      gained = neto.v;
      gainedPrev = neto.p;
    }
    var h = '<div class="kpis">' +
      kpi("👥 Seguidores", gained == null ? "–" : sgnNum(gained), deltaHtml(gained, gainedPrev, r.etiqueta),
        (neto.v != null ? fmtNum(sig.v) + " nuevos − " + fmtNum(dej.v) + " que se fueron" : "ganados en el periodo") +
        (fEnd != null ? " · " + fmtNum(fEnd) + " en total" : "")) +
      cifra("alcance", "👀 Alcance", "Cuentas que vieron tu contenido" + (t.alcance ? " · " + fmtNum(t.alcance) + " con ads" : "")) +
      kpi("❤️ Media de likes", la ? fmtNum(la.v) : "–", deltaHtml(la && la.v, laP && laP.v, r.etiqueta),
        la ? "por post, de " + plural(la.n, "post publicado", "posts publicados") : (S.canWrite ? "Pega el link de los posts publicados." : "")) +
      cifra("interacciones", "💬 Interacciones", rate != null ? "Tasa: " + fmtNum(rate, 1) + " % del alcance" : "") +
      cifra("visitas", "👤 Visitas al perfil", t.visitas ? fmtNum(t.visitas) + " con ads" : "") +
      cifra("clics_bio", "🔗 Clics en la bio", "Toques en los enlaces del perfil") + "</div>";
    if (L && L.loading) h += '<p class="muted">Cargando las cifras de la cuenta…</p>';
    if (L && L.error) h += '<p class="warn-note">' + esc(L.error) + "</p>";
    return h;
  }
  function contenido(r) {
    var inPer = allPosts().filter(function (p) {
      var x = igMet(p), day = postDay(p, x);
      return hasIg(p) && day >= r.desde && day <= r.hasta;
    });
    var withM = inPer.filter(function (p) {
      var x = igMet(p);
      return x && x.m;
    });
    var sk = S.resSort || "alcance";
    var top = withM.slice().sort(function (a, b) {
      return (igMet(b).m[sk] || 0) - (igMet(a).m[sk] || 0);
    }).slice(0, 10);
    var h = '<div class="card"><div class="card-h"><h3>Top posts</h3><div class="seg" role="group" aria-label="Ordenar por">' +
      SORT_KEYS.map(function (x) {
        return '<button type="button" data-act="ressort" data-v="' + x[0] + '" aria-pressed="' + (sk === x[0]) +
          '">' + x[1] + "</button>";
      }).join("") + "</div></div>";
    if (!top.length) {
      h += '<p class="gv-empty">Ningún post de este periodo tiene métricas todavía.' +
        (S.canWrite ? " Pega el link de Instagram en cada post publicado." : "") + "</p>";
    } else {
      h += '<ol class="toplist">' + top.map(function (p, i) {
        var x = igMet(p), m = x.m, paid = adsTotals(impulsosDe(p.id));
        return '<li><span class="tn">' + (i + 1) + "</span>" + thumbHtml(p, x, "tthumb") +
          '<div class="tt"><a href="#post-' + esc(p.id) + '">' + (p.title ? esc(p.title) : "<em>Sin título</em>") +
          '</a><div class="meta"><span class="tag">' + fIcon(p.format) + (FORMATS[p.format] || FORMATS.reel).label +
          '</span><span class="mt">' + esc(fmtShort(postDay(p, x))) + "</span>" + boostBadge(p) + "</div></div>" +
          '<div class="tv"><b>' + fmtNum(m[sk]) + "</b><span>" + MET[sk].toLowerCase() + "</span>" +
          (sk === "alcance" && paid.alcance ? '<span class="paid">+' + fmtNum(paid.alcance) + " con ads</span>" : "") +
          "</div></li>";
      }).join("") + "</ol>";
    }
    h += "</div>";
    var fm = {};
    withM.forEach(function (p) {
      var f = p.format || "reel", m = igMet(p).m;
      var o = fm[f] || (fm[f] = { n: 0, alcance: 0, interacciones: 0, guardados: 0, likes: 0 });
      o.n++;
      o.likes += m.likes || 0;
      o.alcance += m.alcance || 0;
      o.interacciones += m.interacciones || 0;
      o.guardados += m.guardados || 0;
    });
    var fRows = FORMAT_ORDER.filter(function (f) {
      return fm[f];
    });
    var winner = null;
    if (fRows.length > 1) {
      fRows.forEach(function (f) {
        if (!winner || fm[f].interacciones / fm[f].n > fm[winner].interacciones / fm[winner].n) winner = f;
      });
    }
    var planned = allPosts().filter(function (p) {
        return hasIg(p) && p.date && p.date >= r.desde && p.date <= r.hasta;
      }),
      published = planned.filter(function (p) {
        return p.status === "publicado";
      }),
      linked = published.filter(function (p) {
        var x = igMet(p);
        return x && x.encontrado;
      }),
      missing = published.filter(function (p) {
        var x = igMet(p);
        return !(x && x.encontrado);
      });
    h += '<div class="grid2 res2"><section class="card"><h3>Por formato</h3>' +
      (fRows.length
        ? '<div class="tw"><table class="ftab"><thead><tr><th>Formato</th><th>Posts</th><th>Media de alcance</th><th>Media de likes</th><th>Media de interacciones</th><th>Media de guardados</th></tr></thead><tbody>' +
          fRows.map(function (f) {
            var o = fm[f];
            return '<tr' + (f === winner ? ' class="win"' : "") + '><td><span class="tag f-' + f + '">' + fIcon(f) +
              FORMATS[f].label + "</span>" + (f === winner ? ' <span class="crown" title="Formato ganador del periodo">' + CROWN_SVG + "</span>" : "") +
              "</td><td>" + o.n + "</td><td>" + fmtNum(o.alcance / o.n) + "</td><td>" + fmtNum(o.likes / o.n) + "</td><td>" +
              fmtNum(o.interacciones / o.n) + "</td><td>" + fmtNum(o.guardados / o.n) + "</td></tr>";
          }).join("") + "</tbody></table></div>" +
          (winner
            ? '<p class="hint" style="min-height:0"><span><span class="crown">' + CROWN_SVG + "</span> " +
              esc(FORMATS[winner].plural || FORMATS[winner].label) + ": el formato con la mayor media de interacciones por post.</span></p>"
            : "")
        : '<p class="gv-empty">Se calcula con los posts que tienen métricas.</p>') +
      '</section><section class="card"><h3>Plan contra realidad</h3><div class="pvr">' +
      "<div><b>" + planned.length + "</b><span>planificados</span></div>" +
      "<div><b>" + published.length + "</b><span>publicados</span></div>" +
      "<div><b>" + linked.length + "</b><span>con link de Instagram</span></div></div>" +
      (missing.length && S.canWrite
        ? '<p class="muted small" style="margin-top:4px">' + (missing.length === 1 ? "Falta el link de este post publicado:" : "Falta el link de estos posts publicados:") + "</p>" +
          '<ul class="missing">' + missing.sort(cmp).map(function (p) {
            var x = igMet(p);
            return '<li><div><a href="#post-' + esc(p.id) + '">' + (p.title ? esc(p.title) : "<em>Sin título</em>") +
              '</a><span class="mt">' + esc(p.date ? fmtShort(p.date) : "") +
              (x && x.error ? " · " + esc(x.error) : "") + '</span></div><a class="btn sm" href="#post-' + esc(p.id) + '">Abrir y pegar link</a></li>';
          }).join("") + "</ul>"
        : "") +
      "</section></div>";
    return h;
  }
  function audiencia(r, L) {
    var dias = (L && L.data && L.data.dias) || [];
    var days = [], d0 = dateObj(r.desde), d1 = dateObj(r.hasta), today = todayStr();
    for (var d = new Date(d0); d <= d1; d.setDate(d.getDate() + 1)) {
      var k = ymd(d.getFullYear(), d.getMonth(), d.getDate());
      if (k > today) break;
      days.push(k);
    }
    var byDay = {};
    dias.forEach(function (x) {
      byDay[x.dia] = x;
    });
    // Franjas: los días en que hubo al menos un post impulsado activo.
    var bands = [], on = days.map(function (k) {
      return ADS().impulsos.some(function (i) {
        return !i.ajeno && i.inicio <= k && (i.fin || today) >= k;
      });
    });
    for (var j = 0; j < on.length; j++) {
      if (!on[j]) continue;
      var a = j;
      while (j + 1 < on.length && on[j + 1]) j++;
      bands.push([a, j]);
    }
    function serie(key) {
      return days.map(function (k) {
        return { dia: k, v: byDay[k] && typeof byDay[k][key] === "number" ? byDay[k][key] : null };
      });
    }
    return '<div class="card"><div class="charts">' +
      lineChart("seg", "Seguidores", serie("seguidores"), bands) +
      lineChart("alc", "Alcance por día", serie("alcance"), bands) +
      lineChart("int", "Interacciones por día", serie("interacciones"), bands) + "</div>" +
      (bands.length ? '<p class="hint" style="min-height:0"><span><i class="hk hk-band"></i> días con un post impulsado</span></p>' : "") +
      '</div><div class="card"><h3>Mejor día y hora para publicar</h3>' + heatmap(L && L.data && L.data.audiencia) + "</div>";
  }
  function viewRes() {
    var h = notices() + monthBar();
    var tt = S.resRed === "tt", c = igCon(), r = resRange(), q = resQ(), m0 = q ? Math.floor(S.cm / 3) * 3 : S.cm;
    h += '<div class="ptools"><div class="seg" role="group" aria-label="Red">' +
      '<button type="button" data-act="resred" data-v="ig" aria-pressed="' + !tt + '">Instagram</button>' +
      '<button type="button" data-act="resred" data-v="tt" aria-pressed="' + tt + '">TikTok</button></div>' +
      '<div class="seg" role="group" aria-label="Periodo">' +
      [["m", "Mes"], ["q", "Trimestre"]].map(function (x) {
        return '<button type="button" data-act="resper" data-v="' + x[0] + '" aria-pressed="' +
          ((S.resPer || "m") === x[0]) + '">' + x[1] + "</button>";
      }).join("") + "</div>" +
      (c && !tt
        ? '<span class="res-upd"><span class="muted">' + esc(igLastTxt()) + "</span>" + igUpdButton() + "</span>"
        : "") + "</div>";
    var objExtra = '<a class="btn sm" href="#objetivos">Ver objetivos</a>';
    if (tt) {
      main.innerHTML = h + '<div class="connect"><span class="cn-ic">' + TT_SVG + '</span><div class="cn-b"><b>Pronto: métricas de TikTok</b>' +
        "<p>Las reproducciones, likes, comentarios y compartidos de cada video, y los seguidores de la cuenta, en esta misma pestaña. Mientras tanto, las metas de TikTok se escriben a mano en Objetivos.</p></div></div>" +
        rsec("sec-obj", "Objetivos", goalsSummary(S.cy, m0, q, true), objExtra) +
        rsec("sec-cont", "Contenido", planVsReal(r, false));
      return;
    }
    var L = c ? resLoad(r) : null;
    if (!c) {
      h += igConnectNotice("Verás el alcance, la media de likes, la evolución de seguidores, los mejores posts y la mejor hora para publicar. Las cifras se guardan desde el día en que se conecta.");
    } else if (c.estado === "error") h += igConnectNotice("");
    var nav = [["sec-resumen", "Resumen"], ["sec-obj", "Objetivos"], ["sec-ads", "Ads"], ["sec-cont", "Contenido"]];
    if (c) nav.push(["sec-aud", "Audiencia"]);
    h += resNav(nav) +
      rsec("sec-resumen", "Resumen", resumen(r, L, c)) +
      rsec("sec-obj", "Objetivos", goalsSummary(S.cy, m0, q, true), objExtra) +
      adsSection(r) +
      rsec("sec-cont", "Contenido", c ? contenido(r) : planVsReal(r, false));
    if (c) h += rsec("sec-aud", "Audiencia y evolución", audiencia(r, L));
    main.innerHTML = h;
  }

  /* ---------- Detail ---------- */
  function buildDetail(p) {
    S.detailBuilt = p.id;
    var ro = S.canWrite ? "" : " disabled";
    var platBtns = Object.keys(PLATFORMS).map(function (k) {
      return '<button type="button" class="tog" id="pl-' + k + '" data-act="togplat" data-v="' + k +
        '" aria-pressed="false">' + PLATFORMS[k] + "</button>";
    }).join("");
    var dis = S.canWrite ? "" : " disabled";
    function opt(k, label) {
      return '<button type="button" class="btn sm ghost opt-add" id="optadd-' + k + '" data-act="optopen" data-v="' + k + '"' + dis +
        ">+ " + label + "</button>";
    }
    function copyRow(id, label, cnt, btn) {
      return '<div class="lblrow"><label for="' + id + '">' + label + '</label><span class="cnt" id="' + cnt + '"></span>' +
        '<button class="btn sm ghost" type="button" data-act="copyfield" data-target="' + id + '">' + btn + "</button></div>";
    }
    main.innerHTML = '<div id="detail">' +
      '<div class="detail-head"><button class="btn ghost" type="button" data-act="back">← ' +
      (S.last === "calendario" ? "Calendario" : "Lista") + "</button>" +
      '<div class="dh-right"><span class="saved" id="saveState" aria-live="polite"></span>' +
      (S.canWrite ? '<span id="delWrap"><button class="btn ghost more-btn" type="button" data-act="moremenu" aria-haspopup="menu" aria-expanded="false" aria-label="Más acciones">' + MORE_SVG + "</button></span>" : "") +
      '<span id="delConfirm" hidden><span id="delTxt">¿Eliminar este post?</span> <button class="btn sm" type="button" data-act="delno">Cancelar</button> <button class="btn sm danger" type="button" data-act="delyes" id="delYes">Sí, eliminar</button></span></div></div>' +
      // Cabecera: título y, en una fila, formato · plataformas · fecha y hora
      '<section class="card dhead"><label class="sr" for="f-title">Título</label><input id="f-title" class="in title" data-f="title" type="text" placeholder="Título o idea del post" autocomplete="off"' +
      ro + ">" +
      '<div class="dmeta"><div class="fld"><span class="lbl">Estado</span><span id="stWrap"></span></div>' +
      '<div class="fld"><span class="lbl" id="lbl-fmt">Formato</span><span id="fmtWrap"></span></div>' +
      '<div class="fld"><span class="lbl" id="lbl-plat">Plataformas</span><div class="wrapr" role="group" aria-labelledby="lbl-plat">' +
      platBtns + "</div></div>" +
      '<div class="fld dm-when"><span class="lbl">Publicación</span>' + dtFields("f", true) + "</div>" +
      '<div class="fld"><span class="lbl">Colaboración</span><span id="colabWrap"></span></div></div></section>' +
      '<div class="dtabs seg" role="group" aria-label="Sección del post">' +
      [["contenido", "Contenido"], ["produccion", "Producción"], ["resultados", "Resultados"]].map(function (x) {
        return '<button type="button" data-act="dtab" data-v="' + x[0] + '" id="dtab-' + x[0] + '" aria-pressed="false">' + x[1] + "</button>";
      }).join("") + "</div>" +
      '<nav class="tabs dtabs-d" id="dtabsD" aria-label="Sección del post">' +
      '<button type="button" data-act="dtab" data-v="contenido" data-grp="d">Contenido y producción</button>' +
      '<button type="button" data-act="dtab" data-v="resultados" data-grp="d">Métricas y ads</button></nav>' +
      '<div class="grid2" id="dgrid" data-tab="' + S.dtab + '"><div class="col col-contenido">' +
      '<section class="card"><h3>Contenido</h3>' +
      '<div class="fld">' + copyRow("f-copy", "Copy", "cnt-copy", "Copiar") +
      '<textarea id="f-copy" class="in" data-f="copy" rows="5" placeholder="Texto que acompaña la publicación"' + ro + "></textarea></div>" +
      '<div class="fld">' + copyRow("f-hashtags", "Hashtags", "cnt-tags", "Copiar") +
      '<textarea id="f-hashtags" class="in" data-f="hashtags" rows="2" placeholder="#hashtag1 #hashtag2"' + ro + "></textarea></div>" +
      '<div class="fld"><label for="f-drive">Carpeta de Drive</label><div class="drivebox"><input id="f-drive" class="in" data-f="drive" type="url" inputmode="url" placeholder="Link de la carpeta con los contenidos" autocomplete="off" spellcheck="false"' +
      ro + '><span id="driveOpen"></span></div><div class="hint" id="driveHint" hidden><span class="over">Ese link no parece válido.</span></div></div>' +
      "</section></div>" +
      '<div class="col col-produccion">' +
      '<section class="card"><div class="card-h"><h3>Producción</h3><button class="sw" id="sw-shoot" type="button" role="switch" aria-checked="false" data-act="togshoot" title="Aparece en la pauta audiovisual del mes de publicación"><span class="trk"></span><span>En la pauta</span></button></div>' +
      '<div class="fld grabfld" id="grabFld"><label for="f-grabarEn">Grabar en</label><select id="f-grabarEn" class="in sel" data-f="grabarEn"' + ro +
      "></select></div>" +
      '<div class="fld"><label for="f-direction">Dirección creativa</label><textarea id="f-direction" class="in" data-f="direction" rows="4" placeholder="Idea, tono, estilo visual, música…"' +
      ro + "></textarea></div>" +
      '<div class="fld" id="shotsFld"><div class="lblrow"><span class="lbl" id="lbl-shot">Lista de tomas</span><span class="cnt" id="shotProg"></span>' +
      '<button class="ck-inline" id="sw-done" type="button" role="checkbox" aria-checked="false" data-act="togdone">' + CHECK_SVG + "<span>Ya se tomó</span></button></div>" +
      '<div class="shots" id="shotsBox" role="group" aria-labelledby="lbl-shot"></div>' +
      '<div><button class="btn sm ghost" type="button" id="shotAdd" data-act="shotadd"' + ro + ">+ Añadir toma</button></div></div>" +
      // Lo opcional: se abre al usarlo
      '<div class="fld opt refbox" id="opt-refs" hidden><div class="lblrow"><label for="f-refs">Referencias</label>' +
      '<button class="ck-inline" id="sw-refshow" type="button" role="checkbox" aria-checked="true" data-act="togrefshow">' + CHECK_SVG + "<span>Mostrar en la pauta</span></button></div>" +
      '<textarea id="f-refs" class="in" data-f="refs" rows="2" placeholder="Links o notas. También puedes pegar o arrastrar imágenes aquí."' +
      ro + "></textarea>" +
      '<div id="refLinks"></div><div class="thumbs" id="refThumbs"></div>' +
      '<div class="hint"><span id="refStatus"></span><span><input id="refFile" type="file" accept="image/*" multiple hidden><button class="btn sm ghost" type="button" id="refAdd" data-act="refadd"' +
      ro + ">+ Imágenes</button></span></div></div>" +
      '<div class="fld opt" id="opt-voice" hidden><label for="f-voice">Guion de voz</label><textarea id="f-voice" class="in" data-f="voice" rows="3" placeholder="Una frase por línea"' +
      ro + "></textarea></div>" +
      '<div class="r2 opt-r2"><div class="fld opt" id="opt-location" hidden><label for="f-location">Locación</label><input id="f-location" class="in" data-f="location" type="text" placeholder="Dónde se graba" autocomplete="off"' +
      ro + "></div>" +
      '<div class="fld opt" id="opt-props" hidden><label for="f-props">Props y vestuario</label><input id="f-props" class="in" data-f="props" type="text" placeholder="Qué hay que llevar" autocomplete="off"' +
      ro + "></div></div>" +
      '<div class="opt-adds" id="optAdds">' + opt("refs", "Referencias") + opt("voice", "Guion de voz") + opt("location", "Locación") +
      opt("props", "Props y vestuario") + "</div>" +
      "</section></div>" +
      // Métricas y ads: su propia pestaña (solo cuando ya se publicó)
      '<div class="col col-resultados"><div class="res-grid">' +
      '<section class="card" id="igCard" hidden><div class="card-h"><h3>Métricas de Instagram</h3><span id="igAct"></span></div>' +
      '<div class="fld" id="igLinkFld"><label for="f-igLink">Link en Instagram</label><input id="f-igLink" class="in" data-f="igLink" type="url" inputmode="url" placeholder="Pega el link del post publicado" autocomplete="off" spellcheck="false"' +
      ro + '></div><div id="igBody"></div></section>' +
      '<section class="card" id="adsCard" hidden><div class="card-h"><h3>Impulsos</h3><span id="adsAct"></span></div><div id="adsBody"></div></section>' +
      "</div></div></div>" +
      '<p class="edited" id="editedBy"></p></div>';
  }
  function paintCounters() {
    var c = $("#f-copy"), t = $("#f-hashtags"), p = S.posts.get(S.postId);
    if (c) {
      var n = c.value.length, ig = p && (p.platforms || []).indexOf("ig") >= 0 && n > 2200;
      $("#cnt-copy").innerHTML = n + " caracteres" +
        (ig ? ' · <span class="over">Supera los 2.200 de Instagram</span>' : "");
    }
    if (t) {
      var tags = (t.value.match(/#[\p{L}\p{N}_]+/gu) || []).length;
      $("#cnt-tags").textContent = plural(tags, "hashtag", "hashtags");
    }
    var rl = $("#refLinks"), rf = $("#f-refs");
    if (rl && rf) rl.innerHTML = linksHtml(rf.value);
    var dv = $("#f-drive"), dop = $("#driveOpen");
    if (dv && dop) {
      var dh = driveHref(dv.value);
      dop.innerHTML = dh ? driveLink({ drive: dh }, "btn sm") : "";
      $("#driveHint").hidden = !dv.value.trim() || !!dh;
    }
  }
  /* Campos opcionales de producción: se ven si tienen algo o si se abrieron; si no, un botón «+ …» los abre.
     Locación, props y guion de voz son de la pauta: solo con «En la pauta». */
  var OPT_F = { refs: "refs", voice: "voice", location: "location", props: "props" };
  function paintOpts(p) {
    var open = (S.optOpen && S.optOpen[p.id]) || {}, any = false;
    Object.keys(OPT_F).forEach(function (k) {
      var has = !!String(p[OPT_F[k]] || "").trim() || (k === "refs" && refImgs(p).length > 0);
      var pauta = k !== "refs";
      var show = (has || open[k]) && (!pauta || p.shoot || has);
      $("#opt-" + k).hidden = !show;
      var add = $("#optadd-" + k);
      add.hidden = show || !S.canWrite || (pauta && !p.shoot);
      if (!add.hidden) any = true;
    });
    $("#optAdds").hidden = !any;
  }
  /* «Grabar en»: la pauta en que se graba el post. Por defecto la de su mes; se puede adelantar a meses anteriores. */
  function paintGrab(p) {
    var fld = $("#grabFld"), sel = $("#f-grabarEn");
    if (!fld || !sel) return;
    fld.hidden = !p.shoot;
    var base = p.date ? p.date.slice(0, 7) : todayStr().slice(0, 7);
    var by = +base.slice(0, 4), bm = +base.slice(5, 7) - 1, opts = [["", p.date ? "Su mes (" + monthName(base) + ")" : "Su mes de publicación"]];
    for (var k = 1; k <= 3; k++) {
      var d = new Date(by, bm - k, 1), ym = monthKey(d.getFullYear(), d.getMonth());
      opts.push([ym, cap(monthName(ym)) + (d.getFullYear() !== by ? " " + d.getFullYear() : "")]);
    }
    if (p.grabarEn && !opts.some(function (o) {
      return o[0] === p.grabarEn;
    })) opts.push([p.grabarEn, cap(monthName(p.grabarEn)) + " " + p.grabarEn.slice(0, 4)]);
    var sig = JSON.stringify(opts) + (p.grabarEn || "");
    if (sel.dataset.sig !== sig) {
      sel.innerHTML = opts.map(function (o) {
        return '<option value="' + o[0] + '"' + ((p.grabarEn || "") === o[0] ? " selected" : "") + ">" + esc(o[1]) + "</option>";
      }).join("");
      sel.dataset.sig = sig;
    }
    if (sel !== document.activeElement) sel.value = p.grabarEn || "";
  }
  /* «Autoguardado ✓»: mientras hay cambios por guardar dice «Guardando…». */
  function paintSave() {
    var el = $("#saveState");
    if (!el) return;
    if (!S.canWrite) {
      el.textContent = "";
      return;
    }
    var path = "posts/" + S.postId, busy = !!pending[path] || !!saving[path];
    el.className = "saved" + (busy ? " busy" : "");
    el.innerHTML = busy ? "Guardando…" : "Autoguardado " + CHECK_SVG;
  }
  function paintFooter() {
    var p = S.posts.get(S.postId), el = $("#editedBy");
    if (!el || !p) return;
    if (!p.updatedAt) {
      el.textContent = "";
      return;
    }
    var who = p.updatedBy
      ? (p.updatedBy === S.uid ? "ti" : (S.names[p.updatedBy] || "otra persona"))
      : "";
    el.textContent = "Editado" + (who ? " por " + who : "") + " · " + relTime(p.updatedAt);
  }
  function shotRowHtml(sh, i, ro) {
    return '<div class="shot-row"><button class="ck" type="button" role="checkbox" aria-checked="' +
      (!!sh.d) + '" aria-label="Marcar toma ' + (i + 1) + '" data-act="shotck" data-i="' + i +
      '">' + CHECK_SVG + "</button>" +
      '<input class="in" id="shot-' + i + '" data-shot="' + i + '" type="text" value="' +
      esc(sh.t) + '" placeholder="Ej. Plano general del espacio" autocomplete="off"' + ro + ">" +
      '<button class="icon-x" type="button" data-act="shotdel" data-i="' + i +
      '" aria-label="Quitar toma ' + (i + 1) + '">×</button></div>';
  }
  function paintShots(p, force) {
    var box = $("#shotsBox");
    if (!box) return;
    var arr = getShots(p), ae = document.activeElement;
    var editing = !!(ae && ae.tagName === "INPUT" && box.contains(ae));
    var pend = (pending["posts/" + p.id] || {}).patch || {};
    var sig = JSON.stringify(arr);
    if (
      force ||
      (!editing && !Object.prototype.hasOwnProperty.call(pend, "shots") && box.dataset.sig !== sig)
    ) {
      box.innerHTML = arr.length
        ? arr.map(function (x, i) {
          return shotRowHtml(x, i, S.canWrite ? "" : " disabled");
        }).join("")
        : '<p class="muted">Aún no hay tomas. Añade cada clip o foto que hay que tomar para ir tachándolos.</p>';
      box.dataset.sig = sig;
    }
    var c = shotCount(p);
    var pr = $("#shotProg");
    if (pr) pr.textContent = c.n ? (c.d + " de " + c.n + " listas") : "";
  }
  function focusShot(i) {
    var el = document.getElementById("shot-" + i);
    if (el) el.focus();
  }
  function mutShots(fn) {
    var p = S.posts.get(S.postId);
    if (!p || !canW()) return false;
    var arr = copyShots(p);
    fn(arr);
    setShots(p, arr, 300);
    paintShots(p, true);
    $("#sw-done").hidden = arr.length > 0;
    return true;
  }
  function paintRefs(p) {
    var box = $("#refThumbs");
    if (!box) return;
    var imgs = refImgs(p), sig = JSON.stringify(imgs);
    if (box.dataset.sig !== sig) {
      box.innerHTML = imgs.map(function (x) {
        return '<div class="thumb"><a href="' + window.PLANIFICA.img + esc(x.id) +
          '" target="_blank" rel="noopener noreferrer"><img src="' + window.PLANIFICA.img +
          esc(x.id) + '" alt="Imagen de referencia" loading="lazy"></a>' +
          (S.canWrite
            ? '<button class="icon-x" type="button" data-act="refdel" data-id="' + esc(x.id) +
              '" aria-label="Quitar imagen">×</button>'
            : "") +
          "</div>";
      }).join("");
      box.dataset.sig = sig;
    }
    var add = $("#refAdd");
    if (add) add.hidden = !(S.assets && S.canWrite);
    var st = $("#refStatus");
    if (st && !S.refBusy) {
      st.textContent = (S.booted && S.canWrite && !S.assets)
        ? "Tu nivel de acceso no permite subir imágenes. Pega links."
        : "";
    }
  }
  function setRefStatus(t) {
    var st = $("#refStatus");
    if (st) st.textContent = t;
  }
  function prepImage(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        try {
          var s = Math.min(1, 1080 / Math.max(img.naturalWidth, img.naturalHeight)),
            cv = document.createElement("canvas");
          cv.width = Math.max(1, Math.round(img.naturalWidth * s));
          cv.height = Math.max(1, Math.round(img.naturalHeight * s));
          var cx = cv.getContext("2d");
          cx.fillStyle = "#fff";
          cx.fillRect(0, 0, cv.width, cv.height);
          cx.drawImage(img, 0, 0, cv.width, cv.height);
          URL.revokeObjectURL(url);
          cv.toBlob(
            function (b) {
              b ? res(b) : rej(new Error("blob"));
            },
            "image/webp",
            0.72,
          );
        } catch (e) {
          rej(e);
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        rej(new Error("decode"));
      };
      img.src = url;
    });
  }
  function upErr(err) {
    var c = err && err.code;
    if ((c === "quota_exceeded" || c === "permission_denied") && err.message) return err.message;
    if (c === "too_large") return "La imagen es demasiado grande.";
    if (c === "quota_or_state") return "Se llenó el espacio de imágenes de la app.";
    if (c === "rate_limited") return "Demasiadas subidas seguidas. Espera un momento.";
    return "No se pudo subir una imagen. Prueba con JPG o PNG.";
  }
  function addRefFiles(files) {
    var p = S.posts.get(S.postId);
    if (!p || !canW()) return;
    if (!S.assets) {
      toast("Tu nivel de acceso no permite subir imágenes.");
      return;
    }
    var list = Array.prototype.filter.call(files || [], function (f) {
      return /^image\//.test(f.type);
    });
    if (!list.length) {
      toast("Elige archivos de imagen.");
      return;
    }
    var pid = p.id, added = [], ch = Promise.resolve();
    S.refBusy = true;
    setRefStatus("Subiendo " + plural(list.length, "imagen", "imágenes") + "…");
    list.forEach(function (f) {
      ch = ch.then(function () {
        return prepImage(f).then(function (b) {
          return S.assets.upload(b, { type: b.type || "image/webp" });
        }).then(function (r) {
          added.push({ id: r.id });
        }, function (err) {
          toast(upErr(err));
        });
      });
    });
    ch.then(function () {
      S.refBusy = false;
      setRefStatus("");
      var cur = S.posts.get(pid);
      if (!cur || !added.length) return;
      var arr = refImgs(cur).concat(added);
      cur.refImgs = arr;
      queueSave("posts/" + pid, { refImgs: arr }, 0);
      if (S.view === "detalle" && S.postId === pid) paintRefs(cur);
    });
  }
  function paintDetail() {
    var p = S.posts.get(S.postId);
    if (!p) {
      S.detailBuilt = null;
      if (S.loaded.posts) {
        main.innerHTML =
          '<div class="empty" style="margin-top:24px"><h3>Este post no existe</h3><p>Puede que se haya eliminado.</p><div class="acts"><button class="btn" type="button" data-act="back">← Volver</button></div></div>';
      } else {main.innerHTML = '<div class="empty" style="margin-top:24px"><p>' +
          (db === null && S.booted ? "No se pudo conectar con el servidor." : "Cargando…") +
          "</p></div>";}
      return;
    }
    if (S.detailBuilt !== p.id) buildDetail(p);
    var pend = (pending["posts/" + p.id] || {}).patch || {};
    document.querySelectorAll("#detail [data-f]").forEach(function (el) {
      var f = el.dataset.f;
      if (el === document.activeElement || Object.prototype.hasOwnProperty.call(pend, f)) return;
      var v = p[f] == null ? "" : String(p[f]);
      if (el.value !== v) el.value = v;
    });
    paintColab(p);
    var fw = $("#fmtWrap"), fk = (FORMATS[p.format] ? p.format : "reel") + (S.canWrite ? "w" : "r");
    if (fw && fw.dataset.k !== fk) {
      fw.innerHTML = fmtSelect(p);
      fw.dataset.k = fk;
    }
    Object.keys(PLATFORMS).forEach(function (k) {
      $("#pl-" + k).setAttribute("aria-pressed", String((p.platforms || []).indexOf(k) >= 0));
    });
    var stw = $("#stWrap"), stk = (STATUS[p.status] ? p.status : "idea") + (S.canWrite ? "w" : "r");
    if (stw && stw.dataset.k !== stk) {
      stw.innerHTML = stSelect(p);
      stw.dataset.k = stk;
    }
    $("#sw-shoot").setAttribute("aria-checked", String(!!p.shoot));
    $("#sw-done").setAttribute("aria-checked", String(!!p.shotDone));
    paintShots(p, false);
    // Lista de tomas: solo si va en la pauta. «Ya se tomó» solo cuando no hay tomas que marcar.
    $("#shotsFld").hidden = !p.shoot;
    $("#sw-done").hidden = shotCount(p).n > 0;
    $("#sw-refshow").setAttribute("aria-checked", String(p.refShow !== false));
    $("#sw-refshow").hidden = !p.shoot;
    paintRefs(p);
    $("#lbl-shot").textContent = (FORMATS[p.format] || FORMATS.reel).list;
    paintOpts(p);
    paintGrab(p);
    paintDT();
    paintCounters();
    paintFooter();
    paintSave();
    // Métricas y ads: en todo post de Instagram (ahí se pega el link) o con impulsos; las historias no tienen métricas
    var res = hasIg(p) || impulsosDe(p.id).length > 0;
    $("#dtab-resultados").hidden = !res;
    $("#dtabsD").hidden = !res;
    if (!res && S.dtab === "resultados") S.dtab = "contenido";
    paintDtabs();
    $("#igLinkFld").hidden = !hasIg(p);
    paintIg(p);
    paintAds(p);
    ensureThumbs();
  }

  /* ---------- Render ---------- */
  /* Si llegan datos mientras se aprieta un botón, el redibujado espera a que se suelte (si no, el clic se pierde). */
  var ptrDown = false, ptrRender = false;
  document.addEventListener("pointerdown", function () {
    ptrDown = true;
  }, true);
  function soltar() {
    if (!ptrDown) return;
    ptrDown = false;
    if (ptrRender) {
      ptrRender = false;
      setTimeout(function () {
        render();
      }, 0);
    }
  }
  document.addEventListener("click", soltar);
  document.addEventListener("pointerup", function () {
    setTimeout(soltar, 0);
  }, true);
  document.addEventListener("pointercancel", soltar, true);
  function render(toTop) {
    if (DR && DR.active) {
      S.needsRender = true;
      return;
    }
    if (ptrDown && !toTop) {
      ptrRender = true;
      return;
    }
    setNav();
    if (S.view === "detalle") {
      paintDetail();
      if (toTop) window.scrollTo(0, 0);
      return;
    }
    S.detailBuilt = null;
    var ae = document.activeElement, keep = null;
    if (ae && ae.id && main.contains(ae) && (ae.tagName === "TEXTAREA" || ae.tagName === "INPUT")) {
      keep = { id: ae.id, v: ae.value, s: ae.selectionStart, e: ae.selectionEnd };
    }
    var sy = window.scrollY;
    ({ lista: viewLista, calendario: viewCal, objetivos: viewObj, pauta: viewPauta, rendimiento: viewRes })[S.view]();
    if (keep) {
      var el = document.getElementById(keep.id);
      if (el) {
        el.value = keep.v;
        el.focus({ preventScroll: true });
        try {
          el.setSelectionRange(keep.s, keep.e);
        } catch (e) {}
      }
    }
    window.scrollTo(0, toTop ? 0 : sy);
    ensureThumbs();
    if (S.pendingNew != null && S.loaded.posts) {
      var nd = S.pendingNew;
      S.pendingNew = null;
      openNewPost({ date: nd });
    }
  }
  function onData(pendingWrites) {
    if (S.view === "detalle") {
      paintDetail();
      return;
    }
    if (pendingWrites && S.view === "objetivos") return;
    render();
  }

  /* ---------- Examples ---------- */
  function loadExamples() {
    if (!canW()) return;
    var dim = new Date(S.cy, S.cm + 1, 0).getDate();
    function d(n) {
      return ymd(S.cy, S.cm, Math.min(n, dim));
    }
    var ex = [
      {
        format: "reel",
        title: "Ejemplo: reel de bienvenida (quiénes somos)",
        date: d(4),
        time: "18:00",
        status: "porproducir",
        platforms: ["ig", "tt"],
        direction: "Ritmo rápido, luz natural, música instrumental. Cierra con cara a cámara.",
        copy: "Hola, somos [nombre]. Esto es lo que vas a ver por aquí.",
        hashtags: "#presentacion #detrasdecamaras",
        shoot: true,
        shotList:
          "1. Plano general del espacio\n2. Cara a cámara, 10 s\n3. Detalle de manos trabajando",
        location: "Estudio",
        props: "Vestuario neutro",
      },
      {
        format: "carrusel",
        title: "Ejemplo: 5 errores comunes (carrusel)",
        date: d(7),
        time: "12:00",
        status: "produccion",
        platforms: ["ig"],
        direction: "Fondo liso, una idea por slide, tipografía grande.",
        copy: "Guarda este post para no cometerlos.",
        hashtags: "#tips #aprende",
        shoot: false,
        shotList: "Slide 1: gancho\nSlides 2–6: un error por slide\nSlide 7: llamado a guardar",
      },
      {
        format: "foto",
        title: "Ejemplo: foto de producto en luz natural",
        date: d(11),
        time: "10:00",
        status: "idea",
        platforms: ["ig"],
        direction: "Luz lateral de ventana, superficie de madera clara.",
        shoot: true,
        shotList: "Plano cenital\nPlano 45° con detalle\nProducto en uso",
        location: "Ventana del estudio",
        props: "Mantel de lino, planta pequeña",
      },
      {
        format: "historia",
        title: "Ejemplo: encuesta de la semana",
        date: d(12),
        time: "09:00",
        status: "listo",
        platforms: ["ig"],
        direction: "Fondo de color de marca con sticker de encuesta.",
        shoot: false,
        shotList: "Historia 1: pregunta\nHistoria 2: resultado",
      },
      {
        format: "reel",
        title: "Ejemplo: proceso paso a paso (timelapse)",
        date: d(18),
        time: "19:00",
        status: "idea",
        platforms: ["ig", "tt"],
        direction: "Timelapse con texto en pantalla por paso.",
        shoot: true,
        shotList: "Cámara fija sobre la mesa\nGrabar 20 min continuos\nPlano de resultado final",
        location: "Estudio",
        props: "Materiales del paso a paso",
      },
      {
        format: "diseno",
        title: "Ejemplo: frase del mes",
        date: d(24),
        time: "11:00",
        status: "porproducir",
        platforms: ["ig"],
        direction: "Tipografía grande sobre fondo de color, un solo mensaje.",
        shoot: false,
      },
    ];
    ex[0].voice = "Hola, somos [nombre].\nEsto es lo que vas a ver por aquí.";
    ex.forEach(function (e) {
      e.example = true;
      e.shotDone = false;
      e.refs = e.refs || "";
      e.shots = String(e.shotList || "").split("\n").map(function (x) {
        return x.replace(/^\d+\.\s*/, "").trim();
      }).filter(Boolean).map(function (t) {
        return { t: t, d: false };
      });
      delete e.shotList;
    });
    var chainP = Promise.resolve();
    ex.forEach(function (e) {
      chainP = chainP.then(function () {
        return createPost(e);
      });
    });
    chainP.then(function () {
      toast("Ejemplos cargados");
      render();
    });
  }

  /* ---------- Clipboard and downloads ---------- */
  function copyText(t, msg) {
    var ok = function () {
      toast(msg || "Copiado");
    };
    var fb = function () {
      var ta = document.createElement("textarea");
      ta.value = t;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var r = false;
      try {
        r = document.execCommand("copy");
      } catch (e) {}
      ta.remove();
      if (r) ok();
      else toast("No se pudo copiar. Selecciona el texto y cópialo a mano.");
    };
    try {
      navigator.clipboard.writeText(t).then(ok, fb);
    } catch (e) {
      fb();
    }
  }
  function download(name, text) {
    var p = (window.claude && window.claude.use)
      ? window.claude.use("downloads")
      : Promise.resolve(null);
    Promise.resolve(p).catch(function () {
      return null;
    }).then(function (d) {
      if (!d) {
        toast("La descarga no está disponible en esta vista.");
        return;
      }
      return d.save({ filename: name, data: text }).then(function () {
        toast("Archivo listo");
      }, function (e) {
        if (!e || e.code !== "declined") toast("No se pudo descargar el archivo.");
      });
    });
  }

  /* ---------- Events ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (a && !a.dataset.act) return;
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var act = el.dataset.act, p;
    switch (act) {
      case "secgo":
        var sec = document.getElementById(el.dataset.v);
        if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      case "budedit":
        S.budEdit = true;
        render();
        var bm = $("#budMonto");
        if (bm) bm.focus();
        break;
      case "budtoggle":
        S.budOpen = !S.budOpen;
        render();
        break;
      case "budcancel":
        S.budEdit = false;
        render();
        break;
      case "budsave":
        saveBudget(el);
        break;
      case "impnew":
        if (canW()) openImp(null, el.dataset.post || null);
        break;
      case "impedit":
        if (canW()) openImp(el.dataset.id);
        break;
      case "impclose":
        closeImp();
        break;
      case "impsave":
        saveImp(el);
        break;
      case "impdel":
        deleteImp(el);
        break;
      case "impsort":
        S.impSort = el.dataset.v;
        render();
        break;
      case "resred":
        S.resRed = el.dataset.v;
        render();
        break;
      case "resper":
        S.resPer = el.dataset.v;
        render();
        break;
      case "ressort":
        S.resSort = el.dataset.v;
        render();
        break;
      case "igupd":
        igUpdate();
        break;
      case "stmenu":
        if (stMenuBtn === el) closeStMenu(true);
        else openStMenu(el);
        break;
      case "stpick":
        pickStatus(el.dataset.id, el.dataset.v);
        break;
      case "togpub":
        S.showPub = !S.showPub;
        try {
          localStorage.setItem("pc_pub", S.showPub ? "1" : "0");
        } catch (e2) {}
        render();
        break;
      case "new":
        openNewPost({});
        break;
      case "add":
        e.stopPropagation();
        openNewPost({ date: el.dataset.date });
        break;
      case "npfmt":
        if (S.npOpen) {
          S.npOpen.format = el.dataset.v;
          S.npOpen.platforms = defaultPlats(el.dataset.v);
          paintNewPost();
        }
        break;
      case "npplat":
        if (S.npOpen) {
          var npl = S.npOpen.platforms, npi = npl.indexOf(el.dataset.v);
          if (npi >= 0) npl.splice(npi, 1);
          else npl.push(el.dataset.v);
          paintNewPost();
        }
        break;
      case "dtopen":
        openDT(el);
        break;
      case "dtnav":
        if (S.dtPop) {
          S.dtPop.m += +el.dataset.v;
          if (S.dtPop.m < 0) S.dtPop.m = 11, S.dtPop.y--;
          if (S.dtPop.m > 11) S.dtPop.m = 0, S.dtPop.y++;
          renderDT();
        }
        break;
      case "dtset":
        if (S.dtPop) {
          var dtid = S.dtPop.id, dtb = S.dtPop.btn;
          closeDT();
          setDT(dtid, el.dataset.v);
          if (dtb) dtb.focus();
        }
        break;
      case "traer":
        openTraer();
        break;
      case "traerpick":
        traerPick(el.dataset.id);
        break;
      case "traerclose":
        closeTraer();
        break;
      case "npclose":
        closeNewPost();
        break;
      case "npsave":
        saveNewPost();
        break;
      case "selday":
        S.selDay = el.dataset.date;
        render();
        break;
      case "prev":
        shift(isQ() ? -3 : -1);
        render();
        break;
      case "next":
        shift(isQ() ? 3 : 1);
        render();
        break;
      case "today":
        S.cy = now.getFullYear();
        S.cm = now.getMonth();
        S.selDay = null;
        render();
        break;
      case "gocal":
        S.cm = Number(el.dataset.m);
        S.selDay = null;
        go("calendario");
        break;
      case "lsort":
        S.lsort = el.dataset.v === "formato" ? "formato" : "fecha";
        setPref("pc_lsort", S.lsort);
        render();
        break;
      case "lview":
        S.lview = el.dataset.v === "detalle" ? "detalle" : "simple";
        setPref("pc_lview", S.lview);
        render();
        break;
      case "moclose":
        closeMonthObj();
        break;
      case "moedit":
        closeMonthObj();
        S.cy = +el.dataset.v.slice(0, 4);
        S.cm = +el.dataset.v.slice(5, 7) - 1;
        go("objetivos");
        break;
      case "tfmtmenu":
        p = S.posts.get(el.dataset.id);
        if (!p) break;
        if (stMenuBtn === el) closeStMenu(false);
        else {
          openMenu(el, FORMAT_ORDER.map(function (f) {
            return '<button class="tog fmtbtn f-' + f + '" type="button" role="menuitemradio" aria-checked="' + (p.format === f) +
              '" aria-pressed="' + (p.format === f) + '" data-act="tfmtpick" data-id="' + esc(p.id) + '" data-v="' + f + '">' + fIcon(f) +
              FORMATS[f].label + "</button>";
          }).join(""), "fmt-menu");
        }
        break;
      case "tfmtpick":
        closeStMenu(false);
        setFormat(S.posts.get(el.dataset.id), el.dataset.v);
        break;
      case "tplat":
        p = S.posts.get(el.dataset.id);
        if (!p || !canW()) break;
        var tpl = (p.platforms || []).slice(), tpi = tpl.indexOf(el.dataset.v);
        if (tpi >= 0) tpl.splice(tpi, 1);
        else tpl.push(el.dataset.v);
        p.platforms = tpl;
        queueSave("posts/" + p.id, { platforms: tpl }, 0);
        render();
        break;
      case "tshoot":
        p = S.posts.get(el.dataset.id);
        if (!p || !canW()) break;
        p.shoot = !p.shoot;
        queueSave("posts/" + p.id, { shoot: p.shoot }, 0);
        render();
        break;
      case "pubtoggle":
        S.pubOpen = !S.pubOpen;
        render();
        break;
      case "monthobj":
        openMonthObj(el.dataset.v);
        break;
      case "lgroup":
        S.lgroup = el.dataset.v === "estado" ? "estado" : "mes";
        setPref("pc_lgroup", S.lgroup);
        render();
        break;
      case "fplat":
        S.f.plat = el.dataset.v;
        render();
        break;
      case "togfilters":
        S.filtersOpen = !S.filtersOpen;
        render();
        break;
      case "clearfilters":
        S.f = { plat: "all", fmt: "all", st: "all", q: "" };
        render();
        break;
      case "mtoggle":
        var tm = el.dataset.mid;
        if (S.mcol[tm]) delete S.mcol[tm];
        else S.mcol[tm] = 1;
        try {
          localStorage.setItem("pc_mcol", JSON.stringify(S.mcol));
        } catch (e) {}
        render();
        break;
      case "madd":
        var nid = newId("mt");
        saveMetrics(el.dataset.gid, function (nm) {
          nm[el.dataset.plat].push({
            id: nid,
            name: "",
            cur: null,
            tar: null,
            pin: null,
            real: [null, null, null],
          });
        });
        render();
        var ni2 = document.getElementById("mf-" + nid + "-name");
        if (ni2) ni2.focus();
        break;
      case "mdel":
        S.mdel = el.dataset.mid;
        render();
        break;
      case "mdelno":
        S.mdel = "";
        render();
        break;
      case "mdelyes":
        var dmid = el.dataset.mid;
        saveMetrics(el.dataset.gid, function (nm) {
          nm[el.dataset.plat] = nm[el.dataset.plat].filter(function (m) {
            return m.id !== dmid;
          });
        });
        S.mdel = "";
        render();
        break;
      case "mpinreset":
        editMetric(el.dataset.gid, el.dataset.plat, el.dataset.mid, function (m) {
          m.pin = null;
        });
        render();
        break;
      case "objdone":
        if (!canW()) break;
        var ogid = el.dataset.gid,
          og = S.goals.get(ogid) || { id: ogid },
          otx = lines(og.objectives)[Number(el.dataset.i)];
        if (otx == null) break;
        var odn = (og.objDone || []).slice(), ok2 = odn.indexOf(otx);
        if (ok2 >= 0) odn.splice(ok2, 1);
        else odn.push(otx);
        S.goals.set(ogid, Object.assign({}, og, { objDone: odn }));
        queueSave("goals/" + ogid, { objDone: odn }, 0);
        render();
        break;
      case "goalsedit":
        if (!canW()) break;
        if (S.goalsEdit) flushAll();
        S.goalsEdit = !S.goalsEdit;
        render();
        break;
      case "refadd":
        var rf = $("#refFile");
        if (rf) rf.click();
        break;
      case "refdel":
        p = S.posts.get(S.postId);
        if (!p || !canW()) break;
        var rid = el.dataset.id,
          rarr = refImgs(p).filter(function (x) {
            return x.id !== rid;
          });
        p.refImgs = rarr;
        queueSave("posts/" + p.id, { refImgs: rarr }, 0);
        paintRefs(p);
        if (S.assets) S.assets.delete(rid).catch(function () {});
        break;
      case "optopen":
        p = S.posts.get(S.postId);
        if (!p) break;
        S.optOpen = S.optOpen || {};
        (S.optOpen[p.id] = S.optOpen[p.id] || {})[el.dataset.v] = true;
        paintOpts(p);
        var of = $("#opt-" + el.dataset.v + " .in");
        if (of) of.focus();
        break;
      case "togrefshow":
        p = S.posts.get(S.postId);
        if (!p || !canW()) break;
        p.refShow = !(p.refShow !== false);
        queueSave("posts/" + p.id, { refShow: p.refShow }, 0);
        paintDetail();
        break;
      case "dtab":
        S.dtab = el.dataset.v;
        paintDtabs();
        window.scrollTo(0, 0);
        break;
      case "group":
        S.group = el.dataset.v;
        render();
        break;
      case "toggledone":
        S.showDone = !S.showDone;
        render();
        break;
      case "examples":
        loadExamples();
        break;
      case "rmexamples":
        allPosts().filter(function (x) {
          return x.example;
        }).forEach(function (x) {
          deletePost(x.id);
        });
        toast("Ejemplos borrados");
        render();
        break;
      case "back":
        flushAll();
        go(S.last || "lista");
        break;
      case "done":
        p = S.posts.get(el.dataset.id);
        if (!p || !canW()) break;
        toggleTaken(p);
        render();
        break;
      case "pshot":
        p = S.posts.get(el.dataset.id);
        if (!p || !canW()) break;
        var pa = copyShots(p), pi = Number(el.dataset.i);
        if (pa[pi]) {
          pa[pi].d = !pa[pi].d;
          setShots(p, pa, 0);
          render();
        }
        break;
      case "shotadd":
        var ni = getShots(S.posts.get(S.postId) || {}).length;
        if (
          mutShots(function (a) {
            a.push({ t: "", d: false });
          })
        ) focusShot(ni);
        break;
      case "shotdel":
        var di = Number(el.dataset.i);
        mutShots(function (a) {
          a.splice(di, 1);
        });
        break;
      case "shotck":
        p = S.posts.get(S.postId);
        if (!p || !canW()) break;
        var sa = copyShots(p), si = Number(el.dataset.i);
        if (sa[si]) {
          sa[si].d = !sa[si].d;
          setShots(p, sa, 0);
          el.setAttribute("aria-checked", String(sa[si].d));
          var bx = $("#shotsBox");
          if (bx) bx.dataset.sig = JSON.stringify(sa);
          paintShots(p, false);
        }
        break;
      case "dlpdf":
        if (S.pdfBusy) break;
        var pd = pautaData();
        if (!pd.all.length) {
          toast("No hay piezas en la pauta de este mes.");
          break;
        }
        S.pdfBusy = true;
        toast("Generando PDF…");
        var pids = pdfImageIds(pd);
        Promise.all(pids.map(loadImgData)).then(function (res) {
          var map = {};
          pids.forEach(function (id, k) {
            if (res[k]) map[id] = res[k];
          });
          var buf = null;
          try {
            buf = buildPdf(pd, map);
          } catch (err) {
            buf = null;
          }
          S.pdfBusy = false;
          if (!buf) {
            toast("No se pudo generar el PDF. Revisa tu conexión y recarga la página.");
            return;
          }
          download("pauta-audiovisual-" + monthKey(S.cy, S.cm) + ".pdf", buf);
        });
        break;
      case "copyfield":
        var t = document.getElementById(el.dataset.target);
        if (t && t.value) copyText(t.value, "Copiado");
        else toast("No hay nada que copiar todavía.");
        break;
      case "togplat":
        p = S.posts.get(S.postId);
        if (!p) break;
        var pl = (p.platforms || []).slice(), i = pl.indexOf(el.dataset.v);
        if (i >= 0) pl.splice(i, 1);
        else pl.push(el.dataset.v);
        p.platforms = pl;
        queueSave("posts/" + p.id, { platforms: pl }, 0);
        paintDetail();
        break;
      case "togshoot":
        p = S.posts.get(S.postId);
        if (!p) break;
        p.shoot = !p.shoot;
        queueSave("posts/" + p.id, { shoot: p.shoot }, 0);
        paintDetail();
        break;
      case "togdone":
        p = S.posts.get(S.postId);
        if (!p || !canW()) break;
        toggleTaken(p);
        paintDetail();
        break;
      case "moremenu":
        if (stMenuBtn === el) closeStMenu(false);
        else {
          var mp = S.posts.get(S.postId);
          openMenu(el, '<button class="mi" type="button" role="menuitem" data-act="dup">Duplicar</button>' +
            '<button class="mi danger" type="button" role="menuitem" data-act="del">' +
            (mp && !soyDueno(mp) ? "Quitar de esta cuenta" : "Eliminar") + "</button>", "acts-menu", true);
        }
        break;
      case "fmtmenu":
        p = S.posts.get(S.postId);
        if (!p) break;
        if (stMenuBtn === el) closeStMenu(false);
        else {
          openMenu(el, FORMAT_ORDER.map(function (f) {
            return '<button class="tog fmtbtn f-' + f + '" type="button" role="menuitemradio" aria-checked="' + (p.format === f) +
              '" aria-pressed="' + (p.format === f) + '" data-act="fmtpick" data-v="' + f + '">' + fIcon(f) + FORMATS[f].label + "</button>";
          }).join(""), "fmt-menu");
        }
        break;
      case "fmtpick":
        closeStMenu(false);
        setFormat(S.posts.get(S.postId), el.dataset.v);
        var fb = $("#fmtWrap button");
        if (fb) fb.focus();
        break;
      case "colabmenu":
        if (stMenuBtn === el) closeStMenu(false);
        else openColabMenu(el);
        break;
      case "colabpick":
        toggleColab(el.dataset.v);
        break;
      case "dup":
        closeStMenu(false);
        duplicatePost(S.posts.get(S.postId));
        break;
      case "del":
        closeStMenu(false);
        p = S.posts.get(S.postId);
        var quitar = p && !soyDueno(p);
        $("#delTxt").textContent = quitar
          ? "¿Quitar este post de esta cuenta? Sigue en las demás de la colaboración."
          : (p && p.colab ? "¿Eliminar este post? Se borra en todas las cuentas de la colaboración." : "¿Eliminar este post?");
        $("#delYes").textContent = quitar ? "Sí, quitar" : "Sí, eliminar";
        $("#delWrap").hidden = true;
        $("#delConfirm").hidden = false;
        break;
      case "delno":
        $("#delWrap").hidden = false;
        $("#delConfirm").hidden = true;
        break;
      case "delyes":
        var id = S.postId, dp = S.posts.get(id), soloQuitar = dp && !soyDueno(dp);
        flushAll();
        deletePost(id);
        toast(soloQuitar ? "Post quitado de esta cuenta" : "Post eliminado");
        go(S.last || "lista");
        break;
    }
  });
  document.addEventListener("input", function (e) {
    var el = e.target;
    // Tabla de la Lista (vista detallada): cada campo guarda en su post
    if (el.dataset && el.dataset.tf && el.dataset.id) {
      var tp = S.posts.get(el.dataset.id);
      if (!tp || !canW()) return;
      var tpatch = {};
      tpatch[el.dataset.tf] = el.value;
      Object.assign(tp, tpatch);
      queueSave("posts/" + tp.id, tpatch, el.dataset.tf === "title" ? 600 : 0);
      if (el.dataset.tf !== "title") render(); // la fecha cambia el orden y el mes
      return;
    }
    if (el.id === "fq") {
      S.f.q = el.value;
      render();
      return;
    }
    if (el.dataset && el.dataset.g) {
      var v = el.dataset.gf === "postTarget" ? (el.value === "" ? "" : Number(el.value)) : el.value;
      queueSave(
        "goals/" + el.dataset.g,
        (function () {
          var o = {};
          o[el.dataset.gf] = v;
          return o;
        })(),
        600,
      );
      return;
    }
    if (el.dataset && el.dataset.shot != null && el.dataset.shot !== "") {
      var sp = S.posts.get(S.postId), sk = Number(el.dataset.shot);
      if (sp) {
        var sarr = copyShots(sp);
        if (sarr[sk]) {
          sarr[sk].t = el.value;
          setShots(sp, sarr, 600);
          var sb = $("#shotsBox");
          if (sb) sb.dataset.sig = JSON.stringify(sarr);
        }
      }
      return;
    }
    if (el.dataset && el.dataset.f && S.view === "detalle" && S.postId) {
      var o = {};
      o[el.dataset.f] = el.value;
      var p = S.posts.get(S.postId);
      if (p) Object.assign(p, o);
      queueSave(
        "posts/" + S.postId,
        o,
        el.tagName === "SELECT" || el.type === "date" || el.type === "time" ? 150 : 600,
      );
      if (
        el.id === "f-copy" || el.id === "f-hashtags" || el.id === "f-refs" || el.id === "f-drive"
      ) paintCounters();
    }
  });
  document.addEventListener("change", function (e) {
    var el = e.target;
    if (el.id === "f-igLink" && S.postId && canW()) {
      linkIg(S.postId);
      return;
    }
    if (el.id === "refFile") {
      addRefFiles(el.files);
      el.value = "";
      return;
    }
    if (el.dataset && el.dataset.mf) {
      var mq = el.dataset.mf.split("|");
      editMetric(mq[0], mq[1], mq[2], function (m) {
        if (mq[3] === "name") {
          m.name = el.value.trim();
          m.nameAuto = false;
        }
        else if (mq[3] === "src") {
          m.src = el.value; // «manual» se guarda tal cual: así no se vuelve a deducir del nombre
          // El nombre sigue al origen mientras nadie lo haya escrito a mano.
          if (m.src !== "manual" && (!m.name || m.nameAuto)) {
            m.name = srcLabel(m.src).replace(/ \(.*\)| del mes/g, "");
            m.nameAuto = true;
          }
          // «Hoy» se llena solo con el dato de Instagram (si está vacío o ya venía de Instagram).
          var gq = /^q-(\d{4})-([1-4])$/.exec(mq[0]);
          if (m.src !== "manual" && gq && (!hasNum(m.cur) || m.curAuto)) {
            var bv = baseVal(m.src, Number(gq[1]), Number(gq[2]) - 1);
            if (bv) {
              m.cur = bv.v;
              m.curAuto = true;
              m.curMes = bv.mes;
            }
          } else if (m.src === "manual" && m.curAuto) {
            m.curAuto = false;
          }
        }
        else if (mq[3] === "tarMode") {
          // Al cambiar de modo, se conserva la misma meta: el número pasa a % sobre «Hoy» y viceversa.
          var gq2 = /^q-(\d{4})-([1-4])$/.exec(mq[0]);
          var em2 = gq2 ? effM(m, mq[1], Number(gq2[1]), Number(gq2[2]) - 1) : m;
          if (el.value === "pct") {
            m.tarMode = "pct";
            if (hasNum(em2.tar) && hasNum(em2.cur) && Number(em2.cur)) {
              m.tarPct = Math.round((Number(em2.tar) / Number(em2.cur) - 1) * 1000) / 10;
            }
          } else {
            if (hasNum(em2.tar)) m.tar = Number(em2.tar);
            m.tarMode = "num";
          }
        }
        else {
          m[mq[3]] = parseNum(el.value);
          if (mq[3] === "cur") m.curAuto = false; // escrito a mano
        }
      });
      setTimeout(function () {
        render();
      }, 0);
      return;
    }
    if (el.dataset && el.dataset.mreal) {
      var rq = el.dataset.mreal.split("|"), ri = Number(rq[3]);
      editMetric(rq[0], rq[1], rq[2], function (m) {
        var a = (m.real || [null, null, null]).slice();
        while (a.length < 3) a.push(null);
        a[ri] = parseNum(el.value);
        m.real = a;
      });
      setTimeout(function () {
        render();
      }, 0);
      return;
    }
    if (el.dataset && el.dataset.mpin) {
      var pq = el.dataset.mpin.split("|"), pv = parseNum(el.value);
      editMetric(pq[0], pq[1], pq[2], function (m) {
        m.pin = pv == null ? null : { m: Number(pq[3]), d: pv };
      });
      setTimeout(function () {
        render();
      }, 0);
      return;
    }
    if (el.dataset && el.dataset.fsel) {
      S.f[el.dataset.fsel] = el.value;
      render();
    }
  });
  document.addEventListener("focusout", function () {
    flushAll();
  });
  document.addEventListener("keydown", function (e) {
    var el = e.target;
    if (!el || !el.dataset || el.dataset.shot == null || el.dataset.shot === "" || e.isComposing) {
      return;
    }
    var i = Number(el.dataset.shot);
    if (e.key === "Enter") {
      e.preventDefault();
      if (
        mutShots(function (a) {
          a.splice(i + 1, 0, { t: "", d: false });
        })
      ) focusShot(i + 1);
    } else if (e.key === "Backspace" && el.value === "") {
      e.preventDefault();
      if (
        mutShots(function (a) {
          a.splice(i, 1);
        })
      ) focusShot(Math.max(0, i - 1));
    }
  });

  /* Drag to reschedule (mouse and touch) */
  var DR = null, scrollT = null;
  function dayAt(x, y) {
    var el = document.elementFromPoint(x, y);
    return el && el.closest ? el.closest(".day") : null;
  }
  function moveGhost(x, y) {
    if (DR && DR.ghost) {
      DR.ghost.style.left = (x - 30) + "px";
      DR.ghost.style.top = (y - 16) + "px";
    }
  }
  function markDrop() {
    var d = dayAt(DR.x, DR.y);
    if (DR.over && DR.over !== d) DR.over.classList.remove("drop");
    if (d) d.classList.add("drop");
    DR.over = d;
  }
  function dragStart() {
    if (!DR || DR.active) return;
    DR.active = true;
    clearTimeout(DR.timer);
    var r = DR.src.getBoundingClientRect();
    var g = DR.src.cloneNode(true);
    g.removeAttribute("href");
    g.removeAttribute("data-drag");
    g.classList.add("drag-ghost");
    g.style.width = Math.max(150, Math.min(r.width || 200, 300)) + "px";
    document.body.appendChild(g);
    DR.ghost = g;
    DR.src.classList.add("drag-src");
    document.body.classList.add("dragging");
    moveGhost(DR.x, DR.y);
    try {
      if (navigator.vibrate) navigator.vibrate(12);
    } catch (e) {}
    scrollT = setInterval(function () {
      if (!DR || !DR.active) return;
      var h = window.innerHeight || 600;
      if (DR.y < 70) window.scrollBy(0, -14);
      else if (DR.y > h - 70) window.scrollBy(0, 14);
      markDrop();
    }, 30);
  }
  function dragEnd(drop) {
    if (!DR) return;
    var d = DR;
    clearTimeout(d.timer);
    clearInterval(scrollT);
    var moved = false;
    if (d.active) {
      S.noClick = true;
      setTimeout(function () {
        S.noClick = false;
      }, 400);
      if (d.over) d.over.classList.remove("drop");
      if (d.ghost && d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
      d.src.classList.remove("drag-src");
      document.body.classList.remove("dragging");
      if (drop) {
        var day = dayAt(d.x, d.y), p = S.posts.get(d.id);
        if (day && p && day.dataset.date && p.date !== day.dataset.date) {
          p.date = day.dataset.date;
          queueSave("posts/" + p.id, { date: p.date }, 0);
          S.selDay = p.date;
          moved = true;
          toast("Movido al " + fmtShort(p.date));
        }
      }
    }
    DR = null;
    if (moved || S.needsRender) {
      S.needsRender = false;
      render();
    }
  }
  document.addEventListener("pointerdown", function (e) {
    if (S.view !== "calendario" || !S.canWrite || DR) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest && e.target.closest("select, .stsel")) return;
    var src = e.target.closest && e.target.closest("[data-drag]");
    if (!src) return;
    DR = {
      id: src.dataset.drag,
      src: src,
      x: e.clientX,
      y: e.clientY,
      sx: e.clientX,
      sy: e.clientY,
      touch: e.pointerType !== "mouse",
      active: false,
      pid: e.pointerId,
      over: null,
      ghost: null,
      timer: null,
    };
    if (DR.touch) DR.timer = setTimeout(dragStart, 300);
  });
  document.addEventListener("pointermove", function (e) {
    if (!DR || e.pointerId !== DR.pid) return;
    DR.x = e.clientX;
    DR.y = e.clientY;
    if (!DR.active) {
      var dx = Math.abs(DR.x - DR.sx), dy = Math.abs(DR.y - DR.sy);
      if (DR.touch) {
        if (dx > 10 || dy > 10) {
          clearTimeout(DR.timer);
          DR = null;
        }
      } else if (dx > 5 || dy > 5) dragStart();
      return;
    }
    moveGhost(DR.x, DR.y);
    markDrop();
  });
  document.addEventListener("pointerup", function (e) {
    if (DR && e.pointerId === DR.pid) dragEnd(true);
  });
  document.addEventListener("pointercancel", function (e) {
    if (DR && e.pointerId === DR.pid) dragEnd(false);
  });
  document.addEventListener("touchmove", function (e) {
    if (DR && DR.active && e.cancelable) e.preventDefault();
  }, { passive: false });
  document.addEventListener("contextmenu", function (e) {
    if (DR && DR.active) e.preventDefault();
  });
  document.addEventListener("click", function (e) {
    if (S.noClick) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  /* Image paste / drop in references */
  function imageFiles(dt) {
    var out = [];
    if (!dt) return out;
    if (dt.files && dt.files.length) {
      Array.prototype.forEach.call(dt.files, function (f) {
        if (/^image\//.test(f.type)) out.push(f);
      });
    }
    if (!out.length && dt.items) {
      Array.prototype.forEach.call(dt.items, function (it) {
        if (it.kind === "file" && /^image\//.test(it.type)) {
          var f = it.getAsFile();
          if (f) out.push(f);
        }
      });
    }
    return out;
  }
  document.addEventListener("paste", function (e) {
    if (!e.target || e.target.id !== "f-refs") return;
    var fs = imageFiles(e.clipboardData);
    if (!fs.length) return;
    e.preventDefault();
    addRefFiles(fs);
  });
  document.addEventListener("dragover", function (e) {
    var b = e.target.closest && e.target.closest("#opt-refs");
    if (!b) return;
    e.preventDefault();
    b.classList.add("over");
  });
  document.addEventListener("dragleave", function (e) {
    var b = e.target.closest && e.target.closest("#opt-refs");
    if (b) b.classList.remove("over");
  });
  document.addEventListener("drop", function (e) {
    var b = e.target.closest && e.target.closest("#opt-refs");
    if (!b) return;
    e.preventDefault();
    b.classList.remove("over");
    addRefFiles(imageFiles(e.dataTransfer));
  });

  /* ---------- Boot ---------- */
  function resolveNames() {
    if (!userCap || !userCap.profiles) return;
    var ids = [];
    S.posts.forEach(function (p) {
      if (p.updatedBy && !(p.updatedBy in S.names) && ids.indexOf(p.updatedBy) < 0) {
        ids.push(p.updatedBy);
      }
    });
    if (!ids.length) return;
    ids.forEach(function (i) {
      S.names[i] = "";
    });
    userCap.profiles(ids).then(function (ps) {
      ids.forEach(function (i) {
        S.names[i] = (ps && ps[i] && ps[i].name) || "";
      });
      if (S.view === "detalle") paintFooter();
    }, function () {});
  }
  function subscribe() {
    var timer = setTimeout(function () {
      S.slow = true;
      render();
    }, 10000);
    function ready(snap) {
      if (!snap.metadata.fromCache) {
        clearTimeout(timer);
        S.slow = false;
      }
    }
    function bad() {
      clearTimeout(timer);
      S.slow = false;
      render();
    }
    db.collection("posts").onSnapshot(function (snap) {
      var m = new Map();
      snap.docs.forEach(function (d) {
        m.set(d.id, Object.assign({ id: d.id }, d.data()));
      });
      S.posts = m;
      S.loaded.posts = true;
      ready(snap);
      resolveNames();
      onData(snap.metadata.hasPendingWrites);
    }, bad);
    db.collection("goals").onSnapshot(function (snap) {
      var m = new Map();
      snap.docs.forEach(function (d) {
        m.set(d.id, Object.assign({ id: d.id }, d.data()));
      });
      S.goals = m;
      S.loaded.goals = true;
      ready(snap);
      if (S.view !== "detalle") onData(snap.metadata.hasPendingWrites);
    }, bad);
    db.doc("settings/account").onSnapshot(function (snap) {
      S.account = snap.exists ? snap.data() : {};
      // La cuenta de Instagram se ve bajo el nombre del cliente (dentro del selector); solo la cambia un
      // administrador, en «Clientes y equipo».
      var el = document.getElementById("acct"), hd = String(S.account.handle || "").trim().replace(/^@+/, "");
      if (el) {
        el.textContent = hd ? "@" + hd : "";
        el.hidden = !hd;
      }
      if (S.view === "pauta" && !snap.metadata.hasPendingWrites) render();
    }, function () {});
  }
  function boot() {
    route();
    render(true);
    var c = window.claude;
    if (!c || !c.use) {
      S.booted = true;
      render();
      return;
    }
    Promise.all([
      c.use("db").catch(function () {
        return null;
      }),
      c.use("user").catch(function () {
        return null;
      }),
      c.use("assets").catch(function () {
        return null;
      }),
    ]).then(function (r) {
      db = r[0];
      userCap = r[1];
      S.assets = r[2] || null;
      S.booted = true;
      var jobs = [];
      if (userCap) {
        jobs.push(
          Promise.resolve(userCap.id()).then(function (id) {
            S.uid = id;
          }, function () {}),
        );
        jobs.push(
          Promise.resolve(userCap.can("data.write")).then(function (v) {
            if (v === false) S.canWrite = false;
          }, function () {}),
        );
      }
      return Promise.all(jobs);
    }).then(function () {
      if (!db) {
        render();
        return;
      }
      subscribe();
      render();
    });
  }
  boot();
})();
