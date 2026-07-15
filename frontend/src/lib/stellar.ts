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

// Validate a Stellar public key (G... address)
// Checks: G prefix, 56 character length, valid base32 alphabet (A-Z 2-7)
export function validateStellarAddress(address: string): { valid: boolean; error?: string } {
  if (!address) return { valid: false, error: 'Address is required' };
  if (!address.startsWith('G')) return { valid: false, error: 'Stellar addresses must start with G' };
  if (address.length !== 56) return { valid: false, error: `Address must be 56 characters (got ${address.length})` };
  if (!/^[A-Z2-7]+$/.test(address)) return { valid: false, error: 'Address contains invalid characters' };
  return { valid: true };
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

// Format a USDC display amount with $ prefix and locale separators
// Accepts a string like "1200.50" or a number and produces "$1,200.50"
export function formatUSDC(amount: string | number, withPrefix: boolean = true): string {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  if (isNaN(num)) return withPrefix ? '$0.00' : '0.00';
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return withPrefix ? `$${formatted}` : formatted;
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

// Format timestamp as human-friendly relative time (e.g. "2 min ago")
export function formatRelativeTime(timestamp: number): string {
  const diffSeconds = Math.floor(Date.now() / 1000) - timestamp;

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60);
    return `${mins} min ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffSeconds / 86400);
  return `${days}d ago`;
}
