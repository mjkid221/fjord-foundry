use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::math::calculate_fee;
use crate::{
  LiquidityBootstrappingPool, OwnerConfig, PoolError,
};

#[derive(Accounts)]
pub struct ClosePool<'info> {
    // Token mints
    pub asset_token_mint: Account<'info, Mint>,
    pub share_token_mint: Account<'info, Mint>,
    // The pool
    #[account(
      mut,
      seeds = [share_token_mint.key().as_ref(), asset_token_mint.key().as_ref(), pool.creator.key().as_ref()], 
      bump = pool.bump
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
    // Miscs
    #[account(mut)]
    pub user: Signer<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}


pub fn close_pool(
    ctx: Context<ClosePool>,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    if pool.closed || Clock::get()?.unix_timestamp < pool.sale_end_time {
        return Err(PoolError::ClosingDisallowed.into());
    }
    
    let total_assets = ctx.accounts.pool_asset_token_account.amount - pool.total_swap_fees_asset;
    let platform_fees = calculate_fee(pool.total_swap_fees_asset, ctx.accounts.config.platform_fee);
    let total_assets_minus_fees = total_assets - platform_fees - pool.total_referred;

    // let pool = &mut ctx.accounts.pool;
    // let config = &mut ctx.accounts.config;
    // let pool_asset_token_account = &mut ctx.accounts.pool_asset_token_account;
    // let pool_share_token_account = &mut ctx.accounts.pool_share_token_account;
    // let user = &mut ctx.accounts.user;

    // // Transfer all assets to the user
    // let asset_transfer_instruction = Transfer {
    //     from: pool_asset_token_account.to_account_info(),
    //     to: ctx.accounts.user.to_account_info(),
    //     authority: ctx.accounts.pool.to_account_info(),
    // };
    // let asset_cpi_ctx =
    //     CpiContext::new(ctx.accounts.token_program.to_account_info(), asset_transfer_instruction);
    // token::transfer(asset_cpi_ctx, pool_asset_token_account.amount)?;

    // // Transfer all shares to the user
    // let share_transfer_instruction = Transfer {
    //     from: pool_share_token_account.to_account_info(),
    //     to: ctx.accounts.user.to_account_info(),
    //     authority: ctx.accounts.pool.to_account_info(),
    // };
    // let share_cpi_ctx =
    //     CpiContext::new(ctx.accounts.token_program.to_account_info(), share_transfer_instruction);
    // token::transfer(share_cpi_ctx, pool_share_token_account.amount)?;

    // // Close the pool
    // pool.is_initialized = false;
    // pool_asset_token_account.amount = 0;
    // pool_share_token_account.amount = 0;

    // // Close the global pool config
    // config.is_initialized = false;

    Ok(())
}