#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, symbol_short, token, Address, Env, Symbol, Vec, log
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum CircleError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    CircleFull = 3,
    AlreadyMember = 4,
    NotMember = 5,
    InvalidAmount = 6,
    CycleNotComplete = 7,
    AlreadyContributed = 8,
    CircleAlreadyStarted = 9,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MemberInfo {
    pub joined_at: u64,
    pub has_contributed_current: bool,
    pub payouts_received: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    TokenId,
    FactoryId,
    CircleId,
    Admin,
    Members,
    Member(Address),
    CycleInfo,
    TotalContributed,
    Initialized,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CycleInfo {
    pub current_cycle: u32,
    pub max_cycles: u32,
    pub contributions_this_cycle: u32,
    pub next_payout_index: u32,
    pub started: bool,
}

#[contract]
pub struct CircleCoreContract;

#[contractimpl]
impl CircleCoreContract {
    pub fn initialize(
        env: Env,
        factory_id: Address,
        token_id: Address,
        circle_id: Symbol,
        admin: Address,
        max_members: u32,
    ) -> Result<(), CircleError> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(CircleError::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::FactoryId, &factory_id);
        env.storage().instance().set(&DataKey::TokenId, &token_id);
        env.storage().instance().set(&DataKey::CircleId, &circle_id);
        env.storage().instance().set(&DataKey::Admin, &admin);
        
        env.storage().instance().set(&DataKey::Members, &Vec::<Address>::new(&env));
        env.storage().instance().set(&DataKey::CycleInfo, &CycleInfo {
            current_cycle: 1,
            max_cycles: max_members,
            contributions_this_cycle: 0,
            next_payout_index: 0,
            started: false,
        });
        
        env.storage().instance().set(&DataKey::Initialized, &true);

        log!(&env, "CircleCore initialized");
        Ok(())
    }

    pub fn join_circle(env: Env, member: Address) -> Result<bool, CircleError> {
        member.require_auth();
        
        let mut cycle_info: CycleInfo = env.storage().instance().get(&DataKey::CycleInfo).unwrap();
        if cycle_info.started {
            return Err(CircleError::CircleAlreadyStarted);
        }

        let mut members: Vec<Address> = env.storage().instance().get(&DataKey::Members).unwrap();
        if members.len() >= cycle_info.max_cycles {
            return Err(CircleError::CircleFull);
        }

        if env.storage().persistent().has(&DataKey::Member(member.clone())) {
            return Err(CircleError::AlreadyMember);
        }

        members.push_back(member.clone());
        env.storage().instance().set(&DataKey::Members, &members);

        let info = MemberInfo {
            joined_at: env.ledger().timestamp(),
            has_contributed_current: false,
            payouts_received: 0,
        };
        env.storage().persistent().set(&DataKey::Member(member.clone()), &info);

        // Auto-start if full
        if members.len() == cycle_info.max_cycles {
            cycle_info.started = true;
            env.storage().instance().set(&DataKey::CycleInfo, &cycle_info);
        }

        env.events().publish((symbol_short!("joined"), member), members.len());
        Ok(true)
    }

    pub fn contribute(env: Env, member: Address, amount: i128) -> Result<bool, CircleError> {
        member.require_auth();

        let mut member_info: MemberInfo = env
            .storage()
            .persistent()
            .get(&DataKey::Member(member.clone()))
            .ok_or(CircleError::NotMember)?;

        if member_info.has_contributed_current {
            return Err(CircleError::AlreadyContributed);
        }

        let mut cycle_info: CycleInfo = env.storage().instance().get(&DataKey::CycleInfo).unwrap();
        if !cycle_info.started {
            return Err(CircleError::NotInitialized); // Circle hasn't started yet
        }

        // We assume the amount matches the contribution_amount (should be verified via factory call in a real app, keeping it simple here)
        if amount <= 0 {
            return Err(CircleError::InvalidAmount);
        }

        let token_id: Address = env.storage().instance().get(&DataKey::TokenId).unwrap();
        let vault_address = env.current_contract_address();
        let token_client = token::Client::new(&env, &token_id);
        
        // Transfer USDC
        token_client.transfer(&member, &vault_address, &amount);

        // Update state
        member_info.has_contributed_current = true;
        env.storage().persistent().set(&DataKey::Member(member.clone()), &member_info);

        cycle_info.contributions_this_cycle += 1;
        
        // Track Total
        let total: i128 = env.storage().instance().get(&DataKey::TotalContributed).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalContributed, &(total + amount));

        env.events().publish((symbol_short!("contrib"), member.clone()), amount);

        // Check for payout
        let max_cycles = cycle_info.max_cycles;
        if cycle_info.contributions_this_cycle == max_cycles {
            Self::execute_payout(&env, &mut cycle_info, amount * max_cycles as i128)?;
        } else {
            env.storage().instance().set(&DataKey::CycleInfo, &cycle_info);
        }

        Ok(true)
    }

    fn execute_payout(env: &Env, cycle_info: &mut CycleInfo, payout_amount: i128) -> Result<(), CircleError> {
        let members: Vec<Address> = env.storage().instance().get(&DataKey::Members).unwrap();
        let recipient = members.get(cycle_info.next_payout_index).unwrap();
        
        let token_id: Address = env.storage().instance().get(&DataKey::TokenId).unwrap();
        let vault_address = env.current_contract_address();
        let token_client = token::Client::new(env, &token_id);
        
        token_client.transfer(&vault_address, &recipient, &payout_amount);

        // Update Recipient Info
        let mut rec_info: MemberInfo = env.storage().persistent().get(&DataKey::Member(recipient.clone())).unwrap();
        rec_info.payouts_received += 1;
        env.storage().persistent().set(&DataKey::Member(recipient.clone()), &rec_info);

        // Reset for next cycle
        cycle_info.current_cycle += 1;
        cycle_info.contributions_this_cycle = 0;
        cycle_info.next_payout_index += 1;

        // Reset member contributions
        for i in 0..members.len() {
            let m = members.get(i).unwrap();
            let mut info: MemberInfo = env.storage().persistent().get(&DataKey::Member(m.clone())).unwrap();
            info.has_contributed_current = false;
            env.storage().persistent().set(&DataKey::Member(m.clone()), &info);
        }

        if cycle_info.current_cycle > cycle_info.max_cycles {
            cycle_info.started = false; // Circle complete
        }
        
        env.storage().instance().set(&DataKey::CycleInfo, cycle_info);
        env.events().publish((symbol_short!("payout"), recipient), payout_amount);

        Ok(())
    }

    pub fn get_cycle_info(env: Env) -> CycleInfo {
        env.storage().instance().get(&DataKey::CycleInfo).unwrap()
    }

    pub fn get_members(env: Env) -> Vec<Address> {
        env.storage().instance().get(&DataKey::Members).unwrap_or(Vec::new(&env))
    }

    pub fn get_member_info(env: Env, member: Address) -> Option<MemberInfo> {
        env.storage().persistent().get(&DataKey::Member(member))
    }
}
