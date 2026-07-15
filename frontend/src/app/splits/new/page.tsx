'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useWallet } from '@/components/WalletProvider';
import TransactionStatusCard from '@/components/TransactionStatusCard';
import ErrorBanner from '@/components/ErrorBanner';
import { useSorobanContract } from '@/hooks/useSorobanContract';
import { truncateAddress, validateStellarAddress } from '@/lib/stellar';
import type { AppError } from '@/lib/errors';

interface Recipient {
  address: string;
  share: number;
}

export default function CreateSplitPage() {
  const router = useRouter();
  const { publicKey, isConnected, connect } = useWallet();
  const { txState, execute, reset } = useSorobanContract();

  const [step, setStep] = useState<1 | 2>(1);
  const [splitId, setSplitId] = useState('');
  const [splitIdError, setSplitIdError] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: '', share: 50 },
    { address: '', share: 50 },
  ]);
  const [error, setError] = useState<AppError | null>(null);

  const totalShares = recipients.reduce((sum, r) => sum + (r.share || 0), 0);
  const sharesValid = totalShares === 100;
  const allAddressesFilled = recipients.every((r) => validateStellarAddress(r.address).valid);
  const formValid = splitId.length > 0 && sharesValid && allAddressesFilled && recipients.length >= 1 && recipients.length <= 10;

  const addRecipient = () => {
    if (recipients.length >= 10) return;
    setRecipients([...recipients, { address: '', share: 0 }]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length <= 1) return;
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, field: keyof Recipient, value: string | number) => {
    const updated = [...recipients];
    if (field === 'share') {
      updated[index] = { ...updated[index], share: Math.max(0, Math.min(100, Number(value))) };
    } else if (field === 'address') {
      updated[index] = { ...updated[index], address: String(value) };
    }
    setRecipients(updated);
  };

  const validateSplitId = (id: string) => {
    const cleaned = id.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    setSplitId(cleaned);
    if (cleaned.length > 0 && cleaned.length < 3) {
      setSplitIdError('Split ID must be at least 3 characters');
    } else {
      setSplitIdError('');
    }
  };

  const handleSubmit = async () => {
    if (!formValid) return;
    setError(null);

    try {
      await execute(async () => {
        // Simulate contract call
        await new Promise((r) => setTimeout(r, 2000));
        return { hash: 'abc123def456', result: { splitId } };
      });

      // Redirect on success
      setTimeout(() => router.push(`/splits/${splitId}`), 1500);
    } catch {
      // Error handled by useSorobanContract
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Create a Split</h1>
        <p className="text-text-secondary mb-6">Connect your wallet to create a new revenue split.</p>
        <button onClick={connect} className="btn-primary">Connect Wallet</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Create a Split</h1>
      <p className="text-sm text-text-secondary mb-8">
        Define how payments will be distributed among recipients.
      </p>

      {/* Step indicators */}
      <div className="flex items-center gap-3 mb-8">
        <div className={`flex items-center gap-2 text-sm font-medium ${step === 1 ? 'text-accent' : 'text-text-muted'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-accent text-bg-primary' : 'bg-bg-surface text-text-muted'}`}>1</span>
          Configure
        </div>
        <div className="w-8 h-px bg-border" />
        <div className={`flex items-center gap-2 text-sm font-medium ${step === 2 ? 'text-accent' : 'text-text-muted'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-accent text-bg-primary' : 'bg-bg-surface text-text-muted'}`}>2</span>
          Review & Submit
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Split ID */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Split ID
              </label>
              <input
                type="text"
                value={splitId}
                onChange={(e) => validateSplitId(e.target.value)}
                placeholder="e.g. team_salary"
                className="font-mono"
              />
              {splitIdError && (
                <ErrorBanner
                  error={{ type: 'split_exists', message: splitIdError, retryable: false }}
                />
              )}
            </div>

            {/* Recipients */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-3">
                Recipients ({recipients.length}/10)
              </label>
              <div className="space-y-3">
                {recipients.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-2 items-start"
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        value={r.address}
                        onChange={(e) => updateRecipient(i, 'address', e.target.value)}
                        placeholder="G... (Stellar address)"
                        className={`font-mono text-sm ${
                          r.address && !validateStellarAddress(r.address).valid
                            ? 'border-error/50 focus:border-error'
                            : r.address && validateStellarAddress(r.address).valid
                            ? 'border-success/50'
                            : ''
                        }`}
                      />
                      {r.address && !validateStellarAddress(r.address).valid && (
                        <p className="text-xs text-error mt-1">
                          {validateStellarAddress(r.address).error}
                        </p>
                      )}
                      {r.address && validateStellarAddress(r.address).valid && (
                        <p className="text-xs text-success mt-1">✓ Valid address</p>
                      )}
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        value={r.share || ''}
                        onChange={(e) => updateRecipient(i, 'share', e.target.value)}
                        placeholder="%"
                        min="1"
                        max="100"
                        className="text-center font-mono text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removeRecipient(i)}
                      className="p-2 text-text-muted hover:text-error transition-colors mt-0.5"
                      disabled={recipients.length <= 1}
                    >
                      ✕
                    </button>
                  </motion.div>
                ))}
              </div>
              {recipients.length < 10 && (
                <button
                  onClick={addRecipient}
                  className="mt-3 text-sm text-accent hover:text-accent-dim transition-colors"
                >
                  + Add recipient
                </button>
              )}
            </div>

            {/* Percentage bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-text-secondary">Allocation</span>
                <span className={`font-mono font-semibold ${sharesValid ? 'text-success' : totalShares > 100 ? 'text-error' : 'text-warning'}`}>
                  {totalShares}%
                </span>
              </div>
              <div className="w-full h-2 bg-bg-surface rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${sharesValid ? 'bg-accent' : totalShares > 100 ? 'bg-error' : 'bg-warning'}`}
                  animate={{ width: `${Math.min(totalShares, 100)}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>
              {!sharesValid && totalShares > 0 && (
                <ErrorBanner
                  error={{
                    type: 'invalid_shares',
                    message: totalShares > 100
                      ? `Shares exceed 100% by ${totalShares - 100}%. Reduce allocations.`
                      : `${100 - totalShares}% remaining. Shares must total exactly 100%.`,
                    retryable: false,
                  }}
                />
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formValid}
              className="btn-primary w-full"
            >
              Review Split
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {/* Review card */}
            <div className="bg-bg-card border border-border rounded-xl p-6 mb-6">
              <h3 className="text-sm font-medium text-text-secondary mb-4">Split Configuration</h3>
              <div className="mb-4">
                <p className="text-xs text-text-muted">Split ID</p>
                <p className="font-mono text-accent">{splitId}</p>
              </div>
              <div className="mb-4">
                <p className="text-xs text-text-muted">Owner</p>
                <p className="font-mono text-sm">{truncateAddress(publicKey || '', 8)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-2">Recipients</p>
                <div className="space-y-2">
                  {recipients.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-bg-surface">
                      <span className="font-mono text-xs text-text-secondary">{truncateAddress(r.address, 6)}</span>
                      <span className="font-mono text-sm font-medium text-accent">{r.share}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4">
                <ErrorBanner error={error} onDismiss={() => setError(null)} />
              </div>
            )}

            <TransactionStatusCard
              status={txState.status}
              hash={txState.hash}
              error={txState.error}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setStep(1); reset(); }}
                className="btn-secondary flex-1"
                disabled={txState.status === 'pending' || txState.status === 'simulating'}
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={txState.status !== 'idle' && txState.status !== 'failed'}
                className="btn-primary flex-1"
              >
                {txState.status === 'idle' || txState.status === 'failed'
                  ? 'Register on Stellar'
                  : 'Processing...'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
