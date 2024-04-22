use crate::{PoolError, SwapTokens};
use anchor_lang::prelude::*;

pub mod merkle {
    use solana_program::keccak;

    pub use super::*;
    use crate::merkle_verify;

    pub fn _only_white_listed(
        ctx: &Context<SwapTokens>,
        merkle_proof: Option<Vec<[u8; 32]>>,
    ) -> Result<()> {
        // if merkle root is not an empty array and merkle proof is provided, check if the user is in the whitelist
        let merkle_root = ctx.accounts.pool.whitelist_merkle_root;
        let node = keccak::hashv(&[&ctx.accounts.user.key().to_string().as_bytes()]);
        if merkle_root != [0u8; 32]
            && (merkle_proof.is_none()
                || !merkle_verify(&merkle_proof.unwrap()[..], &merkle_root, &node.0))
        {
            return Err(PoolError::WhitelistProof.into());
        }
        Ok(())
    }
}

pub mod sale {
    pub use super::*;

    pub fn _when_sale_active(ctx: &Context<SwapTokens>) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp;
        if current_time < ctx.accounts.pool.sale_start_time
            || current_time >= ctx.accounts.pool.sale_end_time
        {
            return Err(PoolError::TradingDisallowed.into());
        }
        Ok(())
    }

    pub fn _when_selling_allowed(ctx: &Context<SwapTokens>) -> Result<()> {
        if !ctx.accounts.pool.selling_allowed {
            return Err(PoolError::SellingDisallowed.into());
        }
        Ok(())
    }
}

pub fn before_token_swap(
    ctx: &Context<SwapTokens>,
    merkle_proof: Option<Vec<[u8; 32]>>,
    is_sell: bool,
) -> Result<()> {
    merkle::_only_white_listed(ctx, merkle_proof)?;
    sale::_when_sale_active(ctx)?;
    if is_sell {
        sale::_when_selling_allowed(ctx)?
    };
    Ok(())
}
