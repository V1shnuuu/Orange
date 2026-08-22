#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Symbol,
    Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum CircleError {
    CircleNotFound = 1,
    CircleAlreadyExists = 2,
    CircleFull = 3,
    AlreadyMember = 4,
    NotMember = 5,
    InvalidAmount = 6,
    CircleNotStarted = 7,
    AlreadyContributed = 8,
    CircleAlreadyStarted = 9,
    InvalidMemberCount = 10,
}

/// A circle needs at least two members to rotate a pot between, and the
/// members vector is read and rewritten on every contribution, so the upper
/// bound keeps that cost predictable.
const MIN_MEMBERS: u32 = 2;
const MAX_MEMBERS: u32 = 20;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MemberInfo {
    pub joined_at: u64,
    pub has_contributed_current: bool,
    pub payouts_received: u32,
}

/// Everything one circle owns. Keyed by `circle_id`, so a single deployment
/// backs any number of concurrent circles.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CircleState {
    pub name: Symbol,
    pub cycle_duration: u32,
    pub admin: Address,
    pub token: Address,
    pub contribution_amount: i128,
    pub members: Vec<Address>,
    pub max_members: u32,
    pub current_cycle: u32,
    pub contributions_this_cycle: u32,
    pub next_payout_index: u32,
    pub started: bool,
    pub completed: bool,
    pub total_contributed: i128,
}

/// The subset of [`CircleState`] the dashboard polls for.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CycleInfo {
    pub current_cycle: u32,
    pub max_cycles: u32,
    pub contributions_this_cycle: u32,
    pub next_payout_index: u32,
    pub started: bool,
    pub completed: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// CircleState for one circle.
    Circle(Symbol),
    /// MemberInfo, scoped to a circle so a wallet can be in many at once.
    Member(Symbol, Address),
    /// Every circle id this contract has opened, for enumeration.
    CircleIds,
}

#[contract]
pub struct CircleCoreContract;

fn load_circle(env: &Env, circle_id: &Symbol) -> Result<CircleState, CircleError> {
    env.storage()
        .persistent()
        .get(&DataKey::Circle(circle_id.clone()))
        .ok_or(CircleError::CircleNotFound)
}

fn save_circle(env: &Env, circle_id: &Symbol, circle: &CircleState) {
    env.storage()
        .persistent()
        .set(&DataKey::Circle(circle_id.clone()), circle);
}

#[contractimpl]
impl CircleCoreContract {
    /// Open a new circle under `circle_id`.
    ///
    /// Unlike the previous single-instance design, this may be called once per
    /// circle against the same deployment.
    pub fn initialize(
        env: Env,
        circle_id: Symbol,
        name: Symbol,
        admin: Address,
        token: Address,
        max_members: u32,
        contribution_amount: i128,
        cycle_duration: u32,
    ) -> Result<(), CircleError> {
        admin.require_auth();

        if env
            .storage()
            .persistent()
            .has(&DataKey::Circle(circle_id.clone()))
        {
            return Err(CircleError::CircleAlreadyExists);
        }

        if !(MIN_MEMBERS..=MAX_MEMBERS).contains(&max_members) {
            return Err(CircleError::InvalidMemberCount);
        }

        if contribution_amount <= 0 {
            return Err(CircleError::InvalidAmount);
        }

        let circle = CircleState {
            name,
            cycle_duration,
            admin,
            token,
            contribution_amount,
            members: Vec::new(&env),
            max_members,
            current_cycle: 1,
            contributions_this_cycle: 0,
            next_payout_index: 0,
            started: false,
            completed: false,
            total_contributed: 0,
        };
        save_circle(&env, &circle_id, &circle);

        let mut ids: Vec<Symbol> = env
            .storage()
            .persistent()
            .get(&DataKey::CircleIds)
            .unwrap_or(Vec::new(&env));
        ids.push_back(circle_id.clone());
        env.storage().persistent().set(&DataKey::CircleIds, &ids);

        env.events()
            .publish((symbol_short!("opened"), circle_id), max_members);
        Ok(())
    }

    pub fn join_circle(env: Env, circle_id: Symbol, member: Address) -> Result<bool, CircleError> {
        member.require_auth();

        let mut circle = load_circle(&env, &circle_id)?;

        if circle.members.len() >= circle.max_members {
            return Err(CircleError::CircleFull);
        }

        if circle.started {
            return Err(CircleError::CircleAlreadyStarted);
        }

        let member_key = DataKey::Member(circle_id.clone(), member.clone());
        if env.storage().persistent().has(&member_key) {
            return Err(CircleError::AlreadyMember);
        }

        circle.members.push_back(member.clone());
        env.storage().persistent().set(
            &member_key,
            &MemberInfo {
                joined_at: env.ledger().timestamp(),
                has_contributed_current: false,
                payouts_received: 0,
            },
        );

        // A circle starts the moment its last seat is taken.
        if circle.members.len() == circle.max_members {
            circle.started = true;
        }

        let joined = circle.members.len();
        save_circle(&env, &circle_id, &circle);

        env.events()
            .publish((symbol_short!("joined"), circle_id, member), joined);
        Ok(true)
    }

