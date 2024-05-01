use crate::SafeMathError;

/**
 * Clarification: WAD is usually an Ethereum term for 1e18 in Math Libraries.
 * It is just used here for consistency across Fjord's arithmetic logic.
 */
pub const WAD: u64 = 1_000_000_000_000;

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
    let xy = u128::from(x)
        .checked_mul(u128::from(y))
        .ok_or(SafeMathError::MultiplicationOverflow)?;
    let z = xy
        .checked_div(u128::from(z))
        .ok_or(SafeMathError::DivisionUnderflow)?;
    u64::try_from(z).map_err(|_| SafeMathError::ConversionOverflow)
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

/// @dev Equivalent to `x` to the power of `y` scaled by WAD.
pub fn pow_wad(x: i64, y: i64) -> Result<i64, SafeMathError> {
    let ln_result = ln_wad(x)?;
    let exp_input = (ln_result * y as i128 / WAD as i128) as i128;

    exp_wad(exp_input)
}

/**
 * pow_wad but rounded up
 */
pub fn pow_wad_up(x: u64, y: u64) -> Result<u64, SafeMathError> {
    let power = pow_wad(x as i64, y as i64)?;

    // Convert power to u64, add small increment for rounding up.
    let power_u64 = power as u64;
    let increment = mul_wad_up(power_u64, 1000)?;
    let rounded_up = power_u64
        .checked_add(increment)
        .and_then(|p| p.checked_add(1))
        .ok_or(SafeMathError::AdditionOverflow)?;

    Ok(rounded_up)
}

/// Approximates ln(x) for x scaled by WAD.
pub fn ln_wad(x: i64) -> Result<i128, SafeMathError> {
    if x <= 0 {
        return Err(SafeMathError::LogarithmUndefined);
    }
    // Calculate the natural logarithm using f64, then convert to i128 for high precision.
    let ln_value = ((x as f64 / WAD as f64).ln() * WAD as f64) as i128;

    Ok(ln_value)
}

pub fn exp_wad(x: i128) -> Result<i64, SafeMathError> {
    // Approximately ~log(i64:MAX_VALUE) in WAD (1e9 scale)
    let max_min_input = 43 * WAD as i128;

    // Early exit for overflow/underflow conditions
    if x >= max_min_input {
        return Err(SafeMathError::ExponentiationOverflow);
    }

    // Exp small x approximates to 0
    if x <= -max_min_input {
        return Ok(0);
    }

    // Scale x from WAD to natural exponential scale
    let scaled_x = (x as f64 / WAD as f64).exp();
    let result_scaled = (scaled_x * WAD as f64).round() as i128;

    // Ensures the result fits within i64 range.
    if result_scaled > i64::MAX as i128 || result_scaled < i64::MIN as i128 {
        return Err(SafeMathError::ExponentiationOverflow);
    }

    Ok(result_scaled as i64)
}
