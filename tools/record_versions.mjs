/** Records the pinned tool matrix for VERSIONS.md. Adjust package.json
 *  pins to the current releases at execution time; these pins are
 *  placeholders to verify. */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const req = createRequire(import.meta.url);
const pkgs = ["axe-core", "@axe-core/playwright", "pa11y", "lighthouse",
  "accessibility-checker", "@qualweb/core", "playwright", "jscodeshift"];

function pkgVersion(name) {
  // Try require() first; fall back to direct fs read for packages with strict exports maps.
  try { return req(`${name}/package.json`).version; } catch {}
  try {
    const slash = name.startsWith("@") ? name.indexOf("/", 1) : name.indexOf("/");
    const bare = slash === -1 ? name : name.slice(0, slash);
    const dir = new URL(`../node_modules/${name}/package.json`, import.meta.url);
    return JSON.parse(readFileSync(dir, "utf8")).version;
  } catch { return "NOT INSTALLED"; }
}

console.log("# Pinned tool matrix\n");
for (const p of pkgs) console.log(`- ${p}: ${pkgVersion(p)}`);
console.log(`- node: ${process.version}`);
console.log(`- date: ${new Date().toISOString().slice(0,10)}`);
