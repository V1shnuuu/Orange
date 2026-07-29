'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCircleContracts } from '@/hooks/useCircleContracts';
import { useWallet } from '@/components/WalletProvider';
import { formatAmount } from '@/lib/stellar';
import ProgressRing from '@/components/ProgressRing';
import Timeline from '@/components/Timeline';
import MemberCard from '@/components/MemberCard';
import TransactionStatusCard from '@/components/TransactionStatusCard';
import ErrorBanner from '@/components/ErrorBanner';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';

export default function CircleDashboardPage() {
  const params = useParams();
  const id = params.id as string;
  const { publicKey: address } = useWallet();
  const { circles, joinCircle, contributeToCircle, txState, resetTxState } =
    useCircleContracts();

  const circle = circles.find((c) => c.id === id);
  const isMember = address ? circle?.members.includes(address) : false;
  const isFull = circle ? circle.currentMembers >= circle.maxMembers : false;

  const handleJoin = async () => {
    try {
      await joinCircle(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleContribute = async () => {
    try {
      await contributeToCircle(id, circle!.contributionAmount);
    } catch (e) {
      console.error(e);
    }
  };

  const timelineEvents = useMemo(() => {
    return [
      {
        title: 'Cycle started',
        description: 'Waiting for all members to contribute.',
        date: 'Now',
        status: 'completed' as const,
      },
      {
        title: 'Contributions',
        description: '2/5 members paid',
        date: 'In progress',
        status: 'current' as const,
      },
      {
        title: 'Payout',
        description: 'To be disbursed to Member 1',
        date: 'End of cycle',
        status: 'upcoming' as const,
      },
    ];
  }, []);

  if (!circle) {
    return (
      <div className="container py-14">
        <EmptyState
          title="Circle not found"
          description="This circle doesn't exist or may have been removed."
          icon="○"
          action={
            <Link href="/circles">
              <Button>Browse circles</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const totalPool = BigInt(circle.contributionAmount) * BigInt(circle.maxMembers);
  const currentPool = BigInt(circle.contributionAmount) * BigInt(2); // Simulated
  const poolPercent = Number((currentPool * BigInt(100)) / totalPool);

  return (
    <div className="container py-14">
      <Link
        href="/circles"
        className="mb-8 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-white"
      >
        <ArrowLeft size={15} />
        Back to circles
      </Link>

      {txState.status === 'failed' && (
        <div className="mb-6">
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

      {txState.status !== 'idle' && txState.status !== 'failed' && (
        <div className="mx-auto mb-8 max-w-md">
          <TransactionStatusCard
            status={txState.status}
            hash={txState.hash}
            error={txState.error}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: pool + actions */}
        <div className="flex flex-col gap-6">
          <div className="glass-card p-7 text-center">
            <h1 className="heading-page mb-1 text-white">{circle.name}</h1>
            <p className="mb-7 text-sm text-text-secondary">
              Cycle 1 of {circle.maxMembers}
            </p>

            <div className="mb-7 flex justify-center">
              <ProgressRing progress={poolPercent} size={168} strokeWidth={10}>
                <span className="font-mono text-2xl font-bold text-white">
                  ${formatAmount(currentPool)}
                </span>
                <span className="mt-0.5 text-xs text-text-muted">
                  of ${formatAmount(totalPool)}
                </span>
              </ProgressRing>
            </div>

            <dl className="mb-7 space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <dt className="text-text-secondary">Your contribution</dt>
                <dd className="font-mono font-medium text-white">
                  ${formatAmount(BigInt(circle.contributionAmount))}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-text-secondary">Expected payout</dt>
                <dd className="font-mono font-semibold text-iris-mint">
                  ${formatAmount(totalPool)}
                </dd>
              </div>
            </dl>

            {!isMember ? (
              <Button
                onClick={handleJoin}
                disabled={isFull}
                variant={isFull ? 'outline' : 'primary'}
                size="lg"
                className="w-full"
              >
                {isFull ? 'Circle full' : 'Join circle'}
              </Button>
            ) : (
              <Button onClick={handleContribute} size="lg" className="w-full">
                Pay contribution
              </Button>
            )}
          </div>

          <div className="glass-card p-7">
            <h2 className="mb-6 text-[15px] font-semibold tracking-tight text-white">
              Cycle timeline
            </h2>
            <Timeline events={timelineEvents} />
          </div>
        </div>

        {/* Right column: members */}
        <div className="lg:col-span-2">
          <div className="glass-card p-7">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold tracking-tight text-white">
                Members
              </h2>
              <span className="rounded-full border border-border bg-white/5 px-2.5 py-1 font-mono text-[11px] text-text-secondary">
                {circle.currentMembers} / {circle.maxMembers}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {circle.members.map((member, idx) => (
                <MemberCard
                  key={member}
                  address={member}
                  joinedAt={new Date()}
                  tier={idx === 0 ? 'Gold' : 'Silver'} // Simulated tier
                  hasContributed={idx === 0}
                  isCurrentUser={address === member}
                />
              ))}

              {/* Empty slots */}
              {Array.from({
                length: circle.maxMembers - circle.currentMembers,
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex h-[74px] items-center justify-center rounded-2xl border border-dashed border-border bg-bg-card/40"
                >
                  <span className="text-sm text-text-muted">Empty slot</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
