import { describe, it, expect, vi } from 'vitest';
import { arg, AccountNotFundedError } from '@/lib/soroban';

// Mock the RPC server so invokeContract's account-lookup step can be
// exercised without a live network call.
const getAccountMock = vi.fn();
const simulateTransactionMock = vi.fn();
vi.mock('@/lib/stellar', () => ({
  getServer: () => ({
    getAccount: getAccountMock,
    simulateTransaction: simulateTransactionMock,
  }),
  NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
}));

describe('arg', () => {
  it('builds a ContractArg with the given value and type', () => {
    expect(arg('hello', 'symbol')).toEqual({ value: 'hello', type: 'symbol' });
    expect(arg(BigInt(5), 'i128')).toEqual({ value: BigInt(5), type: 'i128' });
  });
});

describe('AccountNotFundedError', () => {
  it('carries the address and a descriptive message', () => {
    const addr = 'GCHE645J3234KFRIEOH3Z76JU3N27SAKTCKH6QFTZMK2T5MQZ5CBJHV4';
    const err = new AccountNotFundedError(addr);
    expect(err.address).toBe(addr);
    expect(err.name).toBe('AccountNotFundedError');
    expect(err.message).toContain(addr);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('invokeContract', () => {
  it('throws AccountNotFundedError when the source account does not exist', async () => {
    getAccountMock.mockRejectedValueOnce(new Error('Account not found'));

    const { invokeContract } = await import('@/lib/soroban');

    await expect(
      invokeContract({
        contractId: 'CDVNCAGXECSZPB57C5V5DXX3LOLTTMLQETR4EZXI6X3LSWTUBXGERVMX',
        method: 'create_circle',
        sourceAddress: 'GCHE645J3234KFRIEOH3Z76JU3N27SAKTCKH6QFTZMK2T5MQZ5CBJHV4',
        signTransaction: vi.fn(),
        args: [arg('GCHE645J3234KFRIEOH3Z76JU3N27SAKTCKH6QFTZMK2T5MQZ5CBJHV4', 'address')],
      })
    ).rejects.toBeInstanceOf(AccountNotFundedError);
  });
});


describe('readContract', () => {
  const CONTRACT = 'CDKN4ZKKEH2CVHOJ36QKSTYFMISMHUJSDAWK2SCISDAD3W2PQPNDAR3W';

  it('decodes the simulated return value', async () => {
    const { nativeToScVal } = await import('@stellar/stellar-sdk');
    simulateTransactionMock.mockResolvedValueOnce({
      result: { retval: nativeToScVal(42, { type: 'u32' }) },
    });

    const { readContract } = await import('@/lib/soroban');
    const value = await readContract({ contractId: CONTRACT, method: 'get_total' });

    expect(value).toBe(42);
  });

  it('never fetches the source account, so reads work unfunded', async () => {
    const { nativeToScVal } = await import('@stellar/stellar-sdk');
    getAccountMock.mockClear();
    simulateTransactionMock.mockResolvedValueOnce({
      result: { retval: nativeToScVal(0, { type: 'u32' }) },
    });

    const { readContract } = await import('@/lib/soroban');
    await readContract({ contractId: CONTRACT, method: 'get_total' });

    expect(getAccountMock).not.toHaveBeenCalled();
  });

  it('returns undefined when the function returns void', async () => {
    simulateTransactionMock.mockResolvedValueOnce({ result: undefined });

    const { readContract } = await import('@/lib/soroban');
    const value = await readContract({ contractId: CONTRACT, method: 'noop' });

    expect(value).toBeUndefined();
  });

  it('throws the simulation error when the contract rejects the call', async () => {
    simulateTransactionMock.mockResolvedValueOnce({
      error: 'HostError: Error(Contract, #1)',
    });

    const { readContract } = await import('@/lib/soroban');

    await expect(
      readContract({ contractId: CONTRACT, method: 'get_circle' })
    ).rejects.toThrow('Error(Contract, #1)');
  });
});
