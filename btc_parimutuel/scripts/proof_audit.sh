#!/usr/bin/env bash
set -euo pipefail
ID=1766716704
test -f "artifacts/status/${ID}.json" || { echo "Missing artifacts/status/${ID}.json" >&2; exit 1; }
test -f "artifacts/resolved/${ID}/resolve.sig.txt" || { echo "Missing resolve.sig.txt" >&2; exit 1; }
test -f "artifacts/resolved/${ID}/claim.sig.txt" || { echo "Missing claim.sig.txt" >&2; exit 1; }
echo "proof_audit OK (resolved)"
