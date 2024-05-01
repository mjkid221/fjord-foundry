use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{
    math::{calculate_fee, preview_assets_in, preview_shares_out},
    safe_math, standard_checks, Buy, LiquidityBootstrappingPool, OwnerConfig, PoolError,
    PreviewAmountArgs, SwapTokens, UserStateInPool,
};

/// Swap a specific amount of assets for a minimum number of shares with a referrer and Merkle proof.
/// This function allows users to exchange a certain number of shares for assets
/// while specifying a referrer, ensuring that they receive no more than the specified maximum
/// * `ctx` - The program context
/// * `assets_in` - The number of assets to be swapped for the shares
/// * `min_shares_out` - The minimum number of shares expected to be received
/// * `merkle_proof` - The Merkle proof for the whitelist
/// * `referrer` - The referrer's public key (optional)
#[access_control(standard_checks::before_token_swap(&ctx, merkle_proof, false))]
pub fn swap_exact_assets_for_shares(
    ctx: Context<SwapTokens>,
    assets_in: u64,
    min_shares_out: u64,
    merkle_proof: Option<Vec<[u8; 32]>>,
    _referrer: Option<Pubkey>,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let pool_asset_token_account = &mut ctx.accounts.pool_asset_token_account;
    let pool_share_token_account = &mut ctx.accounts.pool_share_token_account;

    let swap_fees = calculate_fee(assets_in, ctx.accounts.config.swap_fee);
    pool.total_swap_fees_asset += swap_fees;

    let shares_out = preview_shares_out(
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
        },
        safe_math::safe_sub(assets_in, swap_fees)?,
    )?;

    if shares_out < min_shares_out {
        return Err(PoolError::SlippageExceeded.into());
    }

    _swap_assets_for_shares(
        pool,
        &mut ctx.accounts.user_state_in_pool,
        &mut ctx.accounts.config,
        &ctx.accounts.user_asset_token_account,
        pool_asset_token_account,
        &mut ctx.accounts.user,
        &ctx.accounts.token_program,
        assets_in,
        shares_out,
        pool_asset_token_account.amount,
        pool_share_token_account.amount,
        swap_fees,
        &mut ctx.accounts.referrer_state_in_pool,
    )?;

    Ok(())
}

/// Swap a specific amount of shares for a maximum number of assets with a referrer and Merkle proof.
/// This function allows users to exchange a certain number of shares for assets
/// while specifying a referrer, ensuring that they receive no more than the specified maximum
/// * `ctx` - The program context
/// * `shares_out` - The number of shares to be swapped for the asset
/// * `max_assets_in` - The maximum number of assets to be used for the exchange
/// * `merkle_proof` - The Merkle proof for the whitelist
/// * `referrer` - The referrer's public key (optional)
///
#[access_control(standard_checks::before_token_swap(&ctx, merkle_proof, false))]
pub fn swap_assets_for_exact_shares(
    ctx: Context<SwapTokens>,
    shares_out: u64,
    max_assets_in: u64,
    merkle_proof: Option<Vec<[u8; 32]>>,
    _referrer: Option<Pubkey>,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let pool_asset_token_account = &mut ctx.accounts.pool_asset_token_account;
    let pool_share_token_account = &mut ctx.accounts.pool_share_token_account;

    let mut assets_in = preview_assets_in(
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
        },
        shares_out,
    )?;
    let swap_fees = calculate_fee(assets_in, ctx.accounts.config.swap_fee);
    assets_in += swap_fees;
    pool.total_swap_fees_asset += swap_fees;

    if assets_in > max_assets_in {
        return Err(PoolError::SlippageExceeded.into());
    }

    _swap_assets_for_shares(
        pool,
        &mut ctx.accounts.user_state_in_pool,
        &mut ctx.accounts.config,
        &ctx.accounts.user_asset_token_account,
        pool_asset_token_account,
        &mut ctx.accounts.user,
        &ctx.accounts.token_program,
        assets_in,
        shares_out,
        pool_asset_token_account.amount,
        pool_share_token_account.amount,
        swap_fees,
        &mut ctx.accounts.referrer_state_in_pool,
    )?;

    Ok(())
}

#[allow(clippy::too_many_arguments)]
fn _swap_assets_for_shares<'info>(
    pool: &mut Account<'info, LiquidityBootstrappingPool>,
    user_state_in_pool: &mut Account<'info, UserStateInPool>,
    global_pool_config: &mut Account<'info, OwnerConfig>,
    user_asset_token_account: &Account<'info, TokenAccount>,
    pool_asset_token_account: &mut Account<'info, TokenAccount>,
    user: &mut Signer<'info>,
    token_program: &Program<'info, Token>,
    assets_in: u64,
    shares_out: u64,
    assets: u64,
    shares: u64,
    swap_fees: u64,
    referrer_state_in_pool: &mut Option<Account<'info, UserStateInPool>>,
) -> Result<()> {
    if assets + assets_in - swap_fees >= pool.max_assets_in {
        return Err(PoolError::AssetsInExceeded.into());
    }

    // Transfer assets from user to pool
    let asset_transfer_instruction = Transfer {
        from: user_asset_token_account.to_account_info(),
        to: pool_asset_token_account.to_account_info(),
        authority: user.to_account_info(),
    };
    let asset_cpi_ctx =
        CpiContext::new(token_program.to_account_info(), asset_transfer_instruction);
    token::transfer(asset_cpi_ctx, assets_in)?;

    let total_purchased_after: u64 = pool.total_purchased + shares_out;
    if (total_purchased_after >= pool.max_shares_out) || (total_purchased_after >= shares) {
        return Err(PoolError::SharesOutExceeded.into());
    }
    pool.total_purchased = total_purchased_after;
    user_state_in_pool.purchased_shares += shares_out;

    match referrer_state_in_pool.as_mut() {
        Some(referrer_state) if global_pool_config.referral_fee != 0 => {
            let assets_referred = calculate_fee(assets_in, global_pool_config.referral_fee);
            pool.total_referred += assets_referred;
            referrer_state.referred_assets += assets_referred;
        }
        _ => {}
    }

    emit!(Buy {
        user: user.key(),
        assets: assets_in,
        shares: shares_out,
        swap_fee: swap_fees,
    });

    Ok(())
}
