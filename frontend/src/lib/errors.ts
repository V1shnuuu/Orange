import { AccountNotFundedError } from './soroban';
import { friendbotFundUrl } from './stellar';

// Maps SplitError enum codes to human-readable messages
const SPLIT_ERROR_MESSAGES: Record<number, string> = {
  1: 'Split configuration not found. It may have been deactivated.',
  2: 'Unauthorized — only the split owner can perform this action.',
  3: 'Invalid shares — they must sum to exactly 100%.',
  4: 'Too many recipients — maximum is 10 per split.',
  5: 'Recipients list cannot be empty.',
  6: 'A split with this ID already exists. Choose a different name.',
  7: 'Each recipient must have a share greater than 0%.',
  8: 'The registry is frozen and not accepting changes.',
};

// Maps VaultError enum codes to human-readable messages
const VAULT_ERROR_MESSAGES: Record<number, string> = {
  1: 'The payment vault has not been initialized.',
  2: 'The payment vault is already initialized.',
  3: 'Split configuration not found in the registry.',
  4: 'Amount must be greater than zero.',
  5: 'Distribution failed — please try again.',
};

// Maps CircleError enum codes to human-readable messages
const CIRCLE_ERROR_MESSAGES: Record<number, string> = {
  1: 'This circle has not started yet — it opens once every seat is filled.',
  2: 'This circle has already been set up.',
  3: 'This circle is full — every seat has been taken.',
  4: 'You have already joined this circle.',
  5: 'Only members of this circle can contribute.',
  6: "Contribution must match the circle's fixed amount exactly.",
  7: 'The current cycle is still open — not every member has contributed yet.',
  8: 'You have already contributed to this cycle.',
  9: 'This circle has already started and is no longer accepting members.',
};

// Maps FactoryError enum codes to human-readable messages
const FACTORY_ERROR_MESSAGES: Record<number, string> = {
  1: 'The circle factory has not been initialized.',
  2: 'The circle factory is already initialized.',
  3: 'A circle with this ID already exists. Choose a different name.',
};

/** Which contract an error code should be read against. */
export type ContractKind = 'split' | 'vault' | 'circle' | 'factory';

const CONTRACT_ERROR_MESSAGES: Record<ContractKind, Record<number, string>> = {
  split: SPLIT_ERROR_MESSAGES,
  vault: VAULT_ERROR_MESSAGES,
  circle: CIRCLE_ERROR_MESSAGES,
  factory: FACTORY_ERROR_MESSAGES,
};

export type ErrorType =
  | 'wallet_not_installed'
  | 'user_rejected'
  | 'insufficient_balance'
  | 'invalid_shares'
  | 'split_exists'
  | 'contract_error'
  | 'network_timeout'
  | 'account_not_funded';

export interface AppError {
  type: ErrorType;
  message: string;
  code?: number;
  retryable: boolean;
  /** Friendbot funding link, set only for account_not_funded errors. */
  friendbotUrl?: string;
}

export function decodeContractError(
  errorCode: number,
  contract: ContractKind = 'split',
): string {
  return (
    CONTRACT_ERROR_MESSAGES[contract][errorCode] ||
    `Unknown contract error (code: ${errorCode})`
  );
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    if (Object.keys(obj).length === 0) return '';
  }
  return String(error ?? '');
}

/**
 * Turn anything thrown during a contract call into a message worth showing.
 *
 * Contract error codes are only meaningful alongside the contract that raised
 * them — every contract in this repo numbers its errors from 1 — so callers
 * pass the contract they were talking to.
 */
export function classifyError(
  error: unknown,
  contract: ContractKind = 'split',
): AppError {
  if (error instanceof AccountNotFundedError) {
    return {
      type: 'account_not_funded',
      message:
        'This wallet has no account on Stellar testnet yet. Fund it with free test XLM to continue.',
      retryable: true,
      friendbotUrl: friendbotFundUrl(error.address),
    };
  }

  const message = extractMessage(error);
  const lower = message.toLowerCase();

  // No message extractable (e.g. an empty rejection) — most commonly means
  // the wallet extension isn't installed, since fetchAddress() rejects with
  // a bare object rather than an Error when there's nothing to connect to.
  if (!message) {
    return {
      type: 'wallet_not_installed',
      message: 'No Stellar wallet detected. Please install Freighter, xBull, or Albedo to continue.',
      retryable: false,
    };
  }

  // Wallet not installed
  if (lower.includes('freighter') && lower.includes('not') && lower.includes('install')) {
    return {
      type: 'wallet_not_installed',
      message: 'No Stellar wallet detected. Please install Freighter, xBull, or Albedo to continue.',
      retryable: false,
    };
  }

  // User rejected signature
  if (lower.includes('user declined') || lower.includes('rejected') || lower.includes('cancelled') || lower.includes('denied')) {
    return {
      type: 'user_rejected',
      message: 'Transaction cancelled — nothing was sent.',
      retryable: false,
    };
  }

  // Insufficient balance
  if (lower.includes('insufficient') || lower.includes('balance') || lower.includes('underfunded')) {
    return {
      type: 'insufficient_balance',
      message: 'Insufficient USDC balance to complete this transaction.',
      retryable: false,
    };
  }

  // Contract error with code
  const contractMatch = message.match(/Error\(Contract, #(\d+)\)/);
  if (contractMatch) {
    const code = parseInt(contractMatch[1]);
    return {
      type: 'contract_error',
      message: decodeContractError(code, contract),
      code,
      retryable: false,
    };
  }

  // Network/RPC timeout
  if (lower.includes('timeout') || lower.includes('network') || lower.includes('fetch') || lower.includes('econnrefused')) {
    return {
      type: 'network_timeout',
      message: 'Network error — unable to reach the Stellar network. Retrying...',
      retryable: true,
    };
  }

  // Generic fallback
  return {
    type: 'contract_error',
    message: message || 'An unexpected error occurred.',
    retryable: false,
  };
}
