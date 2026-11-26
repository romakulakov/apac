"""Step 6b: differential detection -> per-operator/per-class recall,
lenient + strict, per tool + union, with Wilson CIs."""
import os
import pandas as pd
from common import load_raw, load_operators, load_mutant_manifest, load_tools, wilson_ci, ROOT

ops = load_operators()
man = load_mutant_manifest()
base = pd.read_csv(f"{ROOT}/results/tables/baseline_sets.csv")
mut = load_raw("results/raw/mutants")
mut = mut[mut.ruleId != "__ERROR__"]
tools = load_tools("results/raw/mutants")  # full battery, incl. zero-finding tools

# coding.csv is the source of truth for accept/discard. Manifest may lag.
coding_path = os.path.join(ROOT, "anchoring", "coding.csv")
csv_discards = set()
if os.path.exists(coding_path):
    coding = pd.read_csv(coding_path)
    csv_discards = set(
        coding.loc[
            coding["decision"].astype(str).str.strip() == "discard", "mutant"
        ].astype(str)
    )

# Baseline lookup: (tool, seed, page, staged) -> set(ruleId)
bset = {}
for r in base.itertuples():
    bset.setdefault((r.tool, r.target, r.page, r.staged), set()).add(r.ruleId)

rows = []
for mid, m in man.items():
    if mid in csv_discards or m.get("coding_decision") == "discard":
        continue
    op = m["operator"]; truth_sc = ops[op]["sc"]
    sub = mut[mut.target == mid]
    per_tool = {}
    for tool in tools:
        tsub = sub[sub.tool == tool]
        delta = []
        for r in tsub.itertuples():
            baseline = bset.get((tool, m["seed"], r.page, r.staged), set())
            if r.ruleId not in baseline:
                delta.append(r)
        lenient = len(delta) > 0
        strict = any(set(d.sc) & truth_sc for d in delta)
        per_tool[tool] = (lenient, strict)
        rows.append(dict(mutant=mid, operator=op, cls=ops[op]["class"], tool=tool,
                         lenient=lenient, strict=strict,
                         delta_rules=";".join(sorted({d.ruleId for d in delta}))))
    rows.append(dict(mutant=mid, operator=op, cls=ops[op]["class"], tool="UNION",
                     lenient=any(v[0] for v in per_tool.values()),
                     strict=any(v[1] for v in per_tool.values()), delta_rules=""))

det = pd.DataFrame(rows)
det.to_csv(f"{ROOT}/results/tables/detection_per_mutant.csv", index=False)

def agg(df, keys):
    g = df.groupby(keys).agg(n=("mutant", "nunique"),
                             lenient_k=("lenient", "sum"),
                             strict_k=("strict", "sum")).reset_index()
    g["lenient_recall"] = g.lenient_k / g.n
    g["strict_recall"] = g.strict_k / g.n
    g[["strict_lo", "strict_hi"]] = g.apply(
        lambda r: pd.Series(wilson_ci(r.strict_k, r.n)), axis=1)
    return g

agg(det, ["operator", "tool"]).to_csv(f"{ROOT}/results/tables/recall_by_operator.csv", index=False)
agg(det, ["cls", "tool"]).to_csv(f"{ROOT}/results/tables/recall_by_class.csv", index=False)
print(agg(det, ["cls", "tool"]).to_string(index=False))
