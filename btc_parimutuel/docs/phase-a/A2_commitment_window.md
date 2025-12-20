# Phase A2 — Commitment Window (Commit Instruction Only)

Gate: A2_COMMIT_ONLY — NOT APPROVED (docs-only)
Status: DRAFT
Phase: A2
Invariant Level: Trust-Critical (STOP-THE-LINE)

## Scope (Exactly This)
- Enable Commitment Window (S1)
- Add commit() instruction
- Aggregate commitment accounting only
- NO betting
- NO withdrawal
- NO open/cancel logic yet (A4+)

## Preconditions (Must Already Hold)
- A1 publish immutable + proven green on devnet
- Market params exist: commit_open_ts, commit_close_ts, min_pool_to_open, dominance_cap
- Phase 0 tests remain unchanged and green

## Allowed User Actions (S1 Only)
- Select a side
- Commit funds
- Increase commitment (same side only)
- View aggregate totals only

## Explicitly Forbidden (Hard Fail)
- Odds / payout estimates / implied probabilities
- Individual withdrawal or cancellation
- Switching sides
- Early open
- Any state transition beyond S1 (except informational threshold label)
- Any change to Phase 0 flows/tests

## Program-Level Requirements

### Instruction: commit
Inputs:
- market_id (u64) — FIRST ARG (canonical)
- side
- amount

Preconditions:
- market state == Commitment window open (S1)
- now >= commit_open_ts
- now < commit_close_ts
- amount > 0
- user_total_on_side + amount <= dominance_cap
- side must match any prior commitment

Effects:
- transfer funds into market vault
- update totals + per-user commitment
- NO bets, NO odds, NO claimable balance

## Regression Guards
- Phase 0 devnet command remains green (unchanged)
- No PDA or arg-order drift

## Acceptance Criteria
- Commit/increase works during S1
- Funds locked
- Phase 0 stays green
