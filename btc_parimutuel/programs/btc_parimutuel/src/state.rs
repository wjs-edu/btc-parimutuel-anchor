use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MarketVariant { Proof=0, PrimeLite=1, Prime=2, PrimePlus=3 }

#[account]
pub struct VFinalMarket {
  pub published: bool,
  pub market_id: u64,
  pub variant: u8,
  pub admin: Pubkey,
  pub creator: Pubkey,
  pub commit_open_ts: i64,
  pub commit_close_ts: i64,
  pub min_to_open_usd: u64,
  pub dominance_cap_bps: u16,
  pub bet_cutoff_ts: i64,
  pub resolution_ts: i64,
  pub published_at: i64,
  pub bump: u8,
  pub _reserved: [u8; 32],
}
