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
  const { publicKey: address } = useWallet();
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
    <div className="container py-16">
      {txState.status === 'failed' && (
        <div className="mb-6"><ErrorBanner error={{ message: txState.error || 'Unknown error', type: 'contract_error', retryable: false }} onDismiss={resetTxState} /></div>
      )}
      
      {txState.status !== 'idle' && txState.status !== 'failed' && (
         <div className="mb-8 max-w-md mx-auto">
           <TransactionStatusCard status={txState.status} hash={txState.hash} error={txState.error} />
         </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Action */}
        <div className="flex-col gap-6" style={{ gridColumn: 'span 1' }}>
          <div className="glass-card text-center mb-6">
            <h2 className="font-bold mb-2" style={{ fontSize: '24px' }}>{circle.name}</h2>
            <p className="text-secondary mb-6" style={{ fontSize: '14px' }}>Cycle 1 of {circle.maxMembers}</p>
            
            <div className="flex justify-center mb-6">
              <ProgressRing progress={40} size={160} strokeWidth={10}>
                <span className="text-2xl font-mono font-bold text-text-primary">${formatAmount(currentPool)}</span>
                <span className="text-xs text-text-secondary">/ ${formatAmount(totalPool)} Pool</span>
              </ProgressRing>
            </div>

            <div className="flex-col gap-3 mb-6">
              <div className="flex justify-between" style={{ fontSize: '14px' }}>
                <span className="text-secondary">Your Contribution</span>
                <span className="font-mono font-medium">${formatAmount(BigInt(circle.contributionAmount))}</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: '14px' }}>
                <span className="text-secondary">Expected Payout</span>
                <span className="font-mono font-bold text-accent">${formatAmount(totalPool)}</span>
              </div>
            </div>

            {!isMember ? (
              <button 
                onClick={handleJoin} 
                disabled={isFull} 
                className={`btn w-full ${isFull ? 'btn-secondary' : 'btn-primary'}`}
              >
                {isFull ? 'Circle Full' : 'Join Circle'}
              </button>
            ) : (
              <button 
                onClick={handleContribute}
                className="btn btn-primary w-full"
              >
                Pay Contribution
              </button>
            )}
          </div>

          <div className="glass-card">
            <h3 className="font-bold mb-4">Cycle Timeline</h3>
            <Timeline events={timelineEvents} />
          </div>
        </div>

        {/* Right Column: Members */}
        <div className="flex-col gap-6" style={{ gridColumn: 'span 2' }}>
          <div className="glass-card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold">Members ({circle.currentMembers}/{circle.maxMembers})</h3>
            </div>
            <div className="flex-col gap-4">
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
                <div key={`empty-${i}`} className="flex items-center justify-center p-4" style={{ borderRadius: '12px', border: '1px dashed var(--border)', background: 'rgba(10, 10, 10, 0.3)', height: '74px' }}>
                  <span className="text-secondary" style={{ fontSize: '14px' }}>Empty Slot</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
