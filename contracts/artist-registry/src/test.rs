#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env, String};

#[test]
fn test_register_artist() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, ArtistRegistryContract);
    let client = ArtistRegistryContractClient::new(&env, &contract_id);

    let artist = Address::generate(&env);
    let name = String::from_str(&env, "Kamal Haasan");
    let skill = String::from_str(&env, "Theatre");

    let result = client.try_register_artist(&artist, &name, &skill);
    assert!(result.is_ok());

    let profile = client.get_artist(&artist);
    assert_eq!(profile.name, name);
    assert_eq!(profile.primary_skill, skill);
}

#[test]
fn test_already_registered() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, ArtistRegistryContract);
    let client = ArtistRegistryContractClient::new(&env, &contract_id);

    let artist = Address::generate(&env);
    let name = String::from_str(&env, "Rajini");
    let skill = String::from_str(&env, "Acting");

    client.register_artist(&artist, &name, &skill);

    let result = client.try_register_artist(&artist, &name, &skill);
    assert_eq!(result, Err(Ok(Error::AlreadyRegistered)));
}

#[test]
fn test_get_not_registered() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ArtistRegistryContract);
    let client = ArtistRegistryContractClient::new(&env, &contract_id);

    let artist = Address::generate(&env);
    let result = client.try_get_artist(&artist);
    
    assert_eq!(result, Err(Ok(Error::NotRegistered)));
}
