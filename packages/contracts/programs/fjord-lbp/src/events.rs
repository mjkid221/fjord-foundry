use anchor_lang::prelude::*;

// Emitted when a pool is created
#[event]
pub struct PoolCreatedEvent {
    pub pool: Pubkey
}

// Emitted when assets (collateral token) are swapped for shares (project token)
#[event]
pub struct Buy {    
    // The pubkey of the user initiating the swap
    pub user: Pubkey,
    // The amount of assets being swapped
    pub assets: u64,
    // The amount of shares received in swap
    pub shares: u64,
    // The amount of fee charged in swap
    pub swap_fee: u64,
}

// Emitted when the fee settings are updated
#[event]
pub struct FeeSet {
    pub fee_recipient: Pubkey,
    pub platform_fee: u16,
    pub referral_fee: u16,
    pub swap_fee: u16,
}