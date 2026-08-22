#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env, Symbol,
};

const SEATS: u32 = 3;
const CONTRIBUTION: i128 = 50_000_000;
const MINT_AMOUNT: i128 = 500_000_000;

struct Harness {
    env: Env,
    contract: Address,
    token: Address,
    admin: Address,
}

impl Harness {
    fn new() -> Self {
        let env = Env::default();
        env.mock_all_auths();

        let contract = env.register(CircleCoreContract, ());
        let token_admin = Address::generate(&env);
        let token = env
            .register_stellar_asset_contract_v2(token_admin)
            .address()
            .clone();
        let admin = Address::generate(&env);

        Self {
            env,
            contract,
            token,
            admin,
        }
    }

    fn client(&self) -> CircleCoreContractClient<'_> {
        CircleCoreContractClient::new(&self.env, &self.contract)
    }

    fn token_client(&self) -> TokenClient<'_> {
        TokenClient::new(&self.env, &self.token)
    }

    fn id(&self, name: &str) -> Symbol {
        Symbol::new(&self.env, name)
    }

    /// Open a circle with the default seat count and contribution.
    fn open(&self, name: &str) -> Symbol {
        let circle_id = self.id(name);
        self.client().initialize(
            &circle_id,
            &self.admin,
            &self.token,
            &SEATS,
            &CONTRIBUTION,
        );
        circle_id
    }

    /// Generate a funded wallet that has not joined anything.
    fn wallet(&self) -> Address {
        let wallet = Address::generate(&self.env);
        StellarAssetClient::new(&self.env, &self.token).mint(&wallet, &MINT_AMOUNT);
        wallet
    }

    /// Fill a circle to capacity, which auto-starts it. Returned in join
    /// order, which is also payout order.
    fn fill(&self, circle_id: &Symbol) -> Vec<Address> {
        let mut members = Vec::new(&self.env);
        for _ in 0..SEATS {
            let wallet = self.wallet();
            self.client().join_circle(circle_id, &wallet);
            members.push_back(wallet);
        }
        members
    }
}

#[test]
fn test_initialize_sets_cycle_defaults() {
    let h = Harness::new();
    let circle_id = h.open("alpha");

    let cycle = h.client().get_cycle_info(&circle_id).unwrap();
    assert_eq!(cycle.current_cycle, 1);
    assert_eq!(cycle.max_cycles, SEATS);
    assert_eq!(cycle.contributions_this_cycle, 0);
    assert_eq!(cycle.next_payout_index, 0);
    assert_eq!(cycle.started, false);
    assert_eq!(cycle.completed, false);

    assert_eq!(h.client().get_contribution_amount(&circle_id), CONTRIBUTION);
    assert_eq!(h.client().get_members(&circle_id).len(), 0);
}

#[test]
fn test_duplicate_circle_id_rejected() {
    let h = Harness::new();
    let circle_id = h.open("alpha");

    let result = h.client().try_initialize(
        &circle_id,
        &h.admin,
        &h.token,
        &SEATS,
        &CONTRIBUTION,
    );
    assert_eq!(result, Err(Ok(CircleError::CircleAlreadyExists)));
}

#[test]
fn test_initialize_rejects_non_positive_contribution() {
    let h = Harness::new();

    let result = h.client().try_initialize(
        &h.id("alpha"),
        &h.admin,
        &h.token,
        &SEATS,
        &0,
    );
    assert_eq!(result, Err(Ok(CircleError::InvalidAmount)));
}

#[test]
fn test_initialize_rejects_out_of_range_seat_counts() {
    let h = Harness::new();

    for seats in [0u32, 1, 21, 100] {
        let result = h.client().try_initialize(
            &h.id("alpha"),
            &h.admin,
            &h.token,
            &seats,
            &CONTRIBUTION,
        );
        assert_eq!(result, Err(Ok(CircleError::InvalidMemberCount)));
    }
}

