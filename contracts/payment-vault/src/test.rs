#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env, Symbol, Vec,
};

use split_registry::SplitRegistryContract;

/// Setup the full test environment: registry + vault + token.
fn setup_full_env() -> (
    Env,
    Address, // registry contract id
    Address, // vault contract id
    Address, // token contract id
    Address, // admin (token issuer)
) {
    let env = Env::default();
    env.mock_all_auths();

    // Register the split registry contract
    let registry_id = env.register(SplitRegistryContract, ());

    // Register the payment vault contract
    let vault_id = env.register(PaymentVaultContract, ());

    // Create a token (simulating USDC)
    let admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(admin.clone()).address().clone();

    // Initialize the vault with registry and token
    let vault_client = PaymentVaultContractClient::new(&env, &vault_id);
    vault_client.initialize(&registry_id, &token_id);

    (env, registry_id, vault_id, token_id, admin)
}

/// Test 5: distribute splits amount correctly across recipients.
#[test]
fn test_distribute_splits_amount_correctly_across_recipients() {
    let (env, registry_id, vault_id, token_id, _admin) = setup_full_env();

    let registry_client = split_registry::SplitRegistryContractClient::new(&env, &registry_id);
    let vault_client = PaymentVaultContractClient::new(&env, &vault_id);
    let token_admin_client = StellarAssetClient::new(&env, &token_id);
    let token_client = TokenClient::new(&env, &token_id);

    // Create owner and recipients
    let owner = Address::generate(&env);
    let r1 = Address::generate(&env);
    let r2 = Address::generate(&env);
    let r3 = Address::generate(&env);

    let split_id = Symbol::new(&env, "payout");
    let recipients = Vec::from_array(&env, [r1.clone(), r2.clone(), r3.clone()]);
    let shares = Vec::from_array(&env, [50u32, 30u32, 20u32]);

    // Register the split
    registry_client.register_split(&owner, &split_id, &recipients, &shares);

    // Mint USDC to sender
    let sender = Address::generate(&env);
    token_admin_client.mint(&sender, &1000);

    // Distribute 1000 USDC
    let payouts = vault_client.distribute(&sender, &split_id, &1000);

    // Verify payouts: 50% of 1000 = 500, 30% = 300, 20% = 200
    assert_eq!(payouts.len(), 3);
    assert_eq!(payouts.get(0).unwrap().amount, 500);
    assert_eq!(payouts.get(1).unwrap().amount, 300);
    assert_eq!(payouts.get(2).unwrap().amount, 200);

    // Verify actual token balances
    assert_eq!(token_client.balance(&r1), 500);
    assert_eq!(token_client.balance(&r2), 300);
    assert_eq!(token_client.balance(&r3), 200);
    assert_eq!(token_client.balance(&sender), 0);
}

/// Test 6: distribute calls registry cross-contract successfully.
/// This test verifies the inter-contract communication pathway.
#[test]
fn test_distribute_calls_registry_cross_contract_successfully() {
    let (env, registry_id, vault_id, token_id, _admin) = setup_full_env();

    let registry_client = split_registry::SplitRegistryContractClient::new(&env, &registry_id);
    let vault_client = PaymentVaultContractClient::new(&env, &vault_id);
    let token_admin_client = StellarAssetClient::new(&env, &token_id);

    let owner = Address::generate(&env);
    let r1 = Address::generate(&env);
    let split_id = Symbol::new(&env, "cross");
    let recipients = Vec::from_array(&env, [r1.clone()]);
    let shares = Vec::from_array(&env, [100u32]);

    // Register in registry
    registry_client.register_split(&owner, &split_id, &recipients, &shares);

    // Mint and distribute via vault (vault calls registry under the hood)
    let sender = Address::generate(&env);
    token_admin_client.mint(&sender, &500);

    let payouts = vault_client.distribute(&sender, &split_id, &500);

    // If we got here without error, the cross-contract call succeeded
    assert_eq!(payouts.len(), 1);
    assert_eq!(payouts.get(0).unwrap().recipient, r1);
    assert_eq!(payouts.get(0).unwrap().amount, 500);
}

/// Test 7: distribution history is recorded correctly.
#[test]
fn test_distribution_history_recorded_correctly() {
    let (env, registry_id, vault_id, token_id, _admin) = setup_full_env();

    let registry_client = split_registry::SplitRegistryContractClient::new(&env, &registry_id);
    let vault_client = PaymentVaultContractClient::new(&env, &vault_id);
    let token_admin_client = StellarAssetClient::new(&env, &token_id);

    let owner = Address::generate(&env);
    let r1 = Address::generate(&env);
    let split_id = Symbol::new(&env, "hist");
    let recipients = Vec::from_array(&env, [r1.clone()]);
    let shares = Vec::from_array(&env, [100u32]);

    registry_client.register_split(&owner, &split_id, &recipients, &shares);

    let sender = Address::generate(&env);
    token_admin_client.mint(&sender, &2000);

    // Two distributions
    vault_client.distribute(&sender, &split_id, &800);
    vault_client.distribute(&sender, &split_id, &200);

    let history = vault_client.get_distribution_history(&split_id);
    assert_eq!(history.len(), 2);
    assert_eq!(history.get(0).unwrap().total_amount, 800);
    assert_eq!(history.get(1).unwrap().total_amount, 200);
    assert_eq!(history.get(0).unwrap().sender, sender);
}

