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
declare_id!("7UTvQUzE1iThaXhXDg1FsVoqcv3MBAgwUCW7PEKzNbPH");

#[program]
pub mod fjord_lbp {
    use super::*;
    use instructions::structs::ComputedReservesAndWeights;

    // Initializer --------------------------------------------------------
    #[allow(clippy::too_many_arguments)]
    pub fn initialize_owner_config(
        ctx: Context<InitializeOwner>,
        owner_key: Pubkey,
        swap_fee_recipient: Pubkey,
        fee_recipients: Vec<Pubkey>,
        fee_percentages: Vec<u16>,
        platform_fee: u16,
        referral_fee: u16,
        swap_fee: u16,
    ) -> Result<()> {
        ownable::initializer::initialize_owner_config(
            ctx,
            owner_key,
            swap_fee_recipient,
            fee_recipients,
            fee_percentages,
            platform_fee,
            referral_fee,
            swap_fee,
        )
    }

    // Pool Creation ------------------------------------------------------
    #[allow(clippy::too_many_arguments)]
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        salt: String,
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
        selling_allowed: bool,
    ) -> Result<()> {
        initialize_pool::create_pool(
            ctx,
            salt,
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
        assets_in: u64,
        min_shares_out: u64,
        merkle_proof: Option<Vec<[u8; 32]>>,
        referrer: Option<Pubkey>,
    ) -> Result<()> {
        swap::buy::swap_exact_assets_for_shares(
            ctx,
            assets_in,
            min_shares_out,
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

    // Sell functions -----------------------------------------------------
    pub fn swap_exact_shares_for_assets(
        ctx: Context<SwapTokens>,
        shares_in: u64,
        min_assets_out: u64,
        merkle_proof: Option<Vec<[u8; 32]>>,
        referrer: Option<Pubkey>,
    ) -> Result<()> {
        swap::sell::swap_exact_shares_for_assets(
            ctx,
            shares_in,
            min_assets_out,
            merkle_proof,
            referrer,
        )
    }

    pub fn swap_shares_for_exact_assets(
        ctx: Context<SwapTokens>,
        assets_out: u64,
        max_shares_in: u64,
        merkle_proof: Option<Vec<[u8; 32]>>,
        referrer: Option<Pubkey>,
    ) -> Result<()> {
        swap::sell::swap_shares_for_exact_assets(
            ctx,
            assets_out,
            max_shares_in,
            merkle_proof,
            referrer,
        )
    }

    // Redemption functions -----------------------------------------------
    pub fn close_pool<'info>(ctx: Context<'_, '_, '_, 'info, ClosePool<'info>>) -> Result<()> {
        redemption::close_pool(ctx)
    }

    pub fn redeem(ctx: Context<RedeemTokens>, referred: bool) -> Result<()> {
        redemption::redeem(ctx, referred)
    }

    // View functions -----------------------------------------------------
    pub fn preview_assets_in(ctx: Context<ReturnPreviewContext>, shares_out: u64) -> Result<u64> {
        let mut assets_in = math::preview_assets_in(
            PreviewAmountArgs {
                assets: ctx.accounts.pool_asset_token_account.amount,
                virtual_assets: ctx.accounts.pool.virtual_assets,
                asset_token_decimal: ctx.accounts.asset_token_mint.decimals,
                shares: ctx.accounts.pool_share_token_account.amount,
                virtual_shares: ctx.accounts.pool.virtual_shares,
                share_token_decimal: ctx.accounts.share_token_mint.decimals,
                total_purchased: ctx.accounts.pool.total_purchased,
                max_share_price: ctx.accounts.pool.max_share_price,
                current_time: Clock::get()?.unix_timestamp,
                sale_start_time: ctx.accounts.pool.sale_start_time,
                sale_end_time: ctx.accounts.pool.sale_end_time,
                start_weight_basis_points: ctx.accounts.pool.start_weight_basis_points,
                end_weight_basis_points: ctx.accounts.pool.end_weight_basis_points,
                total_swap_fees_asset: ctx.accounts.pool.total_swap_fees_asset,
                total_swap_fees_share: ctx.accounts.pool.total_swap_fees_share,
            },
            shares_out,
        )?;
        assets_in = safe_math::safe_add(
            assets_in,
            math::calculate_fee(assets_in, ctx.accounts.config.swap_fee),
        )?;
        emit!(PreviewAssetsIn { assets_in });
        Ok(assets_in)
    }

    pub fn preview_shares_in(ctx: Context<ReturnPreviewContext>, assets_out: u64) -> Result<u64> {
        let mut shares_in = math::preview_shares_in(
            PreviewAmountArgs {
                assets: ctx.accounts.pool_asset_token_account.amount,
                virtual_assets: ctx.accounts.pool.virtual_assets,
                asset_token_decimal: ctx.accounts.asset_token_mint.decimals,
                shares: ctx.accounts.pool_share_token_account.amount,
                virtual_shares: ctx.accounts.pool.virtual_shares,
                share_token_decimal: ctx.accounts.share_token_mint.decimals,
                total_purchased: ctx.accounts.pool.total_purchased,
                max_share_price: ctx.accounts.pool.max_share_price,
                current_time: Clock::get()?.unix_timestamp,
                sale_start_time: ctx.accounts.pool.sale_start_time,
                sale_end_time: ctx.accounts.pool.sale_end_time,
                start_weight_basis_points: ctx.accounts.pool.start_weight_basis_points,
                end_weight_basis_points: ctx.accounts.pool.end_weight_basis_points,
                total_swap_fees_asset: ctx.accounts.pool.total_swap_fees_asset,
                total_swap_fees_share: ctx.accounts.pool.total_swap_fees_share,
            },
            assets_out,
        )?;
        shares_in = safe_math::safe_add(
            shares_in,
            math::calculate_fee(shares_in, ctx.accounts.config.swap_fee),
        )?;
        emit!(PreviewSharesIn { shares_in });
        Ok(shares_in)
    }

    pub fn preview_shares_out(ctx: Context<ReturnPreviewContext>, assets_in: u64) -> Result<u64> {
        let shares_out = math::preview_shares_out(
            PreviewAmountArgs {
                assets: ctx.accounts.pool_asset_token_account.amount,
                virtual_assets: ctx.accounts.pool.virtual_assets,
                asset_token_decimal: ctx.accounts.asset_token_mint.decimals,
                shares: ctx.accounts.pool_share_token_account.amount,
                virtual_shares: ctx.accounts.pool.virtual_shares,
                share_token_decimal: ctx.accounts.share_token_mint.decimals,
                total_purchased: ctx.accounts.pool.total_purchased,
                max_share_price: ctx.accounts.pool.max_share_price,
                current_time: Clock::get()?.unix_timestamp,
                sale_start_time: ctx.accounts.pool.sale_start_time,
                sale_end_time: ctx.accounts.pool.sale_end_time,
                start_weight_basis_points: ctx.accounts.pool.start_weight_basis_points,
                end_weight_basis_points: ctx.accounts.pool.end_weight_basis_points,
                total_swap_fees_asset: ctx.accounts.pool.total_swap_fees_asset,
                total_swap_fees_share: ctx.accounts.pool.total_swap_fees_share,
            },
            safe_math::safe_sub(
                assets_in,
                math::calculate_fee(assets_in, ctx.accounts.config.swap_fee),
            )?,
        )?;
        emit!(PreviewSharesOut { shares_out });
        Ok(shares_out)
    }

    pub fn preview_assets_out(ctx: Context<ReturnPreviewContext>, shares_in: u64) -> Result<u64> {
        let assets_out = math::preview_assets_out(
            PreviewAmountArgs {
                assets: ctx.accounts.pool_asset_token_account.amount,
                virtual_assets: ctx.accounts.pool.virtual_assets,
                asset_token_decimal: ctx.accounts.asset_token_mint.decimals,
                shares: ctx.accounts.pool_share_token_account.amount,
                virtual_shares: ctx.accounts.pool.virtual_shares,
                share_token_decimal: ctx.accounts.share_token_mint.decimals,
                total_purchased: ctx.accounts.pool.total_purchased,
                max_share_price: ctx.accounts.pool.max_share_price,
                current_time: Clock::get()?.unix_timestamp,
                sale_start_time: ctx.accounts.pool.sale_start_time,
                sale_end_time: ctx.accounts.pool.sale_end_time,
                start_weight_basis_points: ctx.accounts.pool.start_weight_basis_points,
                end_weight_basis_points: ctx.accounts.pool.end_weight_basis_points,
                total_swap_fees_asset: ctx.accounts.pool.total_swap_fees_asset,
                total_swap_fees_share: ctx.accounts.pool.total_swap_fees_share,
            },
            safe_math::safe_sub(
                shares_in,
                math::calculate_fee(shares_in, ctx.accounts.config.swap_fee),
            )?,
        )?;
        emit!(PreviewAssetsOut { assets_out });
        Ok(assets_out)
    }

    pub fn reserves_and_weights(
        ctx: Context<ReturnPreviewContext>,
    ) -> Result<ComputedReservesAndWeights> {
        let reserves_and_weights = math::compute_reserves_and_weights(&PreviewAmountArgs {
            assets: ctx.accounts.pool_asset_token_account.amount,
            virtual_assets: ctx.accounts.pool.virtual_assets,
            asset_token_decimal: ctx.accounts.asset_token_mint.decimals,
            shares: ctx.accounts.pool_share_token_account.amount,
            virtual_shares: ctx.accounts.pool.virtual_shares,
            share_token_decimal: ctx.accounts.share_token_mint.decimals,
            total_purchased: ctx.accounts.pool.total_purchased,
            max_share_price: ctx.accounts.pool.max_share_price,
            current_time: Clock::get()?.unix_timestamp,
            sale_start_time: ctx.accounts.pool.sale_start_time,
            sale_end_time: ctx.accounts.pool.sale_end_time,
            start_weight_basis_points: ctx.accounts.pool.start_weight_basis_points,
            end_weight_basis_points: ctx.accounts.pool.end_weight_basis_points,
            total_swap_fees_asset: ctx.accounts.pool.total_swap_fees_asset,
            total_swap_fees_share: ctx.accounts.pool.total_swap_fees_share,
        })?;
        let ComputedReservesAndWeights {
            asset_reserve,
            share_reserve,
            asset_weight,
            share_weight,
        } = reserves_and_weights;

        emit!(ReservesAndWeights {
            asset_reserve,
            share_reserve,
            asset_weight,
            share_weight,
        });
        Ok(reserves_and_weights)
    }

    // Pool Management ----------------------------------------------------
    pub fn toggle_pause(ctx: Context<OnlyPoolCreator>) -> Result<()> {
        pool_management::toggle_pause(ctx)
    }

    // Owner Authority Controls -------------------------------------------
    pub fn set_fees(
        ctx: Context<FeeConfig>,
        platform_fee: Option<u16>,
        referral_fee: Option<u16>,
        swap_fee: Option<u16>,
    ) -> Result<()> {
        setter::set_fees(ctx, platform_fee, referral_fee, swap_fee)
    }

    pub fn set_treasury_fee_recipients(
        ctx: Context<TreasuryFeeRecipientConfig>,
        swap_fee_recipient: Option<Pubkey>,
        fee_recipients: Vec<Pubkey>,
        fee_percentages: Vec<u16>,
    ) -> Result<()> {
        setter::set_fee_recipients(ctx, swap_fee_recipient, fee_recipients, fee_percentages)
    }

    pub fn nominate_new_owner(ctx: Context<OnlyOwner>, new_owner_key: Pubkey) -> Result<()> {
        ownable::access_control::nominate_new_owner(ctx, new_owner_key)
    }

    pub fn accept_new_owner(ctx: Context<AcceptOwner>) -> Result<()> {
        ownable::access_control::accept_owner(ctx)
    }
}
