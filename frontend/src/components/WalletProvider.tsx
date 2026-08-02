'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { classifyError, type AppError } from '@/lib/errors';
import { NETWORK_PASSPHRASE } from '@/lib/stellar';
import type { SignTransactionFn } from '@/lib/soroban';

interface WalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: AppError | null;
  clearError: () => void;
  signTransaction: SignTransactionFn;
}

const WalletContext = createContext<WalletContextType>({
  publicKey: null,
  isConnected: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
  error: null,
  clearError: () => {},
  signTransaction: async () => {
    throw new Error('Wallet not connected');
  },
});

export function useWallet() {
  return useContext(WalletContext);
}

// Module-scoped so the dynamically-imported kit is only fetched once and its
// init()/setWallet() calls stay idempotent across connect() and later signing
// calls (e.g. after a page reload restores the address from localStorage).
type KitModules = {
  StellarWalletsKit: typeof import('@creit.tech/stellar-wallets-kit').StellarWalletsKit;
  defaultModules: typeof import('@creit.tech/stellar-wallets-kit/modules/utils').defaultModules;
};
let kitModulePromise: Promise<KitModules> | null = null;
let kitReady = false;

async function getReadyKit() {
  if (!kitModulePromise) {
    kitModulePromise = Promise.all([
      import('@creit.tech/stellar-wallets-kit'),
      import('@creit.tech/stellar-wallets-kit/modules/utils'),
    ]).then(([kitModule, utilsModule]) => ({
      StellarWalletsKit: kitModule.StellarWalletsKit,
      defaultModules: utilsModule.defaultModules,
    }));
  }
  const { StellarWalletsKit, defaultModules } = await kitModulePromise;
  if (!kitReady) {
    StellarWalletsKit.init({ modules: defaultModules() });
    StellarWalletsKit.setWallet('freighter');
    kitReady = true;
  }
  return StellarWalletsKit;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // Check for existing connection on mount
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('splitstream_wallet') : null;
    if (saved) {
      setTimeout(() => setPublicKey(saved), 0);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const StellarWalletsKit = await getReadyKit();
      const { address } = await StellarWalletsKit.fetchAddress();
      setPublicKey(address);
      localStorage.setItem('splitstream_wallet', address);
    } catch (err: unknown) {
      const classified = classifyError(err);
      if (classified.type !== 'wallet_not_installed') {
        console.error("Wallet connection error:", err);
      }
      setError(classified);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    localStorage.removeItem('splitstream_wallet');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const signTransaction = useCallback<SignTransactionFn>(
    async (xdr: string) => {
      if (!publicKey) throw new Error('Wallet not connected');
      const StellarWalletsKit = await getReadyKit();
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        address: publicKey,
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      return signedTxXdr;
    },
    [publicKey]
  );

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        isConnected: !!publicKey,
        isConnecting,
        connect,
        disconnect,
        error,
        clearError,
        signTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
