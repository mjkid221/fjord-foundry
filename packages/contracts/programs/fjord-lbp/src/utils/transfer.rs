use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

/// Transfer helper function to transfer tokens to an account from the pool.
pub fn transfer_tokens_from<'a>(
    token_program: AccountInfo<'a>,
    from_account: AccountInfo<'a>,
    to_account: AccountInfo<'a>,
    authority: AccountInfo<'a>,
    seeds: &[&[u8]],
    amount: u64,
) -> Result<()> {
    let token_transfer_instruction = Transfer {
        from: from_account.clone(),
        to: to_account.clone(),
        authority: authority.clone(),
    };

    let signer_seeds = &[&seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(
        token_program.clone(),
        token_transfer_instruction,
        signer_seeds,
    );

    token::transfer(cpi_ctx, amount)
}
