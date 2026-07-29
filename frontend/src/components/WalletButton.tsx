'use client';

import { Wallet } from 'lucide-react';
import { useWallet } from './WalletProvider';
import { truncateAddress } from '@/lib/stellar';
import ErrorBanner from './ErrorBanner';
import Button from './Button';

export default function WalletButton() {
  const { publicKey, isConnected, isConnecting, connect, disconnect, error, clearError } = useWallet();

  if (isConnected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-block text-xs font-mono text-text-secondary bg-bg-surface px-3 py-1.5 rounded-lg border border-border">
          {truncateAddress(publicKey, 6)}
        </span>
        <Button variant="secondary" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-end">
      <Button variant="primary" size="sm" onClick={connect} isLoading={isConnecting}>
        {!isConnecting && <Wallet size={14} />}
        {isConnecting ? 'Connecting…' : 'Connect Wallet'}
      </Button>
      {error && error.type !== 'wallet_not_installed' && (
        <div className="absolute top-full mt-2 right-0 w-64 z-50 animate-fade-in-up">
          <ErrorBanner error={error} onDismiss={clearError} />
        </div>
      )}
      {error && error.type === 'wallet_not_installed' && (
        <ErrorBanner error={error} onDismiss={clearError} />
      )}
    </div>
  );
}
