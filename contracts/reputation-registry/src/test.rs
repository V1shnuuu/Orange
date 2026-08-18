#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup() -> (Env, ReputationRegistryContractClient<'static>, Address) {
    let env = Env::default();
    let contract_id = env.register(ReputationRegistryContract, ());
    let client = ReputationRegistryContractClient::new(&env, &contract_id);
    let member = Address::generate(&env);
    (env, client, member)
}

/// Record `count` clean cycles for a member.
fn record_successes(client: &ReputationRegistryContractClient, member: &Address, count: u32) {
    for _ in 0..count {
        client.update_score(member, &true, &false, &false);
    }
}

#[test]
fn test_unknown_member_starts_clean() {
    let (_env, client, member) = setup();

    let score = client.get_score(&member);
    assert_eq!(score.total_circles, 0);
    assert_eq!(score.successful_cycles, 0);
    assert_eq!(score.late_payments, 0);
    assert_eq!(score.defaults, 0);
    // A member with no history is given the benefit of the doubt.
    assert_eq!(score.completion_rate, 100);
    assert_eq!(client.get_badge(&member), Badge::None);
}

#[test]
fn test_successful_cycle_is_recorded() {
    let (_env, client, member) = setup();

    client.update_score(&member, &true, &false, &false);

    let score = client.get_score(&member);
    assert_eq!(score.successful_cycles, 1);
    assert_eq!(score.late_payments, 0);
    assert_eq!(score.defaults, 0);
    assert_eq!(score.completion_rate, 100);
}

#[test]
fn test_late_and_defaulted_cycles_are_recorded() {
    let (_env, client, member) = setup();

    client.update_score(&member, &false, &true, &false);
    client.update_score(&member, &false, &false, &true);

    let score = client.get_score(&member);
    assert_eq!(score.successful_cycles, 0);
    assert_eq!(score.late_payments, 1);
    assert_eq!(score.defaults, 1);
    assert_eq!(score.completion_rate, 0);
}

#[test]
fn test_completion_rate_is_successes_over_total_activity() {
    let (_env, client, member) = setup();

    record_successes(&client, &member, 3);
    client.update_score(&member, &false, &true, &false);

    // 3 clean cycles out of 4 recorded cycles.
    assert_eq!(client.get_score(&member).completion_rate, 75);
}

#[test]
fn test_scores_are_tracked_per_member() {
    let (env, client, member) = setup();
    let other = Address::generate(&env);

    record_successes(&client, &member, 2);

    assert_eq!(client.get_score(&member).successful_cycles, 2);
    assert_eq!(client.get_score(&other).successful_cycles, 0);
}

#[test]
fn test_badge_tiers_track_successful_cycles() {
    let (env, client, _member) = setup();

    let bronze = Address::generate(&env);
    record_successes(&client, &bronze, 1);
    assert_eq!(client.get_badge(&bronze), Badge::Bronze);

    let silver = Address::generate(&env);
    record_successes(&client, &silver, 5);
    assert_eq!(client.get_badge(&silver), Badge::Silver);

    let gold = Address::generate(&env);
    record_successes(&client, &gold, 10);
    assert_eq!(client.get_badge(&gold), Badge::Gold);

    let diamond = Address::generate(&env);
    record_successes(&client, &diamond, 20);
    assert_eq!(client.get_badge(&diamond), Badge::Diamond);
}

#[test]
fn test_late_payments_hold_a_member_at_a_lower_tier() {
    let (_env, client, member) = setup();

    // 10 clean cycles would be Gold, but enough late cycles drag the
    // completion rate below the Gold threshold.
    record_successes(&client, &member, 10);
    for _ in 0..3 {
        client.update_score(&member, &false, &true, &false);
    }

    assert_eq!(client.get_score(&member).completion_rate, 76);
    assert_eq!(client.get_badge(&member), Badge::Bronze);
}

#[test]
fn test_a_single_default_clears_the_badge() {
    let (_env, client, member) = setup();

    record_successes(&client, &member, 20);
    assert_eq!(client.get_badge(&member), Badge::Diamond);

    client.update_score(&member, &false, &false, &true);

    // Defaulting on a circle costs a member its standing outright.
    assert_eq!(client.get_score(&member).defaults, 1);
    assert_eq!(client.get_badge(&member), Badge::None);
}
