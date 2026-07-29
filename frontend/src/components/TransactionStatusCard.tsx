'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Check, CheckCheck, X } from 'lucide-react';
import type { TxStatus } from '@/lib/contracts';
import { stellarExpertTxUrl } from '@/lib/stellar';

interface TransactionStatusCardProps {
  status: TxStatus;
  hash?: string;
  error?: string;
}

const STATUS_CONFIG: Record<
  Exclude<TxStatus, 'idle'>,
  { label: string; tone: string; icon: React.ReactNode }
> = {
  simulating: {
    label: 'Simulating transaction…',
    tone: 'border-border bg-bg-surface text-text-secondary',
    icon: <Loader2 size={16} className="animate-spin" />,
  },
  pending: {
    label: 'Waiting for confirmation…',
    tone: 'border-warning/25 bg-warning/8 text-warning',
    icon: <Loader2 size={16} className="animate-spin" />,
  },
  confirmed: {
    label: 'Transaction confirmed',
    tone: 'border-accent/25 bg-accent/8 text-accent',
    icon: <Check size={16} />,
  },
  success: {
    label: 'Transaction successful',
    tone: 'border-accent/30 bg-accent/10 text-accent',
    icon: <CheckCheck size={16} />,
  },
  failed: {
    label: 'Transaction failed',
    tone: 'border-error/30 bg-error/10 text-error',
    icon: <X size={16} />,
  },
};

export default function TransactionStatusCard({
  status,
  hash,
  error,
}: TransactionStatusCardProps) {
  if (status === 'idle') return null;

  const config = STATUS_CONFIG[status];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className={`flex items-start gap-3 rounded-2xl border p-4 ${config.tone}`}
      >
        <span className="mt-0.5 shrink-0">{config.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{config.label}</p>
          {error && <p className="mt-1 text-xs opacity-80">{error}</p>}
          {hash && status === 'success' && (
            <a
              href={stellarExpertTxUrl(hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-block font-mono text-xs underline-offset-2 hover:underline"
            >
              View on Stellar Expert →
            </a>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
