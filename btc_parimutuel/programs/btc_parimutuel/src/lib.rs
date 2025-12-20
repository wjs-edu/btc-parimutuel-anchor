use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};

declare_id!("QvRjL6RbUCg1pCxskrxBpiuoJ94iEghWddwYipjAQpz");

pub mod state;
use crate::state::*;

// ============================================================================
// ERROR CODES
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,
    
    #[msg("Market is not open")]
    MarketNotOpen,
    
    #[msg("Market is not resolved")]
    MarketNotResolved,
    
    #[msg("Invalid outcome (must be 1 for UP or 2 for DOWN)")]
    InvalidOutcome,
    
    #[msg("Invalid direction (must be 1 for UP or 2 for DOWN)")]
    InvalidDirection,
    
    #[msg("Too late to bet (resolution time has passed)")]
    TooLateToBet,
    
    #[msg("Amount must be positive")]
    AmountMustBePositive,
    
    #[msg("Cannot switch direction for existing bet")]
    DirectionMismatch,
    
    #[msg("No winning pool available")]
    NoWinningPool,
    
    #[msg("Math overflow")]
    MathOverflow,

    #[msg("Market already published")]
    AlreadyPublished,

    #[msg("Invalid market variant")]
    InvalidVariant,

    #[msg("Invalid commitment window")]
    BadCommitWindow,

    #[msg("Invalid resolution timestamp")]
    BadResolutionTime,
}

// ============================================================================
// ACCOUNT STRUCTURES
// ============================================================================

/// Market account: PDA seeds = ["market"]
/// Stores the global market state for a single up/down BTC betting market
#[account]
pub struct Market {
    // Authorities
    pub admin: Pubkey,
    pub market_id: u64,              // admin that can initialize and resolve
    pub creator: Pubkey,            // creator wallet (rev-share)
    pub creator_fee_vault: Pubkey,  // creator's USDC SPL token account

    // Status
    pub status: u8,                 // 0 = INIT/UNUSED, 1 = OPEN, 2 = RESOLVED
    pub resolved_outcome: u8,       // 0 = unset, 1 = UP, 2 = DOWN

    // Reference price
    pub reference_price: u64,       // integer price * reference_price_decimals
    pub reference_price_decimals: u8,
    pub reference_price_timestamp: i64, // unix timestamp when the ref price was locked

    // Timing
    pub resolution_ts: i64,         // unix timestamp when market is resolvable

    // Pools
    pub total_up: u64,              // total USDC bet on UP (smallest units)
    pub total_down: u64,            // total USDC bet on DOWN

    // Fees
    pub fee_bps: u16,               // fee in basis points of the total pool (e.g. 200 = 2%)
    pub platform_fee_bps: u16,      // share of the fee that goes to platform (0-10_000)
    pub fee_vault: Pubkey,          // platform's USDC SPL token account

    // USDC vault
    pub usdc_vault: Pubkey,         // SPL token account owned by the Market PDA, holds pooled USDC
    pub usdc_mint: Pubkey,          // USDC mint for safety

    // Resolve-settlement (order-independent payouts)
    pub settled_pool: u64,          // fixed distributable pool after fees, set at resolve
    pub total_winning_at_resolve: u64, // fixed winning-side total, set at resolve

    // PDA bump
    pub bump: u8,
}

/// Bet account: PDA seeds = ["bet", market.key().as_ref(), user.key().as_ref()]
/// Stores a user's bet on a specific market
#[account]
pub struct Bet {
    pub user: Pubkey,     // bettor
    pub direction: u8,    // 1 = UP, 2 = DOWN
    pub amount: u64,      // total USDC bet
    pub claimed: bool,    // has payout been claimed
    pub bump: u8,
}

// ============================================================================
// INSTRUCTION CONTEXT STRUCTURES
// ============================================================================

