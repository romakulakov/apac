/**
 * mutate.mjs — implementation of all 32 accessibility mutation operators.
 *
 * Three mechanisms, all deterministic and diff-logged by the generator:
 *   html    — cheerio transform on an .html file (AST-class markup operators);
 *             `sel` in sites.yaml addresses the element(s).
 *   js-tag  — delete every line of a .js file carrying `@mut:<OP>:<site>`
 *             ("the developer forgot this line"); tags are addressing only.
 *   css-tag — delete the tagged CSS line, or rewrite it per the operator.
 *
 * Each operator entry: { mech, apply }.
 *   html:   apply($, site)          — mutate the cheerio doc.
 *   js/css: apply(source, tag, site)— return mutated source (throws if no-op).
 */
import * as cheerio from "cheerio";

/* ---------- shared helpers ---------- */
function deleteTaggedLines(src, tag) {
  const lines = src.split("\n");
  const kept = lines.filter(l => !l.includes(tag));
  if (kept.length === lines.length) throw new Error(`tag not found: ${tag}`);
  return kept.join("\n");
}
function rewriteTaggedLine(src, tag, fn) {
  const lines = src.split("\n");
  let hit = false;
  const out = lines.map(l => (l.includes(tag) ? ((hit = true), fn(l)) : l));
  if (!hit) throw new Error(`tag not found: ${tag}`);
  return out.join("\n");
}
const one = ($, sel) => {
  const el = $(sel);
  if (el.length === 0) throw new Error(`selector matched nothing: ${sel}`);
  return el;
};

