'use client';

import { useSorobanContract } from './useSorobanContract';
import { useWallet } from '@/components/WalletProvider';
import { useCallback, useState } from 'react';
import { invokeContract, arg } from '@/lib/soroban';
import { CIRCLE_FACTORY_CONTRACT_ID } from '@/lib/contracts';
import { toSorobanSymbol, generateCircleId } from '@/lib/stellar';

export interface CircleData {
  id: string;
  name: string;
  contributionAmount: string;
  maxMembers: number;
  currentMembers: number;
  cycleDurationDays: number;
  members: string[];
  /**
   * True when this circle's creation was a real, verifiable transaction
   * against the deployed circle-factory contract on Stellar testnet.
   * Membership/contribution/payout state below is still tracked locally —
   * circle-core is deployed as a single-instance contract and doesn't yet
   * support multiple concurrent circles, so those actions aren't on-chain
   * yet (see README's "Known gaps" section).
   */
  isOnChain?: boolean;
  createCircleTxHash?: string;
}

export function useCircleContracts() {
  const { publicKey, signTransaction } = useWallet();
  const address = publicKey;
  const { txState, execute, reset } = useSorobanContract();

  // Seed data for the MVP frontend so the list/dashboard aren't empty before
  // any real circle has been created. Real circles created via createCircle()
  // are prepended to this list with isOnChain: true.
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
      members: [
        'GDT42G5...M9QZ',
        'GBX8M2T...L4P1',
        'GA2P9Q7...R5X8',
        'GCF1V4B...N9M2',
        'GBL5K8J...H3T7',
        'GDP9Z3M...W4R1',
        'GAT7C2V...B8L9',
        'GCX4M9N...Q2P5',
        'GBR1H8F...T7K3',
        'GDV5B2C...M4Z8'
      ],
    }
  ]);

  const createCircle = useCallback(async (params: { name: string, amount: string, maxMembers: number, duration: number }) => {
    if (!address) throw new Error('Wallet not connected');
    if (!CIRCLE_FACTORY_CONTRACT_ID) {
      throw new Error('Circle factory contract is not configured (NEXT_PUBLIC_CIRCLE_FACTORY_CONTRACT_ID is missing).');
    }

    return execute(async () => {
      const circleId = generateCircleId();
      const nameSymbol = toSorobanSymbol(params.name);

      // Real, signed transaction against the deployed circle-factory contract.
      const { hash } = await invokeContract({
        contractId: CIRCLE_FACTORY_CONTRACT_ID,
        method: 'create_circle',
        sourceAddress: address,
        signTransaction,
        args: [
          arg(address, 'address'),
          arg(circleId, 'symbol'),
          arg(nameSymbol, 'symbol'),
          arg(BigInt(params.amount), 'i128'),
          arg(params.maxMembers, 'u32'),
          arg(params.duration, 'u32'),
        ],
      });

      const newCircle: CircleData = {
        id: circleId,
        name: params.name,
        contributionAmount: params.amount,
        maxMembers: params.maxMembers,
        currentMembers: 1,
        cycleDurationDays: params.duration,
        members: [address],
        isOnChain: true,
        createCircleTxHash: hash,
      };

      setCircles(prev => [newCircle, ...prev]);

      return {
        hash,
        result: circleId,
      };
    });
  }, [address, execute, signTransaction]);

  const joinCircle = useCallback(async (circleId: string) => {
    if (!address) throw new Error('Wallet not connected');

    // Not yet wired to circle-core: it's deployed as a single-instance
    // contract with no per-circle deployment mechanism, so it can't back
    // more than one circle today. Tracked locally until that's resolved.
    return execute(async () => {
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

    // Not yet wired to circle-core — see joinCircle for why.
    return execute(async () => {
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
