// Pool fee setter
pub mod setter {
  use anchor_lang::prelude::*;
  use crate::{ownable::access_control::*, FeeSet, OnlyOwner};

  #[access_control(_check_only_owner(&ctx))]
  pub fn set_fees(ctx: Context<OnlyOwner>, fee_recipient: Option<Pubkey>, platform_fee: Option<u16>, referral_fee: Option<u16>, swap_fee: Option<u16>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.fee_recipient = fee_recipient.unwrap_or(config.fee_recipient);
    config.platform_fee = platform_fee.unwrap_or(config.platform_fee);
    config.referral_fee = referral_fee.unwrap_or(config.referral_fee);
    config.swap_fee = swap_fee.unwrap_or(config.swap_fee);
    
    emit!(FeeSet {
      fee_recipient: config.fee_recipient,
      platform_fee: config.platform_fee,
      referral_fee: config.referral_fee,
      swap_fee: config.swap_fee
    });
    Ok(())
  }
}