#[derive(Accounts)]
#[instruction(market_id: u64, resolution_ts: i64, reference_price: u64, reference_price_decimals: u8, fee_bps: u16, platform_fee_bps: u16, creator: Pubkey)]
pub struct InitializeMarket<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init_if_needed,
        payer = admin,
        seeds = [b"market".as_ref(), market_id.to_le_bytes().as_ref()],
        bump,
        space = 8 + std::mem::size_of::<Market>()
    )]
    pub market: Account<'info, Market>,

    #[account(mut, constraint = usdc_vault.mint == token_mint.key())]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(mut, constraint = fee_vault.mint == token_mint.key())]
    pub fee_vault: Account<'info, TokenAccount>,

    #[account(mut, constraint = creator_fee_vault.mint == token_mint.key())]
    pub creator_fee_vault: Account<'info, TokenAccount>,

    pub token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(market_id: u64, direction: u8, amount: u64)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = user_usdc_ata.owner == user.key(),
        constraint = user_usdc_ata.mint == market.usdc_mint
    )]
    pub user_usdc_ata: Account<'info, TokenAccount>,

    #[account(mut, seeds = [b"market".as_ref(), market_id.to_le_bytes().as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,

    #[account(
        init_if_needed,
        payer = user,
        seeds = [b"bet", market.key().as_ref(), user.key().as_ref()],
        bump,
        space = 8 + std::mem::size_of::<Bet>()
    )]
    pub bet: Account<'info, Bet>,

    #[account(
        mut,
        constraint = usdc_vault.key() == market.usdc_vault,
        constraint = usdc_vault.mint == market.usdc_mint
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(market_id: u64, outcome: u8)]
pub struct ResolveMarket<'info> {
    pub admin: Signer<'info>,

    #[account(mut, seeds = [b"market".as_ref(), market_id.to_le_bytes().as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        constraint = usdc_vault.key() == market.usdc_vault,
        constraint = usdc_vault.mint == market.usdc_mint
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = fee_vault.key() == market.fee_vault,
        constraint = fee_vault.mint == market.usdc_mint
    )]
    pub fee_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = creator_fee_vault.key() == market.creator_fee_vault,
        constraint = creator_fee_vault.mint == market.usdc_mint
    )]
    pub creator_fee_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct ClaimPayout<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut, seeds = [b"market".as_ref(), market_id.to_le_bytes().as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"bet", market.key().as_ref(), user.key().as_ref()],
        bump = bet.bump,
        constraint = bet.user == user.key()
    )]
    pub bet: Account<'info, Bet>,

    #[account(
        mut,
        constraint = usdc_vault.key() == market.usdc_vault,
        constraint = usdc_vault.mint == market.usdc_mint
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_usdc_ata.owner == user.key(),
        constraint = user_usdc_ata.mint == market.usdc_mint
    )]
    pub user_usdc_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ============================================================================
// PROGRAM
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PublishMarketArgs {
  pub variant: u8,
  pub creator: Pubkey,
  pub commit_open_ts: i64,
  pub commit_close_ts: i64,
  pub resolution_ts: i64,
  pub override_min_to_open_usd: Option<u64>,
  pub override_bet_cutoff_ts: Option<i64>,
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct PublishMarketVFinal<'info> {
  #[account(mut)]
  pub admin: Signer<'info>,

  #[account(
    init_if_needed,
    payer = admin,
    space = 8 + std::mem::size_of::<VFinalMarket>(),
    seeds = [b"market_v1".as_ref(), market_id.to_le_bytes().as_ref()],
    bump
  )]
  pub market: Account<'info, VFinalMarket>,

  pub system_program: Program<'info, System>,
}

#[program]
pub mod btc_parimutuel {
    use super::*;

    

