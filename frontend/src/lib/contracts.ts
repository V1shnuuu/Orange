// Contract IDs from environment
export const SPLIT_REGISTRY_CONTRACT_ID = process.env.NEXT_PUBLIC_SPLIT_REGISTRY_CONTRACT_ID || '';
export const PAYMENT_VAULT_CONTRACT_ID = process.env.NEXT_PUBLIC_PAYMENT_VAULT_CONTRACT_ID || '';
export const USDC_TOKEN_CONTRACT_ID = process.env.NEXT_PUBLIC_USDC_TOKEN_CONTRACT_ID || '';

// CirclePact Contract IDs
export const CIRCLE_FACTORY_CONTRACT_ID = process.env.NEXT_PUBLIC_CIRCLE_FACTORY_CONTRACT_ID || '';
export const CIRCLE_CORE_CONTRACT_ID = process.env.NEXT_PUBLIC_CIRCLE_CORE_CONTRACT_ID || '';
export const REPUTATION_REGISTRY_CONTRACT_ID = process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_CONTRACT_ID || '';

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

export const CIRCLE_FACTORY_METHODS = {
  CREATE_CIRCLE: 'create_circle',
  GET_CIRCLE: 'get_circle',
  LIST_ADMIN_CIRCLES: 'list_admin_circles',
  GET_TOTAL_CIRCLES: 'get_total_circles',
} as const;

export const CIRCLE_CORE_METHODS = {
  INITIALIZE: 'initialize',
  JOIN_CIRCLE: 'join_circle',
  CONTRIBUTE: 'contribute',
  GET_CYCLE_INFO: 'get_cycle_info',
  GET_MEMBERS: 'get_members',
  GET_MEMBER_INFO: 'get_member_info',
} as const;

export const REPUTATION_METHODS = {
  GET_SCORE: 'get_score',
  GET_BADGE: 'get_badge',
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