#[test]
fn test_actions_on_an_unknown_circle_are_rejected() {
    let h = Harness::new();
    let ghost = h.id("ghost");
    let wallet = h.wallet();

    assert_eq!(
        h.client().try_join_circle(&ghost, &wallet),
        Err(Ok(CircleError::CircleNotFound))
    );
    assert_eq!(
        h.client().try_contribute(&ghost, &wallet, &CONTRIBUTION),
        Err(Ok(CircleError::CircleNotFound))
    );
    assert_eq!(h.client().get_circle(&ghost), None);
    assert_eq!(h.client().get_cycle_info(&ghost), None);
    assert_eq!(h.client().get_members(&ghost).len(), 0);
}

#[test]
fn test_join_circle_registers_member() {
    let h = Harness::new();
    let circle_id = h.open("alpha");
    let wallet = h.wallet();

    h.client().join_circle(&circle_id, &wallet);

    let members = h.client().get_members(&circle_id);
    assert_eq!(members.len(), 1);
    assert_eq!(members.get(0).unwrap(), wallet);

    let info = h.client().get_member_info(&circle_id, &wallet).unwrap();
    assert_eq!(info.has_contributed_current, false);
    assert_eq!(info.payouts_received, 0);
}

#[test]
fn test_join_circle_rejects_duplicate_member() {
    let h = Harness::new();
    let circle_id = h.open("alpha");
    let wallet = h.wallet();

    h.client().join_circle(&circle_id, &wallet);

    assert_eq!(
        h.client().try_join_circle(&circle_id, &wallet),
        Err(Ok(CircleError::AlreadyMember))
    );
    assert_eq!(h.client().get_members(&circle_id).len(), 1);
}

#[test]
fn test_circle_auto_starts_when_full() {
    let h = Harness::new();
    let circle_id = h.open("alpha");

    h.fill(&circle_id);

    let cycle = h.client().get_cycle_info(&circle_id).unwrap();
    assert_eq!(cycle.started, true);
    assert_eq!(h.client().get_members(&circle_id).len(), SEATS);
}

#[test]
fn test_join_rejected_once_every_seat_is_taken() {
    let h = Harness::new();
    let circle_id = h.open("alpha");
    h.fill(&circle_id);

    let latecomer = h.wallet();
    assert_eq!(
        h.client().try_join_circle(&circle_id, &latecomer),
        Err(Ok(CircleError::CircleFull))
    );
    assert_eq!(h.client().get_members(&circle_id).len(), SEATS);
}

#[test]
fn test_contribute_before_circle_starts_rejected() {
    let h = Harness::new();
    let circle_id = h.open("alpha");
    let wallet = h.wallet();
    h.client().join_circle(&circle_id, &wallet);

    assert_eq!(
        h.client().try_contribute(&circle_id, &wallet, &CONTRIBUTION),
        Err(Ok(CircleError::CircleNotStarted))
    );
}

#[test]
fn test_contribute_by_non_member_rejected() {
    let h = Harness::new();
    let circle_id = h.open("alpha");
    h.fill(&circle_id);

    let outsider = h.wallet();
    assert_eq!(
        h.client().try_contribute(&circle_id, &outsider, &CONTRIBUTION),
        Err(Ok(CircleError::NotMember))
    );
}

#[test]
fn test_contribute_rejects_any_amount_but_the_circle_amount() {
    let h = Harness::new();
    let circle_id = h.open("alpha");
    let members = h.fill(&circle_id);
    let member = members.get(0).unwrap();

    for amount in [0, -1, CONTRIBUTION - 1, CONTRIBUTION * 2] {
        assert_eq!(
            h.client().try_contribute(&circle_id, &member, &amount),
            Err(Ok(CircleError::InvalidAmount))
        );
    }

    assert_eq!(h.token_client().balance(&h.contract), 0);
    assert_eq!(
        h.client()
            .get_cycle_info(&circle_id)
            .unwrap()
            .contributions_this_cycle,
        0
    );
}

