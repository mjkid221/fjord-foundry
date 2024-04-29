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
    #[msg("Fee percentages must add up to 100% (10000)")]
    InvalidPercentageSum,
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
    #[msg("Invalid selling allowed value")]
    InvalidSellingAllowed,
    #[msg("Share value cannot be 0")]
    InvalidShareValue,
    #[msg("Invalid share price")]
    InvalidSharePrice,
    #[msg("Max shares out cannot be 0")]
    InvalidMaxSharesOut,
    #[msg("Max assets in cannot be 0")]
    InvalidMaxAssetsIn,
    #[msg("There are insuffcient shares to transfer in your account")]
    InsufficientShares,
    #[msg("There are insuffcient assets to transfer in your account")]
    InsufficientAssets,
    #[msg("The pool is paused")]
    Paused,
    #[msg("The fee recipient and percentages must match in length")]
    InvalidFeeRecipients,
    #[msg("The fee recipient must be writable")]
    InvalidFeeRecipientWritable,
    #[msg("Supplied account must match the pool creator pubkey")]
    InvalidCreator,
    #[msg("Invalid swap fee recipient")]
    InvalidSwapFeeRecipient,
}

// Access Control Errors
#[error_code]
pub enum AccessControlError {
    #[msg("Only owner can call this function")]
    Unauthorized,
    #[msg("Only the program upgrade authority can call this function")]
    NotUpgradeAuthority,
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
    #[msg("WeightedMathLib: Logarithm undefined")]
    LogarithmUndefined,
}
