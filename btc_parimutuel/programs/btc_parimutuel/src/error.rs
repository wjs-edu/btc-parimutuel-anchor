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

  // Phase C: vFinal Resolve/Claim
  #[msg("Invalid winning side.")]
  InvalidWinningSide,
  #[msg("Market not open.")]
  NotOpen,
  #[msg("Market not resolved.")]
  NotResolved,
  #[msg("Already resolved.")]
  AlreadyResolved,
  #[msg("Already claimed.")]
  AlreadyClaimed,
  #[msg("Too early to resolve.")]
  TooEarlyToResolve,
  #[msg("No winners on winning side.")]
  NoWinners,

  // Phase C: vFinal Resolve/Claim
}

// ==========================
// A2: Commitment Errors
// ==========================
