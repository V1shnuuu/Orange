import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useClipboard } from '@/hooks/useClipboard';

// Mock the Clipboard API
const mockWriteText = vi.fn();

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: mockWriteText },
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('useClipboard', () => {
  it('initializes with copied = false', () => {
    const { result } = renderHook(() => useClipboard());
    expect(result.current.copied).toBe(false);
  });

  it('sets copied to true after calling copy()', async () => {
    mockWriteText.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('GBZX4TKKRMQNFTO2');
    });

    expect(mockWriteText).toHaveBeenCalledWith('GBZX4TKKRMQNFTO2');
    expect(result.current.copied).toBe(true);
  });

  it('resets copied to false after timeout', async () => {
    vi.useFakeTimers();
    mockWriteText.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useClipboard({ timeout: 1000 }));

    await act(async () => {
      await result.current.copy('GTEST123');
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.copied).toBe(false);
  });

  it('does not throw when clipboard API is unavailable', async () => {
    // Simulate no clipboard API
    Object.assign(navigator, { clipboard: undefined });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('GTEST');
    });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Clipboard API not available'));
    expect(result.current.copied).toBe(false);
    warnSpy.mockRestore();
  });
});