/// Test 8: total distributed accumulates across multiple calls.
#[test]
fn test_total_distributed_accumulates_across_calls() {
    let (env, registry_id, vault_id, token_id, _admin) = setup_full_env();

    let registry_client = split_registry::SplitRegistryContractClient::new(&env, &registry_id);
    let vault_client = PaymentVaultContractClient::new(&env, &vault_id);
    let token_admin_client = StellarAssetClient::new(&env, &token_id);

    let owner = Address::generate(&env);
    let r1 = Address::generate(&env);
    let split_id = Symbol::new(&env, "total");
    let recipients = Vec::from_array(&env, [r1.clone()]);
    let shares = Vec::from_array(&env, [100u32]);

    registry_client.register_split(&owner, &split_id, &recipients, &shares);

    let sender = Address::generate(&env);
    token_admin_client.mint(&sender, &5000);

    // Check initial total
    assert_eq!(vault_client.get_total_distributed(&split_id), 0);

    // First distribution
    vault_client.distribute(&sender, &split_id, &1000);
    assert_eq!(vault_client.get_total_distributed(&split_id), 1000);

    // Second distribution
    vault_client.distribute(&sender, &split_id, &2500);
    assert_eq!(vault_client.get_total_distributed(&split_id), 3500);

    // Third distribution
    vault_client.distribute(&sender, &split_id, &500);
    assert_eq!(vault_client.get_total_distributed(&split_id), 4000);
}

/// Test 9: hard math distribution with remainders and truncation
#[test]
fn test_hard_math_distribution_truncation() {
    let (env, registry_id, vault_id, token_id, _admin) = setup_full_env();

    let registry_client = split_registry::SplitRegistryContractClient::new(&env, &registry_id);
    let vault_client = PaymentVaultContractClient::new(&env, &vault_id);
    let token_admin_client = StellarAssetClient::new(&env, &token_id);
    let token_client = TokenClient::new(&env, &token_id);

    let owner = Address::generate(&env);
    let r1 = Address::generate(&env);
    let r2 = Address::generate(&env);
    let r3 = Address::generate(&env);
    let split_id = Symbol::new(&env, "trunc");
    
    let recipients = Vec::from_array(&env, [r1.clone(), r2.clone(), r3.clone()]);
    let shares = Vec::from_array(&env, [33u32, 33u32, 34u32]);

    registry_client.register_split(&owner, &split_id, &recipients, &shares);

    let sender = Address::generate(&env);
    // Mint exactly 100
    token_admin_client.mint(&sender, &100);

    vault_client.distribute(&sender, &split_id, &100);

    // 100 * 33 / 100 = 33
    // 100 * 34 / 100 = 34
    assert_eq!(token_client.balance(&r1), 33);
    assert_eq!(token_client.balance(&r2), 33);
    assert_eq!(token_client.balance(&r3), 34);
    
    // There should be no remainder left with sender since they sum to exactly 100 (if our logic is flawless)
    assert_eq!(token_client.balance(&sender), 0);
}

/// Test 10: huge amounts distribution
#[test]
fn test_huge_amounts_distribution() {
    let (env, registry_id, vault_id, token_id, _admin) = setup_full_env();

    let registry_client = split_registry::SplitRegistryContractClient::new(&env, &registry_id);
    let vault_client = PaymentVaultContractClient::new(&env, &vault_id);
    let token_admin_client = StellarAssetClient::new(&env, &token_id);
    let token_client = TokenClient::new(&env, &token_id);

    let owner = Address::generate(&env);
    let r1 = Address::generate(&env);
    let r2 = Address::generate(&env);
    let split_id = Symbol::new(&env, "huge");
    
    let recipients = Vec::from_array(&env, [r1.clone(), r2.clone()]);
    let shares = Vec::from_array(&env, [50u32, 50u32]);

    registry_client.register_split(&owner, &split_id, &recipients, &shares);

    let sender = Address::generate(&env);
    let huge_amount: i128 = 10_000_000_000_000_000_000;
    token_admin_client.mint(&sender, &huge_amount);

    vault_client.distribute(&sender, &split_id, &huge_amount);

    assert_eq!(token_client.balance(&r1), huge_amount / 2);
    assert_eq!(token_client.balance(&r2), huge_amount / 2);
    assert_eq!(token_client.balance(&sender), 0);
}
