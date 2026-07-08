'use client';

import { useState, useCallback } from 'react';
import type { TxState, TxStatus } from '@/lib/contracts';

export function useSorobanContract() {
  const [txState, setTxState] = useState<TxState>({ status: 'idle' });

  const execute = useCallback(async (operation: () => Promise<{ hash: string; result?: unknown }>) => {
    try {
      setTxState({ status: 'simulating' });

      // Simulate a brief simulation period
      await new Promise(r => setTimeout(r, 800));

      setTxState({ status: 'pending' });

      const { hash, result } = await operation();

      setTxState({ status: 'confirmed', hash });

      // Brief confirmed state before success
      await new Promise(r => setTimeout(r, 500));

      setTxState({ status: 'success', hash, result });

      return { hash, result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Transaction failed';
      setTxState({ status: 'failed', error: message });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setTxState({ status: 'idle' });
  }, []);

  const setStatus = useCallback((status: TxStatus) => {
    setTxState(prev => ({ ...prev, status }));
  }, []);

  return { txState, execute, reset, setStatus };
}