export const OPERATORS = {
  /* ================= M1 — semantic structure ================= */
  "M1.1": { mech: "html", // div-ification of a control (F59)
    apply: ($, site) => {
      const btn = one($, site.sel);
      const div = $(`<div class="${btn.attr("class") ?? ""} fake-btn" id="${btn.attr("id")}">${btn.html()}</div>`);
      btn.replaceWith(div); // click handlers attach by id at runtime → still "works" for mouse
    } },
  "M1.2": { mech: "html", // widget role removal
    apply: ($, site) => { one($, site.sel).removeAttr("role"); } },
  "M1.3": { mech: "html", // heading degradation: h2 -> styled p
    apply: ($, site) => {
      const h = one($, site.sel);
      h.replaceWith(`<p class="fake-heading"><strong>${h.html()}</strong></p>`);
    } },
  "M1.4": { mech: "html", // list flattening: ul/li -> div/div
    apply: ($, site) => {
      const ul = one($, site.sel);
      const items = ul.children("li").toArray()
        .map(li => `<div class="row">${$(li).html()}</div>`).join("");
      ul.replaceWith(`<div id="${ul.attr("id") ?? ""}">${items}</div>`);
    } },
  "M1.5": { mech: "html", // landmark removal: main -> div (keep id/tabindex)
    apply: ($) => {
      const m = one($, "main");
      m.replaceWith(`<div id="${m.attr("id")}" tabindex="-1">${m.html()}</div>`);
    } },

  /* ================= M2 — accessible name ================= */
  "M2.1": { mech: "html", // label disassociation (F68): break for/id
    apply: ($, site) => { one($, site.sel).attr("for", "broken-" + Date.now() % 1000); } },
  "M2.2": { mech: "html", // alt removal (F65) — positive control
    apply: ($, site) => { one($, site.sel).removeAttr("alt"); } },
  "M2.3": { mech: "html", // placeholder alt (F30)
    apply: ($, site) => { one($, site.sel).attr("alt", "image123.jpg"); } },
  "M2.4": { mech: "html", // generic link text
    apply: ($, site) => { one($, site.sel).text("click here"); } },
  "M2.5": { mech: "html", // label-in-name mismatch (F96)
    apply: ($, site) => { one($, site.sel).attr("aria-label", "Submit"); } },
  "M2.6": { mech: "html", // unnamed icon control
    apply: ($, site) => { one($, site.sel).removeAttr("aria-label"); } },

  /* ================= M3 — state synchronization (js-tag) ================= */
  "M3.1": { mech: "js-tag", apply: deleteTaggedLines }, // frozen aria-expanded
  "M3.2": { mech: "js-tag", apply: deleteTaggedLines }, // frozen checked/selected
  "M3.3": { mech: "js-tag", apply: deleteTaggedLines }, // stale aria-hidden
  "M3.4": { mech: "js-tag", apply: deleteTaggedLines }, // modal without inertness

  /* ================= M4 — keyboard & focus ================= */
  "M4.1": { mech: "js-tag", apply: deleteTaggedLines }, // mouse-only widget (F54)
  "M4.2": { mech: "js-tag", apply: deleteTaggedLines }, // no focus entry (F85)
  "M4.3": { mech: "js-tag", apply: deleteTaggedLines }, // no containment
  "M4.4": { mech: "js-tag", apply: deleteTaggedLines }, // no Escape (F10)
  "M4.5": { mech: "js-tag", apply: deleteTaggedLines }, // no restoration (F85)
  "M4.6": { mech: "html",  // positive tabindex (F44)
    apply: ($, site) => { one($, site.sel).attr("tabindex", "3"); } },
  "M4.7": { mech: "html",  // focusability removal
    apply: ($, site) => { one($, site.sel).attr("tabindex", "-1"); } },
  "M4.8": { mech: "js-tag", apply: deleteTaggedLines }, // broken roving tabindex

  /* ================= M5 — visual operability (css-tag) ================= */
  "M5.1": { mech: "css-tag", // suppress focus indicator (F78)
    apply: (src, tag) => rewriteTaggedLine(src, tag,
      () => `:focus-visible { outline: none; } /* ${tag} mutated */`) },
  "M5.2": { mech: "css-tag", // reduce contrast below 4.5:1 on muted text
    apply: (src, tag) => rewriteTaggedLine(src, tag,
      () => `  --muted: #a8a8a8;            /* ${tag} mutated */`) },
  "M5.3": { mech: "css-tag", // shrink targets below 24px
    apply: (src, tag) => rewriteTaggedLine(src, tag,
      () => `  min-width: 0; min-height: 0; padding: 0 2px; font-size: 11px; /* ${tag} mutated */`) },
  "M5.4": { mech: "css-tag", // sticky footer occludes focused content (2.4.11)
    apply: (src, tag) => rewriteTaggedLine(src, tag,
      () => `  position: fixed; inset: auto 0 0 0; height: 6rem; z-index: 50; /* ${tag} mutated */`) },
  "M5.5": { mech: "html",   // color-only error state (F81): drop icon+text, keep border color
    apply: ($, site) => { one($, site.sel).empty(); } },

  /* ================= M6 — dynamic content / SPA ================= */
  "M6.1": { mech: "js-tag", apply: deleteTaggedLines }, // silent status (4.1.3)
  "M6.2": { mech: "js-tag", apply: deleteTaggedLines }, // unmanaged route (F25 + focus)
  "M6.3": { mech: "js-tag", apply: deleteTaggedLines }, // unpausable auto-update
  "M6.4": { mech: "js-tag", apply: deleteTaggedLines }, // undismissable hover content (F95)

  /* ================= M7 — forms & errors ================= */
  "M7.1": { mech: "html",   // error text unassociated (3.3.1)
    apply: ($, site) => { one($, site.sel).removeAttr("aria-describedby"); } },
  "M7.2": { mech: "html",   // visual-only required state
    apply: ($, site) => { one($, site.sel).removeAttr("required").removeAttr("aria-required"); } },
  "M7.3": { mech: "html",   // autocomplete removal (1.3.5)
    apply: ($, site) => { one($, site.sel).removeAttr("autocomplete"); } },
  "M7.4": { mech: "js-tag", apply: deleteTaggedLines }, // no focus-to-error on submit
};

/** Apply operator `op` at `site` to files inside mutant dir `dir`. */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export function applyOperator(op, site, dir) {
  const def = OPERATORS[op];
  if (!def) throw new Error(`unknown operator ${op}`);
  const file = path.join(dir, site.file);
  const src = readFileSync(file, "utf8");
  // Per-site mechanism override (e.g. M2.1 exists at both HTML and JS level):
  const mech = site.mech ?? def.mech;

  if (mech === "html") {
    const $ = cheerio.load(src);
    def.apply($, site);
    writeFileSync(file, $.html());
  } else {
    const tag = `@mut:${op}:${site.site}`;
    const apply = mech === def.mech ? def.apply : deleteTaggedLines;
    writeFileSync(file, apply(src, tag, site));
  }
}
