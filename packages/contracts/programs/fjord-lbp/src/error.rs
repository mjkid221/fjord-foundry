use anchor_lang::prelude::*;

// Pool Errors
#[error_code]
pub enum PoolError {
    #[msg("Asset and share token mints must be different")]
    InvalidAssetOrShare,
    #[msg("Sale period is too low")]
    SalePeriodLow,
    #[msg("Vesting cliff time should be less than sale end")]
    InvalidVestCliff,
    #[msg("Vesting end time should be greater or equal to vest cliff ")]
    InvalidVestEnd,
    #[msg("Invalid start or end weight")]
    InvalidWeightConfig,
    #[msg("Asset value cannot be 0")]
    InvalidAssetValue,
    #[msg("Max Fee Exceeded")]
    MaxFeeExceeded,
    #[msg("Max allowed assets in exceeded")]
    AssetsInExceeded,
    #[msg("Max allowed shares out exceeded")]
    SharesOutExceeded,
    #[msg("Whitelist verification failed")]
    WhitelistProof,
    #[msg("Slippage limit is exceeded")]
    SlippageExceeded,
    #[msg("Selling is disallowed")]
    SellingDisallowed,
    #[msg("Trading is disallowed")]
    TradingDisallowed,
    #[msg("Closing is disallowed")]
    ClosingDisallowed,
    #[msg("Redeeming is disallowed")]
    RedeemingDisallowed,
    #[msg("Caller is disallowed")]
    CallerDisallowed,
}

// Access Control Errors
#[error_code]
pub enum AccessControlError {
    #[msg("Only owner can call this function")]
    Unauthorized,
}

#[error_code]
pub enum SafeMathError {
    #[msg("SafeMath: Addition overflow")]
    AdditionOverflow,
    #[msg("SafeMath: Subtraction underflow")]
    SubtractionUnderflow,
    #[msg("SafeMath: Multiplication overflow")]
    MultiplicationOverflow,
    #[msg("SafeMath: Division underflow")]
    DivisionUnderflow,
    #[msg("SafeMath: Exponentiation overflow")]
    ExponentiationOverflow,
    #[msg("SafeMath: Conversion overflow")]
    ConversionOverflow,
    #[msg("WeightedMathLib: amount_in exceeds MAX_PERCENTAGE_IN")]
    AmountInTooLarge,
    #[msg("WeightedMathLib: amount_out exceeds MAX_PERCENTAGE_OUT")]
    AmountOutTooLarge,
}
