
// Pool fee setter
use crate::LiquidityBootstrappingPool;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
pub struct OnlyPoolCreator<'info> {
    #[account(
      mut,
      seeds = [share_token_mint.key().as_ref(), asset_token_mint.key().as_ref(), creator.key().as_ref()], 
      bump
    )]
    pub pool: Account<'info, LiquidityBootstrappingPool>,
    // Token mint
    pub asset_token_mint: Account<'info, Mint>,
    pub share_token_mint: Account<'info, Mint>,
    pub creator: Signer<'info>,  // Creator of the pool
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn toggle_pause(ctx: Context<OnlyPoolCreator>) -> Result<()> {
  ctx.accounts.pool.paused = !ctx.accounts.pool.paused;
  Ok(())
}


