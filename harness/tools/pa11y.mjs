/** Pa11y (HTML_CodeSniffer engine). Staged scans use Pa11y "actions".
 *  Pa11y's bundled puppeteer has no downloaded browser (install ran with
 *  --ignore-scripts) — launch Playwright's pinned Chrome for Testing
 *  instead, so the executed browser is version-pinned via playwright. */
import pa11y from "pa11y";
import { chromium } from "playwright";
import { htmlcsCodeToSC } from "../normalize.mjs";
import { STAGING_ACTIONS } from "../staging/index.mjs";

export async function version() {
  const { createRequire } = await import("node:module");
  return createRequire(import.meta.url)("pa11y/package.json").version;
}

export async function run(url, stagingFn) {
  const actions = stagingFn ? STAGING_ACTIONS[stagingFn.stageName] ?? [] : [];
  const res = await pa11y(url, {
    standard: "WCAG2AA", actions, timeout: 60000,
    chromeLaunchConfig: { executablePath: chromium.executablePath(),
                          args: ["--no-sandbox"] },
  });
  return res.issues.filter(i => i.type === "error").map(i => ({
    ruleId: i.code, sc: htmlcsCodeToSC(i.code), nodes: 1,
  }));
}
