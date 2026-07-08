'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { useWallet } from '@/components/WalletProvider';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { truncateAddress } from '@/lib/stellar';
import { useState, useEffect } from 'react';

interface SplitCardData {
  id: string;
  recipientCount: number;
  totalDistributed: string;
}

export default function SplitsDashboard() {
  const { publicKey, isConnected, connect } = useWallet();
  const [splits, setSplits] = useState<SplitCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      setTimeout(() => setIsLoading(false), 0);
      return;
    }

    // Simulate fetching splits from contract
    const timer = setTimeout(() => {
      setSplits([
        { id: 'team_salary', recipientCount: 4, totalDistributed: '12,500.00' },
        { id: 'creator_rev', recipientCount: 3, totalDistributed: '3,200.00' },
        { id: 'dao_ops', recipientCount: 5, totalDistributed: '8,750.00' },
      ]);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">My Splits</h1>
        <p className="text-text-secondary mb-6">Connect your wallet to view and manage your splits.</p>
        <button onClick={connect} className="btn-primary">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Splits</h1>
          <p className="text-sm text-text-secondary mt-1">
            Wallet: <span className="font-mono text-accent">{truncateAddress(publicKey || '', 6)}</span>
          </p>
        </div>
        <Link href="/splits/new" className="btn-primary text-sm">
          + Create New Split
        </Link>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : splits.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-bg-card border border-border rounded-xl"
        >
          <p className="text-4xl mb-4">📊</p>
          <h2 className="text-lg font-semibold text-text-primary mb-2">No splits yet</h2>
          <p className="text-sm text-text-secondary mb-6">
            Create your first split to start distributing payments automatically.
          </p>
          <Link href="/splits/new" className="btn-primary text-sm">
            Create Your First Split
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {splits.map((split, i) => (
            <motion.div
              key={split.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={`/splits/${split.id}`}
                className="block p-5 bg-bg-card border border-border rounded-xl hover:border-accent/30 transition-all group"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors font-mono">
                      {split.id}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {split.recipientCount} recipients
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-mono font-semibold text-text-primary">
                      ${split.totalDistributed}
                    </p>
                    <p className="text-xs text-text-muted">total distributed</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <span className="btn-primary text-xs !py-1.5 !px-3">Distribute</span>
                  <span className="btn-secondary text-xs !py-1.5 !px-3">Edit</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
