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

// ==========================
// A2: Commitment Accounts
// ==========================

#[account]
pub struct VFinalCommitPool {
  pub market: Pubkey,          // VFinalMarket PDA
  pub usdc_mint: Pubkey,       // mint committed into the vault
  pub commit_vault: Pubkey,    // token account holding committed USDC
  pub total_committed: u64,    // total committed (USDC smallest units)
  pub total_up: u64,
  pub total_down: u64,
  pub bump: u8,
  pub vault_bump: u8,
  pub _reserved: [u8; 32],
}

#[account]
pub struct VFinalCommitment {
  pub market: Pubkey,          // VFinalMarket PDA
  pub user: Pubkey,            // committer
  pub side: u8,                // 1=UP,2=DOWN
  pub amount: u64,             // total committed (USDC smallest units)
  pub bump: u8,
  pub _reserved: [u8; 32],
}

impl VFinalMarket {
  pub fn a4_is_settled(&self) -> bool {
    self._reserved[0] == 1
  }

  pub fn a4_outcome(&self) -> u8 {
    self._reserved[1]
  }

  pub fn a4_settle(&mut self, outcome: u8, settled_at: i64) {
    self._reserved[0] = 1;
    self._reserved[1] = outcome;
    let b = settled_at.to_le_bytes();
    self._reserved[8..16].copy_from_slice(&b);
  }
}

// ==========================
// A5: Refund helpers
// ==========================
impl VFinalCommitment {
  pub fn a5_is_refunded(&self) -> bool {
    self._reserved[0] == 1
  }

  pub fn a5_mark_refunded(&mut self, refunded_at: i64) {
    self._reserved[0] = 1;
    let b = refunded_at.to_le_bytes();
    self._reserved[8..16].copy_from_slice(&b);
  }
}
