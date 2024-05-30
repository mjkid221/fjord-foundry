use std::collections::{HashMap, HashSet};

use anchor_lang::prelude::*;
use anchor_spl::associated_token::{AssociatedToken, get_associated_token_address};
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::math::calculate_fee;
use crate::{
  safe_math, transfer_tokens_from, Close, FeeMapping, LiquidityBootstrappingPool, OwnerConfig, PoolError, Redeem, Treasury, UserStateInPool
};

pub struct FeeRecipient<'a> {
    pub account_info: AccountInfo<'a>,
    pub fee_percentage: u16,
}

#[derive(Accounts)]
pub struct ClosePool<'info> {
    // Token mints -----------------------------------------------------
    pub asset_token_mint: Box<Account<'info, Mint>>,
    pub share_token_mint: Box<Account<'info, Mint>>,
    // The pool --------------------------------------------------------
    #[account(
      mut,
      seeds = [share_token_mint.key().as_ref(), asset_token_mint.key().as_ref(), pool.creator.key().as_ref()], 
      bump = pool.bump
    )]
    pub pool: Box<Account<'info, LiquidityBootstrappingPool>>,
    // Pool token accounts ---------------------------------------------
    #[account(
      mut,
      associated_token::mint = asset_token_mint,
      associated_token::authority = pool
    )]
    pub pool_asset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
      mut,
      associated_token::mint = share_token_mint,
      associated_token::authority = pool
    )]
    pub pool_share_token_account: Box<Account<'info, TokenAccount>>,
    // Treasury token accounts -------------------------------------
    #[account(
      init_if_needed,
      payer = user,
      associated_token::mint = asset_token_mint,
      associated_token::authority = treasury
    )]
    pub treasury_asset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
      init_if_needed,
      payer = user,
      associated_token::mint = share_token_mint,
      associated_token::authority = treasury
    )]
    pub treasury_share_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
      seeds = ["treasury".as_bytes()],
      bump
    )]
    pub treasury: Box<Account<'info, Treasury>>,
    // Pool owner/manager token accounts --------------------------------
    #[account(
      init_if_needed,
      payer = user,
      associated_token::mint = asset_token_mint,
      associated_token::authority = pool_creator
    )]
    pub creator_asset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
      init_if_needed,
      payer = user,
      associated_token::mint = share_token_mint,
      associated_token::authority = pool_creator
    )]
    pub creator_share_token_account: Box<Account<'info, TokenAccount>>,
    #[account(constraint = pool.creator == pool_creator.key() @PoolError::InvalidCreator)]
    pub pool_creator: SystemAccount<'info>,
    // Swap fee recipient ----------------------------------------------
    #[account(
      init_if_needed, 
      payer = user, 
      associated_token::mint = asset_token_mint, 
      associated_token::authority = swap_fee_recipient
    )]
    pub swap_fee_recipient_asset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
      init_if_needed, 
      payer = user, 
      associated_token::mint = share_token_mint, 
      associated_token::authority = swap_fee_recipient
    )]
    pub swap_fee_recipient_share_token_account: Box<Account<'info, TokenAccount>>,
    #[account(constraint = treasury.swap_fee_recipient == swap_fee_recipient.key() @PoolError::InvalidSwapFeeRecipient)]
    pub swap_fee_recipient: SystemAccount<'info>,
    // Global pool config ----------------------------------------------
    #[account(
      seeds = ["owner_config".as_bytes()],
      bump = owner_config.bump
    )]
    pub owner_config: Box<Account<'info, OwnerConfig>>,    
    // Miscs ----------------------------------------------------------
    #[account(mut)]
    pub user: Signer<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RedeemTokens<'info> {
  // Token mints -----------------------------------------------------
  pub asset_token_mint: Account<'info, Mint>,
  pub share_token_mint: Account<'info, Mint>,
  // The pool --------------------------------------------------------
  #[account(
    seeds = [share_token_mint.key().as_ref(), asset_token_mint.key().as_ref(), pool.creator.key().as_ref()], 
    bump = pool.bump
  )]
  pub pool: Box<Account<'info, LiquidityBootstrappingPool>>,
  // Pool token accounts ---------------------------------------------
  #[account(
    mut,
    associated_token::mint = asset_token_mint,
    associated_token::authority = pool
  )]
  pub pool_asset_token_account: Account<'info, TokenAccount>,
  #[account(
    mut,
    associated_token::mint = share_token_mint,
    associated_token::authority = pool
  )]
  pub pool_share_token_account: Account<'info, TokenAccount>,
  // User token accounts ---------------------------------------------
  #[account(
    init_if_needed,
    payer = user,
    associated_token::mint = asset_token_mint, 
    associated_token::authority = user)
  ]
  pub user_asset_token_account: Account<'info, TokenAccount>,
  #[account(
    init_if_needed,
    payer = user,
    associated_token::mint = share_token_mint, 
    associated_token::authority = user)
  ]
  pub user_share_token_account: Account<'info, TokenAccount>,
  // The user's state in a pool --------------------------------------
  #[account(
    mut,
    seeds = [user.key().as_ref(), pool.key().as_ref()],
    bump
  )]
  pub user_state_in_pool: Box<Account<'info, UserStateInPool>>,
  // Miscs ----------------------------------------------------------
  #[account(mut)]
  pub user: Signer<'info>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
}

