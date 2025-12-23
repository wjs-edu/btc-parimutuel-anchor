use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,
    // A2: commitment
    #[msg("Market not published.")]
    MarketNotPublished,
    #[msg("Commitment window not open.")]
    CommitmentWindowNotOpen,
    #[msg("Commitment window closed.")]
    CommitmentWindowClosed,
    #[msg("Invalid side.")]
    InvalidSide,
    #[msg("Side switching is forbidden during commitment.")]
    SideSwitchForbidden,
    #[msg("Dominance cap exceeded.")]
    DominanceCapExceeded,

  // A4: Batch settle
  #[msg("Too early to settle (commit window not closed).")]
  TooEarlyToSettle,
  #[msg("Commit-close already settled.")]
  AlreadySettled,

}

// ==========================
// A2: Commitment Errors
// ==========================
