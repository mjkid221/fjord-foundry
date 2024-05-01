use anchor_lang::prelude::*;
use crate::{program::FjordLbp, AccessControlError, OwnerConfig, PoolError, Treasury, FeeMapping};
use anchor_spl::token_2022::spl_token_2022::extension::transfer_fee::MAX_FEE_BASIS_POINTS;

// Accounts for the initialize_owner instruction
#[derive(Accounts)]
#[instruction(owner_key: Pubkey, swap_fee_recipient: Pubkey, fee_recipients: Vec<Pubkey>, fee_percentages: Vec<u16>)]
pub struct InitializeOwner<'info> {
  #[account(
    init,
    payer = authority,
    space = 8 + OwnerConfig::LEN, // anchor discriminator + owner config
    seeds = ["owner_config".as_bytes()],
    bump,
  )]
  pub config: Account<'info, OwnerConfig>,
  #[account(
    init,
    payer = authority,
    seeds=["treasury".as_bytes()],
    constraint = fee_percentages.len() == fee_recipients.len() @PoolError::InvalidFeeRecipients,
    space = 8 + 32 + (4 + (32 + 2) * fee_recipients.len()),
    bump
  )]
  pub treasury: Box<Account<'info, Treasury>>,
  #[account(constraint = program.programdata_address()? == Some(program_data.key()))]
  pub program: Program<'info, FjordLbp>,
  #[account(constraint = program_data.upgrade_authority_address == Some(authority.key()) @AccessControlError::NotUpgradeAuthority)]
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
    constraint = config.owner == owner.key() @AccessControlError::Unauthorized,
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
    constraint = config.pending_owner == Some(new_owner.key()) @AccessControlError::Unauthorized,
    bump = config.bump
    
  )]
  pub config: Account<'info, OwnerConfig>,
  pub new_owner: Signer<'info>,

}

// Modules
pub mod initializer {
  use super::*;

  #[allow(clippy::too_many_arguments)]
  pub fn initialize_owner_config(ctx: Context<InitializeOwner>, 
    owner_key: Pubkey,  
    swap_fee_recipient: Pubkey,
    fee_recipients: Vec<Pubkey>,
    fee_percentages: Vec<u16>,
    platform_fee: u16,
    referral_fee: u16,
    swap_fee: u16
  ) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let treasury = &mut ctx.accounts.treasury;

    // Check if the provided fees are within the acceptable range
    if platform_fee > MAX_FEE_BASIS_POINTS || referral_fee > MAX_FEE_BASIS_POINTS ||  swap_fee > MAX_FEE_BASIS_POINTS {
      return Err(PoolError::MaxFeeExceeded.into());
    }

    if fee_percentages.iter().any(|&fee| fee > MAX_FEE_BASIS_POINTS) {
      return Err(PoolError::MaxFeeExceeded.into());
    }

    if fee_percentages.len() != fee_recipients.len() || fee_recipients.is_empty() {
      return Err(PoolError::InvalidFeeRecipients.into());
    }

    let total_percentage: u16 = fee_percentages.iter().sum();
    if total_percentage != MAX_FEE_BASIS_POINTS {
      return Err(PoolError::InvalidPercentageSum.into());
    }
    
    config.owner = owner_key;
    config.bump = ctx.bumps.config;
    config.treasury = treasury.key();
    config.platform_fee = platform_fee;
    config.referral_fee = referral_fee;
    config.swap_fee = swap_fee;

    treasury.swap_fee_recipient = swap_fee_recipient;
    for (i, recipient) in fee_recipients.iter().enumerate() {
      treasury.fee_recipients.push(FeeMapping {
        user: *recipient,
        percentage: fee_percentages[i],
      })
    }

    Ok(())
  }
}

pub mod access_control {
  use super::*;
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
}

