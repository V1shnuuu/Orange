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
      whileHover={{ y: -4, borderColor: 'var(--accent)' }}
      className="glass-card flex flex-col justify-between transition-all group"
    >
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold transition-colors">{name}</h3>
          <span className="font-mono text-secondary" style={{ fontSize: '12px', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px' }}>
            {cycleDurationDays}D
          </span>
        </div>
        
        <div className="flex-col gap-2 mb-8">
          <div className="flex justify-between" style={{ fontSize: '14px' }}>
            <span className="text-secondary">Contribution</span>
            <span className="font-mono font-medium">${formatAmount(BigInt(contributionAmount))}</span>
          </div>
          <div className="flex justify-between" style={{ fontSize: '14px' }}>
            <span className="text-secondary">Total Payout</span>
            <span className="font-mono font-bold text-accent">${formatAmount(BigInt(contributionAmount) * BigInt(maxMembers))}</span>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-2" style={{ fontSize: '12px' }}>
            <span className="text-secondary">Members</span>
            <span className="font-medium">{currentMembers} / {maxMembers}</span>
          </div>
          <div style={{ height: '6px', width: '100%', background: 'var(--bg-secondary)', borderRadius: '100px', overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', borderRadius: '100px', background: isFull ? 'var(--error)' : 'var(--accent)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      <Link href={`/circles/${id}`} className="block">
        <button className={`btn w-full ${isFull ? 'btn-secondary' : 'btn-primary'}`} style={{ width: '100%' }} disabled={isFull}>
          {isFull ? 'Circle Full' : 'View Circle'}
        </button>
      </Link>
    </motion.div>
  );
}
