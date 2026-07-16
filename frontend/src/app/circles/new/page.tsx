'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCircleContracts } from '@/hooks/useCircleContracts';
import { toStroops } from '@/lib/stellar';
import TransactionStatusCard from '@/components/TransactionStatusCard';
import ErrorBanner from '@/components/ErrorBanner';

export default function CreateCirclePage() {
  const router = useRouter();
  const { createCircle, txState, resetTxState } = useCircleContracts();
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('50');
  const [maxMembers, setMaxMembers] = useState(5);
  const [duration, setDuration] = useState(7);
  const [payoutOrder, setPayoutOrder] = useState('fixed');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amountInStroops = toStroops(amount);
      const res = await createCircle({
        name,
        amount: amountInStroops,
        maxMembers,
        duration
      });
      
      // Delay navigation slightly for UX
      setTimeout(() => {
        router.push(`/circles/${res.result}`);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  if (txState.status !== 'idle' && txState.status !== 'failed') {
    return (
      <div className="max-w-md mx-auto mt-20 px-4">
        <TransactionStatusCard
          state={txState}
          title="Creating Circle"
          onReset={resetTxState}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Create a Circle</h1>
      <p className="text-text-secondary mb-8">Set up a new rotating savings circle.</p>

      {txState.status === 'failed' && (
        <div className="mb-6">
          <ErrorBanner error={new Error(txState.error)} onDismiss={resetTxState} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Circle Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent transition-colors"
            placeholder="e.g., Alpha Savings Group"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Contribution (USDC)</label>
            <input
              type="number"
              required
              min="10"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Max Members</label>
            <input
              type="number"
              required
              min="2"
              max="20"
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value))}
              className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Cycle Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent transition-colors"
            >
              <option value={1}>Daily</option>
              <option value={7}>Weekly</option>
              <option value={14}>Bi-Weekly</option>
              <option value={30}>Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Payout Order</label>
            <select
              value={payoutOrder}
              onChange={(e) => setPayoutOrder(e.target.value)}
              className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent transition-colors"
            >
              <option value="fixed">Fixed Rotation</option>
              <option value="random" disabled>Random (Soon)</option>
              <option value="auction" disabled>Auction (Soon)</option>
            </select>
          </div>
        </div>

        <button type="submit" className="w-full btn-primary py-3">
          Deploy Circle
        </button>
      </form>
    </div>
  );
}
