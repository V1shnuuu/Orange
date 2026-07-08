'use client';

import { motion } from 'motion/react';

interface Recipient {
  address: string;
  share: number;
}

interface SplitBuilderProps {
  recipients: Recipient[];
  onUpdateRecipient: (index: number, field: keyof Recipient, value: string | number) => void;
  onAddRecipient: () => void;
  onRemoveRecipient: (index: number) => void;
}

export default function SplitBuilder({
  recipients,
  onUpdateRecipient,
  onAddRecipient,
  onRemoveRecipient,
}: SplitBuilderProps) {
  const totalShares = recipients.reduce((sum, r) => sum + (r.share || 0), 0);
  const sharesValid = totalShares === 100;
  const overAllocated = totalShares > 100;

  return (
    <div>
      <div className="space-y-3 mb-4">
        {recipients.map((r, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                type="text"
                value={r.address}
                onChange={(e) => onUpdateRecipient(i, 'address', e.target.value)}
                placeholder="G... (Stellar address)"
                aria-label={`Recipient ${i + 1} address`}
                className="font-mono text-sm w-full"
              />
            </div>
            <div className="w-20">
              <input
                type="number"
                value={r.share || ''}
                onChange={(e) => onUpdateRecipient(i, 'share', Number(e.target.value))}
                placeholder="%"
                min="0"
                max="100"
                aria-label={`Recipient ${i + 1} share`}
                className="text-center font-mono text-sm w-full"
              />
            </div>
            <button
              onClick={() => onRemoveRecipient(i)}
              className="p-2 text-text-muted hover:text-error"
              aria-label={`Remove recipient ${i + 1}`}
              disabled={recipients.length <= 1}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {recipients.length < 10 && (
        <button
          onClick={onAddRecipient}
          className="text-sm text-accent hover:text-accent-dim"
        >
          + Add recipient
        </button>
      )}

      {/* Percentage bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-text-secondary">Total Allocation</span>
          <span
            className={`font-mono font-semibold ${
              sharesValid ? 'text-success' : overAllocated ? 'text-error' : 'text-warning'
            }`}
            data-testid="total-shares"
          >
            {totalShares}%
          </span>
        </div>
        <div className="w-full h-2 bg-bg-surface rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              sharesValid ? 'bg-accent' : overAllocated ? 'bg-error' : 'bg-warning'
            }`}
            animate={{ width: `${Math.min(totalShares, 100)}%` }}
          />
        </div>
        {overAllocated && (
          <p className="text-xs text-error mt-2" data-testid="shares-error">
            Shares exceed 100% by {totalShares - 100}%. Reduce allocations.
          </p>
        )}
      </div>
    </div>
  );
}
