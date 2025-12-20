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

## Publish-time immutable fields (A1 must write once)
Identity: market_id, family/variant, admin, creator, usdc_mint, vaults
Ladder params: min_to_open, dominance_cap_bps, commit_open_ts, commit_close_ts, bet_cutoff_ts, fee_bps, platform_fee_bps
State: Draft -> CommitmentWindowOpen only; params immutable after publish
Green: Phase 0 stays green (anchor test --skip-local-validator --provider.cluster devnet --skip-deploy)

## Status
- Implemented: publish_market_vfinal + immutable publish record (PDA seed market_v1)
- Proof: devnet green command => 3 passing (A1 + smoke + fairness)
