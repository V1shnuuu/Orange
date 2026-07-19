$ErrorActionPreference = "Stop"
Write-Host "Starting CirclePact Deployment to Stellar Testnet..." -ForegroundColor Cyan

# 1. Check for identities
Write-Host "Setting up identity..." -ForegroundColor Yellow
$identities = stellar keys ls 2>&1
if ($identities -notmatch "alice") {
    Write-Host "Identity 'alice' not found. Generating and funding via Friendbot..."
    stellar keys generate alice --network testnet
    Write-Host "Identity 'alice' created and funded." -ForegroundColor Green
} else {
    Write-Host "Identity 'alice' already exists." -ForegroundColor Green
}

# 2. Build Contracts
Write-Host "Building Smart Contracts to WASM..." -ForegroundColor Yellow
stellar contract build

# 3. Deploy circle-factory
Write-Host "Deploying circle-factory..." -ForegroundColor Yellow
$factory_address = stellar contract deploy `
    --wasm target/wasm32v1-none/release/circle_factory.wasm `
    --source alice `
    --network testnet
Write-Host "Circle Factory deployed at: $factory_address" -ForegroundColor Green

# 4. Deploy circle-core
Write-Host "Deploying circle-core..." -ForegroundColor Yellow
$core_address = stellar contract deploy `
    --wasm target/wasm32v1-none/release/circle_core.wasm `
    --source alice `
    --network testnet
Write-Host "Circle Core deployed at: $core_address" -ForegroundColor Green

# 5. Deploy reputation-registry
Write-Host "Deploying reputation-registry..." -ForegroundColor Yellow
$rep_address = stellar contract deploy `
    --wasm target/wasm32v1-none/release/reputation_registry.wasm `
    --source alice `
    --network testnet
Write-Host "Reputation Registry deployed at: $rep_address" -ForegroundColor Green

Write-Host "`n=== Deployment Summary ===" -ForegroundColor Cyan
Write-Host "CIRCLE_FACTORY_CONTRACT_ID=$factory_address"
Write-Host "CIRCLE_CORE_CONTRACT_ID=$core_address"
Write-Host "REPUTATION_REGISTRY_CONTRACT_ID=$rep_address"
Write-Host "==========================`n"

Write-Host "Please update these in your frontend .env.local file." -ForegroundColor Yellow
