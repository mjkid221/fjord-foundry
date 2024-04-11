use anchor_lang::prelude::*;

use crate::{program::FjordLbp, OwnerConfig};

// Accounts for the initialize_owner instruction
#[derive(Accounts)]
pub struct InitializeOwner<'info> {
    #[account(
      init,
      payer = authority,
      space = 8 + OwnerConfig::LEN, // anchor discriminator + owner config
      seeds = ["owner_config".as_bytes()],
      bump,
  )]
  pub config: Account<'info, OwnerConfig>,
  #[account(constraint = program.programdata_address()? == Some(program_data.key()))]
  pub program: Program<'info, FjordLbp>,
  #[account(constraint = program_data.upgrade_authority_address == Some(authority.key()))]
  pub program_data: Account<'info, ProgramData>,
  #[account(mut)]
  pub authority: Signer<'info>,
  pub system_program: Program<'info, System>,
}

// Accounts we pass in for owner/admin only functions
// There are two ways to go about this. One, we can do a `has_one = owner` check here which throws an anchor error
// Or, we can do a manual check in the instruction. I'm going to do the manual check for now to throw custom errors.
#[derive(Accounts)]
pub struct OnlyOwner<'info> {
  #[account(
    mut, 
    seeds = ["owner_config".as_bytes()],
    bump = config.bump
  )]
  pub config: Account<'info, OwnerConfig>,
  pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct AcceptOwner<'info> {
  #[account(
    mut, 
    seeds = ["owner_config".as_bytes()],
    constraint = config.pending_owner == Some(new_owner.key()),
    bump = config.bump
  )]
  pub config: Account<'info, OwnerConfig>,
  pub new_owner: Signer<'info>,

}

// Modules
pub mod initializer {
  use anchor_lang::prelude::*;
  use crate::{InitializeOwner, PoolError, MAX_FEE_BIPS};

  pub fn initialize_owner_config(ctx: Context<InitializeOwner>, 
    owner_key: Pubkey,  
    fee_recipient: Pubkey,
    platform_fee: u16,
    referral_fee: u16,
    swap_fee: u16
  ) -> Result<()> {
    let config = &mut ctx.accounts.config;
    // Check if the provided fees are within the acceptable range
    if platform_fee > MAX_FEE_BIPS {
      return Err(PoolError::MaxFeeExceeded.into());
    }

    if referral_fee > MAX_FEE_BIPS {
        return Err(PoolError::MaxFeeExceeded.into());
    }

    if swap_fee > MAX_FEE_BIPS {
        return Err(PoolError::MaxFeeExceeded.into());
    }
    
    config.owner = owner_key;
    config.bump = ctx.bumps.config;
    config.fee_recipient = fee_recipient;
    config.platform_fee = platform_fee;
    config.referral_fee = referral_fee;
    config.swap_fee = swap_fee;

    Ok(())
  }
}

pub mod access_control {
  use anchor_lang::prelude::*;
  use crate::{AcceptOwner, AccessControlError, OnlyOwner};

  #[access_control(_check_only_owner(&ctx))]
  pub fn nominate_new_owner(ctx: Context<OnlyOwner>, new_owner: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.pending_owner = Some(new_owner);
    Ok(())
  }

  pub fn accept_owner(ctx: Context<AcceptOwner>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.owner = ctx.accounts.new_owner.key();
    config.pending_owner = None;
    Ok(())
  }

  // "Modifiers"
  pub fn _check_only_owner(ctx: &Context<OnlyOwner>) -> Result<()> {
    let config = &ctx.accounts.config;
    if config.owner != ctx.accounts.owner.key() {
        return Err(AccessControlError::Unauthorized.into());
    }
    Ok(())
  }
  
}

