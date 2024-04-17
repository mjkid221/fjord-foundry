use std::cmp::min;

use anchor_spl::token_2022::spl_token_2022::extension::transfer_fee::MAX_FEE_BASIS_POINTS;

use crate::{
    div_wad, div_wad_up, mul_div, mul_wad, mul_wad_up, pow_wad_up, safe_add, safe_sub,
    SafeMathError, MAX_PERCENTAGE_IN, MAX_PERCENTAGE_OUT, WAD,
};

pub fn linear_interpolation(x: u64, y: u64, i: u64, n: u64) -> Result<u64, SafeMathError> {
    // -----------------------------------------------------------------------
    //
    //         ⎛ |x - y| ⎞
    // x ± i ⋅   ─────────
    //         ⎝    n    ⎠
    // -----------------------------------------------------------------------
    if x > y {
        Ok(x - (mul_div(x - y, min(i, n), n))?)
    } else {
        Ok(x + (mul_div(y - x, min(i, n), n))?)
    }
}

/// Calculate the amount of output asset received by providing a specific amount of input asset to the pool.
/// * `amount_in` - The amount of input asset provided.
/// * `reserve_in` - The reserve of the input asset in the pool.
/// * `reserve_out` - The reserve of the output asset in the pool.
/// * `weight_in` - The weight of the input asset in the pool.
/// * `weight_out` - The weight of the output asset in the pool.
pub fn get_amount_out(
    amount_in: u64,
    reserve_in: u64,
    reserve_out: u64,
    weight_in: u64,
    weight_out: u64,
) -> Result<u64, SafeMathError> {
    // -----------------------------------------------------------------------
    //
    //             ⎛                          ⎛weightIn ⎞⎞
    //             ⎜                           ───────── ⎟
    //             ⎜                          ⎝weightOut⎠⎟
    //             ⎜    ⎛      reserveIn     ⎞           ⎟
    // reserveOut ⋅  1 -  ────────────────────
    //             ⎝    ⎝reserveIn + amountIn⎠           ⎠
    // -----------------------------------------------------------------------
    // Assert `amountIn` cannot exceed `MAX_PERCENTAGE_IN`.
    if amount_in
        > mul_div(
            reserve_in,
            MAX_PERCENTAGE_IN as u64,
            MAX_FEE_BASIS_POINTS as u64,
        )?
    {
        Err(SafeMathError::AmountInTooLarge)
    } else {
        Ok(_get_amount_out(
            amount_in,
            reserve_in,
            reserve_out,
            weight_in,
            weight_out,
        )?)
    }
}

/// Calculate the amount of input asset required to get a specific amount of output asset from the pool.
/// * `amount_out` - The amount of output asset desired.
/// * `reserve_in` - The reserve of the input asset in the pool.
/// * `reserve_out` - The reserve of the output asset in the pool.
/// * `weight_in` - The weight of the input asset in the pool.
/// * `weight_out` - The weight of the output asset in the pool.
pub fn get_amount_in(
    amount_out: u64,
    reserve_in: u64,
    reserve_out: u64,
    weight_in: u64,
    weight_out: u64,
) -> Result<u64, SafeMathError> {
    // -----------------------------------------------------------------------
    //
    //             ⎛                          ⎛weightIn ⎞⎞
    //             ⎜                           ───────── ⎟
    //             ⎜                          ⎝weightOut⎠⎟
    //             ⎜    ⎛      reserveOut     ⎞          ⎟
    // reserveIn  ⋅  1 -  ────────────────────
    //             ⎝    ⎝reserveOut - amountIn⎠          ⎠
    // -----------------------------------------------------------------------

    // `MAX_PERCENTAGE_OUT` check ensures `amountOut` is always less than `reserveOut`.
    if amount_out > mul_wad(reserve_out, u64::from(MAX_PERCENTAGE_OUT))? {
        Err(SafeMathError::AmountOutTooLarge)
    } else {
        Ok(_get_amount_in(
            amount_out,
            reserve_in,
            reserve_out,
            weight_in,
            weight_out,
        )?)
    }
}

fn _get_amount_out(
    amount_in: u64,
    reserve_in: u64,
    reserve_out: u64,
    weight_in: u64,
    weight_out: u64,
) -> Result<u64, SafeMathError> {
    mul_wad(
        reserve_out,
        safe_sub(
            WAD,
            pow_wad_up(
                div_wad_up(reserve_in, safe_add(reserve_in, amount_in)?)?,
                div_wad(weight_in, weight_out)?,
            )?,
        )?,
    )
}

fn _get_amount_in(
    amount_out: u64,
    reserve_in: u64,
    reserve_out: u64,
    weight_in: u64,
    weight_out: u64,
) -> Result<u64, SafeMathError> {
    mul_wad_up(
        reserve_in,
        safe_sub(
            pow_wad_up(
                div_wad_up(reserve_out, safe_sub(reserve_out, amount_out)?)?,
                div_wad_up(weight_out, weight_in)?,
            )?,
            WAD,
        )?,
    )
}