    pub fn publish_market_vfinal(ctx: Context<PublishMarketVFinal>, market_id: u64, args: PublishMarketArgs) -> Result<()> {
        let m = &mut ctx.accounts.market;
        require!(!m.published, ErrorCode::AlreadyPublished);
        require!(args.variant <= 3, ErrorCode::InvalidVariant);
        require!(args.commit_open_ts < args.commit_close_ts, ErrorCode::BadCommitWindow);
        require!(args.commit_close_ts < args.resolution_ts, ErrorCode::BadResolutionTime);
        let min_to_open = args.override_min_to_open_usd.unwrap_or(match args.variant { 0=>25_000, 1=>50_000, 2=>100_000, _=>150_000 });
        let cap_bps: u16 = match args.variant { 0|1 => 1000, _ => 1250 };
        let bet_cutoff = if args.variant==0 { args.commit_close_ts } else { args.override_bet_cutoff_ts.unwrap_or(args.commit_close_ts + 12*60*60) };
        m.published=true; m.market_id=market_id; m.variant=args.variant; m.admin=ctx.accounts.admin.key(); m.creator=args.creator;
        m.commit_open_ts=args.commit_open_ts; m.commit_close_ts=args.commit_close_ts; m.min_to_open_usd=min_to_open; m.dominance_cap_bps=cap_bps;
        m.bet_cutoff_ts=bet_cutoff; m.resolution_ts=args.resolution_ts; m.published_at=Clock::get()?.unix_timestamp; m.bump=ctx.bumps.market;
        Ok(())
    }
/// Initialize or reset the market
    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        market_id: u64,
        resolution_ts: i64,
        reference_price: u64,
        reference_price_decimals: u8,
        fee_bps: u16,
        platform_fee_bps: u16,
        creator: Pubkey,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;

        
        let admin = &ctx.accounts.admin;
        let clock = Clock::get()?;

        // Validation: only allow re-initialization if market was never used or was resolved
        if market.status != 0 && market.status != 2 {
            return Err(ErrorCode::MarketNotOpen.into());
        }

        // Validate parameters
        require!(
            resolution_ts > clock.unix_timestamp,
            ErrorCode::TooLateToBet
        );
        require!(fee_bps <= 1000, ErrorCode::MathOverflow); // max 10%
        require!(platform_fee_bps <= 10_000, ErrorCode::MathOverflow);

        // Initialize market state
        market.admin = admin.key();
        market.market_id = market_id;
        market.creator = creator;
        market.creator_fee_vault = ctx.accounts.creator_fee_vault.key();
        market.status = 1; // OPEN
        market.resolved_outcome = 0; // unset
        market.reference_price = reference_price;
        market.reference_price_decimals = reference_price_decimals;
        market.reference_price_timestamp = clock.unix_timestamp;
        market.resolution_ts = resolution_ts;
        market.total_up = 0;
        market.total_down = 0;
        market.fee_bps = fee_bps;
        market.platform_fee_bps = platform_fee_bps;
        market.fee_vault = ctx.accounts.fee_vault.key();
        market.usdc_vault = ctx.accounts.usdc_vault.key();
        market.usdc_mint = ctx.accounts.token_mint.key();
        market.bump = ctx.bumps.market;

