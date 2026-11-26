"""Step 6a: false-positive baseline B(T,s) per tool per clean seed.
Every alert on a verified seed is a false positive (or a dispositioned
needs-review item) -> FP-density table."""
import pandas as pd
from common import load_raw, ROOT

clean = load_raw("results/raw/clean")
clean = clean[clean.ruleId != "__ERROR__"]
fp = (clean.groupby(["tool", "target"])
      .agg(alerts=("ruleId", "size"), distinct_rules=("ruleId", "nunique"))
      .reset_index())
fp.to_csv(f"{ROOT}/results/tables/fp_density.csv", index=False)
# The baseline SET used for differencing:
clean[["tool", "target", "page", "staged", "ruleId"]].drop_duplicates() \
    .to_csv(f"{ROOT}/results/tables/baseline_sets.csv", index=False)
print(fp.to_string(index=False))
