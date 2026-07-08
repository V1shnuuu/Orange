'use client';

import { motion, AnimatePresence } from 'motion/react';
import type { TxStatus } from '@/lib/contracts';
import { stellarExpertTxUrl } from '@/lib/stellar';

interface TransactionStatusCardProps {
  status: TxStatus;
  hash?: string;
  error?: string;
}

const STATUS_CONFIG: Record<TxStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  idle: { label: '', color: '', bgColor: '', icon: '' },
  simulating: { label: 'Simulating transaction...', color: 'text-accent', bgColor: 'bg-accent/5 border-accent/20', icon: '⏳' },
  pending: { label: 'Waiting for confirmation...', color: 'text-warning', bgColor: 'bg-warning-bg border-warning/20', icon: '🔄' },
  confirmed: { label: 'Transaction confirmed', color: 'text-accent', bgColor: 'bg-success-bg border-success/20', icon: '✓' },
  success: { label: 'Transaction successful!', color: 'text-success', bgColor: 'bg-success-bg border-success/20', icon: '✅' },
  failed: { label: 'Transaction failed', color: 'text-error', bgColor: 'bg-error-bg border-error/20', icon: '✗' },
};

export default function TransactionStatusCard({ status, hash, error }: TransactionStatusCardProps) {
  if (status === 'idle') return null;

  const config = STATUS_CONFIG[status];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`rounded-lg border p-4 ${config.bgColor}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{config.icon}</span>
          <div className="flex-1">
            <p className={`text-sm font-medium ${config.color}`}>
              {config.label}
            </p>
            {error && (
              <p className="text-xs text-error mt-1">{error}</p>
            )}
            {hash && status === 'success' && (
              <a
                href={stellarExpertTxUrl(hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline mt-1 inline-block font-mono"
              >
                View on Stellar Expert →
              </a>
            )}
          </div>
          {(status === 'simulating' || status === 'pending') && (
            <svg className="animate-spin h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
