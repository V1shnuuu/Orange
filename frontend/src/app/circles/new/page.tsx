'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCircleContracts } from '@/hooks/useCircleContracts';
import { toStroops } from '@/lib/stellar';
import TransactionStatusCard from '@/components/TransactionStatusCard';
import ErrorBanner from '@/components/ErrorBanner';
import Button from '@/components/Button';

export default function CreateCirclePage() {
  const router = useRouter();
  const { createCircle, txState, resetTxState } = useCircleContracts();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('50');
  const [maxMembers, setMaxMembers] = useState(5);
  const [duration, setDuration] = useState(7);
  const [payoutOrder, setPayoutOrder] = useState('fixed');

  const [createdCircleId, setCreatedCircleId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amountInStroops = toStroops(amount);
      const res = await createCircle({
        name,
        amount: amountInStroops.toString(),
        maxMembers,
        duration,
      });

      const circleId = res.result as string;
      setCreatedCircleId(circleId);
      router.push(`/circles/${circleId}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (txState.status !== 'idle' && txState.status !== 'failed') {
    return (
      <div className="mx-auto mt-24 max-w-md px-4">
        <TransactionStatusCard
          status={txState.status}
          hash={txState.hash}
          error={txState.error}
        />
        {txState.status === 'success' && createdCircleId && (
          <Button
            variant="secondary"
            onClick={() => router.push(`/circles/${createdCircleId}`)}
            className="mt-4 w-full"
          >
            View circle
          </Button>
        )}
      </div>
    );
  }

  // Live preview of the pool a completed circle would pay out
  const previewPool = (Number(amount) || 0) * maxMembers;

  return (
    <div className="container py-14">
      <div className="mx-auto max-w-xl">
        <Link
          href="/circles"
          className="mb-8 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-white"
        >
          <ArrowLeft size={15} />
          Back to circles
        </Link>

        <h1 className="heading-page mb-2 text-white">Create a circle</h1>
        <p className="mb-9 text-[15px] leading-relaxed text-text-secondary">
          Set the terms once — the contract enforces them for every cycle.
        </p>

        {txState.status === 'failed' && (
          <div className="mb-7">
            <ErrorBanner
              error={{
                message: txState.error || 'Unknown error',
                type: 'contract_error',
                retryable: false,
              }}
              onDismiss={resetTxState}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-card p-7">
          <div className="form-group">
            <label htmlFor="circle-name" className="form-label">
              Circle name
            </label>
            <input
              id="circle-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="e.g. Alpha Savings Group"
            />
          </div>

          <div className="grid gap-x-5 sm:grid-cols-2">
            <div className="form-group">
              <label htmlFor="contribution" className="form-label">
                Contribution (USDC)
              </label>
              <input
                id="contribution"
                type="number"
                required
                min="10"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
              />
              <p className="mt-2 text-xs text-text-muted">Minimum 10 USDC per member.</p>
            </div>
            <div className="form-group">
              <label htmlFor="max-members" className="form-label">
                Max members
              </label>
              <input
                id="max-members"
                type="number"
                required
                min="2"
                max="20"
                value={maxMembers}
                onChange={(e) => setMaxMembers(parseInt(e.target.value) || 0)}
                className="input-field"
              />
              <p className="mt-2 text-xs text-text-muted">Between 2 and 20 members.</p>
            </div>
          </div>

          <div className="grid gap-x-5 sm:grid-cols-2">
            <div className="form-group">
              <label htmlFor="duration" className="form-label">
                Cycle duration
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="input-field"
              >
                <option value={1}>Daily</option>
                <option value={7}>Weekly</option>
                <option value={14}>Bi-weekly</option>
                <option value={30}>Monthly</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="payout-order" className="form-label">
                Payout order
              </label>
              <select
                id="payout-order"
                value={payoutOrder}
                onChange={(e) => setPayoutOrder(e.target.value)}
                className="input-field"
              >
                <option value="fixed">Fixed rotation</option>
                <option value="random" disabled>
                  Random (soon)
                </option>
                <option value="auction" disabled>
                  Auction (soon)
                </option>
              </select>
            </div>
          </div>

          {/* Live summary so the terms are legible before signing */}
          <div className="mb-7 mt-1 rounded-2xl border border-border bg-bg-surface/60 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Total pool per cycle</span>
              <span className="font-mono font-semibold text-iris-mint">
                ${previewPool.toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              {maxMembers} members × ${Number(amount) || 0} — paid out to one member each
              cycle.
            </p>
          </div>

          <Button type="submit" size="lg" className="w-full">
            Deploy circle
          </Button>
        </form>
      </div>
    </div>
  );
}
