#!/usr/bin/env bash
set -euo pipefail

# Pass through any test file args from `anchor test ... <files>`
ARGS=("$@")

# If no args provided, default to all tests (legacy behavior)
if [ ${#ARGS[@]} -eq 0 ]; then
  ARGS=(tests/*.ts)
fi

# Simple retry loop for devnet flake tolerance
MAX_RETRIES=${MAX_RETRIES:-5}
for i in $(seq 1 $MAX_RETRIES); do
  echo "[run_with_retry] attempt $i/$MAX_RETRIES: ${ARGS[*]}"
  if yarn -s mocha -t 1000000 -r ts-node/register "${ARGS[@]}"; then
    exit 0
  fi
  echo "[run_with_retry] failed attempt $i"
done

exit 1
