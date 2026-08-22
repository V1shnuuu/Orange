'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowLeft, CircleCheck, Info } from 'lucide-react';
import { useCircleContracts } from '@/hooks/useCircleContracts';
import { useWallet } from '@/components/WalletProvider';
import { formatAmount } from '@/lib/stellar';
import ProgressRing from '@/components/ProgressRing';
import Timeline from '@/components/Timeline';
import MemberCard from '@/components/MemberCard';
import TransactionStatusCard from '@/components/TransactionStatusCard';
import ErrorBanner from '@/components/ErrorBanner';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import Button from '@/components/Button';

export default function CircleDashboardPage() {
  const params = useParams();
  const id = params.id as string;
  const { publicKey: address } = useWallet();
  const {
    circles,
    isLoading,
    joinCircle,
    leaveCircle,
    contributeToCircle,
    txState,
    resetTxState,
  } = useCircleContracts();

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

  const handleLeave = async () => {
    try {
      await leaveCircle(id);
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
    if (!circle) return [];

    const recipient = circle.members[circle.nextPayoutIndex];

    return [
      {
        title: circle.started ? 'Circle started' : 'Filling seats',
        description: circle.started
          ? `All ${circle.maxMembers} seats taken.`
          : `${circle.currentMembers} of ${circle.maxMembers} seats taken.`,
        date: circle.started ? 'Done' : 'In progress',
        status: circle.started ? ('completed' as const) : ('current' as const),
      },
      {
        title: `Cycle ${circle.currentCycle} contributions`,
        description: `${circle.contributionsThisCycle}/${circle.maxMembers} members paid`,
        date: circle.started ? 'In progress' : 'Waiting for a full circle',
        status: circle.started ? ('current' as const) : ('upcoming' as const),
      },
      {
        title: 'Payout',
        description: recipient
          ? `Next pot goes to ${recipient.slice(0, 4)}...${recipient.slice(-4)}`
          : 'Recipient decided once the circle fills',
        date: circle.completed ? 'Circle complete' : 'End of cycle',
        status: circle.completed ? ('completed' as const) : ('upcoming' as const),
      },
    ];
  }, [circle]);

  if (isLoading && !circle) {
    return (
      <div className="container py-14">
        <LoadingSkeleton />
      </div>
    );
  }

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
  const currentPool =
    BigInt(circle.contributionAmount) * BigInt(circle.contributionsThisCycle);
  const poolPercent = Number((currentPool * BigInt(100)) / totalPool);
  const memberIndex = address ? circle.members.indexOf(address) : -1;
  const hasContributedThisCycle =
    memberIndex >= 0 && memberIndex < circle.contributionsThisCycle;

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

            {circle.completed ? (
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-white/5 px-2.5 py-1 text-[11px] font-medium text-text-muted">
                <CircleCheck size={12} />
                Completed
              </span>
            ) : circle.started ? (
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
                <CircleCheck size={12} />
                Running
              </span>
            ) : (
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-white/5 px-2.5 py-1 text-[11px] font-medium text-text-secondary">
                Open &middot; {circle.maxMembers - circle.currentMembers} seats left
              </span>
            )}

            <p className="mb-7 text-sm text-text-secondary">
              Cycle {Math.min(circle.currentCycle, circle.maxMembers)} of{' '}
              {circle.maxMembers}
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
                disabled={isFull || circle.completed}
                variant={isFull || circle.completed ? 'outline' : 'primary'}
                size="lg"
                className="w-full"
              >
                {circle.completed
                  ? 'Circle complete'
                  : isFull
                    ? 'Circle full'
                    : 'Join circle'}
              </Button>
            ) : circle.completed ? (
              <Button disabled variant="outline" size="lg" className="w-full">
                Circle complete
              </Button>
            ) : circle.started ? (
              <Button
                onClick={handleContribute}
                disabled={hasContributedThisCycle}
                variant={hasContributedThisCycle ? 'outline' : 'primary'}
                size="lg"
                className="w-full"
              >
                {hasContributedThisCycle ? 'Paid this cycle' : 'Pay contribution'}
              </Button>
            ) : (
              <Button
                onClick={handleLeave}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Leave circle
              </Button>
            )}

            <p className="mt-4 flex items-start gap-1.5 text-left text-xs leading-relaxed text-text-muted">
              <Info size={13} className="mt-0.5 shrink-0" />
              Joining, leaving and contributing are signed in your wallet and
              settled on Stellar testnet by the circle-core contract.
            </p>
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
                  tier="None"
                  hasContributed={idx < circle.contributionsThisCycle}
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
