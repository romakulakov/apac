/** QualWeb core — ACT rules; SC metadata is native to its output. */
import { qualwebSC } from "../normalize.mjs";

export async function version() {
  // strict "exports" map blocks require('@qualweb/core/package.json')
  const { readFileSync } = await import("node:fs");
  const url = new URL("../../node_modules/@qualweb/core/package.json", import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")).version;
}

export async function run(url /* staging unsupported in core API: un-staged only */) {
  // exports map has only a "require" condition — ESM import() is rejected
  const { createRequire } = await import("node:module");
  const { QualWeb } = createRequire(import.meta.url)("@qualweb/core");
  const { chromium } = await import("playwright");
  const qw = new QualWeb({});
  // 2nd arg is the puppeteer slot; its own Chrome was never downloaded
  // (--ignore-scripts), so launch Playwright's pinned Chrome for Testing.
  await qw.start({}, { headless: true, executablePath: chromium.executablePath(),
                       args: ["--no-sandbox"] });
  try {
    const reports = await qw.evaluate({ url, execute: { act: true } });
    const report = Object.values(reports)[0];
    const out = [];
    for (const [id, rule] of Object.entries(report?.modules?.["act-rules"]?.assertions ?? {})) {
      if (rule.metadata?.outcome === "failed")
        out.push({ ruleId: id, sc: qualwebSC(rule.metadata), nodes: rule.metadata.failed ?? 1 });
    }
    return out;
  } finally { await qw.stop(); }
}
