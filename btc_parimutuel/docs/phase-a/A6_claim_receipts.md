# Phase A6 — Claim Receipts + Verify Recompute

Status: DRAFT
Gate: A6_CLAIM_RECEIPTS — NOT APPROVED (docs-only)
Invariant Level: Trust-Critical (STOP-THE-LINE)

## Frozen decisions (no-cracks)
1) Receipt PDA seeds: ["receipt_v1", bet_pda]
2) Recompute uses frozen settlement snapshot (NOT live totals):
   - outcome
   - settled_pool (post-fee distributable pool)
   - total_winning_at_resolve
3) Payout math (integer):
   - net_payout = floor(stake_amount * settled_pool / total_winning_at_resolve)
   - fee_amount = 0 (fees already baked into settled_pool)
   - dust remains in vault (explicit)
4) Claim idempotency:
   - already claimed => deterministic error AlreadyClaimed (acceptable)
   - MUST cause zero additional transfers
5) Receipt is write-once + padding (_reserved) to avoid migrations.

## Receipt fields (minimum, v1)
- market: Pubkey
- market_id: u64
- user: Pubkey
- bet: Pubkey
- outcome: u8
- side: u8
- stake_amount: u64
- settled_pool: u64
- total_winning_at_resolve: u64
- gross_payout: u64
- fee_amount: u64 (0)
- net_payout: u64
- claim_slot: u64
- bump: u8
- _reserved: [u8; 64]

## Acceptance criteria
- A6.1–A6.5 pass on devnet gate:
  anchor test --skip-local-validator --provider.cluster devnet --skip-deploy
