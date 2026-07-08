'use client';

import { truncateAddress } from '@/lib/stellar';

interface PreviewPayout {
  address: string;
  amount: string;
}

interface DistributionPreviewProps {
  amount: number;
  recipients: { address: string; share: number }[];
}

export default function DistributionPreview({ amount, recipients }: DistributionPreviewProps) {
  const payouts: PreviewPayout[] = recipients.map((r) => ({
    address: r.address,
    amount: ((amount * r.share) / 100).toFixed(2),
  }));

  return (
    <div className="p-3 rounded-lg bg-bg-surface border border-border/50" data-testid="distribution-preview">
      <p className="text-xs text-text-muted mb-2">Distribution Preview</p>
      {payouts.map((p, i) => (
        <div key={i} className="flex justify-between py-1" data-testid={`payout-${i}`}>
          <span className="font-mono text-xs text-text-secondary">
            {truncateAddress(p.address, 6)}
          </span>
          <span className="font-mono text-xs text-accent" data-testid={`payout-amount-${i}`}>
            ${p.amount}
          </span>
        </div>
      ))}
    </div>
  );
}
