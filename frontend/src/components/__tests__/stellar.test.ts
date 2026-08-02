import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  validateStellarAddress,
  formatRelativeTime,
  truncateAddress,
  formatAmount,
  formatUSDC,
  toStroops,
  toSorobanSymbol,
  generateCircleId,
  friendbotFundUrl,
  SOROBAN_SYMBOL_MAX_LEN,
} from '@/lib/stellar';

// A valid 56-char G-address using only A-Z 2-7
const VALID_ADDRESS = 'GCHE645J3234KFRIEOH3Z76JU3N27SAKTCKH6QFTZMK2T5MQZ5CBJHV4';

describe('validateStellarAddress', () => {
  it('accepts a valid Stellar address', () => {
    expect(validateStellarAddress(VALID_ADDRESS)).toEqual({ valid: true });
  });

  it('rejects an empty string', () => {
    const result = validateStellarAddress('');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it('rejects addresses not starting with G', () => {
    const result = validateStellarAddress('ABZX4TKKRMQNFTO2HKPXS4TH6HNCQB7V3CDOGJZ4UQXPBRZ7D7OKKM');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/start with G/i);
  });

  it('rejects addresses shorter than 56 characters', () => {
    const result = validateStellarAddress('GBZX4SHORT');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/56 characters/i);
  });

  it('rejects addresses with invalid characters', () => {
    const bad = 'G' + '0'.repeat(55); // '0' is not in A-Z 2-7
    const result = validateStellarAddress(bad);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid characters/i);
  });
});

describe('formatRelativeTime', () => {
  afterEach(() => vi.useRealTimers());

  it('returns "just now" for timestamps within the last minute', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatRelativeTime(now - 30)).toBe('just now');
  });

  it('returns minutes ago for timestamps 1–59 minutes old', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatRelativeTime(now - 5 * 60)).toBe('5 min ago');
  });

  it('returns hours ago for timestamps 1–23 hours old', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatRelativeTime(now - 3 * 3600)).toBe('3h ago');
  });

  it('returns days ago for timestamps 1+ days old', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatRelativeTime(now - 2 * 86400)).toBe('2d ago');
  });
});

describe('truncateAddress', () => {
  it('truncates long addresses', () => {
    expect(truncateAddress(VALID_ADDRESS, 4)).toBe('GCHE...JHV4');
  });

  it('returns the full address if shorter than threshold', () => {
    expect(truncateAddress('GABCD', 4)).toBe('GABCD');
  });

  it('returns empty string for falsy input', () => {
    expect(truncateAddress('')).toBe('');
  });
});

describe('formatAmount', () => {
  it('converts stroops to a human-readable USDC string', () => {
    expect(formatAmount(10_000_000)).toBe('1.00');
  });

  it('formats fractional amounts correctly', () => {
    expect(formatAmount(1_234_567)).toBe('0.1234567');
  });

  it('handles zero', () => {
    expect(formatAmount(0)).toBe('0.00');
  });

  it('accepts bigint stroops', () => {
    expect(formatAmount(BigInt(100_000_000))).toBe('10.00');
  });
});

describe('formatUSDC', () => {
  it('formats a number with $ prefix by default', () => {
    expect(formatUSDC(1234.5)).toBe('$1,234.50');
  });

  it('omits the prefix when withPrefix is false', () => {
    expect(formatUSDC(1234.5, false)).toBe('1,234.50');
  });

  it('returns $0.00 for NaN input', () => {
    expect(formatUSDC('not-a-number')).toBe('$0.00');
  });

  it('strips commas from a string input before parsing', () => {
    expect(formatUSDC('1,000.00')).toBe('$1,000.00');
  });
});

describe('toStroops', () => {
  it('converts 1 USDC to 10_000_000 stroops', () => {
    expect(toStroops(1)).toBe(BigInt(10_000_000));
  });

  it('floors fractional stroops', () => {
    // 0.1234567_8 USDC => 1_234_567.8 stroops, floored to 1_234_567
    expect(toStroops('0.12345678')).toBe(BigInt(1_234_567));
  });

  it('converts zero', () => {
    expect(toStroops(0)).toBe(BigInt(0));
  });
});

describe('toSorobanSymbol', () => {
  it('leaves an already-valid symbol unchanged', () => {
    expect(toSorobanSymbol('Alpha_Savings_123')).toBe('Alpha_Savings_123');
  });

  it('replaces whitespace with underscores', () => {
    expect(toSorobanSymbol('Alpha Savings Group')).toBe('Alpha_Savings_Group');
  });

  it('strips characters outside [A-Za-z0-9_]', () => {
    expect(toSorobanSymbol("Alpha's Savings! #1")).toBe('Alphas_Savings_1');
  });

  it('truncates to the max Symbol length', () => {
    const long = 'A'.repeat(50);
    const result = toSorobanSymbol(long);
    expect(result.length).toBe(SOROBAN_SYMBOL_MAX_LEN);
    expect(result).toBe('A'.repeat(SOROBAN_SYMBOL_MAX_LEN));
  });

  it('respects a custom maxLen', () => {
    expect(toSorobanSymbol('Alpha Savings', 5)).toBe('Alpha');
  });

  it('falls back to a generated symbol when nothing survives sanitization', () => {
    const result = toSorobanSymbol('!!! @@@ ###');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/^[A-Za-z0-9_]+$/);
  });

  it('only ever produces valid Symbol characters', () => {
    const result = toSorobanSymbol('日本語 emoji 🎉 test-name!');
    expect(result).toMatch(/^[A-Za-z0-9_]*$/);
  });
});

describe('generateCircleId', () => {
  it('produces a valid Soroban Symbol', () => {
    const id = generateCircleId();
    expect(id.length).toBeGreaterThan(0);
    expect(id.length).toBeLessThanOrEqual(SOROBAN_SYMBOL_MAX_LEN);
    expect(id).toMatch(/^[A-Za-z0-9_]+$/);
  });

  it('starts with a letter', () => {
    expect(generateCircleId()).toMatch(/^[A-Za-z]/);
  });

  it('generates distinct ids across calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateCircleId()));
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe('friendbotFundUrl', () => {
  it('builds a friendbot URL with the address as a query param', () => {
    const addr = 'GCHE645J3234KFRIEOH3Z76JU3N27SAKTCKH6QFTZMK2T5MQZ5CBJHV4';
    expect(friendbotFundUrl(addr)).toBe(`https://friendbot.stellar.org?addr=${addr}`);
  });

  it('URL-encodes special characters in the address', () => {
    expect(friendbotFundUrl('a b')).toBe('https://friendbot.stellar.org?addr=a%20b');
  });
});
