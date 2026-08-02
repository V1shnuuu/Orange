import Link from 'next/link';
import { motion } from 'motion/react';
import { CircleCheck } from 'lucide-react';
import { formatAmount } from '@/lib/stellar';
import Button from './Button';

interface CircleCardProps {
  id: string;
  name: string;
  contributionAmount: string; // in stroops
  maxMembers: number;
  currentMembers: number;
  cycleDurationDays: number;
  isOnChain?: boolean;
}

export default function CircleCard({
  id,
  name,
  contributionAmount,
  maxMembers,
  currentMembers,
  cycleDurationDays,
  isOnChain,
}: CircleCardProps) {
  const isFull = currentMembers >= maxMembers;
  const progressPercent = (currentMembers / maxMembers) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card glass-card-hoverable flex flex-col p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-[17px] font-semibold leading-snug tracking-tight text-white">
          {name}
        </h3>
        <span className="shrink-0 rounded-full border border-border bg-white/5 px-2.5 py-1 font-mono text-[11px] text-text-secondary">
          {cycleDurationDays}D
        </span>
      </div>

      {isOnChain && (
        <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
          <CircleCheck size={12} />
          On-chain
        </span>
      )}

      <dl className="mb-6 space-y-2.5">
        <div className="flex justify-between text-sm">
          <dt className="text-text-secondary">Contribution</dt>
          <dd className="font-mono font-medium text-white">
            ${formatAmount(BigInt(contributionAmount))}
          </dd>
        </div>
        <div className="flex justify-between text-sm">
          <dt className="text-text-secondary">Total payout</dt>
          <dd className="font-mono font-semibold text-iris-mint">
            ${formatAmount(BigInt(contributionAmount) * BigInt(maxMembers))}
          </dd>
        </div>
      </dl>

      <div className="mb-7">
        <div className="mb-2 flex justify-between text-xs">
          <span className="text-text-secondary">Members</span>
          <span className="font-medium text-white">
            {currentMembers} / {maxMembers}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
          <motion.div
            className={`h-full rounded-full ${isFull ? 'bg-white/40' : 'bg-iris'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </div>
      </div>

      <Link href={`/circles/${id}`} className="mt-auto block">
        <Button
          variant={isFull ? 'outline' : 'primary'}
          className="w-full"
          disabled={isFull}
        >
          {isFull ? 'Circle full' : 'View circle'}
        </Button>
      </Link>
    </motion.div>
  );
}
