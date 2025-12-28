#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://proof.commitclose.com}"

URLS=(
  "$BASE_URL/verify/resolved/1766716704"
  "$BASE_URL/proof/1766716704"
)

# Tight gate: any "base64" string or long base64-like run should fail.
PATTERN='base64|data:.*;base64,|[A-Za-z0-9+/]{120,}={0,2}'

fail=0
for url in "${URLS[@]}"; do
  echo "==> $url"
  html="$(curl -fsSL "$url")"
  if echo "$html" | grep -E -n "$PATTERN" >/dev/null; then
    echo "FAIL: base64/data blob detected in $url"
    echo "$html" | grep -E -n "$PATTERN" | head -n 40
    fail=1
  else
    echo "OK: no base64/data blobs in HTML"
  fi
done

exit "$fail"
