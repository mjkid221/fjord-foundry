use anchor_spl::token_2022::spl_token_2022::extension::transfer_fee::MAX_FEE_BASIS_POINTS;

pub struct ComputedReservesAndWeights {
    pub asset_reserve: u64,
    pub share_reserve: u64,
    pub asset_weight: u64,
    pub share_weight: u64,
}

pub struct ScaledReserves {
    pub asset_reserve_scaled: u64,
    pub share_reserve_scaled: u64,
}

pub struct FormattedReserves {
    pub asset_weight: u64,
    pub share_weight: u64,
    pub asset_reserve_scaled: u64,
    pub share_reserve_scaled: u64,
}

pub struct PreviewAmountArgs {
    pub assets: u64,
    pub virtual_assets: u64,
    pub asset_token_decimal: u8,
    pub shares: u64,
    pub virtual_shares: u64,
    pub share_token_decimal: u8,
    pub total_purchased: u64,
    pub current_time: i64,
    pub max_share_price: u64,
    pub sale_start_time: i64,
    pub sale_end_time: i64,
    pub start_weight_basis_points: u16,
    pub end_weight_basis_points: u16,
}

pub mod math {
    use super::*;
    use crate::{
        div_wad, get_amount_in, get_amount_out, mul_wad,
        safe_math::{div, mul, safe_add, safe_sub},
        safe_pow, weighted_math_lib, PreviewAmountArgs, SafeMathError,
    };

    pub fn preview_shares_out(
        args: PreviewAmountArgs,
        assets_in: u64,
    ) -> Result<u64, SafeMathError> {
        let FormattedReserves {
            asset_weight,
            share_weight,
            asset_reserve_scaled,
            share_reserve_scaled,
        } = _get_scaled_reserves_and_weights(&args)?;

        let assets_in_scaled = _scale_token(args.asset_token_decimal, assets_in, true)?;
        let mut shares_out = get_amount_out(
            assets_in_scaled,
            asset_reserve_scaled,
            share_reserve_scaled,
            asset_weight,
            share_weight,
        )?;

        if div_wad(assets_in_scaled, shares_out)? > args.max_share_price {
            shares_out = mul_wad(assets_in_scaled, args.max_share_price)?;
        }
        shares_out = _scale_token(args.share_token_decimal, shares_out, false)?;

        Ok(shares_out)
    }

    pub fn preview_assets_in(
        args: PreviewAmountArgs,
        shares_out: u64,
    ) -> Result<u64, SafeMathError> {
        let FormattedReserves {
            asset_weight,
            share_weight,
            asset_reserve_scaled,
            share_reserve_scaled,
        } = _get_scaled_reserves_and_weights(&args)?;

        let shares_out_scaled = _scale_token(args.share_token_decimal, shares_out, true)?;
        let mut assets_in = get_amount_in(
            shares_out_scaled,
            asset_reserve_scaled,
            share_reserve_scaled,
            asset_weight,
            share_weight,
        )?;

        if div_wad(assets_in, shares_out_scaled)? > args.max_share_price {
            assets_in = div_wad(shares_out_scaled, args.max_share_price)?;
        }
        assets_in = _scale_token(args.asset_token_decimal, assets_in, false)?;
        Ok(assets_in)
    }

    pub fn preview_shares_in(
        args: PreviewAmountArgs,
        assets_out: u64,
    ) -> Result<u64, SafeMathError> {
        let FormattedReserves {
            asset_weight,
            share_weight,
            asset_reserve_scaled,
            share_reserve_scaled,
        } = _get_scaled_reserves_and_weights(&args)?;

        let assets_out_scaled = _scale_token(args.asset_token_decimal, assets_out, true)?;

        let mut shares_in = get_amount_in(
            assets_out_scaled,
            share_reserve_scaled,
            asset_reserve_scaled,
            share_weight,
            asset_weight,
        )?;

        if div_wad(assets_out_scaled, shares_in)? > args.max_share_price {
            shares_in = div_wad(assets_out_scaled, args.max_share_price)?;
        }

        shares_in = _scale_token(args.share_token_decimal, shares_in, false)?;
        Ok(shares_in)
    }

