# Economic Invariants — vFinal (Stop-the-line)

If any invariant is violated, shipping stops.

## Core invariants
1) Conservation: total payouts + fees == total inputs (per market), within rounding rules.
2) Claim order independence: claim(A then B) == claim(B then A).
3) No negative balances: no account may go negative under any valid sequence of actions.
4) Cancel/refund idempotence: repeated refund attempts must not overpay; net refund <= committed.
5) Deterministic recomputation: public recomputation must match receipt exactly (where implemented).

## Test requirement
Every invariant must have at least one devnet E2E test or a deterministic verification procedure.
