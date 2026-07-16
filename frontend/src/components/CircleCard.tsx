import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { formatAmount } from '@/lib/stellar';

interface CircleCardProps {
  id: string;
  name: string;
  contributionAmount: string; // in USDC
  maxMembers: number;
  currentMembers: number;
  cycleDurationDays: number;
}

export default function CircleCard({
  id,
  name,
  contributionAmount,
  maxMembers,
  currentMembers,
  cycleDurationDays,
}: CircleCardProps) {
  const isFull = currentMembers >= maxMembers;
  const progressPercent = (currentMembers / maxMembers) * 100;

  return (
    <motion.div
      whileHover={{ y: -4, borderColor: 'rgba(0, 201, 177, 0.3)' }}
      className="bg-bg-card border border-border rounded-xl p-5 flex flex-col justify-between transition-all group"
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">{name}</h3>
          <span className="text-xs font-mono bg-bg-secondary px-2 py-1 rounded-md text-text-secondary">
            {cycleDurationDays}D
          </span>
        </div>
        
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Contribution</span>
            <span className="font-mono font-medium text-text-primary">${formatAmount(BigInt(contributionAmount))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Total Payout</span>
            <span className="font-mono font-bold text-accent">${formatAmount(BigInt(contributionAmount) * BigInt(maxMembers))}</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-text-secondary">Members</span>
            <span className="text-text-primary font-medium">{currentMembers} / {maxMembers}</span>
          </div>
          <div className="h-1.5 w-full bg-bg-secondary rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isFull ? 'bg-error' : 'bg-accent'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      <Link href={`/circles/${id}`} className="block">
        <button className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          isFull ? 'bg-bg-secondary text-text-secondary cursor-not-allowed' : 'bg-accent/10 text-accent hover:bg-accent/20'
        }`} disabled={isFull}>
          {isFull ? 'Circle Full' : 'View Circle'}
        </button>
      </Link>
    </motion.div>
  );
}