/// Close the pool and distribute assets and shares accordingly.
/// This function closes the pool after the sale has ended and distributes
/// assets to the platform (treasury) and the creator/manager, and shares to the creator/manager for
/// any unsold shares. Once closed, the pool cannot be used for further transactions.
pub fn close_pool<'info>(ctx: Context<'_, '_, '_, 'info, ClosePool<'info>>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let treasury = &ctx.accounts.treasury;

    if pool.closed || Clock::get()?.unix_timestamp < pool.sale_end_time {
        return Err(PoolError::ClosingDisallowed.into());
    }
    pool.closed = true;
    let total_assets = safe_math::safe_sub(ctx.accounts.pool_asset_token_account.amount, pool.total_swap_fees_asset)?;
    let platform_fees = calculate_fee(total_assets, ctx.accounts.owner_config.platform_fee);
    let total_assets_minus_fees = safe_math::safe_sub(safe_math::safe_sub(total_assets, platform_fees)?, pool.total_referred)?;

    if total_assets != 0 {
        // Transfer platform fees and swap fees directly to the respective recipients
        let fee_recipients_asset_token = retrieve_valid_keys(treasury.fee_recipients.clone(), ctx.remaining_accounts, &ctx.accounts.asset_token_mint.key())?;
        fee_recipients_asset_token.iter().for_each(|recipient| {
            let fees = calculate_fee(platform_fees, recipient.fee_percentage);
            transfer_tokens_from(
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.pool_asset_token_account.to_account_info(),
                recipient.account_info.to_account_info(),
                pool.to_account_info(),
                &[
                    pool.share_token.as_ref(),
                    pool.asset_token.as_ref(),
                    pool.creator.as_ref(),
                    &[pool.bump],
                ],
                fees,
            ).unwrap();
        });
   
        // Transfer asset to swap fee recipient
        transfer_tokens_from(
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.pool_asset_token_account.to_account_info(),
            ctx.accounts
                .swap_fee_recipient_asset_token_account
                .to_account_info(),
            pool.to_account_info(),
            &[
                pool.share_token.as_ref(),
                pool.asset_token.as_ref(),
                pool.creator.as_ref(),
                &[pool.bump],
            ],
            pool.total_swap_fees_asset,
        )?;

        // Transfer share to swap fee recipient
        transfer_tokens_from(
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.pool_share_token_account.to_account_info(),
            ctx.accounts
                .swap_fee_recipient_share_token_account
                .to_account_info(),
            pool.to_account_info(),
            &[
                pool.share_token.as_ref(),
                pool.asset_token.as_ref(),
                pool.creator.as_ref(),
                &[pool.bump],
            ],
            pool.total_swap_fees_share,
        )?;

        // Transfer remaining assets to pool creator/manager
        transfer_tokens_from(
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.pool_asset_token_account.to_account_info(),
            ctx.accounts.creator_asset_token_account.to_account_info(),
            pool.to_account_info(),
            &[
                pool.share_token.as_ref(),
                pool.asset_token.as_ref(),
                pool.creator.as_ref(),
                &[pool.bump],
            ],
            total_assets_minus_fees,
        )?;
    }

    let total_shares = ctx.accounts.pool_share_token_account.amount;
    let unsold_shares = total_shares - pool.total_purchased;

    if unsold_shares != 0 {
        transfer_tokens_from(
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.pool_share_token_account.to_account_info(),
            ctx.accounts
                .creator_share_token_account
                .to_account_info(),
            pool.to_account_info(),
            &[
                pool.share_token.as_ref(),
                pool.asset_token.as_ref(),
                pool.creator.as_ref(),
                &[pool.bump],
            ],
            unsold_shares,
        )?;
    }

    emit!(Close {
        assets: total_assets_minus_fees,
        platform_fees,
        swap_fees_asset: pool.total_swap_fees_asset,
        swap_fees_share: pool.total_swap_fees_share,
    });

    Ok(())
}



