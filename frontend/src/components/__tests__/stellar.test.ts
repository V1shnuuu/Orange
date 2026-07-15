import { describe, it, expect, vi, afterEach } from 'vitest';
import { validateStellarAddress, formatRelativeTime, truncateAddress } from '@/lib/stellar';

// A valid 56-char G-address using only A-Z 2-7
const VALID_ADDRESS = 'GBZX4TKKRMQNFTO2HKPXS4TH6HNCQB7V3CDOGJZ4UQXPBRZ7D7OKKM';

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
    expect(truncateAddress(VALID_ADDRESS, 4)).toBe('GBZX...OKKM');
  });

  it('returns the full address if shorter than threshold', () => {
    expect(truncateAddress('GABCD', 4)).toBe('GABCD');
  });

  it('returns empty string for falsy input', () => {
    expect(truncateAddress('')).toBe('');
  });
});
