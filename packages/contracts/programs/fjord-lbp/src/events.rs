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

#[event]
pub struct Close {
    // The amount of assets transferred out during the pool closure
    pub assets: u64,
    pub platform_fees: u64,
    pub swap_fees_asset: u64,
    pub swap_fees_share: u64,
}

#[event]
pub struct Redeem {
    pub caller: Pubkey,
    pub shares: u64,
}

// For Read-only contexts
#[event]
pub struct PreviewAssetsIn {
    pub assets_in: u64,
}

#[event]
pub struct PreviewAssetsOut {
    pub assets_out: u64,
}

#[event]
pub struct PreviewSharesIn {
    pub shares_in: u64,
}

#[event]
pub struct PreviewSharesOut {
    pub shares_out: u64,
}

#[event]
pub struct ReservesAndWeights {
    pub asset_reserve: u64,
    pub share_reserve: u64,
    pub asset_weight: u64,
    pub share_weight: u64,
}
