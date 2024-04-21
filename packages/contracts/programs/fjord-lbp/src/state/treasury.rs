use anchor_lang::prelude::*;

#[account]
pub struct Treasury {
    // Swap fee recipient
    pub swap_fee_recipient: Pubkey,
    pub fee_recipients: Vec<FeeMapping>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct FeeMapping {
    pub user: Pubkey,
    // Fee percentages must match the length of fee recipients
    pub percentage: u16,
}
