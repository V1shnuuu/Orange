#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, symbol_short, Address, Env, Symbol, Vec, log};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum FactoryError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    CircleAlreadyExists = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CircleConfig {
    pub name: Symbol,
    pub admin: Address,
    pub contribution_amount: i128,
    pub max_members: u32,
    pub cycle_duration: u32,
    pub active: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    CircleConfig(Symbol),
    AdminCircles(Address),
    TotalCircles,
}

#[contract]
pub struct CircleFactoryContract;

#[contractimpl]
impl CircleFactoryContract {
    pub fn create_circle(
        env: Env,
        admin: Address,
        circle_id: Symbol,
        name: Symbol,
        contribution_amount: i128,
        max_members: u32,
        cycle_duration: u32,
    ) -> Result<bool, FactoryError> {
        admin.require_auth();

        let config_key = DataKey::CircleConfig(circle_id.clone());
        if env.storage().persistent().has(&config_key) {
            return Err(FactoryError::CircleAlreadyExists);
        }

        let config = CircleConfig {
            name,
            admin: admin.clone(),
            contribution_amount,
            max_members,
            cycle_duration,
            active: true,
        };
        env.storage().persistent().set(&config_key, &config);

        let admin_key = DataKey::AdminCircles(admin.clone());
        let mut admin_circles: Vec<Symbol> = env
            .storage()
            .persistent()
            .get(&admin_key)
            .unwrap_or(Vec::new(&env));
        admin_circles.push_back(circle_id.clone());
        env.storage().persistent().set(&admin_key, &admin_circles);

        let total_key = DataKey::TotalCircles;
        let total: u32 = env.storage().persistent().get(&total_key).unwrap_or(0);
        env.storage().persistent().set(&total_key, &(total + 1));

        env.events().publish((symbol_short!("circle_cr"), admin.clone()), circle_id);
        log!(&env, "Circle created successfully");

        Ok(true)
    }

    pub fn get_circle(env: Env, circle_id: Symbol) -> Option<CircleConfig> {
        env.storage().persistent().get(&DataKey::CircleConfig(circle_id))
    }

    pub fn list_admin_circles(env: Env, admin: Address) -> Vec<Symbol> {
        env.storage().persistent().get(&DataKey::AdminCircles(admin)).unwrap_or(Vec::new(&env))
    }

    pub fn get_total_circles(env: Env) -> u32 {
        env.storage().persistent().get(&DataKey::TotalCircles).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
