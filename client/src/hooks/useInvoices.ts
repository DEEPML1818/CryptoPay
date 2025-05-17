import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Invoice, InsertInvoice } from '@shared/schema';

export function useInvoices(creatorId?: number, status?: string) {
  const queryKey = creatorId || status 
    ? ['/api/invoices', { creatorId, status }]
    : ['/api/invoices'];

  return useQuery<Invoice[]>({
    queryKey,
  });
}

export function useInvoice(id: number) {
  return useQuery<Invoice>({
    queryKey: [`/api/invoices/${id}`],
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  return useMutation({
    mutationFn: async (invoice: InsertInvoice) => {
      const response = await apiRequest('POST', '/api/invoices', invoice);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate invoices list to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
  });
}

export function useUpdateInvoice() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertInvoice> }) => {
      const response = await apiRequest('PATCH', `/api/invoices/${id}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate specific invoice and invoices list
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
  });
}

/**
 * Get the SOL to USD conversion rate
 */
export function useSolanaPrice() {
  return useQuery<{ price: number }>({
    queryKey: ['/api/solana/price'],
  });
}
