'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useWallet } from '@/components/WalletProvider';
import { useDistributionEvents } from '@/hooks/useDistributionEvents';
import { useSorobanContract } from '@/hooks/useSorobanContract';
import { useClipboard } from '@/hooks/useClipboard';
import TransactionStatusCard from '@/components/TransactionStatusCard';
import ErrorBanner from '@/components/ErrorBanner';
import LoadingSkeleton from '@/components/LoadingSkeleton';
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
  const previewPayouts = amount && parseFloat(amount) > 0
    ? recipients.map((r) => ({
        address: r.address,
        amount: ((parseFloat(amount) * r.share) / 100).toFixed(2),
      }))
    : [];

  if (isLoading) {
    return (
      <div className="container py-16">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  // Desktop layout
  const renderOverviewPanel = () => (
    <div>
      <div className="glass-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold font-mono text-accent" style={{ fontSize: '20px' }}>{splitId}</h2>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(0,255,0,0.1)', color: 'var(--success)' }}>Active</span>
        </div>
        <div className="text-secondary mb-1" style={{ fontSize: '14px' }}>Owner</div>
        <div className="font-mono mb-4" style={{ fontSize: '12px' }}>{truncateAddress(owner, 8)}</div>
        <div className="text-secondary mb-1" style={{ fontSize: '14px' }}>Total Distributed</div>
        <motion.div
          key={totalDistributed}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="font-mono font-bold"
          style={{ fontSize: '24px' }}
        >
          ${totalDistributed}
        </motion.div>
      </div>

      {/* Recipient table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-medium text-secondary" style={{ fontSize: '14px' }}>Recipients</h3>
        </div>
        <div className="flex-col">
          {recipients.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={() => copyAddress(r.address)}
                title="Copy address"
                className="flex items-center gap-1.5 group text-left"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <span className="font-mono transition-colors group-hover:text-accent" style={{ fontSize: '12px' }}>
                  {truncateAddress(r.address, 8)}
                </span>
                <span className="transition-colors group-hover:text-accent text-secondary" style={{ fontSize: '12px' }}>
                  {addressCopied ? '✓' : '⎘'}
                </span>
              </button>
              <div className="flex items-center gap-4 text-right">
                <span className="font-mono text-accent" style={{ fontSize: '14px' }}>{r.share}%</span>
                <span className="font-mono text-secondary" style={{ fontSize: '14px' }}>${r.lastReceived}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSendPanel = () => (
    <div className="glass-card">
      <h3 className="font-semibold mb-4" style={{ fontSize: '16px' }}>Send Payment</h3>

      {!isConnected ? (
        <div className="text-center py-6">
          <p className="text-secondary mb-3" style={{ fontSize: '14px' }}>Connect your wallet to send a payment.</p>
          <button onClick={connect} className="btn btn-primary">Connect Wallet</button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-secondary mb-2" style={{ fontSize: '14px' }}>Amount (USDC)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="input-field font-mono w-full"
              style={{ fontSize: '18px' }}
            />
          </div>

          {/* Preview breakdown */}
          {previewPayouts.length > 0 && (
            <div className="mb-4 p-3 glass-card">
              <p className="text-secondary mb-2" style={{ fontSize: '12px' }}>Distribution Preview</p>
              {previewPayouts.map((p, i) => (
                <div key={i} className="flex justify-between py-1">
                  <span className="font-mono text-secondary" style={{ fontSize: '12px' }}>{truncateAddress(p.address, 6)}</span>
                  <span className="font-mono text-accent" style={{ fontSize: '12px' }}>${p.amount}</span>
                </div>
              ))}
            </div>
          )}

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

          <button
            onClick={handleDistribute}
            disabled={!amount || parseFloat(amount) <= 0 || (txState.status !== 'idle' && txState.status !== 'failed' && txState.status !== 'success')}
            className="btn btn-primary w-full mt-4"
          >
            {txState.status === 'idle' || txState.status === 'success' || txState.status === 'failed'
              ? 'Distribute USDC'
              : 'Processing...'}
          </button>

          {txState.status === 'success' && (
            <button onClick={reset} className="btn btn-secondary w-full mt-2">
              Send Another Payment
            </button>
          )}
        </>
      )}
    </div>
  );

  const renderActivityPanel = () => (
    <div className="glass-card">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse-teal" />
        <h3 className="font-medium text-secondary" style={{ fontSize: '14px' }}>Live Activity</h3>
      </div>
      <div className="flex-col gap-3 max-h-96 overflow-y-auto pr-2">
        <AnimatePresence>
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card mb-3" style={{ padding: 0, overflow: 'hidden' }}
            >
              <button
                onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                className="w-full p-3 flex items-center justify-between text-left transition-colors"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <div>
                  <span className="font-mono text-secondary" style={{ fontSize: '12px' }}>{event.sender}</span>
                  <span className="text-secondary ml-2" style={{ fontSize: '12px' }} title={formatTimestamp(event.timestamp)}>
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </div>
                <span className="font-mono font-medium text-accent" style={{ fontSize: '14px' }}>${event.totalAmount}</span>
              </button>
              <AnimatePresence>
                {expandedEvent === event.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border/30 bg-bg-surface/30"
                  >
                    <div className="flex-col gap-1 p-3">
                      {event.recipients.map((r, j) => (
                        <div key={j} className="flex justify-between" style={{ fontSize: '12px' }}>
                          <span className="font-mono text-secondary">{r.address}</span>
                          <span className="font-mono text-secondary">${r.amount}</span>
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
    <div className="container py-16">
      {/* Mobile tab bar */}
      <div className="md:hidden flex border border-border rounded-lg overflow-hidden mb-6">
        {(['overview', 'send', 'activity'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 font-medium capitalize transition-colors ${
              mobileTab === tab
                ? 'bg-accent'
                : 'glass-card text-secondary'
            }`}
            style={{ fontSize: '14px', border: 'none' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Mobile: show active tab */}
      <div className="md:hidden">
        {mobileTab === 'overview' && renderOverviewPanel()}
        {mobileTab === 'send' && renderSendPanel()}
        {mobileTab === 'activity' && renderActivityPanel()}
      </div>

      {/* Desktop: side by side layout */}
      <div className="hidden md:grid md:grid-cols-5 gap-6">
        <div className="col-span-3 space-y-6">
          {renderOverviewPanel()}
          {renderActivityPanel()}
        </div>
        <div className="col-span-2">
          {renderSendPanel()}
        </div>
      </div>
    </div>
  );
}
