use anchor_lang::prelude::*;

// Emitted when a pool is created
#[event]
pub struct PoolCreatedEvent {
    pub pool: Pubkey,
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

#[event]
pub struct Sell {
    // The pubkey of the user initiating the swap
    pub user: Pubkey,
    // The amount of shares in
    pub shares: u64,
    // The amount of assets received
    pub assets: u64,
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

// For Read-only contexts
#[event]
pub struct PreviewAssetsIn {
    pub assets_in: u64,
}

#[event]
pub struct PreviewAssetsOut {
    pub shares_out: u64,
}

#[event]
pub struct PreviewSharesIn {
    pub shares_in: u64,
}

#[event]
pub struct PreviewSharesOut {
    pub shares_out: u64,
}
