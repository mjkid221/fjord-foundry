use anchor_lang::prelude::*;

pub mod error;
pub mod events;
pub mod constants;
pub mod instructions;
pub mod state;
pub use error::*;
pub use events::*;
pub use constants::*;
pub use instructions::*;
pub use state::*;

// Program Id for the Fjord LBP program. This is the address this program will be deployed to.
declare_id!("fjorR4ubuG42xkRUF6SrA1hKkb1T4LqgfupE1mPLK4K");

#[program]
pub mod fjord_lbp {
    use super::*;
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        assets: u64,
        shares: u64,
        virtual_assets: u64,
        virtual_shares: u64,
        max_share_price: u64,
        max_shares_out: u64,
        max_assets_in: u64,
        start_weight_basis_points: u16,
        end_weight_basis_points: u16,
        sale_start_time: i64,
        sale_end_time: i64,
        vest_cliff: i64,
        vest_end: i64,
        whitelist_merkle_root: [u8; 32],
        selling_allowed: Option<bool>
      ) -> Result<()> {
        initialize_pool::create_pool(
            ctx, 
            assets, 
            shares, 
            virtual_assets, 
            virtual_shares, 
            max_share_price, 
            max_shares_out, 
            max_assets_in, 
            start_weight_basis_points, 
            end_weight_basis_points, 
            sale_start_time, 
            sale_end_time, 
            vest_cliff, 
            vest_end, 
            whitelist_merkle_root, 
            selling_allowed
        )
      }
}
