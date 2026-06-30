#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events},
    token::Client as TokenClient,
    token::StellarAssetClient,
    vec, Env, IntoVal, String,
};

use artist_registry::ArtistRegistryContract;

fn setup_token<'a>(env: &Env, admin: &Address) -> (Address, TokenClient<'a>, StellarAssetClient<'a>) {
    let contract_id = env.register_stellar_asset_contract_v2(admin.clone());
    let token = TokenClient::new(env, &contract_id.address());
    let admin_client = StellarAssetClient::new(env, &contract_id.address());
    (contract_id.address(), token, admin_client)
}

#[test]
fn test_endorse_happy_path() {
    let env = Env::default();
    env.mock_all_auths();

    // 1. Setup Token
    let token_admin = Address::generate(&env);
    let (token_address, token_client, token_admin_client) = setup_token(&env, &token_admin);
    
    // 2. Setup Endorser and Artist accounts
    let endorser = Address::generate(&env);
    let artist = Address::generate(&env);
    
    // Mint some tokens to endorser
    token_admin_client.mint(&endorser, &100_000_000_000);

    // 3. Setup ArtistRegistry
    let registry_id = env.register_contract(None, ArtistRegistryContract);
    let registry_client = artist_registry::ArtistRegistryContractClient::new(&env, &registry_id);
    let name = String::from_str(&env, "Kamal");
    let skill = String::from_str(&env, "Mime");
    registry_client.register_artist(&artist, &name, &skill);

    // 4. Setup EndorsementVault
    let vault_id = env.register_contract(None, EndorsementVaultContract);
    let vault_client = EndorsementVaultContractClient::new(&env, &vault_id);

    // 5. Perform Endorsement
    let endorsement_amount = 5_000_000_000;
    let category = String::from_str(&env, "Mime");
    
    let result = vault_client.try_endorse(
        &endorser,
        &artist,
        &endorsement_amount,
        &category,
        &registry_id,
        &token_address
    );
    assert!(result.is_ok());

    // 6. Verify balances
    assert_eq!(token_client.balance(&endorser), 95_000_000_000);
    assert_eq!(token_client.balance(&artist), 5_000_000_000);
}

#[test]
fn test_endorse_unregistered_artist() {
    let env = Env::default();
    env.mock_all_auths();

    let token_admin = Address::generate(&env);
    let (token_address, _, token_admin_client) = setup_token(&env, &token_admin);
    
    let endorser = Address::generate(&env);
    let unregistered_artist = Address::generate(&env);
    token_admin_client.mint(&endorser, &100_000_000_000);

    let registry_id = env.register_contract(None, ArtistRegistryContract);
    
    let vault_id = env.register_contract(None, EndorsementVaultContract);
    let vault_client = EndorsementVaultContractClient::new(&env, &vault_id);

    let endorsement_amount = 5_000_000_000;
    let category = String::from_str(&env, "Dance");
    
    let result = vault_client.try_endorse(
        &endorser,
        &unregistered_artist,
        &endorsement_amount,
        &category,
        &registry_id,
        &token_address
    );
    
    assert_eq!(result, Err(Ok(Error::ArtistNotRegistered)));
}

#[test]
fn test_endorse_invalid_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let token_admin = Address::generate(&env);
    let (token_address, _, _) = setup_token(&env, &token_admin);
    
    let endorser = Address::generate(&env);
    let artist = Address::generate(&env);

    let registry_id = env.register_contract(None, ArtistRegistryContract);
    let registry_client = artist_registry::ArtistRegistryContractClient::new(&env, &registry_id);
    registry_client.register_artist(&artist, &String::from_str(&env, "Kamal"), &String::from_str(&env, "Mime"));

    let vault_id = env.register_contract(None, EndorsementVaultContract);
    let vault_client = EndorsementVaultContractClient::new(&env, &vault_id);

    let result = vault_client.try_endorse(
        &endorser,
        &artist,
        &0, // Invalid amount
        &String::from_str(&env, "Mime"),
        &registry_id,
        &token_address
    );
    
    assert_eq!(result, Err(Ok(Error::InvalidAmount)));
}
