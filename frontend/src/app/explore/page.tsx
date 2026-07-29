'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
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
    <div className="container py-14">
      <PageHeader
        eyebrow="Explore"
        title="All payment splits"
        description="Browse every registered payment split on the Stellar network."
      />

      {/* Search + sort toolbar */}
      <div className="mb-8 flex flex-col gap-3 md:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by split ID…"
            aria-label="Search splits"
            className="input-field pl-10"
          />
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          aria-label="Sort splits"
          className="input-field max-w-[220px]"
        >
          <option value="distributed">Most distributed</option>
          <option value="recipients">Most recipients</option>
          <option value="id">Name A–Z</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : displayed.length === 0 ? (
        <EmptyState
          icon="◎"
          title={search ? `No splits matching "${search}"` : 'No splits yet'}
          description={
            search
              ? 'Try a different search term.'
              : 'Be the first to create a payment split on Stellar.'
          }
          action={
            !search ? (
              <Button onClick={() => router.push('/splits/new')}>Create a split</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {displayed.map((split) => (
            <Link
              key={split.id}
              href={`/splits/${split.id}`}
              className="glass-card glass-card-hoverable group block p-6 no-underline"
            >
              <h3 className="mb-5 font-mono text-[15px] font-semibold text-white transition-colors group-hover:text-iris-cyan">
                {split.id}
              </h3>
              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-text-muted">Owner</dt>
                  <dd className="font-mono text-text-secondary">
                    {truncateAddress(split.owner, 4)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Recipients</dt>
                  <dd className="text-text-secondary">{split.recipientCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Distributed</dt>
                  <dd className="font-mono font-medium text-iris-mint">
                    ${split.totalDistributed}
                  </dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
