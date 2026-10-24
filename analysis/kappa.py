"""Step 4 reliability: Cohen's kappa between two coding CSVs
(columns: mutant, decision in {accept, discard, technical-only})."""
import sys, pandas as pd
from sklearn.metrics import cohen_kappa_score
a = pd.read_csv(sys.argv[1]).set_index("mutant").decision
b = pd.read_csv(sys.argv[2]).set_index("mutant").decision
common = a.index.intersection(b.index)
print(f"n={len(common)}  kappa={cohen_kappa_score(a[common], b[common]):.3f}")
disagree = common[a[common].values != b[common].values]
print("disagreements:", list(disagree))
