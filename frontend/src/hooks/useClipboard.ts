import { useState, useCallback } from 'react';

interface UseClipboardOptions {
  /** How long (ms) to keep the "copied" state active. Default: 2000 */
  timeout?: number;
}

interface UseClipboardResult {
  copied: boolean;
  copy: (text: string) => Promise<void>;
}

/**
 * Copy text to the clipboard and expose a transient `copied` flag
 * that automatically resets after `timeout` milliseconds.
 */
export function useClipboard({ timeout = 2000 }: UseClipboardOptions = {}): UseClipboardResult {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      if (!navigator?.clipboard) {
        console.warn('useClipboard: Clipboard API not available');
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
      } catch (err) {
        console.error('useClipboard: Failed to copy text', err);
      }
    },
    [timeout],
  );

  return { copied, copy };
}
