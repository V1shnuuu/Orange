import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDistributionEvents } from '../../hooks/useDistributionEvents';

describe('useDistributionEvents', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('returns events array after initial poll', async () => {
    vi.useRealTimers(); // Need real timers for async state updates
    
    const { result } = renderHook(() => useDistributionEvents('test_split'));

    await waitFor(() => {
      expect(result.current.events.length).toBeGreaterThan(0);
    });

    // Each event should have required fields
    const event = result.current.events[0];
    expect(event).toHaveProperty('id');
    expect(event).toHaveProperty('splitId');
    expect(event).toHaveProperty('sender');
    expect(event).toHaveProperty('totalAmount');
    expect(event).toHaveProperty('timestamp');
    expect(event).toHaveProperty('recipients');
  });

  it('exposes a poll function that can be called manually', async () => {
    vi.useRealTimers();
    
    const { result } = renderHook(() => useDistributionEvents());

    // poll should be a function
    expect(typeof result.current.poll).toBe('function');

    // Call poll manually
    await act(async () => {
      await result.current.poll();
    });

    expect(result.current.events.length).toBeGreaterThan(0);
  });
});
