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
        amount: amountInStroops.toString(),
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
          status={txState.status}
          hash={txState.hash}
          error={txState.error}
        />
      </div>
    );
  }

  return (
    <div className="container py-16" style={{ maxWidth: '600px' }}>
      <h1 className="hero-title mb-4 text-center">Create a Circle</h1>
      <p className="text-secondary text-center mb-8">Set up a new rotating savings circle.</p>

      {txState.status === 'failed' && (
        <div className="mb-8">
          <ErrorBanner error={{ message: txState.error || 'Unknown error', type: 'contract_error', retryable: false }} onDismiss={resetTxState} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card">
        <div className="form-group">
          <label className="form-label">Circle Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="e.g., Alpha Savings Group"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Contribution (USDC)</label>
            <input
              type="number"
              required
              min="10"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max Members</label>
            <input
              type="number"
              required
              min="2"
              max="20"
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value))}
              className="input-field"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Cycle Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="input-field"
            >
              <option value={1}>Daily</option>
              <option value={7}>Weekly</option>
              <option value={14}>Bi-Weekly</option>
              <option value={30}>Monthly</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Payout Order</label>
            <select
              value={payoutOrder}
              onChange={(e) => setPayoutOrder(e.target.value)}
              className="input-field"
            >
              <option value="fixed">Fixed Rotation</option>
              <option value="random" disabled>Random (Soon)</option>
              <option value="auction" disabled>Auction (Soon)</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }}>
          Deploy Circle
        </button>
      </form>
    </div>
  );
}
