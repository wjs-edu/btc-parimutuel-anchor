# Phase 0 — Multi-market protocol + deterministic devnet E2E (GREEN)

Completed (required proofs):
- Multi-market PDAs (marketId-first)
- Order-independent payouts (settled_pool fixed at resolve)
- Devnet E2E: initialize -> fund -> placeBet -> resolve -> claim
- Devnet fairness regression: 2 winners, claim A->B == B->A

Current green command:
anchor test --skip-local-validator --provider.cluster devnet --skip-deploy

# Next: Phase A — vFinal Commitment Window + batch open/cancel (NOT STARTED)
Not allowed until Phase 0 remains green and Phase A plan is checked in.

# Phase A — STARTED (A1 only)
Allowed now:
- A1: Market publish + parameter lock (see docs/phase-a/A1_market_publish.md)
Rule:
- Phase 0 green must remain green at all times.
