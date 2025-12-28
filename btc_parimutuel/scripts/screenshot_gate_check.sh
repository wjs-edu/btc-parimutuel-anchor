#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:8787}"
ID="${ID:-1766716704}"
V="$(curl -fsS "${BASE_URL}/verify/resolved/${ID}")"; P="$(curl -fsS "${BASE_URL}/proof/${ID}")"
echo "$V$P" | grep -q 'Environment:</b> DEVNET (evidence only)' || { echo "Missing DEVNET banner" >&2; exit 1; }
echo "$P" | grep -Fq 'This evidence is sufficient for internal review by Compliance, Engineering, and Finance without a meeting.' || { echo "Missing forwardable footer line" >&2; exit 1; }
for s in "Partner retains custody/KYC/UX" "No discretionary overrides exist." "Does not prove partner internal per-user ledger allocations"; do echo "$V$P" | grep -Fq "$s" || { echo "Missing canonical copy: $s" >&2; exit 1; }; done
echo "$V$P" | grep -Eiq '\b(pending|odds|profit|pnl|betting|wager|trading|win rate|guaranteed)\b' && { echo "Forbidden word present" >&2; exit 1; } || true
echo "screenshot_gate_check OK"
