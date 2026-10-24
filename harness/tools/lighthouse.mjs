/** Lighthouse accessibility category (headless Chrome).
 *  SC mapping via rule-sc-map/lighthouse.csv (audits are axe-based).
 *  Calls the LOCAL pinned binary directly — npx can silently resolve a
 *  different version (it did: 12.8.2 from cache vs pinned 13.4.0).
 *  MUST spawn async: the target page is served by an http server in THIS
 *  process, and execFileSync blocks the event loop → the scan starves its
 *  own page server and times out. */
import { execFileSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { csvMap } from "../normalize.mjs";
const execFileP = promisify(execFile);
const MAP = csvMap("lighthouse");
const BIN = fileURLToPath(new URL("../../node_modules/.bin/lighthouse", import.meta.url));

export async function version() {
  return execFileSync(BIN, ["--version"]).toString().trim();
}

export async function run(url /* staging: not supported — record as un-staged only */) {
  const { stdout } = await execFileP(BIN, [url,
    "--only-categories=accessibility", "--output=json", "--quiet",
    "--chrome-flags=--headless=new --no-sandbox"],
    { maxBuffer: 64e6, timeout: 180000 });
  const lhr = JSON.parse(stdout);
  return Object.values(lhr.audits)
    .filter(a => a.score !== null && a.score < 1 && a.details?.items?.length)
    .map(a => ({ ruleId: a.id, sc: MAP.get(a.id) ?? [], nodes: a.details.items.length }));
}
