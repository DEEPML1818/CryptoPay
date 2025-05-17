import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Transaction, InsertTransaction } from '@shared/schema';

export function useTransactions(userId?: number) {
  const queryKey = userId 
    ? ['/api/transactions', { userId }]
    : ['/api/transactions'];

  return useQuery<Transaction[]>({
    queryKey,
  });
}

export function useCreateTransaction() {
  return useMutation({
    mutationFn: async (transaction: InsertTransaction) => {
      const response = await apiRequest('POST', '/api/transactions', transaction);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate transactions list and invoices since they might be updated
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
  });
}

/**
 * Process a payment for an invoice or direct payment
 */
export function usePayInvoice() {
  const createTransaction = useCreateTransaction();
  
  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      senderWalletAddress, 
      recipientWalletAddress,
      amount,
      fiatAmount,
      transactionHash,
      memo
    }: {
      invoiceId?: number;
      senderWalletAddress: string;
      recipientWalletAddress: string;
      amount: number;
      fiatAmount?: number;
      transactionHash?: string;
      memo?: string;
    }) => {
      // Create a transaction record (this connects to real Solana blockchain via the hooks)
      return createTransaction.mutateAsync({
        invoiceId,
        senderWalletAddress,
        recipientWalletAddress,
        amount: amount.toString(), // Convert to string
        fiatAmount: fiatAmount?.toString(), // Convert to string
        transactionType: 'payment',
        status: 'success',
        timestamp: new Date(),
        transactionHash,
        memo
      });
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
    }
  });
}
