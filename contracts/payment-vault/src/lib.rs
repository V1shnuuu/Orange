#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, symbol_short,
    token, Address, Env, IntoVal, Symbol, Vec, log,
};

/// Error codes for the PaymentVault contract.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    SplitNotFound = 3,
    InsufficientAmount = 4,
    DistributionFailed = 5,
}

/// A record of a single distribution event.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DistributionRecord {
    pub sender: Address,
    pub split_id: Symbol,
    pub total_amount: i128,
    pub timestamp: u64,
    pub payouts: Vec<Payout>,
}

/// A single payout to a recipient.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Payout {
    pub recipient: Address,
    pub amount: i128,
}

/// Storage keys for the vault.
#[contracttype]
#[derive(Clone)]
pub enum VaultDataKey {
    RegistryId,
    TokenId,
    History(Symbol),
    TotalDistributed(Symbol),
    Initialized,
}

#[contract]
pub struct PaymentVaultContract;

#[contractimpl]
impl PaymentVaultContract {
    /// Initialize the vault with the registry contract ID and USDC token contract ID.
    pub fn initialize(
        env: Env,
        registry_contract_id: Address,
        usdc_token_id: Address,
    ) -> Result<(), VaultError> {
        // Prevent re-initialization
        if env.storage().instance().has(&VaultDataKey::Initialized) {
            return Err(VaultError::AlreadyInitialized);
        }

        env.storage().instance().set(&VaultDataKey::RegistryId, &registry_contract_id);
        env.storage().instance().set(&VaultDataKey::TokenId, &usdc_token_id);
        env.storage().instance().set(&VaultDataKey::Initialized, &true);

        log!(&env, "PaymentVault initialized");
        Ok(())
    }

    /// Distribute USDC to all recipients of a split.
    ///
    /// Flow:
    /// 1. Authenticate sender
    /// 2. Transfer USDC from sender → vault
    /// 3. Cross-contract call to registry to fetch split config
    /// 4. Calculate per-recipient amounts
    /// 5. Transfer from vault to each recipient
    /// 6. Store distribution record
    /// 7. Emit events
    /// 8. Return breakdown
    pub fn distribute(
        env: Env,
        sender: Address,
        split_id: Symbol,
        amount: i128,
    ) -> Result<Vec<Payout>, VaultError> {
        // Step 1: Authenticate sender
        sender.require_auth();

        if amount <= 0 {
            return Err(VaultError::InsufficientAmount);
        }

        // Ensure initialized
        if !env.storage().instance().has(&VaultDataKey::Initialized) {
            return Err(VaultError::NotInitialized);
        }

        // Get registry and token contract IDs
        let registry_id: Address = env
            .storage()
            .instance()
            .get(&VaultDataKey::RegistryId)
            .ok_or(VaultError::NotInitialized)?;
        let token_id: Address = env
            .storage()
            .instance()
            .get(&VaultDataKey::TokenId)
            .ok_or(VaultError::NotInitialized)?;

        // Step 2: Transfer USDC from sender to this vault contract
        let vault_address = env.current_contract_address();
        let token_client = token::Client::new(&env, &token_id);
        token_client.transfer(&sender, &vault_address, &amount);

        // Step 3: Cross-contract call to registry to fetch split config.
        // This is the inter-contract communication requirement.
        let (recipients, shares): (Vec<Address>, Vec<u32>) = env.invoke_contract(
            &registry_id,
            &Symbol::new(&env, "get_split"),
            (split_id.clone(),).into_val(&env),
        );

        // Step 4 & 5: Calculate and distribute to each recipient
        let mut payouts = Vec::new(&env);
        let mut distributed: i128 = 0;

        for i in 0..recipients.len() {
            let recipient = recipients.get(i).unwrap();
            let share = shares.get(i).unwrap();
            let recipient_amount = (amount * share as i128) / 100;

            // Transfer from vault to recipient
            token_client.transfer(&vault_address, &recipient, &recipient_amount);

            payouts.push_back(Payout {
                recipient: recipient.clone(),
                amount: recipient_amount,
            });

            distributed += recipient_amount;

            // Step 8 (per-recipient event): Emit recipient_paid event
            env.events().publish(
                (symbol_short!("rec_paid"), split_id.clone()),
                (recipient, recipient_amount),
            );
        }

        // Handle any dust (rounding remainder) — send to first recipient
        let dust = amount - distributed;
        if dust > 0 && !recipients.is_empty() {
            let first_recipient = recipients.get(0).unwrap();
            token_client.transfer(&vault_address, &first_recipient, &dust);
            // Update the first payout amount
            let mut first_payout = payouts.get(0).unwrap();
            first_payout.amount += dust;
            payouts.set(0, first_payout);
        }

        // Step 6: Store distribution record
        let timestamp = env.ledger().timestamp();
        let record = DistributionRecord {
            sender: sender.clone(),
            split_id: split_id.clone(),
            total_amount: amount,
            timestamp,
            payouts: payouts.clone(),
        };

        let history_key = VaultDataKey::History(split_id.clone());
        let mut history: Vec<DistributionRecord> = env
            .storage()
            .persistent()
            .get(&history_key)
            .unwrap_or(Vec::new(&env));
        history.push_back(record);
        env.storage().persistent().set(&history_key, &history);

        // Update total distributed
        let total_key = VaultDataKey::TotalDistributed(split_id.clone());
        let current_total: i128 = env
            .storage()
            .persistent()
            .get(&total_key)
            .unwrap_or(0);
        env.storage().persistent().set(&total_key, &(current_total + amount));

        // Step 7: Emit distribution event
        env.events().publish(
            (symbol_short!("distrib"), split_id.clone()),
            (sender, amount, timestamp),
        );

        log!(&env, "Distribution completed");
        Ok(payouts)
    }

    /// Get the distribution history for a split.
    pub fn get_distribution_history(
        env: Env,
        split_id: Symbol,
    ) -> Vec<DistributionRecord> {
        let history_key = VaultDataKey::History(split_id);
        env.storage()
            .persistent()
            .get(&history_key)
            .unwrap_or(Vec::new(&env))
    }

    /// Get the total amount distributed for a split.
    pub fn get_total_distributed(env: Env, split_id: Symbol) -> i128 {
        let total_key = VaultDataKey::TotalDistributed(split_id);
        env.storage().persistent().get(&total_key).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
