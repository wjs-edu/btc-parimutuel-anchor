#!/usr/bin/env bash
set -euo pipefail
MID="${1:?usage: materialize_artifacts_from_evidence.sh <market_id>}"
E="evidence/$MID"; AS="artifacts/status"; AR="artifacts/resolved/$MID"
mkdir -p "$AS" "$AR"
cp -f "$E/resolve.sig.txt" "$AR/resolve.sig.txt"
cp -f "$E/claim.sig.txt"   "$AR/claim.sig.txt"
python3 - "$MID" <<'PY'
import json,sys,os
mid=sys.argv[1]; E=f"evidence/{mid}"
def slurp(p): return open(p,"r",encoding="utf-8").read().strip()
d={"schema_version":slurp(f"{E}/schema_version.txt"),"rule_version":"vFinal","params_hash":slurp(f"{E}/params_hash.txt"),
   "market_id":mid,"program_id":slurp(f"{E}/program_id.txt"),"status":"RESOLVED",
   "publish_sig":slurp(f"{E}/publish.sig.txt"),"commit_sig":slurp(f"{E}/commit.sig.txt"),"close_sig":slurp(f"{E}/settle.sig.txt"),
   "resolve_sig":slurp(f"{E}/resolve.sig.txt"),"claim_sig":slurp(f"{E}/claim.sig.txt"),
   "oracle_reference":f"see evidence/{mid}/params.json","commit_close_ts":f"see evidence/{mid}/params.json","resolution_ts":f"see evidence/{mid}/params.json"}
out=f"artifacts/status/{mid}.json"; open(out,"w",encoding="utf-8").write(json.dumps(d,indent=2)+"\n"); print("WROTE",out)
PY
