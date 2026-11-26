"""Shared loaders for the analysis pipeline."""
import json, glob, os, yaml
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_operators():
    with open(f"{ROOT}/operators/operators.yaml") as f:
        ops = yaml.safe_load(f)
    return {k: {"sc": set(v["sc"]), "class": k.split(".")[0],
                "predicted": v["predicted"], "name": v["name"]} for k, v in ops.items()}

def load_mutant_manifest():
    with open(f"{ROOT}/mutants/manifest.yaml") as f:
        return {m["id"]: m for m in yaml.safe_load(f)}

def _staged_key(v):
    """Canonical string form. JSON gives bool False (unstaged) or a staging
    name (str); a CSV round-trip turns False into 'False'. Stringify both
    sides so baseline<->mutant key lookups in compute_recall never miss on a
    bool-vs-str mismatch (that bug made clean FPs read as new detections)."""
    return v if isinstance(v, str) else str(v)

def load_raw(out_dir):
    """-> DataFrame: target, tool, page, staged, ruleId, sc(frozenset), nodes"""
    rows = []
    for fp in glob.glob(f"{ROOT}/{out_dir}/*/*.json"):
        with open(fp) as f: d = json.load(f)
        for r in d["results"]:
            staged = _staged_key(r.get("staged", False))
            if "error" in r:
                rows.append(dict(target=d["target"], tool=d["tool"], page=r["page"],
                                 staged=staged, ruleId="__ERROR__",
                                 sc=frozenset(), nodes=0))
                continue
            for v in r["violations"]:
                rows.append(dict(target=d["target"], tool=d["tool"], page=r["page"],
                                 staged=staged, ruleId=v["ruleId"],
                                 sc=frozenset(v.get("sc", [])), nodes=v.get("nodes", 1)))
    return pd.DataFrame(rows)

def load_tools(out_dir):
    """All tools that RAN in out_dir, whether or not they found anything.
    load_raw only emits rows for violations/errors, so a tool that finds
    nothing would silently vanish from the tool universe — a NONE-band
    tool showing 0 detections must still appear at 0%, not disappear."""
    tools = set()
    for fp in glob.glob(f"{ROOT}/{out_dir}/*/*.json"):
        with open(fp) as f: tools.add(json.load(f)["tool"])
    return sorted(tools)

def wilson_ci(k, n, z=1.96):
    if n == 0: return (float("nan"),) * 2
    p = k / n; d = 1 + z*z/n
    c = (p + z*z/(2*n)) / d; h = z * ((p*(1-p)/n + z*z/(4*n*n)) ** .5) / d
    return (max(0, c - h), min(1, c + h))
