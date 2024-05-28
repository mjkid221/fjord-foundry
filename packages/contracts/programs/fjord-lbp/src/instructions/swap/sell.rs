use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::{
    math::{calculate_fee, preview_assets_out, preview_shares_in},
    safe_math, standard_checks, transfer_tokens_from, LiquidityBootstrappingPool, OwnerConfig,
    PoolError, PreviewAmountArgs, Sell, SwapTokens, UserStateInPool,
};

/// Swap a specific number of shares for a maximum amount of assets.
/// This function allows users to exchange a certain number of shares for assets,
/// ensuring that they receive no more than the specified maximum amount of assets.
/// *`assetsOut` - The maximum amount of assets allowed to be received.
/// *`maxSharesIn` - The number of shares to be exchanged for assets.
/// *`recipient` - The address to receive the assets.
/// *`proof` - The Merkle proof for whitelisting.
#[access_control(standard_checks::before_token_swap(&ctx, merkle_proof, true))]
pub fn swap_shares_for_exact_assets(
    ctx: Context<SwapTokens>,
    assets_out: u64,
    max_shares_in: u64,
    merkle_proof: Option<Vec<[u8; 32]>>,
    _referrer: Option<Pubkey>,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let pool_asset_token_account = &mut ctx.accounts.pool_asset_token_account;
    let pool_share_token_account = &mut ctx.accounts.pool_share_token_account;

    let mut shares_in = preview_shares_in(
        PreviewAmountArgs {
            assets: pool_asset_token_account.amount,
            virtual_assets: pool.virtual_assets,
            asset_token_decimal: ctx.accounts.asset_token_mint.decimals,
            shares: pool_share_token_account.amount,
            virtual_shares: pool.virtual_shares,
            share_token_decimal: ctx.accounts.share_token_mint.decimals,
            current_time: Clock::get()?.unix_timestamp,
            total_purchased: pool.total_purchased,
            max_share_price: pool.max_share_price,
            sale_start_time: pool.sale_start_time,
            sale_end_time: pool.sale_end_time,
            start_weight_basis_points: pool.start_weight_basis_points,
            end_weight_basis_points: pool.end_weight_basis_points,
            total_swap_fees_asset: pool.total_swap_fees_asset,
            total_swap_fees_share: pool.total_swap_fees_share,
        },
        assets_out,
    )?;
    let swap_fees = calculate_fee(shares_in, ctx.accounts.config.swap_fee);
    shares_in = safe_math::safe_add(shares_in, swap_fees)?;
    pool.total_swap_fees_share = safe_math::safe_add(pool.total_swap_fees_share, swap_fees)?;

    if shares_in > max_shares_in {
        return Err(PoolError::SlippageExceeded.into());
    }

    _swap_shares_for_assets(
        pool,
        &mut ctx.accounts.user_state_in_pool,
        &mut ctx.accounts.config,
        &ctx.accounts.user_asset_token_account,
        pool_asset_token_account,
        &mut ctx.accounts.user,
        &ctx.accounts.token_program,
        assets_out,
        shares_in,
        pool_asset_token_account.amount,
        pool_share_token_account.amount,
        swap_fees,
    )?;
    Ok(())
}

/// Swap a specific number of shares for a minimum amount of assets.
/// This function allows users to exchange a certain number of shares for assets,
/// ensuring that they receive at least the specified minimum amount of assets.
/// * `sharesIn` - The number of shares to be exchanged for assets.
/// * `minAssetsOut` - The minimum amount of assets expected to be received.
/// * `recipient` -  The address to receive the assets.
/// * `proof` -  The Merkle proof for whitelisting.
#[access_control(standard_checks::before_token_swap(&ctx, merkle_proof, true))]
pub fn swap_exact_shares_for_assets(
    ctx: Context<SwapTokens>,
    shares_in: u64,
    min_assets_out: u64,
    merkle_proof: Option<Vec<[u8; 32]>>,
    _referrer: Option<Pubkey>,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let pool_asset_token_account = &mut ctx.accounts.pool_asset_token_account;
    let pool_share_token_account = &mut ctx.accounts.pool_share_token_account;

    let swap_fees = calculate_fee(shares_in, ctx.accounts.config.swap_fee);
    pool.total_swap_fees_share = safe_math::safe_add(pool.total_swap_fees_share, swap_fees)?;

    let assets_out = preview_assets_out(
        PreviewAmountArgs {
            assets: pool_asset_token_account.amount,
            virtual_assets: pool.virtual_assets,
            asset_token_decimal: ctx.accounts.asset_token_mint.decimals,
            shares: pool_share_token_account.amount,
            virtual_shares: pool.virtual_shares,
            share_token_decimal: ctx.accounts.share_token_mint.decimals,
            total_purchased: pool.total_purchased,
            max_share_price: pool.max_share_price,
            current_time: Clock::get()?.unix_timestamp,
            sale_start_time: pool.sale_start_time,
            sale_end_time: pool.sale_end_time,
            start_weight_basis_points: pool.start_weight_basis_points,
            end_weight_basis_points: pool.end_weight_basis_points,
            total_swap_fees_asset: pool.total_swap_fees_asset,
            total_swap_fees_share: pool.total_swap_fees_share,
        },
        safe_math::safe_sub(shares_in, swap_fees)?,
    )?;

    if assets_out < min_assets_out {
        return Err(PoolError::SlippageExceeded.into());
    }

    _swap_shares_for_assets(
        pool,
        &mut ctx.accounts.user_state_in_pool,
        &mut ctx.accounts.config,
        &ctx.accounts.user_asset_token_account,
        pool_asset_token_account,
        &mut ctx.accounts.user,
        &ctx.accounts.token_program,
        assets_out,
        shares_in,
        pool_asset_token_account.amount,
        pool_share_token_account.amount,
        swap_fees,
    )?;

    Ok(())
}

#[allow(clippy::too_many_arguments)]
fn _swap_shares_for_assets<'info>(
    pool: &mut Account<'info, LiquidityBootstrappingPool>,
    user_state_in_pool: &mut Account<'info, UserStateInPool>,
    _global_pool_config: &mut Account<'info, OwnerConfig>,
    user_asset_token_account: &Account<'info, TokenAccount>,
    pool_asset_token_account: &mut Account<'info, TokenAccount>,
    user: &mut Signer<'info>,
    token_program: &Program<'info, Token>,
    assets_out: u64,
    shares_in: u64,
    assets: u64,
    shares: u64,
    swap_fees: u64,
) -> Result<()> {
    if assets >= pool.max_assets_in {
        return Err(PoolError::AssetsInExceeded.into());
    }

    let total_purchased_before = pool.total_purchased;

    if total_purchased_before >= pool.max_shares_out || total_purchased_before >= shares {
        return Err(PoolError::SharesOutExceeded.into());
    }

    user_state_in_pool.purchased_shares =
        safe_math::safe_sub(user_state_in_pool.purchased_shares, shares_in)?;
    pool.total_purchased = safe_math::safe_sub(total_purchased_before, shares_in)?;

    transfer_tokens_from(
        token_program.to_account_info(),
        pool_asset_token_account.to_account_info(),
        user_asset_token_account.to_account_info(),
        pool.to_account_info(),
        &[
            pool.share_token.as_ref(),
            pool.asset_token.as_ref(),
            pool.creator.as_ref(),
            &[pool.bump],
        ],
        assets_out,
    )?;

    emit!(Sell {
        user: user.key(),
        shares: shares_in,
        assets: assets_out,
        swap_fee: swap_fees,
    });

    Ok(())
}
