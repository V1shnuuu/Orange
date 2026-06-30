#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Env, String, Address, symbol_short};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyRegistered = 1,
    NotRegistered = 2,
}

#[contracttype]
pub enum DataKey {
    Artist(Address), // Artist address -> ArtistProfile
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ArtistProfile {
    pub name: String,
    pub primary_skill: String,
}

#[contract]
pub struct ArtistRegistryContract;

#[contractimpl]
impl ArtistRegistryContract {
    pub fn register_artist(env: Env, artist: Address, name: String, primary_skill: String) -> Result<(), Error> {
        artist.require_auth();

        let key = DataKey::Artist(artist.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::AlreadyRegistered);
        }

        let profile = ArtistProfile {
            name: name.clone(),
            primary_skill: primary_skill.clone(),
        };

        env.storage().persistent().set(&key, &profile);

        // Emit an event
        let topics = (symbol_short!("register"), artist.clone());
        env.events().publish(topics, profile);

        Ok(())
    }

    pub fn get_artist(env: Env, artist: Address) -> Result<ArtistProfile, Error> {
        let key = DataKey::Artist(artist);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotRegistered)
    }
}

mod test;
