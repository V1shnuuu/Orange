import React from 'react';
import ReputationBadge, { BadgeTier } from './ReputationBadge';
import { truncateAddress } from '@/lib/stellar';

interface MemberCardProps {
  address: string;
  joinedAt: Date;
  tier: BadgeTier;
  hasContributed: boolean;
  isCurrentUser?: boolean;
}

export default function MemberCard({ address, joinedAt, tier, hasContributed, isCurrentUser }: MemberCardProps) {
  return (
    <div className="flex items-center justify-between p-4 glass-card" style={{
      borderColor: isCurrentUser ? 'var(--accent)' : 'var(--border)',
      background: isCurrentUser ? 'rgba(0, 229, 255, 0.05)' : 'var(--bg-card)'
    }}>
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center font-mono text-secondary" style={{
          width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '14px'
        }}>
          {address.slice(1, 3)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium">
              {truncateAddress(address)}
            </span>
            {isCurrentUser && (
              <span className="text-accent" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(0, 229, 255, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>You</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-secondary" style={{ fontSize: '12px' }}>
            Joined {joinedAt.toLocaleDateString()}
            <ReputationBadge tier={tier} />
          </div>
        </div>
      </div>
      
      <div className="flex-col items-center">
        {hasContributed ? (
          <span className="text-accent font-medium flex items-center gap-2" style={{ fontSize: '14px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Contributed
          </span>
        ) : (
          <span className="text-secondary flex items-center gap-2" style={{ fontSize: '14px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Pending
          </span>
        )}
      </div>
    </div>
  );
}
