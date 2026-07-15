import { useState, useCallback } from 'react';
import type { ToastVariant } from '@/components/Toast';

export interface ToastEntry {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

let _counter = 0;
function nextId() {
  return `toast-${++_counter}-${Date.now()}`;
}

/**
 * Manages a list of toast notifications.
 *
 * @example
 * const { toasts, toast, dismiss } = useToast();
 * // somewhere in a click handler:
 * toast('Transaction submitted!', 'success');
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration: number = 4000) => {
      const id = nextId();
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
      return id;
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return { toasts, toast, dismiss, dismissAll };
}
