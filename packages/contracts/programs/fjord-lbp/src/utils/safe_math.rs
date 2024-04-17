use solana_program::msg;

use crate::SafeMathError;

/**
 * Clarification: WAD is usually an Ethereum term for 1e18 in Math Libraries.
 * In this context, it is being used to represent 1e9, a standard decimals in Solana.
 * It is just used for consistency across Fjord's codebase.
 */
pub const WAD: u64 = 1_000_000_000;

/**
 * (x * y)/WAD
 */
pub fn mul_wad(x: u64, y: u64) -> Result<u64, SafeMathError> {
    let xy = u128::from(x)
        .checked_mul(u128::from(y))
        .ok_or(SafeMathError::MultiplicationOverflow)?;
    let z = xy
        .checked_div(u128::from(WAD))
        .ok_or(SafeMathError::DivisionUnderflow)?;

    u64::try_from(z).map_err(|_| SafeMathError::ConversionOverflow)
}

/**
 * (x * y)/WAD but rounded up
 */
pub fn mul_wad_up(x: u64, y: u64) -> Result<u64, SafeMathError> {
    let xy = u128::from(x)
        .checked_mul(u128::from(y))
        .ok_or(SafeMathError::MultiplicationOverflow)?;
    // Add WAD-1 before division to ensure rounding up
    let z = xy
        .checked_add(u128::from(WAD) - 1)
        .ok_or(SafeMathError::AdditionOverflow)?
        .checked_div(u128::from(WAD))
        .ok_or(SafeMathError::DivisionUnderflow)?;

    u64::try_from(z).map_err(|_| SafeMathError::ConversionOverflow)
}

/**
 * x / y
 */
pub fn div(x: u64, y: u64) -> Result<u64, SafeMathError> {
    let z = x.checked_div(y).ok_or(SafeMathError::DivisionUnderflow)?;
    Ok(z)
}

/**
 * x * y
 */
pub fn mul(x: u64, y: u64) -> Result<u64, SafeMathError> {
    let z = x
        .checked_mul(y)
        .ok_or(SafeMathError::MultiplicationOverflow)?;
    Ok(z)
}

/**
 * (x * WAD)/y
 */
pub fn div_wad(x: u64, y: u64) -> Result<u64, SafeMathError> {
    let xy = u128::from(x)
        .checked_mul(u128::from(WAD))
        .ok_or(SafeMathError::MultiplicationOverflow)?;
    let z = xy
        .checked_div(u128::from(y))
        .ok_or(SafeMathError::DivisionUnderflow)?;
    u64::try_from(z).map_err(|_| SafeMathError::ConversionOverflow)
}

/**
 * (x * WAD)/y but rounded up
 */
pub fn div_wad_up(x: u64, y: u64) -> Result<u64, SafeMathError> {
    let xy = u128::from(x)
        .checked_mul(u128::from(WAD))
        .ok_or(SafeMathError::MultiplicationOverflow)?;
    // Add y-1 before division to ensure rounding up
    let z = xy
        .checked_add(u128::from(y) - 1)
        .ok_or(SafeMathError::AdditionOverflow)?
        .checked_div(u128::from(y))
        .ok_or(SafeMathError::DivisionUnderflow)?;
    u64::try_from(z).map_err(|_| SafeMathError::ConversionOverflow)
}

/**
 * x + y
 */
pub fn safe_add(x: u64, y: u64) -> Result<u64, SafeMathError> {
    let z = x.checked_add(y).ok_or(SafeMathError::AdditionOverflow)?;
    Ok(z)
}

/**
 * x - y
 */
pub fn safe_sub(x: u64, y: u64) -> Result<u64, SafeMathError> {
    let z = x
        .checked_sub(y)
        .ok_or(SafeMathError::SubtractionUnderflow)?;
    Ok(z)
}

/**
 * (x * y)/z
 */
pub fn mul_div(x: u64, y: u64, z: u64) -> Result<u64, SafeMathError> {
    let xy = x
        .checked_mul(y)
        .ok_or(SafeMathError::MultiplicationOverflow)?;
    let z = xy.checked_div(z).ok_or(SafeMathError::DivisionUnderflow)?;
    Ok(z)
}

/**
 * x ** y
 */
pub fn safe_pow(x: u64, y: u32) -> Result<u64, SafeMathError> {
    let z = x
        .checked_pow(y)
        .ok_or(SafeMathError::ExponentiationOverflow)?;
    Ok(z)
}

/// @dev Equivalent to `x` to the power of `y`.
/// because `x ** y = (e ** ln(x)) ** y = e ** (ln(x) * y)`.
pub fn pow_wad(x: i64, y: i64) -> Result<i64, SafeMathError> {
    let result = Ok((ln_wad(x)? * y) / WAD as i64);
    exp_wad(result?)
}

/**
 * pow_wad but rounded up
 */
pub fn pow_wad_up(x: u64, y: u64) -> Result<u64, SafeMathError> {
    let power = u64::try_from(pow_wad(x as i64, y as i64)?)
        .map_err(|_| SafeMathError::ConversionOverflow)?;
    Ok(power + mul_wad_up(power, 1000)? + 1)
}

/// Approximates ln(x) for x scaled by WAD.
pub fn ln_wad(x: i64) -> Result<i64, SafeMathError> {
    // Convert x from WAD_1e9 to an approximation of 1.0 (normalized around 1 for Taylor series)
    let normalized_x = (x as f64 / WAD as f64) - 1.0;

    // Calculate ln(x) using a 4-term Taylor series approximation
    let ln_approx = normalized_x - 0.5 * normalized_x.powi(2) + (1.0 / 3.0) * normalized_x.powi(3)
        - 0.25 * normalized_x.powi(4);

    // Convert result back to WAD_1e9 format
    let result = (ln_approx * (WAD as f64)) as i64;

    Ok(result)
}

pub fn exp_wad(x: i64) -> Result<i64, SafeMathError> {
    // Approximately ~log(i64:MAX_VALUE) in WAD (1e9 scale)
    let max_min_input = (43 * WAD) as i64;

    // Early exit for overflow/underflow conditions
    if x >= max_min_input {
        return Err(SafeMathError::ExponentiationOverflow);
    }
    // Exp small x approximates to 0
    if x <= -max_min_input {
        return Ok(0);
    }

    // Scale x from WAD to natural exponential scale
    let scaled_x = x as f64 / WAD as f64;
    let result = scaled_x.exp();

    // Scale result back to WAD
    let result_scaled = (result * WAD as f64).round() as i64;

    Ok(result_scaled)
}