    pub fn preview_assets_out(
        args: PreviewAmountArgs,
        shares_in: u64,
    ) -> Result<u64, SafeMathError> {
        let FormattedReserves {
            asset_weight,
            share_weight,
            asset_reserve_scaled,
            share_reserve_scaled,
        } = _get_scaled_reserves_and_weights(&args)?;

        let shares_in_scaled = _scale_token(args.share_token_decimal, shares_in, true)?;
        let mut assets_out = get_amount_out(
            shares_in_scaled,
            share_reserve_scaled,
            asset_reserve_scaled,
            share_weight,
            asset_weight,
        )?;

        if div_wad(assets_out, shares_in_scaled)? > args.max_share_price {
            assets_out = mul_wad(shares_in_scaled, args.max_share_price)?;
        }
        assets_out = _scale_token(args.asset_token_decimal, assets_out, false)?;
        Ok(assets_out)
    }

    fn _get_scaled_reserves_and_weights(
        args: &PreviewAmountArgs,
    ) -> Result<FormattedReserves, SafeMathError> {
        let ComputedReservesAndWeights {
            asset_reserve,
            share_reserve,
            asset_weight,
            share_weight,
        } = compute_reserves_and_weights(args)?;

        let ScaledReserves {
            asset_reserve_scaled,
            share_reserve_scaled,
        } = scaled_reserves(
            args.asset_token_decimal,
            args.share_token_decimal,
            asset_reserve,
            share_reserve,
        )?;

        Ok(FormattedReserves {
            asset_weight,
            share_weight,
            asset_reserve_scaled,
            share_reserve_scaled,
        })
    }

    fn compute_reserves_and_weights(
        args: &PreviewAmountArgs,
    ) -> Result<ComputedReservesAndWeights, SafeMathError> {
        let PreviewAmountArgs {
            assets,
            virtual_assets,
            shares,
            virtual_shares,
            total_purchased,
            current_time,
            sale_start_time,
            sale_end_time,
            start_weight_basis_points,
            end_weight_basis_points,
            asset_token_decimal: _,
            share_token_decimal: _,
            max_share_price: _,
        } = *args;
        let asset_reserve: u64 = safe_sub(assets, virtual_assets)?;
        let share_reserve: u64 = safe_sub(safe_add(shares, virtual_shares)?, total_purchased)?;
        let total_seconds = sale_end_time - sale_start_time;

        let mut seconds_elapsed = 0;
        if current_time > sale_start_time {
            seconds_elapsed = current_time - sale_start_time;
        }
        let asset_weight = weighted_math_lib::linear_interpolation(
            start_weight_basis_points.into(),
            end_weight_basis_points.into(),
            seconds_elapsed.try_into().unwrap(),
            total_seconds.try_into().unwrap(),
        )?;

        let share_weight = MAX_FEE_BASIS_POINTS as u64 - asset_weight;

        Ok(ComputedReservesAndWeights {
            asset_reserve,
            share_reserve,
            asset_weight,
            share_weight,
        })
    }

    fn scaled_reserves(
        asset_token_decimals: u8,
        share_token_decimals: u8,
        asset_reserve: u64,
        share_reserve: u64,
    ) -> Result<ScaledReserves, SafeMathError> {
        Ok(ScaledReserves {
            asset_reserve_scaled: _scale_token(asset_token_decimals, asset_reserve, true)?,
            share_reserve_scaled: _scale_token(share_token_decimals, share_reserve, true)?,
        })
    }

    fn _scale_token(
        token_decimals: u8,
        amount: u64,
        scale_before: bool,
    ) -> Result<u64, SafeMathError> {
        let mut scaled_amount = amount;
        let token_decimals_u64 = u64::from(token_decimals);

        let dec_diff = if token_decimals_u64 < 9 {
            9 - token_decimals_u64
        } else {
            token_decimals_u64 - 9
        };

        // Determine whether to multiply or divide based on `scale_before` flag
        if (token_decimals_u64 < 9 && scale_before) || (token_decimals_u64 > 9 && !scale_before) {
            scaled_amount = mul(scaled_amount, safe_pow(10u64, dec_diff as u32)?)?;
        } else if (token_decimals_u64 < 9 && !scale_before)
            || (token_decimals_u64 > 9 && scale_before)
        {
            scaled_amount = div(scaled_amount, safe_pow(10u64, dec_diff as u32)?)?;
        }

        Ok(scaled_amount)
    }

    pub fn calculate_fee(amount: u64, fee: u16) -> u64 {
        amount * u64::from(fee) / u64::from(MAX_FEE_BASIS_POINTS)
    }
}
