# Phase A3 — Threshold Reached (Informational Only)

Status: DRAFT
Gate: A3_THRESHOLD_LABEL — NOT APPROVED (docs-only)
Phase: A3
Invariant Level: Trust-Critical (STOP-THE-LINE)

## Scope (Exactly This)
- Add an informational “threshold reached” indicator during Commitment Window (S1)
- No behavior changes
- No early open
- No timing changes
- No state changes beyond existing labels/copy
- Derived-only: MUST NOT require on-chain changes or new instructions

## Definition
Threshold reached (informational) is true when:
- now < commit_close_ts AND
- total_committed >= min_to_open

It must not trigger any on-chain transition. It is purely a label.

## Sources of Truth
- total_committed: VFinalCommitPool.total_committed (USDC smallest units)
- min_to_open_usd: VFinalMarket.min_to_open_usd (whole USD units)
- conversion: min_to_open_usd * 1_000_000

## Explicitly Forbidden (Hard Fail)
- Any early-open behavior
- Any automatic close/cancel
- Any new instruction that changes market state
- Any urgency banners, “hurry” copy, or special UI behavior
- Any new on-chain state field like `threshold_reached`
- Any on-chain persistence for UI convenience (flags/events required for UI)

## Acceptance Criteria
- When total_committed crosses minimum during S1, UI may show only:
  “Threshold reached — opening at window close.”
- If total falls below, label disappears (still informational)
- Phase 0 + A2 tests remain green:
  anchor test --skip-local-validator --provider.cluster devnet --skip-deploy
