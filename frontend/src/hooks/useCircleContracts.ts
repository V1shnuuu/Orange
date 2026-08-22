'use client';

import { useSorobanContract } from './useSorobanContract';
import { useWallet } from '@/components/WalletProvider';
import { useCallback, useEffect, useState } from 'react';
import { invokeContract, readContract, arg } from '@/lib/soroban';
import { CIRCLE_CORE_CONTRACT_ID, USDC_TOKEN_CONTRACT_ID } from '@/lib/contracts';
import { toSorobanSymbol, generateCircleId } from '@/lib/stellar';

export interface CircleData {
  id: string;
  name: string;
  contributionAmount: string;
  maxMembers: number;
  currentMembers: number;
  cycleDurationDays: number;
  members: string[];
  /** 1-based index of the cycle currently collecting contributions. */
  currentCycle: number;
  /** How many members have paid into the current cycle. */
  contributionsThisCycle: number;
  /** Index into `members` of whoever the next pot goes to. */
  nextPayoutIndex: number;
  started: boolean;
  completed: boolean;
  /** Total ever paid in, in stroops. */
  totalContributed: string;
}

/** Shape returned by circle-core's `get_circle`, after scValToNative. */
interface RawCircleState {
  name: string;
  cycle_duration: number;
  admin: string;
  token: string;
  contribution_amount: bigint;
  members: string[];
  max_members: number;
  current_cycle: number;
  contributions_this_cycle: number;
  next_payout_index: number;
  started: boolean;
  completed: boolean;
  total_contributed: bigint;
}

function toCircleData(id: string, raw: RawCircleState): CircleData {
  return {
    id,
    name: raw.name,
    contributionAmount: raw.contribution_amount.toString(),
    maxMembers: raw.max_members,
    currentMembers: raw.members.length,
    cycleDurationDays: raw.cycle_duration,
    members: raw.members,
    currentCycle: raw.current_cycle,
    contributionsThisCycle: raw.contributions_this_cycle,
    nextPayoutIndex: raw.next_payout_index,
    started: raw.started,
    completed: raw.completed,
    totalContributed: raw.total_contributed.toString(),
  };
}

function requireCoreContract(): string {
  if (!CIRCLE_CORE_CONTRACT_ID) {
    throw new Error(
      'Circle contract is not configured (NEXT_PUBLIC_CIRCLE_CORE_CONTRACT_ID is missing).'
    );
  }
  return CIRCLE_CORE_CONTRACT_ID;
}

/**
 * Read every circle the contract knows about.
 *
 * Kept outside the hook so the mount effect can drive it purely through
 * promise callbacks — no state is touched synchronously.
 */
async function fetchCircles(sourceAddress?: string): Promise<CircleData[]> {
  const contractId = requireCoreContract();

  const ids = (await readContract({
    contractId,
    method: 'list_circles',
    sourceAddress,
  })) as string[] | undefined;

  const loaded = await Promise.all(
    (ids ?? []).map(async (id) => {
      const raw = (await readContract({
        contractId,
        method: 'get_circle',
        args: [arg(id, 'symbol')],
        sourceAddress,
      })) as RawCircleState | undefined;

      return raw ? toCircleData(id, raw) : null;
    })
  );

  // Newest first — list_circles returns them in creation order.
  return loaded.filter((c): c is CircleData => c !== null).reverse();
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to load circles';
}

export function useCircleContracts() {
  const { publicKey, signTransaction } = useWallet();
  const address = publicKey;
  const { txState, execute, reset } = useSorobanContract();

  const [circles, setCircles] = useState<CircleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetchCircles(address ?? undefined)
      .then((loaded) => {
        if (!active) return;
        setCircles(loaded);
        setLoadError(null);
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(messageOf(error));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [address]);

  /** Re-read chain state, e.g. after a transaction confirms. */
  const refresh = useCallback(async () => {
    try {
      setCircles(await fetchCircles(address ?? undefined));
      setLoadError(null);
    } catch (error) {
      setLoadError(messageOf(error));
    }
  }, [address]);

  const createCircle = useCallback(
    async (params: { name: string; amount: string; maxMembers: number; duration: number }) => {
      if (!address) throw new Error('Wallet not connected');
      const contractId = requireCoreContract();
      if (!USDC_TOKEN_CONTRACT_ID) {
        throw new Error(
          'Token contract is not configured (NEXT_PUBLIC_USDC_TOKEN_CONTRACT_ID is missing).'
        );
      }

      return execute(async () => {
        const circleId = generateCircleId();

        const { hash } = await invokeContract({
          contractId,
          method: 'initialize',
          sourceAddress: address,
          signTransaction,
          args: [
            arg(circleId, 'symbol'),
            arg(toSorobanSymbol(params.name), 'symbol'),
            arg(address, 'address'),
            arg(USDC_TOKEN_CONTRACT_ID, 'address'),
            arg(params.maxMembers, 'u32'),
            arg(BigInt(params.amount), 'i128'),
            arg(params.duration, 'u32'),
          ],
        });

        // The creator takes the first seat, which is also the first payout.
        await invokeContract({
          contractId,
          method: 'join_circle',
          sourceAddress: address,
          signTransaction,
          args: [arg(circleId, 'symbol'), arg(address, 'address')],
        });

        await refresh();
        return { hash, result: circleId };
      });
    },
    [address, execute, signTransaction, refresh]
  );

  const joinCircle = useCallback(
    async (circleId: string) => {
      if (!address) throw new Error('Wallet not connected');
      const contractId = requireCoreContract();

      return execute(async () => {
        const { hash } = await invokeContract({
          contractId,
          method: 'join_circle',
          sourceAddress: address,
          signTransaction,
          args: [arg(circleId, 'symbol'), arg(address, 'address')],
        });

        await refresh();
        return { hash };
      });
    },
    [address, execute, signTransaction, refresh]
  );

  const leaveCircle = useCallback(
    async (circleId: string) => {
      if (!address) throw new Error('Wallet not connected');
      const contractId = requireCoreContract();

      return execute(async () => {
        const { hash } = await invokeContract({
          contractId,
          method: 'leave_circle',
          sourceAddress: address,
          signTransaction,
          args: [arg(circleId, 'symbol'), arg(address, 'address')],
        });

        await refresh();
        return { hash };
      });
    },
    [address, execute, signTransaction, refresh]
  );

  const contributeToCircle = useCallback(
    async (circleId: string, amount: string) => {
      if (!address) throw new Error('Wallet not connected');
      const contractId = requireCoreContract();

      return execute(async () => {
        const { hash } = await invokeContract({
          contractId,
          method: 'contribute',
          sourceAddress: address,
          signTransaction,
          args: [arg(circleId, 'symbol'), arg(address, 'address'), arg(BigInt(amount), 'i128')],
        });

        await refresh();
        return { hash };
      });
    },
    [address, execute, signTransaction, refresh]
  );

  return {
    circles,
    isLoading,
    loadError,
    txState,
    refresh,
    createCircle,
    joinCircle,
    leaveCircle,
    contributeToCircle,
    resetTxState: reset,
  };
}
