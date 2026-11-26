"""Copy anchoring/coding.csv decisions into mutants/manifest.yaml.

compute_recall.py also reads coding.csv directly. Running this keeps the
manifest aligned so a published dataset has one coding_decision per mutant.

  python analysis/sync_coding.py
"""
import os
import pandas as pd
import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
coding = pd.read_csv(os.path.join(ROOT, "anchoring", "coding.csv"))
man_path = os.path.join(ROOT, "mutants", "manifest.yaml")
with open(man_path) as f:
    manifest = yaml.safe_load(f)

by_id = {row.mutant: row for row in coding.itertuples(index=False)}
missing = []
updated = 0
for m in manifest:
    row = by_id.get(m["id"])
    if row is None:
        missing.append(m["id"])
        continue
    decision = row.decision
    note = row.note
    if isinstance(decision, float) and pd.isna(decision):
        decision = None
    else:
        decision = None if decision is None else str(decision).strip() or None
    if isinstance(note, float) and pd.isna(note):
        note = None
    elif note is not None:
        note = str(note)
    m["coding_decision"] = decision
    m["coding_note"] = note
    updated += 1

with open(man_path, "w") as f:
    yaml.safe_dump(manifest, f, sort_keys=False, allow_unicode=True)

print(f"updated {updated} manifest rows from coding.csv")
if missing:
    print("WARNING: mutants in manifest with no coding.csv row:")
    for mid in missing:
        print(" ", mid)
empty = coding["decision"].isna() | (coding["decision"].astype(str).str.strip() == "")
print(f"coding.csv empty decision cells: {int(empty.sum())} / {len(coding)}")
print("discard:", list(coding.loc[coding["decision"].astype(str).str.strip() == "discard", "mutant"]))
