use anchor_lang::prelude::*;

pub const ONE_DAY_SECONDS: i64 = 60 * 60 * 24;

/**
 * Maximum percentage of reserve_in allowed to be swapped in when using get_amount_out (30%)
 */
pub const MAX_PERCENTAGE_IN: u16 = 30 * 100;

/**
 * Maximum percentage of reserve_out allowed to be swapped out when using get_amount_in (30%)
 */
pub const MAX_PERCENTAGE_OUT: u16 = 30 * 100;

#[constant]
pub const MAX_FEE_BIPS: u16 = 10_000; // 100%
