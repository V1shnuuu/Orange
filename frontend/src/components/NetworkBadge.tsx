'use client';

import { NETWORK } from '@/lib/stellar';

/**
 * Small pill that shows which Stellar network the app is connected to.
 * Renders with distinct colors for testnet vs mainnet to prevent confusion.
 */
export default function NetworkBadge() {
  const isTestnet = NETWORK === 'testnet';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        isTestnet
          ? 'border-warning/25 bg-warning/10 text-warning'
          : 'border-accent/25 bg-accent/10 text-accent'
      }`}
      title={`Connected to Stellar ${NETWORK}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isTestnet ? 'bg-warning' : 'bg-accent'}`}
      />
      {isTestnet ? 'Testnet' : 'Mainnet'}
    </span>
  );
}
