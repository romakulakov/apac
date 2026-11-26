#!/usr/bin/env node
/**
 * generate_mutants.mjs — one mutant per (operator, site) via mutate.mjs.
 * Copies the seed, applies the operator, refuses empty diffs, records the
 * diff + sha256, writes mutants/manifest.yaml, and copies serve.json.
 */
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import YAML from "yaml";
import { applyOperator } from "./mutate.mjs";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const sites = YAML.parse(readFileSync(path.join(ROOT, "operators/sites.yaml"), "utf8"));
const manPath = path.join(ROOT, "mutants/manifest.yaml");
const existingById = {};
if (existsSync(manPath)) {
  for (const m of YAML.parse(readFileSync(manPath, "utf8")) || []) {
    if (m?.id) existingById[m.id] = m;
  }
}
const manifest = [];
let built = 0, failed = 0, skipped = 0;

function record(id, s, diff, prev) {
  return {
    id, operator: s.op, seed: s.seed, site: s.site, file: s.file,
    diff_sha256: createHash("sha256").update(diff).digest("hex"),
    anchoring_ref: prev?.anchoring_ref ?? null,
    coding_decision: prev?.coding_decision ?? null,
    coding_note: prev?.coding_note ?? null,
  };
}

for (const s of sites) {
  const opSafe = s.op.replace(".", "_");
  const id = `${s.seed}__${opSafe}__${s.site}`;
  const src = path.join(ROOT, "seeds", s.seed);
  const dst = path.join(ROOT, "mutants", id);
  if (existsSync(dst)) {
    const diffPath = path.join(dst, "MUTATION.diff");
    const diff = existsSync(diffPath) ? readFileSync(diffPath, "utf8") : "";
    manifest.push(record(id, s, diff, existingById[id]));
    skipped++;
    console.log(`skip (exists): ${id}`);
    continue;
  }

  cpSync(src, dst, { recursive: true, filter: p => !p.includes("node_modules") });
  try {
    applyOperator(s.op, s, dst);
  } catch (e) { console.error(`FAILED ${id}: ${e.message}`); failed++; continue; }

  const diff = execSync(
    `diff -ru --exclude=node_modules "${src}" "${dst}" || true`).toString();
  if (!diff.trim()) { console.error(`EMPTY DIFF: ${id}`); failed++; continue; }
  writeFileSync(path.join(dst, "MUTATION.diff"), diff);

  manifest.push(record(id, s, diff, existingById[id]));
  built++;
  console.log(`built ${id}`);
}

mkdirSync(path.join(ROOT, "mutants"), { recursive: true });
writeFileSync(path.join(ROOT, "mutants/manifest.yaml"), YAML.stringify(manifest));
console.log(`\n${built} built, ${skipped} skipped (kept), ${failed} failed → mutants/manifest.yaml`);
if (failed) process.exit(1);
