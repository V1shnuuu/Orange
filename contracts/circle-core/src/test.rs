#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env, Symbol,
};

const MAX_MEMBERS: u32 = 3;
const CONTRIBUTION: i128 = 50_000_000;
const MINT_AMOUNT: i128 = 500_000_000;

/// Setup an initialized circle with a Stellar asset token standing in for USDC.
fn setup_circle() -> (
    Env,
    Address, // circle contract id
    Address, // token contract id
    Address, // circle admin
) {
    let env = Env::default();
    env.mock_all_auths();

    let circle_id = env.register(CircleCoreContract, ());
    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address()
        .clone();

    let factory = Address::generate(&env);
    let admin = Address::generate(&env);

    let client = CircleCoreContractClient::new(&env, &circle_id);
    client.initialize(
        &factory,
        &token_id,
        &Symbol::new(&env, "circle1"),
        &admin,
        &MAX_MEMBERS,
    );

    (env, circle_id, token_id, admin)
}

/// Generate a member, fund it with the test token and join it to the circle.
fn join_funded_member(env: &Env, circle_id: &Address, token_id: &Address) -> Address {
    let member = Address::generate(env);
    StellarAssetClient::new(env, token_id).mint(&member, &MINT_AMOUNT);
    CircleCoreContractClient::new(env, circle_id).join_circle(&member);
    member
}

/// Fill the circle to capacity, which auto-starts it. Members are returned in
/// join order, which is also the payout order.
fn fill_circle(env: &Env, circle_id: &Address, token_id: &Address) -> Vec<Address> {
    let mut members = Vec::new(env);
    for _ in 0..MAX_MEMBERS {
        members.push_back(join_funded_member(env, circle_id, token_id));
    }
    members
}

#[test]
fn test_initialize_sets_cycle_defaults() {
    let (env, circle_id, _token_id, _admin) = setup_circle();
    let client = CircleCoreContractClient::new(&env, &circle_id);

    let cycle = client.get_cycle_info();
    assert_eq!(cycle.current_cycle, 1);
    assert_eq!(cycle.max_cycles, MAX_MEMBERS);
    assert_eq!(cycle.contributions_this_cycle, 0);
    assert_eq!(cycle.next_payout_index, 0);
    assert_eq!(cycle.started, false);

    assert_eq!(client.get_members().len(), 0);
}

#[test]
fn test_initialize_twice_rejected() {
    let (env, circle_id, token_id, admin) = setup_circle();
    let client = CircleCoreContractClient::new(&env, &circle_id);

    let result = client.try_initialize(
        &Address::generate(&env),
        &token_id,
        &Symbol::new(&env, "circle2"),
        &admin,
        &MAX_MEMBERS,
    );
    assert_eq!(result, Err(Ok(CircleError::AlreadyInitialized)));
}

#[test]
fn test_join_circle_registers_member() {
    let (env, circle_id, token_id, _admin) = setup_circle();
    let client = CircleCoreContractClient::new(&env, &circle_id);

    let member = join_funded_member(&env, &circle_id, &token_id);

    let members = client.get_members();
    assert_eq!(members.len(), 1);
    assert_eq!(members.get(0).unwrap(), member);

    let info = client.get_member_info(&member).unwrap();
    assert_eq!(info.has_contributed_current, false);
    assert_eq!(info.payouts_received, 0);
}

#[test]
fn test_join_circle_rejects_duplicate_member() {
    let (env, circle_id, token_id, _admin) = setup_circle();
    let client = CircleCoreContractClient::new(&env, &circle_id);

    let member = join_funded_member(&env, &circle_id, &token_id);

    let result = client.try_join_circle(&member);
    assert_eq!(result, Err(Ok(CircleError::AlreadyMember)));
    assert_eq!(client.get_members().len(), 1);
}

#[test]
fn test_circle_auto_starts_when_full() {
    let (env, circle_id, token_id, _admin) = setup_circle();
    let client = CircleCoreContractClient::new(&env, &circle_id);

    fill_circle(&env, &circle_id, &token_id);

    let cycle = client.get_cycle_info();
    assert_eq!(cycle.started, true);
    assert_eq!(client.get_members().len(), MAX_MEMBERS);
}

#[test]
fn test_join_rejected_after_circle_starts() {
    let (env, circle_id, token_id, _admin) = setup_circle();
    let client = CircleCoreContractClient::new(&env, &circle_id);

    fill_circle(&env, &circle_id, &token_id);

    let latecomer = Address::generate(&env);
    let result = client.try_join_circle(&latecomer);
    assert_eq!(result, Err(Ok(CircleError::CircleAlreadyStarted)));
    assert_eq!(client.get_members().len(), MAX_MEMBERS);
}

#[test]
fn test_contribute_before_circle_starts_rejected() {
    let (env, circle_id, token_id, _admin) = setup_circle();
    let client = CircleCoreContractClient::new(&env, &circle_id);

    let member = join_funded_member(&env, &circle_id, &token_id);

    let result = client.try_contribute(&member, &CONTRIBUTION);
    assert_eq!(result, Err(Ok(CircleError::NotInitialized)));
}

