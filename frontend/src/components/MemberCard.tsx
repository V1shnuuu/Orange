import { CheckCircle2, Clock } from 'lucide-react';
import ReputationBadge, { BadgeTier } from './ReputationBadge';
import { truncateAddress } from '@/lib/stellar';

interface MemberCardProps {
  address: string;
  joinedAt: Date;
  tier: BadgeTier;
  hasContributed: boolean;
  isCurrentUser?: boolean;
}

export default function MemberCard({
  address,
  joinedAt,
  tier,
  hasContributed,
  isCurrentUser,
}: MemberCardProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors ${
        isCurrentUser
          ? 'border-white/20 bg-white/[0.04]'
          : 'border-border bg-bg-card hover:border-border-hover'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-bg-surface font-mono text-[13px] text-text-secondary">
          {address.slice(1, 3)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-mono text-sm font-medium text-white">
              {truncateAddress(address)}
            </span>
            {isCurrentUser && (
              <span className="shrink-0 rounded-md bg-white/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                You
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
            <span>Joined {joinedAt.toLocaleDateString()}</span>
            <ReputationBadge tier={tier} />
          </div>
        </div>
      </div>

      {hasContributed ? (
        <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-accent">
          <CheckCircle2 size={15} />
          <span className="hidden sm:inline">Contributed</span>
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-text-muted">
          <Clock size={15} />
          <span className="hidden sm:inline">Pending</span>
        </span>
      )}
    </div>
  );
}