        Ok(())
    }

    /// Place a bet on the market
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        market_id: u64,
        direction: u8,
        amount: u64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let bet = &mut ctx.accounts.bet;
        let clock = Clock::get()?;

        // Validation
        require_eq!(market.status, 1, ErrorCode::MarketNotOpen);
        require!(
            clock.unix_timestamp < market.resolution_ts,
            ErrorCode::TooLateToBet
        );
        require!(
            direction == 1 || direction == 2,
            ErrorCode::InvalidDirection
        );
        require!(amount > 0, ErrorCode::AmountMustBePositive);

        // Check if bet is newly created or existing
        let is_new_bet = bet.user == Pubkey::default();

        if is_new_bet {
            // Initialize new bet
            bet.user = ctx.accounts.user.key();
            bet.direction = direction;
            bet.amount = amount;
            bet.claimed = false;
            bet.bump = ctx.bumps.bet;
        } else {
            // Verify direction hasn't changed
            require_eq!(bet.direction, direction, ErrorCode::DirectionMismatch);
            // Add to existing bet amount
            bet.amount = bet
                .amount
                .checked_add(amount)
                .ok_or(ErrorCode::MathOverflow)?;
        }

        // Update pool totals
        if direction == 1 {
            market.total_up = market.total_up
                .checked_add(amount)
                .ok_or(ErrorCode::MathOverflow)?;
        } else {
            market.total_down = market.total_down
                .checked_add(amount)
                .ok_or(ErrorCode::MathOverflow)?;
        }

        // Transfer USDC from user to vault
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.user_usdc_ata.to_account_info(),
            to: ctx.accounts.usdc_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    /// Resolve the market with the final outcome
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        market_id: u64,
        outcome: u8,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let admin = &ctx.accounts.admin;
        let clock = Clock::get()?;

        // Validation
        require_eq!(admin.key(), market.admin, ErrorCode::Unauthorized);
        require_eq!(market.status, 1, ErrorCode::MarketNotOpen);
        require!(
            clock.unix_timestamp >= market.resolution_ts,
            ErrorCode::TooLateToBet
        );
        require!(
            outcome == 1 || outcome == 2,
            ErrorCode::InvalidOutcome
        );

        // Calculate fees and distributable pool
        let total_pool: u64 = market
            .total_up
            .checked_add(market.total_down)
            .ok_or(ErrorCode::MathOverflow)?;

        let fee: u64 = (total_pool as u128)
            .checked_mul(market.fee_bps as u128)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10_000)
            .ok_or(ErrorCode::MathOverflow)? as u64;

        let platform_fee: u64 = (fee as u128)
            .checked_mul(market.platform_fee_bps as u128)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10_000)
            .ok_or(ErrorCode::MathOverflow)? as u64;

        let creator_fee: u64 = fee
            .checked_sub(platform_fee)
            .ok_or(ErrorCode::MathOverflow)?;

        let _distributable_pool: u64 = total_pool
            .checked_sub(fee)
            .ok_or(ErrorCode::MathOverflow)?;

        // Transfer platform fee
        if platform_fee > 0 {
            let cpi_accounts = token::Transfer {
                from: ctx.accounts.usdc_vault.to_account_info(),
                to: ctx.accounts.fee_vault.to_account_info(),
                authority: market.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let seeds = &[b"market".as_ref(), &market.market_id.to_le_bytes(), &[market.bump]];
            let signer_seeds = &[&seeds[..]];
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
            token::transfer(cpi_ctx, platform_fee)?;
        }

        // Transfer creator fee
        if creator_fee > 0 {
            let cpi_accounts = token::Transfer {
                from: ctx.accounts.usdc_vault.to_account_info(),
                to: ctx.accounts.creator_fee_vault.to_account_info(),
                authority: market.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let seeds = &[b"market".as_ref(), &market.market_id.to_le_bytes(), &[market.bump]];
            let signer_seeds = &[&seeds[..]];
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
            token::transfer(cpi_ctx, creator_fee)?;
        }

        // Freeze settlement values (order-independent payouts)
    market.total_winning_at_resolve = if outcome == 1 { market.total_up } else { market.total_down };
    market.settled_pool = _distributable_pool;

    // Update market state
    market.resolved_outcome = outcome;
    market.status = 2; // RESOLVED

        Ok(())
    }

    /// Claim payout for a winning bet
    pub fn claim_payout(ctx: Context<ClaimPayout>, market_id: u64) -> Result<()> {
        let market = &ctx.accounts.market;

        if market.market_id != 0 {
            require_eq!(market.market_id, market_id, ErrorCode::Unauthorized);
        }
        let bet = &mut ctx.accounts.bet;

        // Validation
        require_eq!(market.status, 2, ErrorCode::MarketNotResolved);
        require!(!bet.claimed, ErrorCode::Unauthorized);
        require!(bet.amount > 0, ErrorCode::AmountMustBePositive);
        require_eq!(
            bet.direction,
            market.resolved_outcome,
            ErrorCode::DirectionMismatch
        );

        // Calculate payout
        let distributable_pool: u64 = market.settled_pool;

        let total_winning: u64 = market.total_winning_at_resolve;

        require!(total_winning > 0, ErrorCode::NoWinningPool);

        let payout: u64 = (bet.amount as u128)
            .checked_mul(distributable_pool as u128)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(total_winning as u128)
            .ok_or(ErrorCode::MathOverflow)? as u64;

        // Transfer payout to user
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.usdc_vault.to_account_info(),
            to: ctx.accounts.user_usdc_ata.to_account_info(),
            authority: market.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let seeds = &[b"market".as_ref(), &market.market_id.to_le_bytes(), &[market.bump]];
        let signer_seeds = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, payout)?;

        // Mark bet as claimed
        bet.claimed = true;

        Ok(())
    }
}
