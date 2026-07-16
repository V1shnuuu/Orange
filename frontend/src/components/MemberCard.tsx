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
    <div className={`p-4 rounded-xl border flex items-center justify-between ${
      isCurrentUser ? 'bg-accent/5 border-accent/20' : 'bg-bg-card border-border'
    }`}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-text-secondary font-mono text-sm border border-border">
          {address.slice(1, 3)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium text-text-primary">
              {truncateAddress(address)}
            </span>
            {isCurrentUser && (
              <span className="text-[10px] uppercase tracking-wider bg-accent/20 text-accent px-1.5 py-0.5 rounded">You</span>
            )}
          </div>
          <div className="text-xs text-text-muted mt-1 flex items-center gap-2">
            Joined {joinedAt.toLocaleDateString()}
            <ReputationBadge tier={tier} />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end">
        {hasContributed ? (
          <span className="text-accent text-sm font-medium flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Contributed
          </span>
        ) : (
          <span className="text-text-secondary text-sm flex items-center gap-1">
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
