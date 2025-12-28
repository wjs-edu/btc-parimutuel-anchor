#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://proof.commitclose.com}"
MARKET_ID="${1:?usage: gate_verifier_facts.sh <market_id>}"

URL="$BASE_URL/verify/resolved/$MARKET_ID"
html="$(curl -fsSL "$URL")"

required=(
  "schema_version"
  "vfinal-p0"
  "rule_version"
  "vFinal"
  "params_hash"
  "oracle"
  "commit_close_ts"
  "resolution_ts"
  "Publish"
  "Commit"
  "Close"
  "Resolve"
)

missing=0
for token in "${required[@]}"; do
  if ! echo "$html" | grep -F "$token" >/dev/null; then
    echo "MISSING: $token"
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  echo "FAIL: verifier missing required facts/labels: $URL"
  exit 1
fi

echo "OK: verifier includes required facts + tx labels: $URL"
