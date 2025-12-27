#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8787}"
ID="1766716704"
PROGRAM_ID="QvRjL6RbUCg1pCxskrxBpiuoJ94iEghWddwYipjAQpz"

echo "Checking golden demo status endpoint..."

json="$(curl -fsS "${BASE_URL}/status/${ID}.json")"

echo "$json" | grep -q "\"market_id\":\"${ID}\""
echo "$json" | grep -q "\"program_id\":\"${PROGRAM_ID}\""
echo "$json" | grep -q "\"status\":\"RESOLVED\""
echo "$json" | grep -q "\"resolve_sig\":\""
echo "$json" | grep -q "\"claim_sig\":\""

echo "golden_demo_status_smoke OK"