pub fn redeem(ctx: Context<RedeemTokens>, referred: bool) -> Result<()> {
    if !ctx.accounts.pool.closed {
        return Err(PoolError::RedeemingDisallowed.into());
    }
    let user_state_in_pool = &mut ctx.accounts.user_state_in_pool;
    let shares = user_state_in_pool.purchased_shares;
    user_state_in_pool.purchased_shares = 0;

    if shares != 0 {
        transfer_tokens_from(
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.pool_share_token_account.to_account_info(),
            ctx.accounts.user_share_token_account.to_account_info(),
            ctx.accounts.pool.to_account_info(),
            &[
                ctx.accounts.pool.share_token.as_ref(),
                ctx.accounts.pool.asset_token.as_ref(),
                ctx.accounts.pool.creator.as_ref(),
                &[ctx.accounts.pool.bump],
            ],
            // Fall back to the remaining shares if there are not enough shares in the pool due to slippage/rounding errors/etc. Could be unlikely, but better to be safe.
            if ctx.accounts.pool_share_token_account.amount < shares {
                ctx.accounts.pool_share_token_account.amount
            } else {
                shares
            },
        )?;

        emit!(Redeem {
            caller: *ctx.accounts.user.key,
            shares,
        })
    }
    
    if referred && user_state_in_pool.referred_assets != 0 {
        let assets = user_state_in_pool.referred_assets;
        user_state_in_pool.referred_assets = 0;
        transfer_tokens_from(
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.pool_asset_token_account.to_account_info(),
            ctx.accounts.user_asset_token_account.to_account_info(),
            ctx.accounts.pool.to_account_info(),
            &[
                ctx.accounts.pool.share_token.as_ref(),
                ctx.accounts.pool.asset_token.as_ref(),
                ctx.accounts.pool.creator.as_ref(),
                &[ctx.accounts.pool.bump],
            ],
            // Fall back to the remaining assets if there are not enough assets in the pool due to slippage/rounding errors/etc.
            if ctx.accounts.pool_asset_token_account.amount < assets {
                ctx.accounts.pool_asset_token_account.amount
            } else {
                assets
            },
        )?
    }

    Ok(())
}

/// Retrieve the valid keys from a list of AccountInfo that match the ATAs of a list of recipient pubkeys set in the treasury
/// and return them along with their respective fee percentages.
/// * `a` - A list of FeeMapping structs, representing fee recipients and their percentages.
/// * `b` - A list of AccountInfo, representing remaining_accounts passed in the instruction.
fn retrieve_valid_keys<'a>(a: Vec<FeeMapping>, b: &[AccountInfo<'a>], token_mint: &Pubkey) -> Result<Vec<FeeRecipient<'a>>> {
    // Compute the ATAs for each Pubkey in `a` and map them to their fee percentages
    let ata_to_fee: HashMap<Pubkey, u16> = a.iter()
        .map(|recipient| (get_associated_token_address(&recipient.user, token_mint), recipient.percentage))
        .collect();

    let mut seen_keys: HashSet<Pubkey> = HashSet::with_capacity(b.len());
    let mut filtered_b: Vec<FeeRecipient<'a>> = Vec::with_capacity(b.len());

    // Filter `b` to find AccountInfo whose key matches any of the ATAs and map them to FeeRecipient
    for account_info in b {
        if !account_info.is_writable {
            return Err(PoolError::InvalidFeeRecipientWritable.into());
        }

        // Check if the account is in the ATA to fee mapping and detect duplicates
        if let Some(&fee_percentage) = ata_to_fee.get(account_info.key) {
            if !seen_keys.insert(*account_info.key) {
                return Err(PoolError::DuplicateFeeRecipient.into());
            }

            filtered_b.push(FeeRecipient {
                account_info: account_info.clone(),
                fee_percentage,
            });
        }
    }

    // Ensure the length matches to prevent invalid configurations
    if a.len() != filtered_b.len() {
        return Err(PoolError::InvalidFeeRecipients.into());
    }

    Ok(filtered_b)
}
