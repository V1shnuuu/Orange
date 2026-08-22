#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ReputationError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
}

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

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// The address allowed to grant and revoke writers.
    Admin,
    /// Contracts permitted to write scores — in practice circle-core.
    Writer(Address),
    /// A member's ReputationScore.
    Score(Address),
}

#[contract]
pub struct ReputationRegistryContract;

/// The score a member carries before it has any recorded history. A member
/// with no activity yet is given the benefit of the doubt on completion rate.
fn blank_score() -> ReputationScore {
    ReputationScore {
        total_circles: 0,
        successful_cycles: 0,
        late_payments: 0,
        defaults: 0,
        completion_rate: 100,
    }
}

fn read_score(env: &Env, member: &Address) -> ReputationScore {
    env.storage()
        .persistent()
        .get(&DataKey::Score(member.clone()))
        .unwrap_or_else(blank_score)
}

/// A score write is only accepted from an address the admin has authorized,
/// and only when that address actually signed the call.
fn require_writer(env: &Env, caller: &Address) -> Result<(), ReputationError> {
    if !env.storage().instance().has(&DataKey::Admin) {
        return Err(ReputationError::NotInitialized);
    }

    caller.require_auth();

    if !env
        .storage()
        .persistent()
        .has(&DataKey::Writer(caller.clone()))
    {
        return Err(ReputationError::Unauthorized);
    }

    Ok(())
}

#[contractimpl]
impl ReputationRegistryContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), ReputationError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ReputationError::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Permit `writer` to record scores. Intended for the circle-core
    /// deployment, which is the only thing that observes a cycle outcome.
    pub fn authorize_writer(env: Env, writer: Address) -> Result<(), ReputationError> {
        Self::require_admin(&env)?;
        env.storage()
            .persistent()
            .set(&DataKey::Writer(writer.clone()), &true);
        env.events()
            .publish((symbol_short!("wr_add"), writer), ());
        Ok(())
    }

    pub fn revoke_writer(env: Env, writer: Address) -> Result<(), ReputationError> {
        Self::require_admin(&env)?;
        env.storage()
            .persistent()
            .remove(&DataKey::Writer(writer.clone()));
        env.events()
            .publish((symbol_short!("wr_del"), writer), ());
        Ok(())
    }

    fn require_admin(env: &Env) -> Result<(), ReputationError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ReputationError::NotInitialized)?;
        admin.require_auth();
        Ok(())
    }

    pub fn is_writer(env: Env, addr: Address) -> bool {
        env.storage().persistent().has(&DataKey::Writer(addr))
    }

    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }

    /// Record that a member has taken part in another circle.
    ///
    /// Circle participation is counted separately from cycle outcomes: a
    /// single circle produces one `record_circle_joined` call and one
    /// `update_score` call per cycle.
    pub fn record_circle_joined(
        env: Env,
        caller: Address,
        member: Address,
    ) -> Result<(), ReputationError> {
        require_writer(&env, &caller)?;

        let mut score = read_score(&env, &member);
        score.total_circles += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Score(member.clone()), &score);

        env.events()
            .publish((symbol_short!("circ_add"), member), score.total_circles);
        Ok(())
    }

    pub fn update_score(
        env: Env,
        caller: Address,
        member: Address,
        successful: bool,
        late: bool,
        defaulted: bool,
    ) -> Result<(), ReputationError> {
        require_writer(&env, &caller)?;

        let mut score = read_score(&env, &member);

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

        env.storage()
            .persistent()
            .set(&DataKey::Score(member.clone()), &score);

        env.events()
            .publish((symbol_short!("rep_upd"), member), score.completion_rate);
        Ok(())
    }

    pub fn get_score(env: Env, member: Address) -> ReputationScore {
        read_score(&env, &member)
    }

    pub fn get_badge(env: Env, member: Address) -> Badge {
        let score = read_score(&env, &member);

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

#[cfg(test)]
mod test;