#[test]
fn test_contribute_moves_tokens_into_the_circle() {
    let h = Harness::new();
    let circle_id = h.open("alpha");
    let members = h.fill(&circle_id);
    let member = members.get(0).unwrap();

    h.client().contribute(&circle_id, &member, &CONTRIBUTION);

    assert_eq!(h.token_client().balance(&member), MINT_AMOUNT - CONTRIBUTION);
    assert_eq!(h.token_client().balance(&h.contract), CONTRIBUTION);

    let circle = h.client().get_circle(&circle_id).unwrap();
    assert_eq!(circle.contributions_this_cycle, 1);
    assert_eq!(circle.total_contributed, CONTRIBUTION);
}

#[test]
fn test_double_contribute_in_same_cycle_rejected() {
    let h = Harness::new();
    let circle_id = h.open("alpha");
    let members = h.fill(&circle_id);
    let member = members.get(0).unwrap();

    h.client().contribute(&circle_id, &member, &CONTRIBUTION);

    assert_eq!(
        h.client().try_contribute(&circle_id, &member, &CONTRIBUTION),
        Err(Ok(CircleError::AlreadyContributed))
    );
    assert_eq!(
        h.client()
            .get_cycle_info(&circle_id)
            .unwrap()
            .contributions_this_cycle,
        1
    );
}

#[test]
fn test_completed_cycle_pays_out_the_first_member() {
    let h = Harness::new();
    let circle_id = h.open("alpha");
    let members = h.fill(&circle_id);

    for member in members.iter() {
        h.client().contribute(&circle_id, &member, &CONTRIBUTION);
    }

    let pot = CONTRIBUTION * SEATS as i128;
    let recipient = members.get(0).unwrap();

    assert_eq!(
        h.token_client().balance(&recipient),
        MINT_AMOUNT - CONTRIBUTION + pot
    );
    assert_eq!(h.token_client().balance(&h.contract), 0);
    assert_eq!(
        h.client()
            .get_member_info(&circle_id, &recipient)
            .unwrap()
            .payouts_received,
        1
    );

    let cycle = h.client().get_cycle_info(&circle_id).unwrap();
    assert_eq!(cycle.current_cycle, 2);
    assert_eq!(cycle.contributions_this_cycle, 0);
    assert_eq!(cycle.next_payout_index, 1);
    assert_eq!(cycle.started, true);

    // Everyone, the recipient included, may contribute again next cycle.
    for member in members.iter() {
        assert_eq!(
            h.client()
                .get_member_info(&circle_id, &member)
                .unwrap()
                .has_contributed_current,
            false
        );
    }
}

#[test]
fn test_payout_rotates_through_every_member_then_completes() {
    let h = Harness::new();
    let circle_id = h.open("alpha");
    let members = h.fill(&circle_id);

    for cycle in 1..=SEATS {
        for member in members.iter() {
            h.client().contribute(&circle_id, &member, &CONTRIBUTION);
        }

        let recipient = members.get(cycle - 1).unwrap();
        assert_eq!(
            h.client()
                .get_member_info(&circle_id, &recipient)
                .unwrap()
                .payouts_received,
            1
        );
    }

    // Everyone paid in three times and was paid out once, so all are square.
    for member in members.iter() {
        assert_eq!(h.token_client().balance(&member), MINT_AMOUNT);
    }
    assert_eq!(h.token_client().balance(&h.contract), 0);

    let cycle = h.client().get_cycle_info(&circle_id).unwrap();
    assert_eq!(cycle.started, false);
    assert_eq!(cycle.completed, true);

    // A completed circle takes no further contributions.
    assert_eq!(
        h.client()
            .try_contribute(&circle_id, &members.get(0).unwrap(), &CONTRIBUTION),
        Err(Ok(CircleError::CircleNotStarted))
    );
}

