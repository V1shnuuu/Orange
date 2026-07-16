'use client';

import { useParams } from 'next/navigation';
import { useCircleContracts } from '@/hooks/useCircleContracts';
import { useWallet } from '@/components/WalletProvider';
import { formatAmount } from '@/lib/stellar';
import ProgressRing from '@/components/ProgressRing';
import Timeline from '@/components/Timeline';
import MemberCard from '@/components/MemberCard';
import TransactionStatusCard from '@/components/TransactionStatusCard';
import ErrorBanner from '@/components/ErrorBanner';
import { useMemo } from 'react';

export default function CircleDashboardPage() {
  const params = useParams();
  const id = params.id as string;
  const { address } = useWallet();
  const { circles, joinCircle, contributeToCircle, txState, resetTxState } = useCircleContracts();
  
  const circle = circles.find(c => c.id === id);
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
      { title: 'Cycle Started', description: 'Waiting for all members to contribute.', date: 'Now', status: 'completed' as const },
      { title: 'Contributions', description: '2/5 members paid', date: 'In Progress', status: 'current' as const },
      { title: 'Payout', description: 'To be disbursed to Member 1', date: 'End of Cycle', status: 'upcoming' as const },
    ];
  }, []);

  if (!circle) {
    return <div className="text-center py-20">Circle not found.</div>;
  }

  const totalPool = BigInt(circle.contributionAmount) * BigInt(circle.maxMembers);
  const currentPool = BigInt(circle.contributionAmount) * BigInt(2); // Simulated

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {txState.status === 'failed' && (
        <div className="mb-6"><ErrorBanner error={new Error(txState.error)} onDismiss={resetTxState} /></div>
      )}
      
      {txState.status !== 'idle' && txState.status !== 'failed' && (
         <div className="mb-8 max-w-md mx-auto">
           <TransactionStatusCard state={txState} title="Processing Transaction" onReset={resetTxState} />
         </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Action */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
            <h1 className="text-2xl font-bold text-text-primary mb-1">{circle.name}</h1>
            <p className="text-sm text-text-secondary mb-6">Cycle 1 of {circle.maxMembers}</p>
            
            <div className="flex justify-center mb-6">
              <ProgressRing progress={40} size={160} strokeWidth={10}>
                <span className="text-2xl font-mono font-bold text-text-primary">${formatAmount(currentPool)}</span>
                <span className="text-xs text-text-secondary">/ ${formatAmount(totalPool)} Pool</span>
              </ProgressRing>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Your Contribution</span>
                <span className="font-mono font-medium">${formatAmount(BigInt(circle.contributionAmount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Expected Payout</span>
                <span className="font-mono font-bold text-accent">${formatAmount(totalPool)}</span>
              </div>
            </div>

            {!isMember ? (
              <button 
                onClick={handleJoin} 
                disabled={isFull} 
                className={`w-full py-3 rounded-lg font-semibold ${isFull ? 'bg-bg-secondary text-text-secondary' : 'btn-primary'}`}
              >
                {isFull ? 'Circle Full' : 'Join Circle'}
              </button>
            ) : (
              <button 
                onClick={handleContribute}
                className="w-full py-3 rounded-lg font-semibold btn-primary shadow-glow"
              >
                Pay Contribution
              </button>
            )}
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold text-text-primary mb-4">Cycle Timeline</h3>
            <Timeline events={timelineEvents} />
          </div>
        </div>

        {/* Right Column: Members */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-text-primary">Members ({circle.currentMembers}/{circle.maxMembers})</h3>
            </div>
            <div className="space-y-4">
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
              {Array.from({ length: circle.maxMembers - circle.currentMembers }).map((_, i) => (
                <div key={`empty-${i}`} className="p-4 rounded-xl border border-dashed border-border bg-bg-secondary/30 flex items-center justify-center h-[74px]">
                  <span className="text-sm text-text-muted">Empty Slot</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
