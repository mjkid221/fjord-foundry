use anchor_lang::prelude::*;

// Events
#[event]
pub struct PoolCreatedEvent {
    pub pool: Pubkey
}

