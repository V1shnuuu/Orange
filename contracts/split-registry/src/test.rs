#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, Env, Symbol, Vec,
};

/// Helper: create an env and register the contract.
fn setup_env() -> (Env, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(SplitRegistryContract, ());
    (env, contract_id)
}

/// Test 1: register_split validates that shares must sum to exactly 100.
#[test]
fn test_register_split_validates_shares_sum_to_100() {
    let (env, contract_id) = setup_env();
    let client = SplitRegistryContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let split_id = Symbol::new(&env, "test1");

    let recipients = Vec::from_array(
        &env,
        [Address::generate(&env), Address::generate(&env)],
    );

    // Shares sum to 90 — should fail
    let bad_shares = Vec::from_array(&env, [50u32, 40u32]);
    let result = client.try_register_split(&owner, &split_id, &recipients, &bad_shares);
    assert_eq!(result, Err(Ok(SplitError::InvalidShares)));

    // Shares sum to 110 — should fail
    let bad_shares2 = Vec::from_array(&env, [60u32, 50u32]);
    let result2 = client.try_register_split(&owner, &split_id, &recipients, &bad_shares2);
    assert_eq!(result2, Err(Ok(SplitError::InvalidShares)));

    // Shares sum to 100 — should succeed
    let good_shares = Vec::from_array(&env, [60u32, 40u32]);
    let result3 = client.try_register_split(&owner, &split_id, &recipients, &good_shares);
    assert!(result3.is_ok());
}

/// Test 2: get_split returns correct recipients and shares.
#[test]
fn test_get_split_returns_correct_recipients_and_shares() {
    let (env, contract_id) = setup_env();
    let client = SplitRegistryContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let split_id = Symbol::new(&env, "royalty");

    let r1 = Address::generate(&env);
    let r2 = Address::generate(&env);
    let r3 = Address::generate(&env);
    let recipients = Vec::from_array(&env, [r1.clone(), r2.clone(), r3.clone()]);
    let shares = Vec::from_array(&env, [50u32, 30u32, 20u32]);

    client.register_split(&owner, &split_id, &recipients, &shares);

    let result: (Vec<Address>, Vec<u32>) = client.get_split(&split_id);
    let returned_recipients = result.0;
    let returned_shares = result.1;

    assert_eq!(returned_recipients.len(), 3);
    assert_eq!(returned_recipients.get(0).unwrap(), r1);
    assert_eq!(returned_recipients.get(1).unwrap(), r2);
    assert_eq!(returned_recipients.get(2).unwrap(), r3);
    assert_eq!(returned_shares.get(0).unwrap(), 50u32);
    assert_eq!(returned_shares.get(1).unwrap(), 30u32);
    assert_eq!(returned_shares.get(2).unwrap(), 20u32);
}

/// Test 3: unauthorized update is rejected.
#[test]
fn test_unauthorized_update_rejected() {
    let (env, contract_id) = setup_env();
    let client = SplitRegistryContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let other = Address::generate(&env);
    let split_id = Symbol::new(&env, "team");

    let recipients = Vec::from_array(&env, [Address::generate(&env)]);
    let shares = Vec::from_array(&env, [100u32]);

    // Register as owner
    client.register_split(&owner, &split_id, &recipients, &shares);

    // Try to update as a different address
    let new_recipients = Vec::from_array(&env, [Address::generate(&env)]);
    let new_shares = Vec::from_array(&env, [100u32]);
    let result = client.try_update_split(&other, &split_id, &new_recipients, &new_shares);
    assert_eq!(result, Err(Ok(SplitError::Unauthorized)));
}

/// Test 4: too many recipients (>10) is rejected.
#[test]
fn test_too_many_recipients_rejected() {
    let (env, contract_id) = setup_env();
    let client = SplitRegistryContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let split_id = Symbol::new(&env, "big");

    // Create 11 recipients
    let mut recipients = Vec::new(&env);
    let mut shares = Vec::new(&env);
    for i in 0..11u32 {
        recipients.push_back(Address::generate(&env));
        if i < 10 {
            shares.push_back(9u32);
        } else {
            shares.push_back(10u32); // 9*10 + 10 = 100
        }
    }

    let result = client.try_register_split(&owner, &split_id, &recipients, &shares);
    assert_eq!(result, Err(Ok(SplitError::TooManyRecipients)));
}

/// Test 5: zero recipients is rejected.
#[test]
fn test_zero_recipients_rejected() {
    let (env, contract_id) = setup_env();
    let client = SplitRegistryContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let split_id = Symbol::new(&env, "zero");

    let recipients = Vec::new(&env);
    let shares = Vec::new(&env);

    let result = client.try_register_split(&owner, &split_id, &recipients, &shares);
    assert_eq!(result, Err(Ok(SplitError::EmptyRecipients)));
}

/// Test 6: duplicate split ID is rejected.
#[test]
fn test_duplicate_split_id_rejected() {
    let (env, contract_id) = setup_env();
    let client = SplitRegistryContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let split_id = Symbol::new(&env, "dup");
    let recipients = Vec::from_array(&env, [Address::generate(&env)]);
    let shares = Vec::from_array(&env, [100u32]);

    client.register_split(&owner, &split_id, &recipients, &shares);

    let other_owner = Address::generate(&env);
    let result = client.try_register_split(&other_owner, &split_id, &recipients, &shares);
    assert_eq!(result, Err(Ok(SplitError::AlreadyExists)));
}

/// Test 7: zero share is rejected.
#[test]
fn test_zero_shares_rejected() {
    let (env, contract_id) = setup_env();
    let client = SplitRegistryContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let split_id = Symbol::new(&env, "zeroshare");
    let recipients = Vec::from_array(&env, [Address::generate(&env), Address::generate(&env)]);
    let shares = Vec::from_array(&env, [100u32, 0u32]);

    let result = client.try_register_split(&owner, &split_id, &recipients, &shares);
    assert_eq!(result, Err(Ok(SplitError::SharesZero)));
}
