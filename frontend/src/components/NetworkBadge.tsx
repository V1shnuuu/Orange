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
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
        isTestnet
          ? 'bg-warning-bg text-warning border border-warning/20'
          : 'bg-success-bg text-success border border-success/20'
      }`}
      title={`Connected to Stellar ${NETWORK}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isTestnet ? 'bg-warning' : 'bg-success'}`}
      />
      {isTestnet ? 'Testnet' : 'Mainnet'}
    </span>
  );
}
