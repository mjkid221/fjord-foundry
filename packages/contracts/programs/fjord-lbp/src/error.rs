use anchor_lang::prelude::*;

// Errors
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
}

#[error_code]
pub enum AccessControlError {
    #[msg("Caller is not owner.")]
    NowOwner,
}
