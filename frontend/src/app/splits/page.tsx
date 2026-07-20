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
      <div className="container py-24 text-center">
        <h1 className="hero-title mb-4">My Splits</h1>
        <p className="text-secondary mb-6">Connect your wallet to view and manage your splits.</p>
        <button onClick={connect} className="btn btn-primary">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="hero-title mb-2">My Splits</h1>
          <p className="text-secondary mt-1" style={{ fontSize: '14px' }}>
            Wallet: <span className="font-mono text-accent">{truncateAddress(publicKey || '', 6)}</span>
          </p>
        </div>
        <Link href="/splits/new" className="btn btn-primary">
          + Create New Split
        </Link>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : splits.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 glass-card"
        >
          <p className="text-4xl mb-4">📊</p>
          <h2 className="font-semibold mb-2" style={{ fontSize: '18px' }}>No splits yet</h2>
          <p className="text-secondary mb-6" style={{ fontSize: '14px' }}>
            Create your first split to start distributing payments automatically.
          </p>
          <Link href="/splits/new" className="btn btn-primary">
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
                className="block glass-card group transition-all"
                style={{ textDecoration: 'none' }}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="font-semibold font-mono transition-colors group-hover:text-accent mb-1" style={{ fontSize: '16px' }}>
                      {split.id}
                    </h3>
                    <p className="text-secondary mt-1" style={{ fontSize: '14px' }}>
                      {split.recipientCount} recipients
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold" style={{ fontSize: '18px' }}>
                      ${split.totalDistributed}
                    </p>
                    <p className="text-secondary" style={{ fontSize: '12px' }}>total distributed</p>
                  </div>
                </div>
                <div className="flex gap-2" style={{ marginTop: '16px' }}>
                  <span className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Distribute</span>
                  <span className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Edit</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
