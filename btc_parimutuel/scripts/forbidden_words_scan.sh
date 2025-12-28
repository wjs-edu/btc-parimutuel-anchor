#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8787}"
ID="${ID:-1766716704}"

# Forbidden words (case-insensitive). Keep as a single regex.
FORBIDDEN_RE='\b(pending|odds|profit|pnl|betting|wager|trading|win rate|guaranteed)\b'

json="$(curl -fsS "${BASE_URL}/status/${ID}.json")"

if echo "$json" | grep -Eiq "$FORBIDDEN_RE"; then
  echo "Forbidden language detected in status JSON for market ${ID}" >&2
  echo "$json" | grep -Ein "$FORBIDDEN_RE" >&2 || true
  exit 1
fi

echo "forbidden_words_scan OK"
