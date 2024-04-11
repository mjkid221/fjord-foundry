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
    let xy = x
        .checked_mul(y)
        .ok_or(SafeMathError::MultiplicationOverflow)?;
    let z = xy
        .checked_div(WAD)
        .ok_or(SafeMathError::DivisionUnderflow)?;
    Ok(z)
}

pub fn mul_wad_up(x: u64, y: u64) -> Result<u64, SafeMathError> {
    let xy = x
        .checked_mul(y)
        .ok_or(SafeMathError::MultiplicationOverflow)?;
    // Add WAD-1 before division to ensure rounding up
    let z = xy
        .checked_add(WAD - 1)
        .ok_or(SafeMathError::AdditionOverflow)?
        .checked_div(WAD)
        .ok_or(SafeMathError::DivisionUnderflow)?;
    Ok(z)
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
    let xy = x
        .checked_mul(WAD)
        .ok_or(SafeMathError::MultiplicationOverflow)?;
    let z = xy.checked_div(y).ok_or(SafeMathError::DivisionUnderflow)?;
    Ok(z)
}

/**
 * (x * WAD + y - 1)/y
 * Rounded up
 */
pub fn div_wad_up(x: u64, y: u64) -> Result<u64, SafeMathError> {
    let xy = x
        .checked_mul(WAD)
        .ok_or(SafeMathError::MultiplicationOverflow)?;
    // Add y-1 before division to ensure rounding up
    let z = xy
        .checked_add(y - 1)
        .ok_or(SafeMathError::AdditionOverflow)?
        .checked_div(y)
        .ok_or(SafeMathError::DivisionUnderflow)?;
    Ok(z)
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

/**
 * x ** (y / WAD )
 */
pub fn pow_wad(x: u64, y: u64) -> Result<u64, SafeMathError> {
    let exponent = div(y.into(), WAD)?;
    safe_pow(
        x,
        exponent
            .try_into()
            .map_err(|_| SafeMathError::ConversionOverflow)?,
    )
}

/**
 * x ** (y / WAD) + 1
 * Rounded up
 */
pub fn pow_wad_up(x: u64, y: u64) -> Result<u64, SafeMathError> {
    let result = pow_wad(x, y)?;
    safe_add(result, 1)
}
