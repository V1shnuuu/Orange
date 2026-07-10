$ErrorActionPreference = "Stop"

echo "Deploying Split Registry..."
$REGISTRY_ID = stellar contract deploy --wasm target/wasm32-unknown-unknown/release/split_registry.wasm --source alice --network testnet
echo "Split Registry deployed: $REGISTRY_ID"

echo "Deploying Payment Vault..."
$VAULT_ID = stellar contract deploy --wasm target/wasm32-unknown-unknown/release/payment_vault.wasm --source alice --network testnet
echo "Payment Vault deployed: $VAULT_ID"

# Native XLM on testnet
$TOKEN_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

echo "Initializing Payment Vault..."
stellar contract invoke --id $VAULT_ID --source alice --network testnet -- initialize --registry_contract_id $REGISTRY_ID --usdc_token_id $TOKEN_ID
echo "Initialized Payment Vault"

echo "Transaction 1: Register Split 1"
stellar contract invoke --id $REGISTRY_ID --source alice --network testnet -- register_split --owner alice --split_id split_one --recipients '["GCCDRGC36W5EGIXRVFROG2MGXTKGBZWD24YJKFUPW6ZLAMUY5YLZPEZD"]' --shares '[100]'

echo "Transaction 2: Register Split 2"
stellar contract invoke --id $REGISTRY_ID --source alice --network testnet -- register_split --owner alice --split_id split_two --recipients '["GCCDRGC36W5EGIXRVFROG2MGXTKGBZWD24YJKFUPW6ZLAMUY5YLZPEZD", "GCCDRGC36W5EGIXRVFROG2MGXTKGBZWD24YJKFUPW6ZLAMUY5YLZPEZD"]' --shares '[50, 50]'

echo "Transaction 3: Register Split 3"
stellar contract invoke --id $REGISTRY_ID --source alice --network testnet -- register_split --owner alice --split_id split_three --recipients '["GCCDRGC36W5EGIXRVFROG2MGXTKGBZWD24YJKFUPW6ZLAMUY5YLZPEZD"]' --shares '[100]'

echo "Done! Copy the contract IDs to update the .env.local and README.md"
