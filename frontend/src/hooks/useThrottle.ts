import { useState, useEffect, useRef } from 'react';

/**
 * Returns a throttled version of `value` that only updates at most once
 * every `limit` ms. Useful for scroll/resize handlers where you want
 * frequent events but capped processing.
 */
export function useThrottle<T>(value: T, limit: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();
    const remaining = limit - (now - lastUpdated.current);

    if (remaining <= 0) {
      // Enough time has passed — update immediately
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      // Schedule a trailing update for when the limit expires
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, remaining);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, limit]);

  return throttledValue;
}
