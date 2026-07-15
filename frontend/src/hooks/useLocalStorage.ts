import { useState, useCallback, useEffect } from 'react';

/**
 * Persist and retrieve a value from localStorage, with SSR safety and
 * cross-tab synchronization via the `storage` event.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const next = value instanceof Function ? value(storedValue) : value;
        window.localStorage.setItem(key, JSON.stringify(next));
        setStoredValue(next);
        // Notify other tabs
        window.dispatchEvent(new StorageEvent('storage', { key }));
      } catch (err) {
        console.warn(`useLocalStorage: failed to set "${key}"`, err);
      }
    },
    [key, storedValue],
  );

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key) setStoredValue(readValue());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key, readValue]);

  return [storedValue, setValue];
}
