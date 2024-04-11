use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;
pub mod utils;
pub use constants::*;
pub use error::*;
pub use events::*;
pub use instructions::*;
pub use state::*;
pub use utils::*;

// Program Id for the Fjord LBP program. This is the address this program will be deployed to.
declare_id!("9yf45kAVeaaaAqBewB6fLX4ie5qBC2vWwqiBhNQayvWq");

#[program]
pub mod fjord_lbp {
    use super::*;

    // Initializer --------------------------------------------------------
    pub fn initialize_owner_config(
        ctx: Context<InitializeOwner>,
        owner_key: Pubkey,
        fee_recipient: Pubkey,
        platform_fee: u16,
        referral_fee: u16,
        swap_fee: u16,
    ) -> Result<()> {
        ownable::initializer::initialize_owner_config(
            ctx,
            owner_key,
            fee_recipient,
            platform_fee,
            referral_fee,
            swap_fee,
        )
    }

    // Pool Creation ------------------------------------------------------
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
        selling_allowed: Option<bool>,
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
            selling_allowed,
        )
    }

    // Buy functions ------------------------------------------------------
    pub fn swap_exact_assets_for_shares(
        ctx: Context<SwapTokens>,
        shares_out: u64,
        max_assets_in: u64,
        merkle_proof: Option<Vec<[u8; 32]>>,
        referrer: Option<Pubkey>,
    ) -> Result<()> {
        swap::buy::swap_assets_for_exact_shares(
            ctx,
            shares_out,
            max_assets_in,
            merkle_proof,
            referrer,
        )
    }

    pub fn swap_assets_for_exact_shares(
        ctx: Context<SwapTokens>,
        shares_out: u64,
        max_assets_in: u64,
        merkle_proof: Option<Vec<[u8; 32]>>,
        referrer: Option<Pubkey>,
    ) -> Result<()> {
        swap::buy::swap_assets_for_exact_shares(
            ctx,
            shares_out,
            max_assets_in,
            merkle_proof,
            referrer,
        )
    }

    // Fee setter ---------------------------------------------------------
    pub fn set_fees(
        ctx: Context<OnlyOwner>,
        fee_recipient: Option<Pubkey>,
        platform_fee: Option<u16>,
        referral_fee: Option<u16>,
        swap_fee: Option<u16>,
    ) -> Result<()> {
        setter::set_fees(ctx, fee_recipient, platform_fee, referral_fee, swap_fee)
    }

    // Access controls ----------------------------------------------------
    pub fn nominate_new_owner(ctx: Context<OnlyOwner>, new_owner_key: Pubkey) -> Result<()> {
        ownable::access_control::nominate_new_owner(ctx, new_owner_key)
    }

    pub fn accept_new_owner(ctx: Context<AcceptOwner>) -> Result<()> {
        ownable::access_control::accept_owner(ctx)
    }
}
