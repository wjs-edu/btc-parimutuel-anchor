#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:8787}"
ID="${ID:-1766716704}"
hdr="$(curl -fsSI "${BASE_URL}/verify/resolved/${ID}" | tr -d '\r')"
echo "$hdr" | grep -qi '^cache-control: public, max-age=31536000, immutable' || { echo "Missing Cache-Control immutable" >&2; echo "$hdr" >&2; exit 1; }
echo "cache_header_check OK"
