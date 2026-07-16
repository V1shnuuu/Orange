import React from 'react';

export type BadgeTier = 'None' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond';

interface ReputationBadgeProps {
  tier: BadgeTier;
  className?: string;
  showLabel?: boolean;
}

export default function ReputationBadge({ tier, className = '', showLabel = false }: ReputationBadgeProps) {
  if (tier === 'None') return null;

  const styles = {
    Bronze: 'bg-[#CD7F32]/10 border-[#CD7F32]/30 text-[#CD7F32]',
    Silver: 'bg-[#C0C0C0]/10 border-[#C0C0C0]/30 text-[#C0C0C0]',
    Gold: 'bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700]',
    Diamond: 'bg-[#00FFFF]/10 border-[#00FFFF]/30 text-[#00FFFF] animate-pulse-teal shadow-[0_0_10px_rgba(0,255,255,0.3)]',
  };

  const icons = {
    Bronze: '🥉',
    Silver: '🥈',
    Gold: '🥇',
    Diamond: '💎',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${styles[tier]} ${className}`}>
      <span>{icons[tier]}</span>
      {showLabel && <span>{tier}</span>}
    </div>
  );
}
