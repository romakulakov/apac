#!/usr/bin/env node
/**
 * audit_walkthrough.mjs — scripted portion of the WCAG-EM self-audit
 * (seeds/AUDIT_TEMPLATE.md sections 2–5). Produces audits/<app>.md with
 * machine-gathered evidence; section 6 (screen-reader pass) is left as a
 * human checklist item. Deterministic: run after any seed change.
 *
 *   node tools/audit_walkthrough.mjs [app-id ...]   (default: all seeds)
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { serveStatic } from "../harness/serve.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);

const DESCRIBE = `el => {
  if (!el || el === document.body) return "(body)";
  const name = el.getAttribute("aria-label")
    ?? (el.labels?.[0]?.textContent ?? el.textContent ?? "").trim().slice(0, 40);
  return [el.tagName.toLowerCase(), el.id ? "#" + el.id : "", el.getAttribute("role") ? "[role=" + el.getAttribute("role") + "]" : "", JSON.stringify(name)].filter(Boolean).join(" ");
}`;

async function active(page) {
  return page.evaluate(`(${DESCRIBE})(document.activeElement)`);
}

async function tabWalk(page, max = 60) {
  await page.locator("body").click({ position: { x: 1, y: 1 } }).catch(() => {});
  await page.evaluate(() => document.activeElement.blur?.());
  const route = [];
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const d = await active(page);
    if (route.length && d === route[0]) break; // cycled
    if (d === "(body)") break;
    route.push(d);
  }
  return route;
}

async function structure(page) {
  return page.evaluate(() => {
    const mains = document.querySelectorAll("main").length;
    const navs = [...document.querySelectorAll("nav")].map(n => n.getAttribute("aria-label") ?? "(unlabeled)");
    const heads = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
      .filter(h => !h.closest("[hidden]") && h.offsetParent !== null || h.closest("dialog,.dialog"))
      .map(h => `${h.tagName.toLowerCase()} ${JSON.stringify(h.textContent.trim().slice(0, 40))}`);
    const skip = document.querySelector(".skip-link");
    return { mains, navs, heads, skip: skip ? skip.getAttribute("href") : null,
             skipTargetOk: skip ? !!document.querySelector(skip.getAttribute("href")) : false };
  });
}

/* one check = { name, pass, note } */
const R = (name, pass, note = "") => ({ name, pass, note });

