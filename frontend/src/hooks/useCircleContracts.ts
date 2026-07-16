'use client';

import { useSorobanContract } from './useSorobanContract';
import { useWallet } from '@/components/WalletProvider';
import { useCallback, useState } from 'react';

// Simulated circle data for the MVP frontend
export interface CircleData {
  id: string;
  name: string;
  contributionAmount: string;
  maxMembers: number;
  currentMembers: number;
  cycleDurationDays: number;
  members: string[];
}

export function useCircleContracts() {
  const { address } = useWallet();
  const { txState, execute, reset } = useSorobanContract();
  
  // Simulated state for circles (in production, this reads from Soroban RPC)
  const [circles, setCircles] = useState<CircleData[]>([
    {
      id: 'circle-alpha',
      name: 'Alpha Savings',
      contributionAmount: '500000000', // 50 USDC
      maxMembers: 5,
      currentMembers: 3,
      cycleDurationDays: 7,
      members: ['GDT...', 'GBX...'],
    },
    {
      id: 'circle-beta',
      name: 'Beta Accumulators',
      contributionAmount: '1000000000', // 100 USDC
      maxMembers: 10,
      currentMembers: 10,
      cycleDurationDays: 30,
      members: ['GDT...', 'GBX...'],
    }
  ]);

  const createCircle = useCallback(async (params: { name: string, amount: string, maxMembers: number, duration: number }) => {
    if (!address) throw new Error('Wallet not connected');

    return execute(async () => {
      // Simulate on-chain transaction
      await new Promise(r => setTimeout(r, 1500));
      const newCircleId = `circle-${Date.now()}`;
      
      const newCircle: CircleData = {
        id: newCircleId,
        name: params.name,
        contributionAmount: params.amount,
        maxMembers: params.maxMembers,
        currentMembers: 1,
        cycleDurationDays: params.duration,
        members: [address],
      };
      
      setCircles(prev => [newCircle, ...prev]);
      
      return {
        hash: `tx_${Date.now()}`,
        result: newCircleId,
      };
    });
  }, [address, execute]);

  const joinCircle = useCallback(async (circleId: string) => {
    if (!address) throw new Error('Wallet not connected');

    return execute(async () => {
      // Simulate on-chain transaction
      await new Promise(r => setTimeout(r, 1200));
      
      setCircles(prev => prev.map(c => 
        c.id === circleId 
          ? { ...c, currentMembers: c.currentMembers + 1, members: [...c.members, address] }
          : c
      ));

      return { hash: `tx_${Date.now()}` };
    });
  }, [address, execute]);

  const contributeToCircle = useCallback(async (circleId: string, amount: string) => {
    if (!address) throw new Error('Wallet not connected');

    return execute(async () => {
      // Simulate on-chain transaction
      await new Promise(r => setTimeout(r, 2000));
      return { hash: `tx_${Date.now()}` };
    });
  }, [address, execute]);

  return {
    circles,
    txState,
    createCircle,
    joinCircle,
    contributeToCircle,
    resetTxState: reset
  };
}
