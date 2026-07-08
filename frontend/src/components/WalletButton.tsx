'use client';

import { useWallet } from './WalletProvider';
import { truncateAddress } from '@/lib/stellar';

export default function WalletButton() {
  const { publicKey, isConnected, isConnecting, connect, disconnect, error } = useWallet();

  if (isConnected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-text-secondary bg-bg-surface px-3 py-1.5 rounded-lg border border-border hidden sm:inline-block">
          {truncateAddress(publicKey, 6)}
        </span>
        <button
          onClick={disconnect}
          className="btn-secondary text-sm !py-1.5 !px-3"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-end">
      <button
        onClick={connect}
        disabled={isConnecting}
        className="btn-primary text-sm flex items-center gap-2"
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connecting...
          </>
        ) : (
          'Connect Wallet'
        )}
      </button>
      {error && (
        <div className="absolute top-full mt-2 right-0 w-64 p-3 rounded-lg bg-error-bg border border-error/20 shadow-lg animate-slide-up z-50">
          <p className="text-xs text-error font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
