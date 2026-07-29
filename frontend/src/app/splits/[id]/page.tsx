'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Copy } from 'lucide-react';
import { useWallet } from '@/components/WalletProvider';
import { useDistributionEvents } from '@/hooks/useDistributionEvents';
import { useSorobanContract } from '@/hooks/useSorobanContract';
import { useClipboard } from '@/hooks/useClipboard';
import TransactionStatusCard from '@/components/TransactionStatusCard';
import ErrorBanner from '@/components/ErrorBanner';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import Button from '@/components/Button';
import { truncateAddress, formatTimestamp, formatRelativeTime } from '@/lib/stellar';
import type { AppError } from '@/lib/errors';

interface RecipientInfo {
  address: string;
  share: number;
  lastReceived: string;
}

export default function SplitDetailPage() {
  const params = useParams();
  const splitId = params?.id as string;
  const { isConnected, connect } = useWallet();
  const { events } = useDistributionEvents(splitId);
  const { txState, execute, reset } = useSorobanContract();
  const { copied: addressCopied, copy: copyAddress } = useClipboard({ timeout: 1500 });

  const [isLoading, setIsLoading] = useState(true);
  const [owner, setOwner] = useState('');
  const [recipients, setRecipients] = useState<RecipientInfo[]>([]);
  const [totalDistributed, setTotalDistributed] = useState('0.00');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<AppError | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'overview' | 'send' | 'activity'>('overview');

  useEffect(() => {
    const timer = setTimeout(() => {
      setOwner('GBZX4TKKRMQNFTO2HKPXS4TH6HNCQB7V3CDOGJZ4UQXPBRZ7D7OKKM');
      setRecipients([
        { address: 'GDFK7KGABDXQ3NW6V54B2CQPHJ3K9L2PYMVFWDATBQNRX', share: 50, lastReceived: '250.00' },
        { address: 'GCXT8HJRN3BVQP5KWMTDZL7V9NQ3X8S2PFYDAMCJWR', share: 30, lastReceived: '150.00' },
        { address: 'GARZ2MND5KWHTVNX7JBP4QLYFM8C9R6K3DGWSNEHT', share: 20, lastReceived: '100.00' },
      ]);
      setTotalDistributed('24,500.00');
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [splitId]);

  const handleDistribute = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    setError(null);

    try {
      await execute(async () => {
        await new Promise((r) => setTimeout(r, 2500));
        return { hash: 'dist_' + Date.now().toString(36) };
      });
    } catch {
      // handled by hook
    }
  };

  // Distribution preview
  const previewPayouts =
    amount && parseFloat(amount) > 0
      ? recipients.map((r) => ({
          address: r.address,
          amount: ((parseFloat(amount) * r.share) / 100).toFixed(2),
        }))
      : [];

  if (isLoading) {
    return (
      <div className="container py-14">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  const isProcessing =
    txState.status !== 'idle' && txState.status !== 'failed' && txState.status !== 'success';

  const renderOverviewPanel = () => (
    <div className="flex flex-col gap-5">
      <div className="glass-card p-7">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="font-mono text-xl font-semibold text-iris-cyan">{splitId}</h1>
          <span className="shrink-0 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
            Active
          </span>
        </div>

        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="mb-1.5 text-xs text-text-muted">Owner</dt>
            <dd className="font-mono text-sm text-white">{truncateAddress(owner, 8)}</dd>
          </div>
          <div>
            <dt className="mb-1.5 text-xs text-text-muted">Total distributed</dt>
            <motion.dd
              key={totalDistributed}
              initial={{ scale: 1.06 }}
              animate={{ scale: 1 }}
              className="font-mono text-2xl font-bold tracking-tight text-white"
            >
              ${totalDistributed}
            </motion.dd>
          </div>
        </dl>
      </div>

      {/* Recipient table */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-text-secondary">
            Recipients
          </h2>
        </div>
        <div>
          {recipients.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 last:border-0"
            >
              <button
                onClick={() => copyAddress(r.address)}
                title="Copy address"
                className="group flex min-w-0 items-center gap-2 text-left"
              >
                <span className="truncate font-mono text-xs text-text-secondary transition-colors group-hover:text-white">
                  {truncateAddress(r.address, 8)}
                </span>
                {addressCopied ? (
                  <Check size={12} className="shrink-0 text-accent" />
                ) : (
                  <Copy
                    size={12}
                    className="shrink-0 text-text-muted transition-colors group-hover:text-white"
                  />
                )}
              </button>
              <div className="flex shrink-0 items-center gap-5">
                <span className="font-mono text-sm font-medium text-iris-mint">
                  {r.share}%
                </span>
                <span className="font-mono text-sm text-text-secondary">
                  ${r.lastReceived}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSendPanel = () => (
    <div className="glass-card p-7">
      <h2 className="mb-5 text-[15px] font-semibold tracking-tight text-white">
        Send payment
      </h2>

      {!isConnected ? (
        <div className="py-6 text-center">
          <p className="mb-5 text-sm text-text-secondary">
            Connect your wallet to send a payment.
          </p>
          <Button onClick={connect} className="w-full">
            Connect wallet
          </Button>
        </div>
      ) : (
        <>
          <div className="form-group">
            <label htmlFor="dist-amount" className="form-label">
              Amount (USDC)
            </label>
            <input
              id="dist-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="input-field font-mono !text-lg"
            />
          </div>

          {previewPayouts.length > 0 && (
            <div className="mb-5 rounded-2xl border border-border bg-bg-surface/60 p-4">
              <p className="mb-3 text-xs text-text-muted">Distribution preview</p>
              <div className="flex flex-col gap-2">
                {previewPayouts.map((p, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="font-mono text-text-secondary">
                      {truncateAddress(p.address, 6)}
                    </span>
                    <span className="font-mono font-medium text-iris-mint">
                      ${p.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          <Button
            onClick={handleDistribute}
            disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
            isLoading={isProcessing}
            size="lg"
            className="w-full"
          >
            {isProcessing ? 'Processing…' : 'Distribute USDC'}
          </Button>

          {txState.status === 'success' && (
            <Button variant="outline" onClick={reset} className="mt-3 w-full">
              Send another payment
            </Button>
          )}
        </>
      )}
    </div>
  );

  const renderActivityPanel = () => (
    <div className="glass-card p-7">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="pulse-indicator" />
        <h2 className="text-[13px] font-medium uppercase tracking-wider text-text-secondary">
          Live activity
        </h2>
      </div>

      <div className="flex max-h-96 flex-col gap-2.5 overflow-y-auto pr-1">
        <AnimatePresence>
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="overflow-hidden rounded-2xl border border-border bg-bg-surface/50"
            >
              <button
                onClick={() =>
                  setExpandedEvent(expandedEvent === event.id ? null : event.id)
                }
                className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-white/[0.03]"
                aria-expanded={expandedEvent === event.id}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-mono text-xs text-text-secondary">
                    {event.sender}
                  </span>
                  <span
                    className="mt-0.5 text-xs text-text-muted"
                    title={formatTimestamp(event.timestamp)}
                  >
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-sm font-medium text-iris-mint">
                  ${event.totalAmount}
                </span>
              </button>

              <AnimatePresence>
                {expandedEvent === event.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-border bg-black/30"
                  >
                    <div className="flex flex-col gap-2 p-4">
                      {event.recipients.map((r, j) => (
                        <div key={j} className="flex justify-between text-xs">
                          <span className="font-mono text-text-muted">{r.address}</span>
                          <span className="font-mono text-text-secondary">${r.amount}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="container py-14">
      {/* Mobile tab bar */}
      <div className="mb-6 flex gap-1 rounded-full border border-border bg-bg-surface/60 p-1 md:hidden">
        {(['overview', 'send', 'activity'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium capitalize transition-colors ${
              mobileTab === tab
                ? 'bg-white text-black'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Mobile: active tab */}
      <div className="md:hidden">
        {mobileTab === 'overview' && renderOverviewPanel()}
        {mobileTab === 'send' && renderSendPanel()}
        {mobileTab === 'activity' && renderActivityPanel()}
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden gap-6 md:grid md:grid-cols-5">
        <div className="col-span-3 flex flex-col gap-5">
          {renderOverviewPanel()}
          {renderActivityPanel()}
        </div>
        <div className="col-span-2">{renderSendPanel()}</div>
      </div>
    </div>
  );
}
