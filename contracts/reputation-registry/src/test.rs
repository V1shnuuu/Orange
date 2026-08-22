#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

struct Harness {
    env: Env,
    contract: Address,
    admin: Address,
    /// An authorized writer, standing in for the circle-core deployment.
    writer: Address,
}

impl Harness {
    /// An initialized registry with one authorized writer.
    fn new() -> Self {
        let env = Env::default();
        env.mock_all_auths();

        let contract = env.register(ReputationRegistryContract, ());
        let admin = Address::generate(&env);
        let writer = Address::generate(&env);

        let client = ReputationRegistryContractClient::new(&env, &contract);
        client.initialize(&admin);
        client.authorize_writer(&writer);

        Self {
            env,
            contract,
            admin,
            writer,
        }
    }

    fn client(&self) -> ReputationRegistryContractClient<'_> {
        ReputationRegistryContractClient::new(&self.env, &self.contract)
    }

    fn member(&self) -> Address {
        Address::generate(&self.env)
    }

    /// Record `count` clean cycles for a member.
    fn successes(&self, member: &Address, count: u32) {
        for _ in 0..count {
            self.client()
                .update_score(&self.writer, member, &true, &false, &false);
        }
    }
}

// --- authorization ---

#[test]
fn test_initialize_sets_the_admin_once() {
    let h = Harness::new();

    assert_eq!(h.client().get_admin(), Some(h.admin.clone()));
    assert_eq!(
        h.client().try_initialize(&h.member()),
        Err(Ok(ReputationError::AlreadyInitialized))
    );
}

#[test]
fn test_an_unauthorized_caller_cannot_write_scores() {
    let h = Harness::new();
    let attacker = h.member();

    // The whole point: a wallet must not be able to inflate its own standing.
    assert_eq!(
        h.client()
            .try_update_score(&attacker, &attacker, &true, &false, &false),
        Err(Ok(ReputationError::Unauthorized))
    );
    assert_eq!(
        h.client().try_record_circle_joined(&attacker, &attacker),
        Err(Ok(ReputationError::Unauthorized))
    );

    let score = h.client().get_score(&attacker);
    assert_eq!(score.successful_cycles, 0);
    assert_eq!(score.total_circles, 0);
    assert_eq!(h.client().get_badge(&attacker), Badge::None);
}

#[test]
fn test_an_unauthorized_caller_cannot_smear_someone_else() {
    let h = Harness::new();
    let victim = h.member();
    let attacker = h.member();

    h.successes(&victim, 20);
    assert_eq!(h.client().get_badge(&victim), Badge::Diamond);

    // A default would wipe the victim's badge, so this must be refused too.
    assert_eq!(
        h.client()
            .try_update_score(&attacker, &victim, &false, &false, &true),
        Err(Ok(ReputationError::Unauthorized))
    );
    assert_eq!(h.client().get_score(&victim).defaults, 0);
    assert_eq!(h.client().get_badge(&victim), Badge::Diamond);
}

#[test]
fn test_authorized_writer_is_accepted() {
    let h = Harness::new();
    let member = h.member();

    assert_eq!(h.client().is_writer(&h.writer), true);
    h.client()
        .update_score(&h.writer, &member, &true, &false, &false);

    assert_eq!(h.client().get_score(&member).successful_cycles, 1);
}

#[test]
fn test_revoked_writer_loses_access() {
    let h = Harness::new();
    let member = h.member();

    h.client().revoke_writer(&h.writer);
    assert_eq!(h.client().is_writer(&h.writer), false);

    assert_eq!(
        h.client()
            .try_update_score(&h.writer, &member, &true, &false, &false),
        Err(Ok(ReputationError::Unauthorized))
    );
}

#[test]
fn test_writers_can_be_granted_independently() {
    let h = Harness::new();
    let second = h.member();
    let member = h.member();

    assert_eq!(h.client().is_writer(&second), false);
    h.client().authorize_writer(&second);

    h.client()
        .update_score(&second, &member, &true, &false, &false);
    h.client()
        .update_score(&h.writer, &member, &true, &false, &false);

    assert_eq!(h.client().get_score(&member).successful_cycles, 2);
}

#[test]
fn test_writes_rejected_before_initialization() {
    let env = Env::default();
    env.mock_all_auths();
    let contract = env.register(ReputationRegistryContract, ());
    let client = ReputationRegistryContractClient::new(&env, &contract);
    let member = Address::generate(&env);

    assert_eq!(client.get_admin(), None);
    assert_eq!(
        client.try_update_score(&member, &member, &true, &false, &false),
        Err(Ok(ReputationError::NotInitialized))
    );
}

// --- scoring ---

