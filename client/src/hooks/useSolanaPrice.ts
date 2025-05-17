import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

/**
 * Hook to fetch the current Solana price in USD from a real API
 * @returns The current SOL/USD price data
 */
export function useSolanaPrice() {
  return useQuery({
    queryKey: ['/api/solana/price'],
    refetchInterval: 60000, // Refresh every minute
    select: (data) => data as { price: number }
  });
}