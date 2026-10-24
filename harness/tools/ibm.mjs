/** IBM Equal Access accessibility-checker.
 *  SC mapping via rule-sc-map/ibm.csv (extract from IBM rule docs). */
import { chromium } from "playwright";
import { csvMap } from "../normalize.mjs";
const MAP = csvMap("ibm");

export async function version() {
  // strict "exports" map blocks require('accessibility-checker/package.json')
  const { readFileSync } = await import("node:fs");
  const url = new URL("../../node_modules/accessibility-checker/package.json", import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")).version;
}

export async function run(url, stagingFn) {
  // CJS package: named exports only, no default
  const aChecker = await import("accessibility-checker");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    if (stagingFn) await stagingFn(page);
    // pass the live Playwright page: html-string input would make aChecker
    // launch its own (never-downloaded) puppeteer browser
    const { report } = await aChecker.getCompliance(page, `scan-${Date.now()}`);
    const viol = (report.results ?? []).filter(r => r.level === "violation");
    const byRule = new Map();
    for (const r of viol) byRule.set(r.ruleId, (byRule.get(r.ruleId) ?? 0) + 1);
    return [...byRule].map(([ruleId, nodes]) => ({ ruleId, sc: MAP.get(ruleId) ?? [], nodes }));
  } finally { await browser.close(); await aChecker.close?.(); }
}