// --- multi-tenancy: the whole point of keying state by circle_id ---

#[test]
fn test_one_deployment_backs_many_independent_circles() {
    let h = Harness::new();
    let alpha = h.open("alpha");
    let beta = h.open("beta");

    let alpha_members = h.fill(&alpha);
    h.client()
        .contribute(&alpha, &alpha_members.get(0).unwrap(), &CONTRIBUTION);

    // beta is untouched by anything that happened in alpha.
    let beta_cycle = h.client().get_cycle_info(&beta).unwrap();
    assert_eq!(beta_cycle.started, false);
    assert_eq!(beta_cycle.contributions_this_cycle, 0);
    assert_eq!(h.client().get_members(&beta).len(), 0);

    let alpha_cycle = h.client().get_cycle_info(&alpha).unwrap();
    assert_eq!(alpha_cycle.started, true);
    assert_eq!(alpha_cycle.contributions_this_cycle, 1);
}

#[test]
fn test_a_wallet_can_belong_to_several_circles_at_once() {
    let h = Harness::new();
    let alpha = h.open("alpha");
    let beta = h.open("beta");

    let wallet = h.wallet();
    h.client().join_circle(&alpha, &wallet);
    h.client().join_circle(&beta, &wallet);

    assert_eq!(h.client().get_members(&alpha).len(), 1);
    assert_eq!(h.client().get_members(&beta).len(), 1);
    assert!(h.client().get_member_info(&alpha, &wallet).is_some());
    assert!(h.client().get_member_info(&beta, &wallet).is_some());
}

#[test]
fn test_contributing_to_one_circle_does_not_mark_the_other() {
    let h = Harness::new();
    let alpha = h.open("alpha");
    let beta = h.open("beta");

    // A wallet that sits in both circles, each filled with its own others.
    let shared = h.wallet();
    h.client().join_circle(&alpha, &shared);
    h.client().join_circle(&beta, &shared);
    for _ in 0..(SEATS - 1) {
        let filler = h.wallet();
        h.client().join_circle(&alpha, &filler);
        let filler = h.wallet();
        h.client().join_circle(&beta, &filler);
    }

    h.client().contribute(&alpha, &shared, &CONTRIBUTION);

    assert_eq!(
        h.client()
            .get_member_info(&alpha, &shared)
            .unwrap()
            .has_contributed_current,
        true
    );
    assert_eq!(
        h.client()
            .get_member_info(&beta, &shared)
            .unwrap()
            .has_contributed_current,
        false
    );
}

#[test]
fn test_circles_can_use_different_contribution_amounts() {
    let h = Harness::new();
    let cheap = h.id("cheap");
    let pricey = h.id("pricey");

    h.client()
        .initialize(&cheap, &h.admin, &h.token, &SEATS, &CONTRIBUTION);
    h.client()
        .initialize(&pricey, &h.admin, &h.token, &SEATS, &(CONTRIBUTION * 2));

    assert_eq!(h.client().get_contribution_amount(&cheap), CONTRIBUTION);
    assert_eq!(
        h.client().get_contribution_amount(&pricey),
        CONTRIBUTION * 2
    );

    let members = h.fill(&cheap);
    // The pricey circle's amount is rejected by the cheap one.
    assert_eq!(
        h.client()
            .try_contribute(&cheap, &members.get(0).unwrap(), &(CONTRIBUTION * 2)),
        Err(Ok(CircleError::InvalidAmount))
    );
}

#[test]
fn test_list_circles_enumerates_every_opened_circle() {
    let h = Harness::new();
    assert_eq!(h.client().list_circles().len(), 0);

    h.open("alpha");
    h.open("beta");
    h.open("gamma");

    let ids = h.client().list_circles();
    assert_eq!(ids.len(), 3);
    assert_eq!(ids.get(0).unwrap(), h.id("alpha"));
    assert_eq!(ids.get(2).unwrap(), h.id("gamma"));
}
