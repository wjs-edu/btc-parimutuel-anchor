#!/usr/bin/env bash
set -euo pipefail

FILE="COPY_LOCK.md"
test -f "$FILE" || { echo "Missing $FILE (required for CI-enforced copy)" >&2; exit 1; }

REQ1='“Partner retains custody/KYC/UX; partner wallet signs all protocol transactions; CommitClose never receives signing keys and does not sign on the partner’s behalf.”'
REQ2='“No discretionary overrides exist.”'
REQ3='“Does not prove partner internal per-user ledger allocations or eligibility enforcement (geo/KYC).”'

grep -Fq "$REQ1" "$FILE" || { echo "Missing required canonical string #1 in $FILE" >&2; exit 1; }
grep -Fq "$REQ2" "$FILE" || { echo "Missing required canonical string #2 in $FILE" >&2; exit 1; }
grep -Fq "$REQ3" "$FILE" || { echo "Missing required canonical string #3 in $FILE" >&2; exit 1; }

echo "canonical_copy_check OK"
