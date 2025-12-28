#!/usr/bin/env bash
set -euo pipefail
hdr="$(curl -fsSI http://localhost:8787/verify/resolved/1766716704 | tr -d '\r')"
echo "$hdr" | grep -qi '^cache-control: public, max-age=31536000, immutable' || { echo "Missing Cache-Control immutable" >&2; echo "$hdr" >&2; exit 1; }
echo "cache_header_check OK"
