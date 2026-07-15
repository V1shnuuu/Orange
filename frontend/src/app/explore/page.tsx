'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import Card from '@/components/Card';
import { useDebounce } from '@/hooks/useDebounce';
import { truncateAddress } from '@/lib/stellar';

interface ExploreSplit {
  id: string;
  owner: string;
  recipientCount: number;
  totalDistributed: string;
  totalDistributedRaw: number;
}

type SortKey = 'distributed' | 'recipients' | 'id';

export default function ExplorePage() {
  const router = useRouter();
  const [splits, setSplits] = useState<ExploreSplit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('distributed');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplits([
        { id: 'team_salary', owner: 'GBZX4TKKRMQNFTO2HKPXS4TH6HNCQB', recipientCount: 4, totalDistributed: '12,500.00', totalDistributedRaw: 12500 },
        { id: 'creator_rev', owner: 'GCRW8J5TNPLQX2WDKFZ9M7B3CGHJK', recipientCount: 3, totalDistributed: '3,200.00', totalDistributedRaw: 3200 },
        { id: 'dao_treasury', owner: 'GAZX6N9KLPD4MWCFQYH5TBRJVGZK', recipientCount: 5, totalDistributed: '45,000.00', totalDistributedRaw: 45000 },
        { id: 'music_royalties', owner: 'GBTK3M7NXRFCVSQJD9W4KHLZ8PBN', recipientCount: 2, totalDistributed: '8,100.00', totalDistributedRaw: 8100 },
        { id: 'nft_splits', owner: 'GCPQ7T2WKDNXM3YFHB8VZLRSJ4QK', recipientCount: 6, totalDistributed: '15,300.00', totalDistributedRaw: 15300 },
        { id: 'dev_bounties', owner: 'GDJR8Q1PXWCVBNM3KF5THLZS9YRD', recipientCount: 3, totalDistributed: '6,750.00', totalDistributedRaw: 6750 },
      ]);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const displayed = useMemo(() => {
    const filtered = splits.filter((s) =>
      s.id.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      if (sortKey === 'distributed') return b.totalDistributedRaw - a.totalDistributedRaw;
      if (sortKey === 'recipients') return b.recipientCount - a.recipientCount;
      return a.id.localeCompare(b.id);
    });
  }, [splits, debouncedSearch, sortKey]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Explore Splits</h1>
        <p className="text-sm text-text-secondary">
          Browse all registered payment splits on the Stellar network.
        </p>
      </div>

      {/* Search + Sort toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by split ID..."
          className="flex-1 max-w-sm"
        />
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="text-sm bg-bg-card border border-border rounded-lg px-3 py-2 text-text-secondary focus:outline-none focus:border-accent/50"
        >
          <option value="distributed">Sort: Most Distributed</option>
          <option value="recipients">Sort: Most Recipients</option>
          <option value="id">Sort: Name A–Z</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : displayed.length === 0 ? (
        <EmptyState
          icon="🔍"
          title={search ? `No splits matching "${search}"` : 'No splits yet'}
          description={search ? 'Try a different search term.' : 'Be the first to create a payment split on Stellar.'}
          action={!search ? { label: 'Create a Split', onClick: () => router.push('/splits/new') } : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((split, i) => (
            <Card
              key={split.id}
              animate
              delay={i * 0.05}
              hoverable
              className="!p-0"
            >
              <Link
                href={`/splits/${split.id}`}
                className="block p-5"
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
