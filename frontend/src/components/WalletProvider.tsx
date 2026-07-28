'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { classifyError, type AppError } from '@/lib/errors';

interface WalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: AppError | null;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType>({
  publicKey: null,
  isConnected: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
  error: null,
  clearError: () => {},
});

export function useWallet() {
  return useContext(WalletContext);
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
      // Dynamic import to avoid SSR issues
      const kitModule = await import('@creit.tech/stellar-wallets-kit');
      const utilsModule = await import('@creit.tech/stellar-wallets-kit/modules/utils');
      
      const StellarWalletsKit = kitModule.StellarWalletsKit;
      const defaultModules = utilsModule.defaultModules;

      // v2.5 uses static methods — init() then setWallet() then getAddress()
      StellarWalletsKit.init({
        modules: defaultModules(),
      });
      StellarWalletsKit.setWallet('freighter');

      const { address } = await StellarWalletsKit.fetchAddress();
      setPublicKey(address);
      localStorage.setItem('splitstream_wallet', address);
    } catch (err: unknown) {
      console.error("Wallet connection error:", err);
      setError(classifyError(err));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    localStorage.removeItem('splitstream_wallet');
  }, []);

  const clearError = useCallback(() => setError(null), []);

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
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
