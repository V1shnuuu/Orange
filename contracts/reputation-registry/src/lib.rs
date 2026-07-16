#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, log};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationScore {
    pub total_circles: u32,
    pub successful_cycles: u32,
    pub late_payments: u32,
    pub defaults: u32,
    pub completion_rate: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Badge {
    None,
    Bronze,
    Silver,
    Gold,
    Diamond,
}

#[contract]
pub struct ReputationRegistryContract;

#[contractimpl]
impl ReputationRegistryContract {
    pub fn update_score(
        env: Env,
        member: Address,
        successful: bool,
        late: bool,
        defaulted: bool,
    ) {
        // In a production app, this would be restricted to authorized factory/core contracts
        
        let mut score: ReputationScore = env
            .storage()
            .persistent()
            .get(&member)
            .unwrap_or(ReputationScore {
                total_circles: 0,
                successful_cycles: 0,
                late_payments: 0,
                defaults: 0,
                completion_rate: 100,
            });

        if successful {
            score.successful_cycles += 1;
        }
        if late {
            score.late_payments += 1;
        }
        if defaulted {
            score.defaults += 1;
        }

        // Calculate a basic completion rate
        let total_activity = score.successful_cycles + score.late_payments + score.defaults;
        if total_activity > 0 {
            score.completion_rate = (score.successful_cycles * 100) / total_activity;
        }

        env.storage().persistent().set(&member, &score);

        // Emit an event for score update, can be used for badge updates
        env.events().publish((symbol_short!("rep_upd"), member), score.completion_rate);
        log!(&env, "Reputation updated");
    }

    pub fn get_score(env: Env, member: Address) -> ReputationScore {
        env.storage()
            .persistent()
            .get(&member)
            .unwrap_or(ReputationScore {
                total_circles: 0,
                successful_cycles: 0,
                late_payments: 0,
                defaults: 0,
                completion_rate: 100,
            })
    }

    pub fn get_badge(env: Env, member: Address) -> Badge {
        let score = Self::get_score(env, member);
        
        if score.defaults > 0 {
            return Badge::None;
        }

        if score.successful_cycles >= 20 && score.completion_rate >= 95 {
            Badge::Diamond
        } else if score.successful_cycles >= 10 && score.completion_rate >= 90 {
            Badge::Gold
        } else if score.successful_cycles >= 5 && score.completion_rate >= 80 {
            Badge::Silver
        } else if score.successful_cycles >= 1 {
            Badge::Bronze
        } else {
            Badge::None
        }
    }
}
