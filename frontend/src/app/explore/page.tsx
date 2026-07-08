'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { truncateAddress } from '@/lib/stellar';

interface ExploreSplit {
  id: string;
  owner: string;
  recipientCount: number;
  totalDistributed: string;
}

export default function ExplorePage() {
  const [splits, setSplits] = useState<ExploreSplit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplits([
        { id: 'team_salary', owner: 'GBZX4TKKRMQNFTO2HKPXS4TH6HNCQB', recipientCount: 4, totalDistributed: '12,500.00' },
        { id: 'creator_rev', owner: 'GCRW8J5TNPLQX2WDKFZ9M7B3CGHJK', recipientCount: 3, totalDistributed: '3,200.00' },
        { id: 'dao_treasury', owner: 'GAZX6N9KLPD4MWCFQYH5TBRJVGZK', recipientCount: 5, totalDistributed: '45,000.00' },
        { id: 'music_royalties', owner: 'GBTK3M7NXRFCVSQJD9W4KHLZ8PBN', recipientCount: 2, totalDistributed: '8,100.00' },
        { id: 'nft_splits', owner: 'GCPQ7T2WKDNXM3YFHB8VZLRSJ4QK', recipientCount: 6, totalDistributed: '15,300.00' },
        { id: 'dev_bounties', owner: 'GDJR8Q1PXWCVBNM3KF5THLZS9YRD', recipientCount: 3, totalDistributed: '6,750.00' },
      ]);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = splits.filter((s) =>
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Explore Splits</h1>
        <p className="text-sm text-text-secondary">
          Browse all registered payment splits on the Stellar network.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by split ID..."
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-bg-card border border-border rounded-xl">
          <p className="text-text-secondary">No splits found matching &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((split, i) => (
            <motion.div
              key={split.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/splits/${split.id}`}
                className="block p-5 bg-bg-card border border-border rounded-xl hover:border-accent/30 transition-all group"
              >
                <h3 className="font-mono text-sm font-semibold text-text-primary group-hover:text-accent transition-colors mb-3">
                  {split.id}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Owner</span>
                    <span className="font-mono text-text-secondary">{truncateAddress(split.owner, 4)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Recipients</span>
                    <span className="text-text-secondary">{split.recipientCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Distributed</span>
                    <span className="font-mono text-accent font-medium">${split.totalDistributed}</span>
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