#[test]
fn test_unknown_member_starts_clean() {
    let h = Harness::new();
    let member = h.member();

    let score = h.client().get_score(&member);
    assert_eq!(score.total_circles, 0);
    assert_eq!(score.successful_cycles, 0);
    assert_eq!(score.late_payments, 0);
    assert_eq!(score.defaults, 0);
    // A member with no history is given the benefit of the doubt.
    assert_eq!(score.completion_rate, 100);
    assert_eq!(h.client().get_badge(&member), Badge::None);
}

#[test]
fn test_successful_cycle_is_recorded() {
    let h = Harness::new();
    let member = h.member();

    h.client()
        .update_score(&h.writer, &member, &true, &false, &false);

    let score = h.client().get_score(&member);
    assert_eq!(score.successful_cycles, 1);
    assert_eq!(score.late_payments, 0);
    assert_eq!(score.defaults, 0);
    assert_eq!(score.completion_rate, 100);
}

#[test]
fn test_late_and_defaulted_cycles_are_recorded() {
    let h = Harness::new();
    let member = h.member();

    h.client()
        .update_score(&h.writer, &member, &false, &true, &false);
    h.client()
        .update_score(&h.writer, &member, &false, &false, &true);

    let score = h.client().get_score(&member);
    assert_eq!(score.successful_cycles, 0);
    assert_eq!(score.late_payments, 1);
    assert_eq!(score.defaults, 1);
    assert_eq!(score.completion_rate, 0);
}

#[test]
fn test_completion_rate_is_successes_over_total_activity() {
    let h = Harness::new();
    let member = h.member();

    h.successes(&member, 3);
    h.client()
        .update_score(&h.writer, &member, &false, &true, &false);

    // 3 clean cycles out of 4 recorded cycles.
    assert_eq!(h.client().get_score(&member).completion_rate, 75);
}

#[test]
fn test_scores_are_tracked_per_member() {
    let h = Harness::new();
    let member = h.member();
    let other = h.member();

    h.successes(&member, 2);

    assert_eq!(h.client().get_score(&member).successful_cycles, 2);
    assert_eq!(h.client().get_score(&other).successful_cycles, 0);
}

#[test]
fn test_badge_tiers_track_successful_cycles() {
    let h = Harness::new();

    for (cycles, expected) in [
        (1u32, Badge::Bronze),
        (5, Badge::Silver),
        (10, Badge::Gold),
        (20, Badge::Diamond),
    ] {
        let member = h.member();
        h.successes(&member, cycles);
        assert_eq!(h.client().get_badge(&member), expected);
    }
}

#[test]
fn test_late_payments_hold_a_member_at_a_lower_tier() {
    let h = Harness::new();
    let member = h.member();

    // 10 clean cycles would be Gold, but enough late cycles drag the
    // completion rate below the Gold threshold.
    h.successes(&member, 10);
    for _ in 0..3 {
        h.client()
            .update_score(&h.writer, &member, &false, &true, &false);
    }

    assert_eq!(h.client().get_score(&member).completion_rate, 76);
    assert_eq!(h.client().get_badge(&member), Badge::Bronze);
}

#[test]
fn test_a_single_default_clears_the_badge() {
    let h = Harness::new();
    let member = h.member();

    h.successes(&member, 20);
    assert_eq!(h.client().get_badge(&member), Badge::Diamond);

    h.client()
        .update_score(&h.writer, &member, &false, &false, &true);

    // Defaulting on a circle costs a member its standing outright.
    assert_eq!(h.client().get_score(&member).defaults, 1);
    assert_eq!(h.client().get_badge(&member), Badge::None);
}

#[test]
fn test_circle_participation_is_counted() {
    let h = Harness::new();
    let member = h.member();

    h.client().record_circle_joined(&h.writer, &member);
    h.client().record_circle_joined(&h.writer, &member);

    assert_eq!(h.client().get_score(&member).total_circles, 2);
}

#[test]
fn test_circle_count_is_independent_of_cycle_outcomes() {
    let h = Harness::new();
    let member = h.member();

    // One circle that ran for three cycles.
    h.client().record_circle_joined(&h.writer, &member);
    h.successes(&member, 3);

    let score = h.client().get_score(&member);
    assert_eq!(score.total_circles, 1);
    assert_eq!(score.successful_cycles, 3);
}

#[test]
fn test_circle_count_survives_later_score_updates() {
    let h = Harness::new();
    let member = h.member();

    h.client().record_circle_joined(&h.writer, &member);
    h.client()
        .update_score(&h.writer, &member, &true, &false, &false);
    h.client()
        .update_score(&h.writer, &member, &false, &true, &false);

    assert_eq!(h.client().get_score(&member).total_circles, 1);
}
