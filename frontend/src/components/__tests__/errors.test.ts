import { describe, it, expect } from 'vitest';
import { classifyError, decodeContractError } from '@/lib/errors';
import { AccountNotFundedError } from '@/lib/soroban';

describe('classifyError', () => {
  it('classifies an AccountNotFundedError with a friendbot link', () => {
    const addr = 'GCHE645J3234KFRIEOH3Z76JU3N27SAKTCKH6QFTZMK2T5MQZ5CBJHV4';
    const result = classifyError(new AccountNotFundedError(addr));

    expect(result.type).toBe('account_not_funded');
    expect(result.retryable).toBe(true);
    expect(result.friendbotUrl).toBe(`https://friendbot.stellar.org?addr=${addr}`);
  });

  it('classifies an empty rejection object as wallet_not_installed', () => {
    const result = classifyError({});
    expect(result.type).toBe('wallet_not_installed');
  });

  it('classifies a Freighter-not-installed message', () => {
    const result = classifyError(new Error('Freighter is not installed'));
    expect(result.type).toBe('wallet_not_installed');
  });

  it('classifies a user-rejected signature', () => {
    const result = classifyError(new Error('User declined access'));
    expect(result.type).toBe('user_rejected');
    expect(result.retryable).toBe(false);
  });

  it('classifies an insufficient balance error', () => {
    const result = classifyError(new Error('insufficient balance for transfer'));
    expect(result.type).toBe('insufficient_balance');
  });

  it('classifies a contract error with a numeric code', () => {
    const result = classifyError(new Error('HostError: Error(Contract, #3)'));
    expect(result.type).toBe('contract_error');
    expect(result.code).toBe(3);
  });

  it('reads a contract error code against the contract that raised it', () => {
    const err = new Error('HostError: Error(Contract, #3)');

    expect(classifyError(err, 'split').message).toContain('shares');
    expect(classifyError(err, 'circle').message).toContain('full');
    expect(classifyError(err, 'factory').message).toContain('already exists');
  });

  it('classifies a network timeout as retryable', () => {
    const result = classifyError(new Error('request timeout'));
    expect(result.type).toBe('network_timeout');
    expect(result.retryable).toBe(true);
  });

  it('falls back to a generic contract_error for unrecognized messages', () => {
    const result = classifyError(new Error('something completely unexpected'));
    expect(result.type).toBe('contract_error');
    expect(result.retryable).toBe(false);
  });
});

describe('decodeContractError', () => {
  it('defaults to the split registry codes', () => {
    expect(decodeContractError(2)).toContain('Unauthorized');
  });

  it('decodes every circle error code', () => {
    for (let code = 1; code <= 9; code++) {
      expect(decodeContractError(code, 'circle')).not.toContain('Unknown');
    }
  });

  it('reports an unmapped code rather than guessing', () => {
    expect(decodeContractError(99, 'circle')).toBe('Unknown contract error (code: 99)');
  });
});
