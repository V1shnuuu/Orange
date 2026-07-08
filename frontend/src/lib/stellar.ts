import * as StellarSdk from '@stellar/stellar-sdk';

// Network configuration
export const STELLAR_RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';
export const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';

// Soroban RPC server (lazy initialized to avoid test env issues)
let _server: StellarSdk.rpc.Server | null = null;
export function getServer(): StellarSdk.rpc.Server {
  if (!_server) {
    _server = new StellarSdk.rpc.Server(STELLAR_RPC_URL);
  }
  return _server;
}

// Truncate Stellar address for display
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Format stroops to human readable USDC amount
export function formatAmount(stroops: bigint | number | string): string {
  const amount = Number(stroops) / 10_000_000;
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  });
}

// Parse human-readable amount to stroops
export function toStroops(amount: string | number): bigint {
  return BigInt(Math.floor(Number(amount) * 10_000_000));
}

// Build Stellar Expert URL for a transaction
export function stellarExpertTxUrl(txHash: string): string {
  return `https://stellar.expert/explorer/${NETWORK}/tx/${txHash}`;
}

// Build Stellar Expert URL for a contract
export function stellarExpertContractUrl(contractId: string): string {
  return `https://stellar.expert/explorer/${NETWORK}/contract/${contractId}`;
}

// Format timestamp
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