    /// Give up a seat before the circle starts.
    ///
    /// Without this a member of a circle that never fills is stuck in it for
    /// good, since a started circle is the only thing that ever clears a seat.
    /// Once a circle has started the seat is committed and this is refused —
    /// members are already relying on the pot being a fixed size.
    pub fn leave_circle(env: Env, circle_id: Symbol, member: Address) -> Result<bool, CircleError> {
        member.require_auth();

        let mut circle = load_circle(&env, &circle_id)?;

        if circle.started || circle.completed {
            return Err(CircleError::CircleAlreadyStarted);
        }

        let member_key = DataKey::Member(circle_id.clone(), member.clone());
        if !env.storage().persistent().has(&member_key) {
            return Err(CircleError::NotMember);
        }

        let mut remaining = Vec::new(&env);
        for seat in circle.members.iter() {
            if seat != member {
                remaining.push_back(seat);
            }
        }
        circle.members = remaining;

        env.storage().persistent().remove(&member_key);

        let left = circle.members.len();
        save_circle(&env, &circle_id, &circle);

        env.events()
            .publish((symbol_short!("left"), circle_id, member), left);
        Ok(true)
    }

    pub fn contribute(
        env: Env,
        circle_id: Symbol,
        member: Address,
        amount: i128,
    ) -> Result<bool, CircleError> {
        member.require_auth();

        let mut circle = load_circle(&env, &circle_id)?;

        let member_key = DataKey::Member(circle_id.clone(), member.clone());
        let mut member_info: MemberInfo = env
            .storage()
            .persistent()
            .get(&member_key)
            .ok_or(CircleError::NotMember)?;

        if member_info.has_contributed_current {
            return Err(CircleError::AlreadyContributed);
        }

        if !circle.started || circle.completed {
            return Err(CircleError::CircleNotStarted);
        }

        // Every member of a ROSCA pays the same amount into each cycle. The pot
        // handed out below is priced off that figure, so an off-amount payment
        // would either short the recipient or overdraw the circle.
        if amount != circle.contribution_amount {
            return Err(CircleError::InvalidAmount);
        }

        let vault = env.current_contract_address();
        token::Client::new(&env, &circle.token).transfer(&member, &vault, &amount);

        member_info.has_contributed_current = true;
        env.storage().persistent().set(&member_key, &member_info);

        circle.contributions_this_cycle += 1;
        circle.total_contributed += amount;

        env.events()
            .publish((symbol_short!("contrib"), circle_id.clone(), member), amount);

        if circle.contributions_this_cycle == circle.max_members {
            Self::execute_payout(&env, &circle_id, &mut circle);
        }

        save_circle(&env, &circle_id, &circle);
        Ok(true)
    }

    /// Hand the full pot to the member whose turn it is, then reset the cycle.
    fn execute_payout(env: &Env, circle_id: &Symbol, circle: &mut CircleState) {
        let recipient = circle.members.get(circle.next_payout_index).unwrap();
        let pot = circle.contribution_amount * circle.max_members as i128;

        let vault = env.current_contract_address();
        token::Client::new(env, &circle.token).transfer(&vault, &recipient, &pot);

        let recipient_key = DataKey::Member(circle_id.clone(), recipient.clone());
        let mut recipient_info: MemberInfo =
            env.storage().persistent().get(&recipient_key).unwrap();
        recipient_info.payouts_received += 1;
        recipient_info.has_contributed_current = false;
        env.storage()
            .persistent()
            .set(&recipient_key, &recipient_info);

        // Clear every other member's flag for the next cycle.
        for member in circle.members.iter() {
            if member == recipient {
                continue;
            }
            let key = DataKey::Member(circle_id.clone(), member);
            let mut info: MemberInfo = env.storage().persistent().get(&key).unwrap();
            info.has_contributed_current = false;
            env.storage().persistent().set(&key, &info);
        }

        circle.current_cycle += 1;
        circle.contributions_this_cycle = 0;
        circle.next_payout_index += 1;

        // Every member has been paid once — the circle is done.
        if circle.next_payout_index >= circle.max_members {
            circle.started = false;
            circle.completed = true;
        }

        env.events()
            .publish((symbol_short!("payout"), circle_id.clone(), recipient), pot);
    }

    pub fn get_circle(env: Env, circle_id: Symbol) -> Option<CircleState> {
        env.storage().persistent().get(&DataKey::Circle(circle_id))
    }

    pub fn get_cycle_info(env: Env, circle_id: Symbol) -> Option<CycleInfo> {
        let circle: CircleState = env
            .storage()
            .persistent()
            .get(&DataKey::Circle(circle_id))?;

        Some(CycleInfo {
            current_cycle: circle.current_cycle,
            max_cycles: circle.max_members,
            contributions_this_cycle: circle.contributions_this_cycle,
            next_payout_index: circle.next_payout_index,
            started: circle.started,
            completed: circle.completed,
        })
    }

    pub fn get_members(env: Env, circle_id: Symbol) -> Vec<Address> {
        match Self::get_circle(env.clone(), circle_id) {
            Some(circle) => circle.members,
            None => Vec::new(&env),
        }
    }

    pub fn get_member_info(env: Env, circle_id: Symbol, member: Address) -> Option<MemberInfo> {
        env.storage()
            .persistent()
            .get(&DataKey::Member(circle_id, member))
    }

    pub fn get_contribution_amount(env: Env, circle_id: Symbol) -> i128 {
        Self::get_circle(env, circle_id)
            .map(|c| c.contribution_amount)
            .unwrap_or(0)
    }

    /// Every circle id this contract has opened, for the explore page.
    pub fn list_circles(env: Env) -> Vec<Symbol> {
        env.storage()
            .persistent()
            .get(&DataKey::CircleIds)
            .unwrap_or(Vec::new(&env))
    }
}

#[cfg(test)]
mod test;
