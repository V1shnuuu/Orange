'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useWallet } from '@/components/WalletProvider';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import { truncateAddress } from '@/lib/stellar';

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
      <div className="container py-24">
        <EmptyState
          icon="◆"
          title="Connect your wallet"
          description="Connect a Stellar wallet to view and manage your payment splits."
          action={<Button onClick={connect}>Connect wallet</Button>}
        />
      </div>
    );
  }

  return (
    <div className="container py-14">
      <PageHeader
        eyebrow="Splits"
        title="My splits"
        description={
          publicKey ? `Wallet ${truncateAddress(publicKey, 6)}` : undefined
        }
        actions={
          <Link href="/splits/new">
            <Button>
              <Plus size={16} />
              Create split
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : splits.length === 0 ? (
        <EmptyState
          icon="◆"
          title="No splits yet"
          description="Create your first split to start distributing payments automatically."
          action={
            <Link href="/splits/new">
              <Button>
                <Plus size={16} />
                Create your first split
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {splits.map((split, i) => (
            <motion.div
              key={split.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={`/splits/${split.id}`}
                className="glass-card glass-card-hoverable group block p-6 no-underline"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-mono text-base font-semibold text-white transition-colors group-hover:text-iris-cyan">
                      {split.id}
                    </h3>
                    <p className="mt-1.5 text-sm text-text-secondary">
                      {split.recipientCount} recipients
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-semibold text-white">
                      ${split.totalDistributed}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">total distributed</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
