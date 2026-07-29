import React from 'react';
import { Medal, Award, Trophy, Gem } from 'lucide-react';

export type BadgeTier = 'None' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond';

interface ReputationBadgeProps {
  tier: BadgeTier;
  className?: string;
  showLabel?: boolean;
}

const TIER_STYLES: Record<Exclude<BadgeTier, 'None'>, string> = {
  Bronze: 'bg-[#CD7F32]/10 border-[#CD7F32]/30 text-[#CD7F32]',
  Silver: 'bg-[#C0C0C0]/10 border-[#C0C0C0]/30 text-[#C0C0C0]',
  Gold: 'bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700]',
  Diamond: 'bg-accent/10 border-accent/30 text-accent shadow-[0_0_12px_rgba(0,229,255,0.25)]',
};

const TIER_ICONS: Record<Exclude<BadgeTier, 'None'>, React.ComponentType<{ size?: number }>> = {
  Bronze: Medal,
  Silver: Award,
  Gold: Trophy,
  Diamond: Gem,
};

export default function ReputationBadge({ tier, className = '', showLabel = false }: ReputationBadgeProps) {
  if (tier === 'None') return null;

  const Icon = TIER_ICONS[tier];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${TIER_STYLES[tier]} ${className}`}>
      <Icon size={12} />
      {showLabel && <span>{tier}</span>}
    </div>
  );
}
