# Phase A1 — Market publish + parameter lock

Goal:
- Add publish flow that writes immutable, ladder-derived parameters on-chain.
- After publish, parameters cannot be modified.

Non-goals (Phase A1):
- No batch open/cancel logic yet
- No cancel recovery yet
- No proof bundles yet
- No receipt/verify yet

Acceptance:
- New instruction: publish_market(market_id, variant, ...) with marketId first arg.
- State transition: Draft -> CommitmentWindowOpen only.
- On-chain rejects any param mutation after publish.
- Phase 0 green stays green:
  anchor test --skip-local-validator --provider.cluster devnet --skip-deploy
