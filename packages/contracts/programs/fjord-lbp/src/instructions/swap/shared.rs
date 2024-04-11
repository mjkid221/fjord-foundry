use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{
  LiquidityBootstrappingPool, OwnerConfig, UserStateInPool,
};

#[derive(Accounts)]
#[instruction(referrer: Option<Pubkey>)]
pub struct SwapTokens<'info> {
    // Token mints
    pub asset_token_mint: Account<'info, Mint>,
    pub share_token_mint: Account<'info, Mint>,
    // The pool
    #[account(
      mut,
      seeds = [share_token_mint.key().as_ref(), asset_token_mint.key().as_ref(), user.key().as_ref()], 
      bump
    )]
    pub pool: Account<'info, LiquidityBootstrappingPool>,
    // The token accounts that the pool will use to hold the tokens
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
    // The token accounts that the user uses to store tokens
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
    // Global pool config
    #[account(
      mut, 
      seeds = ["owner_config".as_bytes()],
      bump = config.bump
    )]
    pub config: Account<'info, OwnerConfig>,
    // The user's state in a pool
    #[account(
      init_if_needed,
      payer = user, 
      space = 8 + UserStateInPool::LEN,
      seeds = [user.key().as_ref(), pool.key().as_ref()],
      bump
    )]
    pub user_state_in_pool: Account<'info, UserStateInPool>,
    // The referrer's state in a pool
    #[account(
      init_if_needed,
      payer = user, 
      space = 8 + UserStateInPool::LEN,
      seeds = [referrer.unwrap_or_default().key().as_ref(), pool.key().as_ref()],
      bump
    )]
    pub referrer_state_in_pool: Option<Account<'info, UserStateInPool>>,
    // Miscs
    #[account(mut)]
    pub user: Signer<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
