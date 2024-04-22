use anchor_lang::prelude::*;

/// Account storing the information of the liquidity bootstrapping pool
#[account]
pub struct LiquidityBootstrappingPool {
    // Collateral token
    pub asset_token: Pubkey,
    // Project token
    pub share_token: Pubkey,
    // The creator of pool
    pub creator: Pubkey,
    pub virtual_assets: u64,
    pub virtual_shares: u64,
    pub max_share_price: u64,
    pub max_shares_out: u64,
    pub max_assets_in: u64,
    // Percentage
    pub start_weight_basis_points: u16,
    // Percentage
    pub end_weight_basis_points: u16,
    // Timestamp
    pub sale_start_time: i64,
    // Timestamp
    pub sale_end_time: i64,
    // Timestamp
    pub vest_cliff: i64,
    // Timestamp
    pub vest_end: i64,
    pub selling_allowed: bool,

    // The total number of purchased shares in the pool
    pub total_purchased: u64,

    // The total number of assets referred in the pool
    pub total_referred: u64,

    // The total swap fee amount in asset charged to users
    pub total_swap_fees_asset: u64,

    // The total swap fee amount in share charged to users
    pub total_swap_fees_share: u64,

    // Flag to indicate the liquidity pool is closed
    pub closed: bool,

    // Whitelist
    pub whitelist_merkle_root: [u8; 32],
}

/// Account storing the information of the user in the liquidity bootstrapping pool
#[account]
pub struct UserStateInPool {
    pub purchased_shares: u64,
    pub referred_assets: u64,
    pub redeemed_shares: u64,
}

impl UserStateInPool {
    // The size length of the UserStateInPool account
    // purchased_shares(8) + referred_assets(8) + redeemed_shares(8)
    pub const LEN: usize = 8 + 8 + 8;
}
