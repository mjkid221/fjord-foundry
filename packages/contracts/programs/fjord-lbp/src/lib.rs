use anchor_lang::prelude::*;

declare_id!("86nkh4SxcKQ96MUjnHBAbriktnGMwZ7skQVbjvr52k9J");

#[program]
pub mod fjord_lbp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
