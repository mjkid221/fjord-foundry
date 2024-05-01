use crate::{AccessControlError, FeeMapping, OwnerConfig, PoolError, Treasury};
use anchor_lang::prelude::*;
use anchor_spl::token_2022::spl_token_2022::extension::transfer_fee::MAX_FEE_BASIS_POINTS;

#[derive(Accounts)]
pub struct FeeConfig<'info> {
    #[account(
        mut,
        seeds = ["owner_config".as_bytes()],
        constraint = config.owner == owner.key() @AccessControlError::Unauthorized,
        bump = config.bump
    )]
    pub config: Account<'info, OwnerConfig>,
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(swap_fee_recipient: Option<Pubkey>, fee_recipients: Vec<Pubkey>, fee_percentages: Vec<u16>)]
pub struct TreasuryFeeRecipientConfig<'info> {
    #[account(
        mut,
        seeds = ["treasury".as_bytes()],
        constraint = fee_percentages.len() == fee_recipients.len() @PoolError::InvalidFeeRecipients,
        realloc = 8 + 32 + (4 + (32 + 2) * fee_recipients.len()),
        realloc::payer = owner,
        realloc::zero = false,
        bump
    )]
    pub treasury: Box<Account<'info, Treasury>>,
    #[account(
        mut,
        seeds = ["owner_config".as_bytes()],
        constraint = config.owner == owner.key() @AccessControlError::Unauthorized,
        bump = config.bump
    )]
    pub config: Account<'info, OwnerConfig>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Pool fee setter
pub mod setter {
    use super::*;
    pub fn set_fees(
        ctx: Context<FeeConfig>,
        platform_fee: Option<u16>,
        referral_fee: Option<u16>,
        swap_fee: Option<u16>,
    ) -> Result<()> {
        if platform_fee.is_some() && platform_fee.unwrap() > MAX_FEE_BASIS_POINTS
            || referral_fee.is_some() && referral_fee.unwrap() > MAX_FEE_BASIS_POINTS
            || swap_fee.is_some() && swap_fee.unwrap() > MAX_FEE_BASIS_POINTS
        {
            return Err(PoolError::MaxFeeExceeded.into());
        }

        let config = &mut ctx.accounts.config;
        config.platform_fee = platform_fee.unwrap_or(config.platform_fee);
        config.referral_fee = referral_fee.unwrap_or(config.referral_fee);
        config.swap_fee = swap_fee.unwrap_or(config.swap_fee);

        Ok(())
    }

    pub fn set_fee_recipients(
        ctx: Context<TreasuryFeeRecipientConfig>,
        swap_fee_recipient: Option<Pubkey>,
        fee_recipients: Vec<Pubkey>,
        fee_percentages: Vec<u16>,
    ) -> Result<()> {
        if fee_percentages.len() != fee_recipients.len() {
            return Err(PoolError::InvalidFeeRecipients.into());
        }

        if fee_percentages
            .iter()
            .any(|&fee| fee > MAX_FEE_BASIS_POINTS)
        {
            return Err(PoolError::MaxFeeExceeded.into());
        }

        let total_percentage: u16 = fee_percentages.iter().sum();
        if total_percentage != MAX_FEE_BASIS_POINTS {
            return Err(PoolError::InvalidPercentageSum.into());
        }

        let treasury = &mut ctx.accounts.treasury;
        treasury.swap_fee_recipient = swap_fee_recipient.unwrap_or(treasury.swap_fee_recipient);
        treasury.fee_recipients.clear();
        for (i, recipient) in fee_recipients.iter().enumerate() {
            treasury.fee_recipients.push(FeeMapping {
                user: *recipient,
                percentage: fee_percentages[i],
            })
        }

        Ok(())
    }
}
