// Contract IDs from environment
export const SPLIT_REGISTRY_CONTRACT_ID = process.env.NEXT_PUBLIC_SPLIT_REGISTRY_CONTRACT_ID || '';
export const PAYMENT_VAULT_CONTRACT_ID = process.env.NEXT_PUBLIC_PAYMENT_VAULT_CONTRACT_ID || '';
export const USDC_TOKEN_CONTRACT_ID = process.env.NEXT_PUBLIC_USDC_TOKEN_CONTRACT_ID || '';

// Contract method names
export const REGISTRY_METHODS = {
  REGISTER_SPLIT: 'register_split',
  UPDATE_SPLIT: 'update_split',
  GET_SPLIT: 'get_split',
  DEACTIVATE_SPLIT: 'deactivate_split',
  LIST_SPLITS: 'list_splits',
  GET_SPLIT_CONFIG: 'get_split_config',
} as const;

export const VAULT_METHODS = {
  INITIALIZE: 'initialize',
  DISTRIBUTE: 'distribute',
  GET_DISTRIBUTION_HISTORY: 'get_distribution_history',
  GET_TOTAL_DISTRIBUTED: 'get_total_distributed',
} as const;

// Types matching contract structs
export interface SplitConfig {
  owner: string;
  recipients: string[];
  shares: number[];
  active: boolean;
}

export interface Payout {
  recipient: string;
  amount: bigint;
}

export interface DistributionRecord {
  sender: string;
  split_id: string;
  total_amount: bigint;
  timestamp: number;
  payouts: Payout[];
}

export interface DistributionEvent {
  id: string;
  splitId: string;
  sender: string;
  totalAmount: string;
  timestamp: number;
  recipients: { address: string; amount: string }[];
}

// Transaction status types
export type TxStatus = 'idle' | 'simulating' | 'pending' | 'confirmed' | 'success' | 'failed';

export interface TxState {
  status: TxStatus;
  hash?: string;
  error?: string;
  result?: unknown;
}
