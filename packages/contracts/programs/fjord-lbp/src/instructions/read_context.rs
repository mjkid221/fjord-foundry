use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

use crate::{LiquidityBootstrappingPool, OwnerConfig};

#[derive(Accounts)]
pub struct ReturnPreviewContext<'info> {
  // Token mints
  pub asset_token_mint: Account<'info, Mint>,
  pub share_token_mint: Account<'info, Mint>,
  #[account(
    mut,
    seeds = [share_token_mint.key().as_ref(), asset_token_mint.key().as_ref(), pool.creator.key().as_ref()], 
    bump
  )]
  pub pool: Account<'info, LiquidityBootstrappingPool>,
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
  // Global pool config
  #[account(
    mut, 
    seeds = ["owner_config".as_bytes()],
    bump = config.bump
  )]
  pub config: Account<'info, OwnerConfig>,
}
