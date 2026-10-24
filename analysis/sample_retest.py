"""Build a 30% stratified test–retest sample.

Includes every instance whose provisional label is `review` (the judgment
calls), then fills up to ~30% of the corpus with a stratified draw across
operator classes M1–M7. Writes:

  anchoring/retest_sample.txt     mutant ids, one per line
  anchoring/coding_retest.csv     same columns as coding.csv, decision/note empty

  python analysis/sample_retest.py
  python analysis/sample_retest.py --seed 20260711
"""
import argparse
import os
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--seed", type=int, default=20260711)
    p.add_argument("--frac", type=float, default=0.30)
    args = p.parse_args()

    src = pd.read_csv(os.path.join(ROOT, "anchoring", "coding.csv"))
    target_n = max(1, round(len(src) * args.frac))
    review = src[src.provisional.astype(str).str.strip() == "review"].copy()
    rest = src[src.provisional.astype(str).str.strip() != "review"].copy()

    chosen = [review]
    remaining = target_n - len(review)
    if remaining > 0 and len(rest):
        rest = rest.copy()
        rest["cls"] = rest.operator.str.split(".").str[0]
        per_class = max(1, remaining // rest["cls"].nunique())
        parts = []
        for _, g in rest.groupby("cls"):
            n = min(len(g), per_class)
            parts.append(g.sample(n=n, random_state=args.seed))
        drawn = pd.concat(parts)
        if len(drawn) < remaining:
            leftover = rest.drop(drawn.index)
            extra_n = min(len(leftover), remaining - len(drawn))
            if extra_n:
                drawn = pd.concat(
                    [drawn, leftover.sample(n=extra_n, random_state=args.seed)]
                )
        elif len(drawn) > remaining:
            drawn = drawn.sample(n=remaining, random_state=args.seed)
        chosen.append(drawn)

    sample = pd.concat(chosen).drop_duplicates(subset=["mutant"])
    sample = sample.sort_values(["operator", "seed", "site"])

    out_ids = os.path.join(ROOT, "anchoring", "retest_sample.txt")
    out_csv = os.path.join(ROOT, "anchoring", "coding_retest.csv")
    with open(out_ids, "w") as f:
        f.write("\n".join(sample.mutant.tolist()) + "\n")

    blank = sample.copy()
    blank["decision"] = ""
    blank["note"] = ""
    blank.to_csv(out_csv, index=False)

    print(f"n={len(sample)} / {len(src)} ({len(sample)/len(src):.0%})")
    print("review instances included:", len(review))
    print("by class:")
    print(sample.operator.str.split(".").str[0].value_counts().sort_index().to_string())
    print(f"wrote {out_ids}")
    print(f"wrote {out_csv}")
    print("Do not look at coding.csv while filling coding_retest.csv.")


if __name__ == "__main__":
    main()
