#!/usr/bin/env node
/**
 * run_all.mjs — orchestrates the tool battery over seeds or mutants.
 *
 *   node harness/run_all.mjs --targets seeds   --out results/raw/clean
 *   node harness/run_all.mjs --targets mutants --out results/raw/mutants
 *
 * Each target directory must contain:
 *   dist/        prebuilt static app (run `npm run build` in the seed first;
 *                the generator copies sources, so run builds via tools/build_all.sh)
 *   serve.json   { "pages": ["/", "/form"],
 *                  "staging": { "/": "openSettingsDialog" } }   // optional
 *
 * Output: <out>/<target>/<tool>.json — NORMALIZED shape shared by all tools:
 *   { tool, version, target, results: [ { page, staged,
 *       violations: [ { ruleId, sc: ["4.1.2",...], nodes } ] } ] }
 * The strict/lenient logic in analysis/ depends only on this shape.
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { serveStatic } from "./serve.mjs";
import { STAGING } from "./staging/index.mjs";
import * as axe from "./tools/axe.mjs";
import * as pa11y from "./tools/pa11y.mjs";
import * as lighthouse from "./tools/lighthouse.mjs";
import * as ibm from "./tools/ibm.mjs";
import * as qualweb from "./tools/qualweb.mjs";

const TOOLS = { axe, pa11y, lighthouse, ibm, qualweb };  // WAVE: see README
const args = Object.fromEntries(process.argv.slice(2).map((a, i, v) =>
  a.startsWith("--") ? [a.slice(2), v[i + 1]] : []).filter(x => x.length));
const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const targetRoot = path.join(ROOT, args.targets);
const outRoot = path.join(ROOT, args.out);

const targets = readdirSync(targetRoot, { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(path.join(targetRoot, d.name, "serve.json")))
  .map(d => d.name);

for (const t of targets) {
  const dir = path.join(targetRoot, t);
  const cfg = JSON.parse(readFileSync(path.join(dir, "serve.json"), "utf8"));
  const { url, close } = await serveStatic(path.join(dir, "dist"));
  console.log(`\n=== ${t} @ ${url} ===`);
  for (const [name, tool] of Object.entries(TOOLS)) {
    const outFile = path.join(outRoot, t, `${name}.json`);
    if (existsSync(outFile)) { console.log(`  skip ${name} (exists)`); continue; }
    const results = [];
    const scans = [
      ...cfg.pages.map(p => ({ page: p, staging: null })),
      ...cfg.pages.filter(p => cfg.staging?.[p])
        .map(p => ({ page: p, staging: cfg.staging[p] })),
      ...(cfg.extra_scans ?? []),
    ];
    for (const scan of scans) {
      const stagingFn = scan.staging ? STAGING[scan.staging] : null;
      try {
        results.push({ page: scan.page, staged: scan.staging ?? false,
                       violations: await tool.run(url + scan.page, stagingFn) });
      } catch (e) {
        results.push({ page: scan.page, staged: scan.staging ?? false,
                       error: String(e.message ?? e) });
      }
    }
    mkdirSync(path.dirname(outFile), { recursive: true });
    writeFileSync(outFile, JSON.stringify(
      { tool: name, version: await tool.version(), target: t, results }, null, 2));
    console.log(`  ${name}: ${results.length} scans`);
  }
  await close();
}
console.log("\nDone.");
