#!/usr/bin/env bash
set -euo pipefail
TRIES="${TRIES:-5}"
for i in $(seq 1 "$TRIES"); do
  set +e
  OUT="$(yarn -s ts-mocha -p ./tsconfig.json -t 1000000 'tests/**/*.ts' 2>&1)"
  RC=$?
  set -e
  echo "$OUT"
  if [ $RC -eq 0 ]; then exit 0; fi
  if echo "$OUT" | grep -q "Blockhash not found"; then
    echo "Retrying due to devnet blockhash flake ($i/$TRIES)..." >&2
    sleep $((2*i))
    continue
  fi
  exit $RC
done
exit 1
