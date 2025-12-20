# Phase A5 — Cancel refund + recovery (NO early refund; idempotent)

Status: DRAFT
Gate: A5_CANCEL_REFUND — NOT APPROVED (docs-only)
Phase: A5
Invariant Level: Trust-Critical (STOP-THE-LINE)

## Scope (Exactly This)
- Refund committed USDC back to users ONLY when:
  - now >= commit_close_ts AND
  - A4 outcome == CANCEL AND
  - user has a nonzero commitment amount
- Refund is principal-only (1:1), no PnL.
- Refund must be idempotent and claim-order independent.

## Canonical semantics (non-negotiable)
- Cancel trigger is only: commit_close_ts reached AND total_committed < min_to_open_usd * 1_000_000.
- “Canceled — refund available” is terminal. “pending” language is forbidden.
- Proof bundle expectation: canceled outcome includes market params + commitment snapshot at close + cancel outcome + refund path.

## Failure modes (explicit)
Refund may only fail with one of:
- TooEarly (now < commit_close_ts)
- NotCanceled (A4 outcome != CANCEL)
- NoCommitment (no commitment / amount == 0)
- AlreadyRefunded (only if we choose error-style idempotency)

## Explicitly Forbidden (Hard Fail)
- Any refund before commit_close_ts
- Any refund when A4 outcome != CANCEL
- Any partial/early withdrawals during commitment
- Any claim-order dependence
- Any PDA / arg-order drift

## Acceptance criteria (devnet tests next)
- A5.1 refund blocked before commit_close_ts
- A5.2 refund blocked when A4 outcome == OPEN
- A5.3 refund succeeds once; second call cannot change balances (idempotent)
- A5.4 order independence (A->B == B->A) + vault conservation
- Commitment post-state: closed OR refunded=true with amount=0 (choose one; tests enforce)
- Keep Phase 0 + A1–A4 green:
  anchor test --skip-local-validator --provider.cluster devnet --skip-deploy
