'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, Plus, X } from 'lucide-react';
import { useWallet } from '@/components/WalletProvider';
import TransactionStatusCard from '@/components/TransactionStatusCard';
import ErrorBanner from '@/components/ErrorBanner';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
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
  const formValid =
    splitId.length > 0 &&
    sharesValid &&
    allAddressesFilled &&
    recipients.length >= 1 &&
    recipients.length <= 10;

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
      <div className="container py-24">
        <EmptyState
          icon="◆"
          title="Connect your wallet"
          description="Connect a Stellar wallet to create a new revenue split."
          action={<Button onClick={connect}>Connect wallet</Button>}
        />
      </div>
    );
  }

  const isProcessing = txState.status !== 'idle' && txState.status !== 'failed';

  return (
    <div className="container py-14">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.push('/splits')}
          className="mb-8 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-white"
        >
          <ArrowLeft size={15} />
          Back to splits
        </button>

        <h1 className="heading-page mb-2 text-white">Create a split</h1>
        <p className="mb-9 text-[15px] leading-relaxed text-text-secondary">
          Define how incoming payments are divided among recipients.
        </p>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-3">
          {([1, 2] as const).map((n, idx) => (
            <div key={n} className="flex items-center gap-3">
              {idx > 0 && <div className="h-px w-8 bg-border" />}
              <div
                className={`flex items-center gap-2 text-sm font-medium ${
                  step === n ? 'text-white' : 'text-text-muted'
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    step === n
                      ? 'bg-accent text-[#04120a]'
                      : 'border border-border bg-bg-surface text-text-muted'
                  }`}
                >
                  {n}
                </span>
                {n === 1 ? 'Configure' : 'Review'}
              </div>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Split ID */}
              <div className="glass-card mb-5 p-6">
                <label htmlFor="split-id" className="form-label">
                  Split ID
                </label>
                <input
                  id="split-id"
                  type="text"
                  value={splitId}
                  onChange={(e) => validateSplitId(e.target.value)}
                  placeholder="e.g. team_salary"
                  className="input-field font-mono"
                />
                {splitIdError && (
                  <ErrorBanner
                    error={{ type: 'split_exists', message: splitIdError, retryable: false }}
                  />
                )}
              </div>

              {/* Recipients */}
              <div className="glass-card mb-5 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="form-label mb-0">Recipients</span>
                  <span className="font-mono text-xs text-text-muted">
                    {recipients.length}/10
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {recipients.map((r, i) => {
                    const validation = validateStellarAddress(r.address);
                    const showInvalid = r.address && !validation.valid;
                    const showValid = r.address && validation.valid;

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-2"
                      >
                        <div className="flex-1">
                          <input
                            type="text"
                            value={r.address}
                            onChange={(e) => updateRecipient(i, 'address', e.target.value)}
                            placeholder="G… (Stellar address)"
                            aria-label={`Recipient ${i + 1} address`}
                            className={`input-field font-mono text-sm ${
                              showInvalid
                                ? '!border-error/50'
                                : showValid
                                  ? '!border-accent/50'
                                  : ''
                            }`}
                          />
                          {showInvalid && (
                            <p className="mt-1.5 text-xs text-error">{validation.error}</p>
                          )}
                          {showValid && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-accent">
                              <Check size={11} />
                              Valid address
                            </p>
                          )}
                        </div>
                        <input
                          type="number"
                          value={r.share || ''}
                          onChange={(e) => updateRecipient(i, 'share', e.target.value)}
                          placeholder="%"
                          min="1"
                          max="100"
                          aria-label={`Recipient ${i + 1} share percentage`}
                          className="input-field w-20 text-center font-mono text-sm"
                        />
                        <button
                          onClick={() => removeRecipient(i)}
                          className="mt-2.5 shrink-0 text-text-muted transition-colors hover:text-error disabled:opacity-30 disabled:hover:text-text-muted"
                          disabled={recipients.length <= 1}
                          aria-label={`Remove recipient ${i + 1}`}
                        >
                          <X size={16} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {recipients.length < 10 && (
                  <button
                    onClick={addRecipient}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-iris-cyan transition-opacity hover:opacity-80"
                  >
                    <Plus size={14} />
                    Add recipient
                  </button>
                )}
              </div>

              {/* Allocation bar */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Allocation</span>
                  <span
                    className={`font-mono font-semibold ${
                      sharesValid
                        ? 'text-accent'
                        : totalShares > 100
                          ? 'text-error'
                          : 'text-warning'
                    }`}
                  >
                    {totalShares}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    className={`h-full rounded-full ${
                      sharesValid
                        ? 'bg-accent'
                        : totalShares > 100
                          ? 'bg-error'
                          : 'bg-warning'
                    }`}
                    animate={{ width: `${Math.min(totalShares, 100)}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                </div>
                {!sharesValid && totalShares > 0 && (
                  <div className="mt-3">
                    <ErrorBanner
                      error={{
                        type: 'invalid_shares',
                        message:
                          totalShares > 100
                            ? `Shares exceed 100% by ${totalShares - 100}%. Reduce allocations.`
                            : `${100 - totalShares}% remaining. Shares must total exactly 100%.`,
                        retryable: false,
                      }}
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!formValid}
                size="lg"
                className="w-full"
              >
                Review split
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="glass-card mb-5 p-6">
                <h2 className="mb-5 text-[15px] font-semibold tracking-tight text-white">
                  Split configuration
                </h2>

                <div className="mb-5">
                  <p className="mb-1 text-xs text-text-muted">Split ID</p>
                  <p className="font-mono text-sm text-iris-cyan">{splitId}</p>
                </div>

                <div className="mb-5">
                  <p className="mb-1 text-xs text-text-muted">Owner</p>
                  <p className="font-mono text-sm text-white">
                    {truncateAddress(publicKey || '', 8)}
                  </p>
                </div>

                <div>
                  <p className="mb-2.5 text-xs text-text-muted">Recipients</p>
                  <div className="flex flex-col gap-2">
                    {recipients.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl border border-border bg-bg-surface px-4 py-3"
                      >
                        <span className="font-mono text-xs text-text-secondary">
                          {truncateAddress(r.address, 6)}
                        </span>
                        <span className="font-mono text-sm font-medium text-iris-mint">
                          {r.share}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-5">
                  <ErrorBanner error={error} onDismiss={() => setError(null)} />
                </div>
              )}

              {txState.status !== 'idle' && (
                <div className="mb-5">
                  <TransactionStatusCard
                    status={txState.status}
                    hash={txState.hash}
                    error={txState.error}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    reset();
                  }}
                  className="flex-1"
                  disabled={txState.status === 'pending' || txState.status === 'simulating'}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  isLoading={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? 'Processing…' : 'Register on Stellar'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
