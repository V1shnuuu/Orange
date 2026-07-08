#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, symbol_short,
    Address, Env, Symbol, Vec, log,
};

/// Error codes for the SplitRegistry contract.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum SplitError {
    NotFound = 1,
    Unauthorized = 2,
    InvalidShares = 3,
    TooManyRecipients = 4,
    EmptyRecipients = 5,
    AlreadyExists = 6,
    SharesZero = 7,
    RegistryFrozen = 8,
}

/// A stored split configuration.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SplitConfig {
    pub owner: Address,
    pub recipients: Vec<Address>,
    pub shares: Vec<u32>,
    pub active: bool,
}

/// Storage key for a split config — keyed by split_id globally.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    SplitConfig(Symbol),
    OwnerSplits(Address),
}

#[contract]
pub struct SplitRegistryContract;

#[contractimpl]
impl SplitRegistryContract {
    /// Register a new split configuration.
    /// - `shares` must sum to exactly 100.
    /// - Max 10 recipients per split.
    /// - `split_id` must be globally unique.
    pub fn register_split(
        env: Env,
        owner: Address,
        split_id: Symbol,
        recipients: Vec<Address>,
        shares: Vec<u32>,
    ) -> Result<bool, SplitError> {
        owner.require_auth();

        // Validate recipients not empty
        if recipients.is_empty() {
            return Err(SplitError::EmptyRecipients);
        }

        // Validate max 10 recipients
        if recipients.len() > 10 {
            return Err(SplitError::TooManyRecipients);
        }

        // Validate recipients and shares have same length
        if recipients.len() != shares.len() {
            return Err(SplitError::InvalidShares);
        }

        // Validate no zero shares
        let mut total: u32 = 0;
        for i in 0..shares.len() {
            let share = shares.get(i).unwrap();
            if share == 0 {
                return Err(SplitError::SharesZero);
            }
            total += share;
        }

        // Validate shares sum to 100
        if total != 100 {
            return Err(SplitError::InvalidShares);
        }

        // Check split_id doesn't already exist
        let config_key = DataKey::SplitConfig(split_id.clone());
        if env.storage().persistent().has(&config_key) {
            return Err(SplitError::AlreadyExists);
        }

        // Store the split config
        let config = SplitConfig {
            owner: owner.clone(),
            recipients,
            shares,
            active: true,
        };
        env.storage().persistent().set(&config_key, &config);

        // Add split_id to owner's list
        let owner_key = DataKey::OwnerSplits(owner.clone());
        let mut owner_splits: Vec<Symbol> = env
            .storage()
            .persistent()
            .get(&owner_key)
            .unwrap_or(Vec::new(&env));
        owner_splits.push_back(split_id.clone());
        env.storage().persistent().set(&owner_key, &owner_splits);

        // Emit event
        env.events().publish(
            (symbol_short!("split_reg"), owner.clone()),
            split_id,
        );

        log!(&env, "Split registered successfully");
        Ok(true)
    }

    /// Update an existing split configuration.
    /// Only the original owner can update.
    pub fn update_split(
        env: Env,
        owner: Address,
        split_id: Symbol,
        recipients: Vec<Address>,
        shares: Vec<u32>,
    ) -> Result<bool, SplitError> {
        owner.require_auth();

        // Validate recipients not empty
        if recipients.is_empty() {
            return Err(SplitError::EmptyRecipients);
        }

        // Validate max 10 recipients
        if recipients.len() > 10 {
            return Err(SplitError::TooManyRecipients);
        }

        // Validate recipients and shares have same length
        if recipients.len() != shares.len() {
            return Err(SplitError::InvalidShares);
        }

        // Validate no zero shares
        let mut total: u32 = 0;
        for i in 0..shares.len() {
            let share = shares.get(i).unwrap();
            if share == 0 {
                return Err(SplitError::SharesZero);
            }
            total += share;
        }

        // Validate shares sum to 100
        if total != 100 {
            return Err(SplitError::InvalidShares);
        }

        // Fetch existing config
        let config_key = DataKey::SplitConfig(split_id.clone());
        let existing: SplitConfig = env
            .storage()
            .persistent()
            .get(&config_key)
            .ok_or(SplitError::NotFound)?;

        // Check ownership
        if existing.owner != owner {
            return Err(SplitError::Unauthorized);
        }

        // Check active
        if !existing.active {
            return Err(SplitError::NotFound);
        }

        // Update the config
        let config = SplitConfig {
            owner: owner.clone(),
            recipients,
            shares,
            active: true,
        };
        env.storage().persistent().set(&config_key, &config);

        // Emit event
        env.events().publish(
            (symbol_short!("split_upd"), owner.clone()),
            split_id,
        );

        log!(&env, "Split updated successfully");
        Ok(true)
    }

    /// Get a split configuration by split_id.
    /// Returns (recipients, shares) tuple for cross-contract consumption.
    pub fn get_split(
        env: Env,
        split_id: Symbol,
    ) -> Result<(Vec<Address>, Vec<u32>), SplitError> {
        let config_key = DataKey::SplitConfig(split_id);
        let config: SplitConfig = env
            .storage()
            .persistent()
            .get(&config_key)
            .ok_or(SplitError::NotFound)?;

        if !config.active {
            return Err(SplitError::NotFound);
        }

        Ok((config.recipients, config.shares))
    }

    /// Deactivate a split. Only the owner can deactivate.
    pub fn deactivate_split(
        env: Env,
        owner: Address,
        split_id: Symbol,
    ) -> Result<(), SplitError> {
        owner.require_auth();

        let config_key = DataKey::SplitConfig(split_id.clone());
        let mut config: SplitConfig = env
            .storage()
            .persistent()
            .get(&config_key)
            .ok_or(SplitError::NotFound)?;

        if config.owner != owner {
            return Err(SplitError::Unauthorized);
        }

        config.active = false;
        env.storage().persistent().set(&config_key, &config);

        // Emit event
        env.events().publish(
            (symbol_short!("split_de"), owner.clone()),
            split_id,
        );

        log!(&env, "Split deactivated successfully");
        Ok(())
    }

    /// List all split IDs for an owner.
    pub fn list_splits(env: Env, owner: Address) -> Vec<Symbol> {
        let owner_key = DataKey::OwnerSplits(owner);
        env.storage()
            .persistent()
            .get(&owner_key)
            .unwrap_or(Vec::new(&env))
    }

    /// Get the full config for a split (including owner and active status).
    /// Used by the frontend to display split details.
    pub fn get_split_config(
        env: Env,
        split_id: Symbol,
    ) -> Result<SplitConfig, SplitError> {
        let config_key = DataKey::SplitConfig(split_id);
        env.storage()
            .persistent()
            .get(&config_key)
            .ok_or(SplitError::NotFound)
    }
}

#[cfg(test)]
mod test;