const PATTERN_CHECKS = {
  async "app1-apg-composition"(page, url, out) {
    // dialog: open → focus in; Tab containment; Escape → restore
    await page.locator("#open-settings").focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);
    let d = await active(page);
    let inDialog = await page.evaluate(() => !!document.activeElement.closest("#settings-dialog, [role=dialog], .dialog"));
    out.push(R("dialog: focus moves inside on open", inDialog, `active=${d}`));
    const seen = new Set();
    for (let i = 0; i < 12; i++) { await page.keyboard.press("Tab"); seen.add(await active(page)); }
    const escaped = [...seen].some(s => s.includes("#open-settings") || s.includes("#like-btn") || s.includes("nav"));
    out.push(R("dialog: Tab stays contained (12 presses)", !escaped, [...seen].join("; ").slice(0, 120)));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
    d = await active(page);
    out.push(R("dialog: Escape closes, focus returns to trigger", d.includes("#open-settings"), `active=${d}`));
    // tabs: arrow moves focus+selection
    await page.locator("#tab-1").focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(100);
    d = await active(page);
    const sel = await page.getAttribute("#tab-2", "aria-selected");
    out.push(R("tabs: ArrowRight moves focus to tab-2, aria-selected updates", d.includes("#tab-2") && sel === "true", `active=${d} sel=${sel}`));
    // accordion
    await page.locator("#acc-1-btn").focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(100);
    out.push(R("accordion: Enter expands, aria-expanded=true", (await page.getAttribute("#acc-1-btn", "aria-expanded")) === "true"));
    // like button (custom, keyboard op)
    await page.locator("#like-btn").focus(); await page.keyboard.press(" "); await page.waitForTimeout(100);
    out.push(R("like: Space toggles aria-pressed", (await page.getAttribute("#like-btn", "aria-pressed")) === "true"));
    // ticker pause
    await page.locator("#ticker-pause").click(); await page.waitForTimeout(100);
    out.push(R("ticker: pause control toggles aria-pressed", (await page.getAttribute("#ticker-pause", "aria-pressed")) === "true"));
    // hover card: focus shows, Escape dismisses
    await page.locator("#term").focus(); await page.waitForTimeout(150);
    const shown = await page.isVisible("#hovercard");
    await page.keyboard.press("Escape"); await page.waitForTimeout(150);
    out.push(R("hover card: shown on focus, dismissed by Escape", shown && !(await page.isVisible("#hovercard"))));
    // form: invalid submit → focus to first invalid, error associated
    await page.goto(url + "#/form"); await page.waitForTimeout(200);
    out.push(R("route #/form: title updated", (await page.title()).toLowerCase().includes("contact")));
    await page.locator("#submit-btn").click(); await page.waitForTimeout(200);
    d = await active(page);
    out.push(R("form: focus moves to first invalid field on submit", d.includes("#name"), `active=${d}`));
    out.push(R("form: error text visible and aria-describedby links it",
      (await page.isVisible("#name-err")) && (await page.getAttribute("#name", "aria-describedby")) === "name-err"));
    // dash: async status announced via live region
    await page.goto(url + "#/dash"); await page.waitForTimeout(200);
    await page.locator("#load-btn").click(); await page.waitForTimeout(700);
    const status = await page.textContent("#dash-status");
    out.push(R("dash: async load announces via role=status", (status ?? "").includes("loaded"), `status="${status}"`));
  },

  async "app2-todomvc"(page, url, out) {
    await page.locator("#new-todo").fill("Audit walkthrough task");
    await page.keyboard.press("Enter"); await page.waitForTimeout(150);
    const status = await page.textContent("#todo-status");
    out.push(R("add: Enter adds task, live region announces", (status ?? "").toLowerCase().includes("added"), `status="${status}"`));
    // toggle-all custom checkbox via keyboard
    await page.locator("#toggle-all").focus(); await page.keyboard.press(" "); await page.waitForTimeout(150);
    out.push(R("toggle-all: Space operates, aria-checked updates", (await page.getAttribute("#toggle-all", "aria-checked")) === "true"));
    // edit: managed focus in and out
    await page.locator(".edit-btn").first().focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(150);
    let d = await active(page);
    let onField = await page.evaluate(() => document.activeElement.classList.contains("edit-field"));
    out.push(R("edit: focus moves into edit field", onField, `active=${d}`));
    await page.keyboard.type(" (edited)"); await page.keyboard.press("Enter"); await page.waitForTimeout(200);
    d = await active(page);
    let onBtn = await page.evaluate(() => document.activeElement.classList.contains("edit-btn"));
    out.push(R("edit: commit returns focus to Edit button", onBtn, `active=${d}`));
    // destroy: focus managed, announcement
    await page.locator(".destroy").first().click(); await page.waitForTimeout(150);
    const st2 = await page.textContent("#todo-status");
    out.push(R("delete: announced via live region", (st2 ?? "").toLowerCase().includes("deleted"), `status="${st2}"`));
    // filter route: title updates
    await page.locator('a[data-filter="active"]').click(); await page.waitForTimeout(150);
    out.push(R("filter route: document title reflects filter", (await page.title()).toLowerCase().includes("active"), `title="${await page.title()}"`));
  },

  async "app3-form"(page, url, out) {
    await page.locator("#next-btn").click(); await page.waitForTimeout(200);
    let d = await active(page);
    out.push(R("invalid submit: focus moves to error summary", d.includes("error-summary"), `active=${d}`));
    const errLinks = await page.locator("#err-list a").count();
    out.push(R("error summary lists per-field links", errLinks >= 2, `${errLinks} links`));
    await page.locator("#err-list a").first().click(); await page.waitForTimeout(150);
    d = await active(page);
    out.push(R("summary link moves focus to its field", d.includes("#full-name"), `active=${d}`));
    out.push(R("field error associated via aria-describedby",
      ((await page.getAttribute("#full-name", "aria-describedby")) ?? "").includes("full-name-err")));
    await page.locator("#full-name").fill("Ada Lovelace");
    await page.locator("#email").fill("ada@example.org");
    await page.locator("#next-btn").click(); await page.waitForTimeout(200);
    d = await active(page);
    out.push(R("step 2: heading receives focus on transition", d.includes("h-step-2"), `active=${d}`));
    out.push(R("step 2: title updated", (await page.title()).includes("2"), `title="${await page.title()}"`));
    await page.locator("#street").fill("1 Main St");
    await page.locator("#city").fill("Warsaw");
    await page.locator("#postal").fill("00-001");
    await page.locator("#next-btn").click(); await page.waitForTimeout(200);
    d = await active(page);
    out.push(R("step 3: heading receives focus", d.includes("h-step-3"), `active=${d}`));
  },

  async "app4-dashboard"(page, url, out) {
    await page.locator("#refresh-btn").click(); await page.waitForTimeout(700);
    const status = await page.textContent("#app-status");
    out.push(R("refresh: announced via role=status", (status ?? "").toLowerCase().includes("updated"), `status="${status}"`));
    // metric pause
    await page.locator("#metric-pause").click(); await page.waitForTimeout(100);
    out.push(R("live metric: pause toggles aria-pressed", (await page.getAttribute("#metric-pause", "aria-pressed")) === "true"));
    // hover/focus card
    await page.locator("#sla-term").focus(); await page.waitForTimeout(150);
    const shown = await page.isVisible("#sla-card");
    await page.keyboard.press("Escape"); await page.waitForTimeout(150);
    out.push(R("SLA card: shown on focus, Escape dismisses", shown && !(await page.isVisible("#sla-card"))));
    // projects route: title + focus, toolbar roving, sort state
    await page.locator('.nav a[href="#/projects"]').click(); await page.waitForTimeout(250);
    out.push(R("route #/projects: title updated", (await page.title()).toLowerCase().includes("project"), `title="${await page.title()}"`));
    await page.locator("#proj-toolbar button").first().focus();
    await page.keyboard.press("ArrowRight"); await page.waitForTimeout(100);
    let d = await active(page);
    out.push(R("toolbar: ArrowRight roves focus", d.includes("Import"), `active=${d}`));
    await page.locator('.sort[data-key="name"]').click(); await page.waitForTimeout(150);
    const ariaSort = await page.getAttribute('th[aria-sort]:first-of-type', "aria-sort")
      ?? await page.evaluate(() => document.querySelector('.sort[data-key="name"]').closest("th").getAttribute("aria-sort"));
    out.push(R("table: sort click updates aria-sort", ariaSort === "ascending" || ariaSort === "descending", `aria-sort=${ariaSort}`));
    // confirm dialog
    await page.locator('.nav a[href="#/settings"]').click(); await page.waitForTimeout(250);
    await page.locator("#reset-btn").focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(200);
    d = await active(page);
    out.push(R("confirm dialog: focus moves inside on open", d.includes("confirm"), `active=${d}`));
    await page.keyboard.press("Escape"); await page.waitForTimeout(150);
    d = await active(page);
    out.push(R("confirm dialog: Escape closes, focus returns to trigger", d.includes("#reset-btn"), `active=${d}`));
    // disclosure
    await page.locator("#adv-btn").click(); await page.waitForTimeout(100);
    out.push(R("disclosure: aria-expanded updates", (await page.getAttribute("#adv-btn", "aria-expanded")) === "true"));
  },
};

