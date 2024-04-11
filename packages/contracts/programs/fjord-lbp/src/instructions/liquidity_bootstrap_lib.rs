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

pub struct PreviewAmountArgs {
    pub assets: u64,
    pub virtual_assets: u64,
    pub asset_token_decimal: u8,
    pub shares: u64,
    pub virtual_shares: u64,
    pub share_token_decimal: u8,
    pub total_purchased: u64,
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
        safe_pow, weighted_math_lib, SafeMathError, WAD,
    };

    pub fn preview_shares_out(
        args: PreviewAmountArgs,
        assets_in: u64,
    ) -> Result<u64, SafeMathError> {
        let PreviewAmountArgs {
            assets: _,
            virtual_assets: _,
            asset_token_decimal,
            shares: _,
            virtual_shares: _,
            share_token_decimal,
            total_purchased: _,
            max_share_price,
            sale_start_time: _,
            sale_end_time: _,
            start_weight_basis_points: _,
            end_weight_basis_points: _,
        } = args;

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
            asset_token_decimal,
            share_token_decimal,
            asset_reserve,
            share_reserve,
        )?;

        let assets_in_scaled = _scale_token(asset_token_decimal, assets_in, true)?;

        let mut shares_out = get_amount_out(
            assets_in_scaled,
            asset_reserve_scaled,
            share_reserve_scaled,
            asset_weight,
            share_weight,
        )?;

        if div_wad(assets_in_scaled, shares_out)? > max_share_price {
            shares_out = mul_wad(assets_in_scaled, max_share_price)?;
        }

        shares_out = _scale_token(share_token_decimal, shares_out, false)?;

        Ok(shares_out)
    }

    pub fn preview_assets_in(
        args: PreviewAmountArgs,
        shares_out: u64,
    ) -> Result<u64, SafeMathError> {
        let PreviewAmountArgs {
            assets: _,
            virtual_assets: _,
            asset_token_decimal,
            shares: _,
            virtual_shares: _,
            share_token_decimal,
            total_purchased: _,
            max_share_price,
            sale_start_time: _,
            sale_end_time: _,
            start_weight_basis_points: _,
            end_weight_basis_points: _,
        } = args;

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
            asset_token_decimal,
            share_token_decimal,
            asset_reserve,
            share_reserve,
        )?;

        let shares_out_scaled = _scale_token(share_token_decimal, shares_out, true)?;

        let mut assets_in = get_amount_in(
            shares_out_scaled,
            asset_reserve_scaled,
            share_reserve_scaled,
            asset_weight,
            share_weight,
        )?;

        if div_wad(assets_in, shares_out_scaled)? > max_share_price {
            assets_in = div_wad(shares_out_scaled, max_share_price)?;
        }

        assets_in = _scale_token(asset_token_decimal, assets_in, false)?;

        Ok(assets_in)
    }

    fn compute_reserves_and_weights(
        args: PreviewAmountArgs,
    ) -> Result<ComputedReservesAndWeights, SafeMathError> {
        let PreviewAmountArgs {
            assets,
            virtual_assets,
            shares,
            virtual_shares,
            total_purchased,
            sale_start_time,
            sale_end_time,
            start_weight_basis_points,
            end_weight_basis_points,
            asset_token_decimal: _,
            share_token_decimal: _,
            max_share_price: _,
        } = args;

        let asset_reserve: u64 = safe_sub(assets, virtual_assets)?;
        let share_reserve: u64 = safe_sub(safe_add(shares, virtual_shares)?, total_purchased)?;

        let total_seconds = sale_end_time - sale_start_time;
        let seconds_elapsed = 0;
        let asset_weight = weighted_math_lib::linear_interpolation(
            start_weight_basis_points.into(),
            end_weight_basis_points.into(),
            seconds_elapsed,
            total_seconds.try_into().unwrap(),
        )?;

        let share_weight = WAD - asset_weight;

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
        if (token_decimals_u64 < 9 && scale_before) || (token_decimals_u64 >= 9 && !scale_before) {
            scaled_amount = mul(scaled_amount, safe_pow(10u64, dec_diff as u32)?)?;
        } else {
            scaled_amount = div(scaled_amount, safe_pow(10u64, dec_diff as u32)?)?;
        }

        Ok(scaled_amount)
    }
}
