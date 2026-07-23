#![cfg(test)]

use super::*;
use soroban_sdk::{Env, testutils::Address as _};

#[test]
fn test_create_circle() {
    let env = Env::default();
    let contract_id = env.register_contract(None, CircleFactoryContract);
    let client = CircleFactoryContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let circle_id = Symbol::new(&env, "circle1");
    let name = Symbol::new(&env, "TestCircle");
    
    // Auth bypass for testing
    env.mock_all_auths();

    let result = client.create_circle(
        &admin,
        &circle_id,
        &name,
        &50_000_000,
        &5,
        &7,
    );

    assert_eq!(result, true);

    let total = client.get_total_circles();
    assert_eq!(total, 1);

    let config = client.get_circle(&circle_id).unwrap();
    assert_eq!(config.name, name);
    assert_eq!(config.max_members, 5);
}
