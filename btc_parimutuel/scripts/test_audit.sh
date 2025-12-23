#!/usr/bin/env bash
set -euo pipefail
rg -n "describe\.only|it\.only|\.only\(" tests && { echo "ERROR: .only found"; exit 1; } || true
rg -n "describe\.skip|it\.skip" tests && { echo "ERROR: permanent skip found"; exit 1; } || true
echo "OK: audit clean"
