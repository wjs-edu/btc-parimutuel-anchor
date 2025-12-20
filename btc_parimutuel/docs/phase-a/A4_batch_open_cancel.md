# Phase A4 — Batch open/cancel at commit_close_ts (NO early open)

Status: DRAFT
Gate: A4_BATCH_OPEN_CANCEL — NOT APPROVED (docs-only)
Phase: A4
Invariant Level: Trust-Critical (STOP-THE-LINE)

## Scope (Exactly This)
- Add batch decision at `commit_close_ts`:
  - If total committed >= min_to_open_usd * 1_000_000 → OPEN batch
  - Else → CANCEL batch (refund path will be A5+ if not already present)
- Absolutely NO early open (never before `commit_close_ts`)
- No new market statuses beyond canonical ones (no “pending”)

## Definition
At any time with `now < commit_close_ts`:
- Market remains in Commitment Window (S1).
- “Threshold reached” is informational only (A3).

At `now >= commit_close_ts`:
- Batch action may occur exactly once.

## Sources of truth
- `VFinalMarket.commit_close_ts`, `VFinalMarket.min_to_open_usd`
- `VFinalCommitPool.total_committed` (USDC smallest units)

## Explicitly Forbidden (Hard Fail)
- Any instruction that opens before `commit_close_ts`
- Any per-user withdrawals during commitment
- Any state mutation triggered by “threshold reached”
- Any change to PROGRAM_ID / PDA seeds / arg order

## Acceptance criteria (devnet tests to add next)
- A4_OPEN_AT_CLOSE: if funded to threshold before close, batch open only after close
- A4_CANCEL_AT_CLOSE: if below threshold at close, batch cancel only after close
- Phase 0 + A1/A2/A3 remain green:
  anchor test --skip-local-validator --provider.cluster devnet --skip-deploy
