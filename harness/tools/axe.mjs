/** axe-core via Playwright. SCs come from axe tags -> strict regime native. */
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { axeTagsToSC } from "../normalize.mjs";

export async function version() {
  const { createRequire } = await import("node:module");
  return createRequire(import.meta.url)("axe-core/package.json").version;
}

export async function run(url, stagingFn) {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    if (stagingFn) await stagingFn(page);
    // Full normative WCAG A/AA rule set through 2.2 — bare .analyze() omits
    // newer 2.2 rules (e.g. target-size), leaving axe less complete than the
    // other four tools, which run their full WCAG sets.
    const res = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    return res.violations.map(v => ({
      ruleId: v.id, sc: axeTagsToSC(v.tags), nodes: v.nodes.length,
    }));
  } finally { await browser.close(); }
}