#[test]
fn test_contribute_by_non_member_rejected() {
    let (env, circle_id, token_id, _admin) = setup_circle();
    let client = CircleCoreContractClient::new(&env, &circle_id);

    fill_circle(&env, &circle_id, &token_id);

    let outsider = Address::generate(&env);
    StellarAssetClient::new(&env, &token_id).mint(&outsider, &MINT_AMOUNT);

    let result = client.try_contribute(&outsider, &CONTRIBUTION);
    assert_eq!(result, Err(Ok(CircleError::NotMember)));
}

#[test]
fn test_contribute_rejects_non_positive_amount() {
    let (env, circle_id, token_id, _admin) = setup_circle();
    let client = CircleCoreContractClient::new(&env, &circle_id);

    let members = fill_circle(&env, &circle_id, &token_id);
    let member = members.get(0).unwrap();

    assert_eq!(
        client.try_contribute(&member, &0),
        Err(Ok(CircleError::InvalidAmount))
    );
    assert_eq!(
        client.try_contribute(&member, &-1),
        Err(Ok(CircleError::InvalidAmount))
    );
}

#[test]
fn test_contribute_moves_tokens_into_the_circle() {
    let (env, circle_id, token_id, _admin) = setup_circle();
    let client = CircleCoreContractClient::new(&env, &circle_id);
    let token = TokenClient::new(&env, &token_id);

    let members = fill_circle(&env, &circle_id, &token_id);
    let member = members.get(0).unwrap();

    client.contribute(&member, &CONTRIBUTION);

    assert_eq!(token.balance(&member), MINT_AMOUNT - CONTRIBUTION);
    assert_eq!(token.balance(&circle_id), CONTRIBUTION);

    let cycle = client.get_cycle_info();
    assert_eq!(cycle.contributions_this_cycle, 1);
    assert_eq!(
        client
            .get_member_info(&member)
            .unwrap()
            .has_contributed_current,
        true
    );
}

#[test]
fn test_double_contribute_in_same_cycle_rejected() {
    let (env, circle_id, token_id, _admin) = setup_circle();
    let client = CircleCoreContractClient::new(&env, &circle_id);

    let members = fill_circle(&env, &circle_id, &token_id);
    let member = members.get(0).unwrap();

    client.contribute(&member, &CONTRIBUTION);

    let result = client.try_contribute(&member, &CONTRIBUTION);
    assert_eq!(result, Err(Ok(CircleError::AlreadyContributed)));
    assert_eq!(client.get_cycle_info().contributions_this_cycle, 1);
}

#[test]
fn test_completed_cycle_pays_out_the_first_member() {
    let (env, circle_id, token_id, _admin) = setup_circle();
    let client = CircleCoreContractClient::new(&env, &circle_id);
    let token = TokenClient::new(&env, &token_id);

    let members = fill_circle(&env, &circle_id, &token_id);
    for member in members.iter() {
        client.contribute(&member, &CONTRIBUTION);
    }

    let pot = CONTRIBUTION * MAX_MEMBERS as i128;
    let recipient = members.get(0).unwrap();

    // The recipient gets the whole pot on top of what is left of its balance.
    assert_eq!(token.balance(&recipient), MINT_AMOUNT - CONTRIBUTION + pot);
    assert_eq!(token.balance(&circle_id), 0);
    assert_eq!(
        client.get_member_info(&recipient).unwrap().payouts_received,
        1
    );

    // The cycle rolls over and every member may contribute again.
    let cycle = client.get_cycle_info();
    assert_eq!(cycle.current_cycle, 2);
    assert_eq!(cycle.contributions_this_cycle, 0);
    assert_eq!(cycle.next_payout_index, 1);
    assert_eq!(cycle.started, true);
    for member in members.iter() {
        assert_eq!(
            client
                .get_member_info(&member)
                .unwrap()
                .has_contributed_current,
            false
        );
    }
}

#[test]
fn test_payout_rotates_through_every_member() {
    let (env, circle_id, token_id, _admin) = setup_circle();
    let client = CircleCoreContractClient::new(&env, &circle_id);
    let token = TokenClient::new(&env, &token_id);

    let members = fill_circle(&env, &circle_id, &token_id);

    for cycle in 1..=MAX_MEMBERS {
        for member in members.iter() {
            client.contribute(&member, &CONTRIBUTION);
        }

        // Each cycle pays the next member in join order.
        let recipient = members.get(cycle - 1).unwrap();
        assert_eq!(
            client.get_member_info(&recipient).unwrap().payouts_received,
            1
        );
    }

    // Everyone paid in three times and was paid out once, so all are square.
    for member in members.iter() {
        assert_eq!(token.balance(&member), MINT_AMOUNT);
        assert_eq!(client.get_member_info(&member).unwrap().payouts_received, 1);
    }
    assert_eq!(token.balance(&circle_id), 0);

    // The circle closes once the last member has been paid.
    let cycle = client.get_cycle_info();
    assert_eq!(cycle.current_cycle, MAX_MEMBERS + 1);
    assert_eq!(cycle.started, false);
}
