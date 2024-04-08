use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use std::mem::size_of;

use crate::{LiquidityBootstrappingPool, PoolCreatedEvent, PoolError, ONE_DAY_SECONDS};

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init, 
        payer = creator, 
        space = 8 + size_of::<LiquidityBootstrappingPool>(), 
        seeds = [share_token_mint.key().as_ref(), asset_token_mint.key().as_ref(), creator.key().as_ref()], 
        bump
    )]
    pub pool: Account<'info, LiquidityBootstrappingPool>,
    // Token mint
    pub asset_token_mint: Account<'info, Mint>,
    pub share_token_mint: Account<'info, Mint>,
    // Token accounts that the pool will use to hold the tokens
    #[account(
        init,
        payer = creator, 
        associated_token::mint = share_token_mint,
        associated_token::authority = pool
    )]
    pub pool_share_token_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = creator, 
        associated_token::mint = asset_token_mint,
        associated_token::authority = pool
    )]
    pub pool_asset_token_account: Account<'info, TokenAccount>,
    // User token account
    #[account(mut, associated_token::mint = asset_token_mint, associated_token::authority = creator)]
    pub creator_asset_token_account: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = share_token_mint, associated_token::authority = creator)]
    pub creator_share_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub creator: Signer<'info>,  // Creator of the pool
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn create_pool(
  ctx: Context<InitializePool>,
  assets: u64,
  shares: u64,
  virtual_assets: u64,
  virtual_shares: u64,
  max_share_price: u64,
  max_shares_out: u64,
  max_assets_in: u64,
  start_weight_basis_points: u16,
  end_weight_basis_points: u16,
  sale_start_time: i64,
  sale_end_time: i64,
  vest_cliff: i64,
  vest_end: i64,
  whitelist_merkle_root: [u8; 32],
  selling_allowed: Option<bool>
) -> Result<()> {
  let pool = &mut ctx.accounts.pool;

  require_keys_neq!(ctx.accounts.asset_token_mint.key(), ctx.accounts.share_token_mint.key(), PoolError::InvalidAssetOrShare);

  // check if the sale start time is in the future
  let current_time = Clock::get()?.unix_timestamp;

  if current_time + ONE_DAY_SECONDS > sale_end_time || sale_end_time - sale_start_time < ONE_DAY_SECONDS {
      return err!(PoolError::SalePeriodLow);
  }

  if sale_end_time < vest_end {
      if sale_end_time > vest_cliff {
          return err!(PoolError::InvalidVestCliff);
      }
      if vest_cliff >= vest_end {
          return err!(PoolError::InvalidVestEnd);
      }
  }

  if start_weight_basis_points < 100 ||  start_weight_basis_points> 9900 || end_weight_basis_points > 9900 || start_weight_basis_points < 100 {
      return err!(PoolError::InvalidWeightConfig);
  }

  if assets == 0 && virtual_assets == 0 {
      return err!(PoolError::InvalidAssetValue);
  }

  pool.asset_token = ctx.accounts.asset_token_mint.key();
  pool.share_token = ctx.accounts.share_token_mint.key();
  pool.creator = ctx.accounts.creator.key();
  
  pool.virtual_assets = virtual_assets;
  pool.virtual_shares = virtual_shares;
  pool.max_share_price = max_share_price;
  pool.max_shares_out = max_shares_out;
  pool.max_assets_in = max_assets_in;

  pool.start_weight_basis_points = start_weight_basis_points;
  pool.end_weight_basis_points = end_weight_basis_points;

  pool.sale_start_time = sale_start_time;
  pool.sale_end_time = sale_end_time;
  pool.vest_cliff = vest_cliff;
  pool.vest_end = vest_end;

  pool.selling_allowed = selling_allowed.unwrap_or(false);
  pool.whitelist_merkle_root = whitelist_merkle_root;

  // Transfer the tokens to the pool
  let asset_transfer_instruction = Transfer {
      from: ctx.accounts.creator_asset_token_account.to_account_info(),
      to: ctx.accounts.pool_asset_token_account.to_account_info(),
      authority: ctx.accounts.creator.to_account_info(),
  };
  let asset_cpi_ctx = CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      asset_transfer_instruction
  );
  token::transfer(asset_cpi_ctx, assets)?;

  // Transfer the share tokens to the pool
  let share_transfer_instruction = Transfer {
      from: ctx.accounts.creator_share_token_account.to_account_info(),
      to: ctx.accounts.pool_share_token_account.to_account_info(),
      authority: ctx.accounts.creator.to_account_info(),
  };
  let share_cpi_ctx = CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      share_transfer_instruction
  );
  token::transfer(share_cpi_ctx, shares)?;

  // Emit creation event
  emit!(PoolCreatedEvent {
      pool: ctx.accounts.pool.key()
  });

  Ok(())
}