const requested = process.argv.slice(2);
const seeds = readdirSync(path.join(ROOT, "seeds"), { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(path.join(ROOT, "seeds", d.name, "serve.json")))
  .map(d => d.name)
  .filter(n => requested.length === 0 || requested.includes(n));

mkdirSync(path.join(ROOT, "audits"), { recursive: true });

for (const app of seeds) {
  const { url, close } = await serveStatic(path.join(ROOT, "seeds", app, "dist"));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url + "/", { waitUntil: "networkidle" });

  const struct = await structure(page);
  const route = await tabWalk(page);
  const checks = [];
  await page.goto(url + "/", { waitUntil: "networkidle" });
  try { await PATTERN_CHECKS[app]?.(page, url + "/", checks); }
  catch (e) { checks.push(R("PATTERN CHECK CRASHED", false, String(e.message).slice(0, 200))); }
  await browser.close(); await close();

  const failed = checks.filter(c => !c.pass);
  // Section 6 is filled by hand (screen-reader pass); never overwrite a completed one on re-run.
  const outFile = path.join(ROOT, "audits", `${app}.md`);
  const prior = existsSync(outFile) ? readFileSync(outFile, "utf8") : "";
  const doneSec6 = prior.match(/## 6\. Screen-reader pass \(HUMAN — performed[\s\S]*?(?=\n## 7\.)/)?.[0];
  const sec6 = doneSec6 ?? `## 6. Screen-reader pass (HUMAN — not yet performed)
- [ ] NVDA (or VoiceOver) full pass: announcements on dialog open, live regions, route changes
- [ ] record AT + browser versions here`;
  const md = `# Self-audit — ${app} (WCAG-EM structured)
Date: ${new Date().toISOString().slice(0, 10)} · Auditor: scripted walkthrough (tools/audit_walkthrough.mjs) + author
App state: seeds/${app}/dist at time of run · Browser: Playwright Chromium (VERSIONS.md)

## 1. Scope
All pages/routes of serve.json; scripted keyboard route + pattern operations below.
AT matrix: scripted checks (this file) + human screen-reader pass (section 6).

## 2. Landmarks & headings
- [${struct.mains === 1 ? "x" : " "}] single main landmark (found: ${struct.mains})
- [${struct.navs.every(n => n !== "(unlabeled)") ? "x" : " "}] nav labeled: ${struct.navs.join(", ") || "(no navs)"}
- [${struct.skipTargetOk ? "x" : " "}] skip link present, target resolves (${struct.skip})
- heading outline: ${struct.heads.join(" · ")}

## 3. Inter-widget focus flow — scripted tab route (${route.length} stops)
${route.map((r, i) => `${String(i + 1).padStart(2)}. ${r}`).join("\n")}

Note: roving-tabindex composites (tabs/toolbar) intentionally expose one stop.

## 4–5. Titles, route transitions, keyboard operation of every widget
${checks.map(c => `- [${c.pass ? "x" : " "}] ${c.name}${c.note ? `  — ${c.note}` : ""}`).join("\n")}

${failed.length ? `**${failed.length} FAILED check(s) — investigate before freezing this audit.**` : "All scripted checks pass."}

${sec6}

## 7. Residual items & dispositions
Tool-battery findings dispositioned in seeds/manifest.yaml (baseline frozen 2026-07-11).
`;
  writeFileSync(outFile, md);
  console.log(`${app}: ${checks.length} checks, ${failed.length} failed → audits/${app}.md`);
}
