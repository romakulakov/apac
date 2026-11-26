"""Step 6c: the four-band detectability map from union strict recall."""
import pandas as pd
from common import ROOT

r = pd.read_csv(f"{ROOT}/results/tables/recall_by_class.csv")
u = r[r.tool == "UNION"].copy()
def band(x):
    if x == 0: return "NONE"
    if x < 0.2: return "LOW"
    if x < 0.8: return "PARTIAL"
    return "HIGH"
u["band"] = u.strict_recall.map(band)
u[["cls", "n", "strict_recall", "strict_lo", "strict_hi", "band"]] \
    .to_csv(f"{ROOT}/results/tables/detectability_map.csv", index=False)
print(u[["cls", "n", "strict_recall", "band"]].to_string(index=False))
print("\nSANITY: M2/M5 static operators should be HIGH; "
      "M3/M6 and interaction core of M4 should be NONE (side effects -> inspect delta_rules).")
