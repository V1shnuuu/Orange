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

export type ErrorType =
  | 'wallet_not_installed'
  | 'user_rejected'
  | 'insufficient_balance'
  | 'invalid_shares'
  | 'split_exists'
  | 'contract_error'
  | 'network_timeout';

export interface AppError {
  type: ErrorType;
  message: string;
  code?: number;
  retryable: boolean;
}

export function decodeContractError(errorCode: number, isVault: boolean = false): string {
  const messages = isVault ? VAULT_ERROR_MESSAGES : SPLIT_ERROR_MESSAGES;
  return messages[errorCode] || `Unknown contract error (code: ${errorCode})`;
}

export function classifyError(error: unknown): AppError {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

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
      message: decodeContractError(code),
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
