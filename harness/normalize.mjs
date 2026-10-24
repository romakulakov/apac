/** SC extraction helpers -> normalized violation shape. */

// axe tags: "wcag412" -> "4.1.2"; "wcag2412" -> "2.4.12"-style handled by length.
export function axeTagsToSC(tags) {
  const sc = [];
  for (const t of tags ?? []) {
    const m = /^wcag(\d)(\d)(\d{1,2})$/.exec(t);
    if (m) sc.push(`${m[1]}.${m[2]}.${m[3]}`);
  }
  return sc;
}

// Pa11y/HTML_CS codes: "WCAG2AA.Principle4.Guideline4_1.4_1_2.H91..." -> "4.1.2"
export function htmlcsCodeToSC(code) {
  const m = /\.(\d)_(\d)_(\d{1,2})\./.exec(code ?? "");
  return m ? [`${m[1]}.${m[2]}.${m[3]}`] : [];
}

// QualWeb: assertions carry success-criteria metadata directly.
export function qualwebSC(meta) {
  return (meta?.["success-criteria"] ?? []).map(s => s.name).filter(Boolean);
}

// CSV-based fallback (rule-sc-map/<tool>.csv: ruleId,sc;sc;sc)
import { readFileSync, existsSync } from "node:fs";
export function csvMap(tool) {
  const p = new URL(`../rule-sc-map/${tool}.csv`, import.meta.url).pathname;
  const map = new Map();
  if (!existsSync(p)) return map;
  for (const line of readFileSync(p, "utf8").split("\n").slice(1)) {
    const [id, scs] = line.split(",");
    if (id) map.set(id.trim(), (scs ?? "").split(";").map(s => s.trim()).filter(Boolean));
  }
  return map;
}
