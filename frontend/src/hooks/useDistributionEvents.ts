'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DistributionEvent } from '@/lib/contracts';

const POLL_INTERVAL = 4000; // 4 seconds

// Simulated event polling — in production this would query Soroban RPC for contract events
export function useDistributionEvents(splitId?: string) {
  const [events, setEvents] = useState<DistributionEvent[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const poll = useCallback(async () => {
    setIsPolling(true);
    try {
      // In production: query Soroban RPC getEvents endpoint
      // const server = new SorobanRpc.Server(STELLAR_RPC_URL);
      // const result = await server.getEvents({ startLedger, filters: [...] });
      //
      // For now, generate realistic mock events for UI demonstration
      const mockEvents: DistributionEvent[] = [
        {
          id: `evt-${Date.now()}-1`,
          splitId: splitId || 'team_pay',
          sender: 'GBZX...4KRM',
          totalAmount: '500.00',
          timestamp: Math.floor(Date.now() / 1000) - 120,
          recipients: [
            { address: 'GDFK...9L2P', amount: '250.00' },
            { address: 'GCXT...7B3Q', amount: '150.00' },
            { address: 'GARZ...2M8N', amount: '100.00' },
          ],
        },
        {
          id: `evt-${Date.now()}-2`,
          splitId: splitId || 'creator_v2',
          sender: 'GCRW...8J5T',
          totalAmount: '1,200.00',
          timestamp: Math.floor(Date.now() / 1000) - 360,
          recipients: [
            { address: 'GDPX...3K7M', amount: '600.00' },
            { address: 'GBNE...1R4S', amount: '360.00' },
            { address: 'GCML...5W2H', amount: '240.00' },
          ],
        },
        {
          id: `evt-${Date.now()}-3`,
          splitId: splitId || 'dao_treasury',
          sender: 'GAZX...6N9K',
          totalAmount: '2,000.00',
          timestamp: Math.floor(Date.now() / 1000) - 900,
          recipients: [
            { address: 'GBWK...4P2L', amount: '800.00' },
            { address: 'GCFR...7T8M', amount: '600.00' },
            { address: 'GDJN...2Q5R', amount: '400.00' },
            { address: 'GAXM...9K3S', amount: '200.00' },
          ],
        },
        {
          id: `evt-${Date.now()}-4`,
          splitId: splitId || 'royalties',
          sender: 'GBTK...3M7N',
          totalAmount: '350.00',
          timestamp: Math.floor(Date.now() / 1000) - 1800,
          recipients: [
            { address: 'GCXW...8P4Q', amount: '175.00' },
            { address: 'GDFM...5R2T', amount: '175.00' },
          ],
        },
        {
          id: `evt-${Date.now()}-5`,
          splitId: splitId || 'team_bonus',
          sender: 'GARZ...1K4L',
          totalAmount: '800.00',
          timestamp: Math.floor(Date.now() / 1000) - 3600,
          recipients: [
            { address: 'GBPX...6N3M', amount: '400.00' },
            { address: 'GCWK...2T7S', amount: '240.00' },
            { address: 'GDJR...8Q1P', amount: '160.00' },
          ],
        },
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to poll events:', error);
    } finally {
      setIsPolling(false);
    }
  }, [splitId]);

  useEffect(() => {
    // Initial fetch
    setTimeout(() => poll(), 0);

    // Start polling
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [poll]);

  return { events, isPolling, poll };
}
