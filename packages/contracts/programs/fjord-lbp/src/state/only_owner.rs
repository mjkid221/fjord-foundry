use anchor_lang::prelude::*;

#[account]
pub struct OwnerConfig {
    // Owner address
    pub owner: Pubkey,
    // A potentially new owner (used to transfer ownership)
    pub pending_owner: Option<Pubkey>,
    // We store our bump seed as a form of optimization

    // Fee settings
    pub fee_recipient: Pubkey,
    pub platform_fee: u16,
    pub referral_fee: u16,
    pub swap_fee: u16,

    pub bump: u8,
}

impl OwnerConfig {
    // The size length of the OwnerConfig account
    // pub key(32) + optional pending owner (1 + 32) + Pool fee settings + bump(1)
    pub const LEN: usize = 32 + 1 + 32 + 32 + 2 + 2 + 2 + 1;
}
