#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracterror, token, Address, Env, String, symbol_short, Symbol
};

use artist_registry::ArtistRegistryContractClient;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidAmount = 1,
    ArtistNotRegistered = 2,
    InvalidSkill = 3,
}

#[contract]
pub struct EndorsementVaultContract;

#[contractimpl]
impl EndorsementVaultContract {
    pub fn endorse(
        env: Env,
        endorser: Address,
        artist: Address,
        amount: i128,
        skill_category: String,
        registry_address: Address,
        token_address: Address,
    ) -> Result<(), Error> {
        endorser.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Verify the artist is registered in the ArtistRegistry
        let registry_client = ArtistRegistryContractClient::new(&env, &registry_address);
        if registry_client.try_get_artist(&artist).is_err() {
            return Err(Error::ArtistNotRegistered);
        }

        // Perform the token transfer (endorser -> artist)
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&endorser, &artist, &amount);

        // Emit endorsement event
        let topics = (symbol_short!("endorse"), artist.clone(), skill_category.clone());
        env.events().publish(topics, amount);

        // Emit milestone event if amount is significant (e.g. > 100 XLM for demo)
        // XLM is 7 decimals, so 100 XLM = 1,000,000,000 stroops
        if amount >= 1_000_000_000 {
             let milestone_topics = (Symbol::new(&env, "milestone"), artist.clone());
             env.events().publish(milestone_topics, skill_category);
        }

        Ok(())
    }
}

mod test;
