use anchor_lang::prelude::*;

// Accounts
#[account]
pub struct LiquidityBootstrappingPool {
    // Collateral token
    pub asset_token: Pubkey,
    // Project token
    pub share_token: Pubkey,
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

    pub whitelist_merkle_root: [u8; 32],
}