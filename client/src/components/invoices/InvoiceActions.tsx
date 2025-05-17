import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSolanaInvoices } from '@/hooks/useSolanaInvoices';
import { useToast } from '@/hooks/use-toast';
import { useWalletContext } from '@/providers/WalletProvider';
import { useUserRole } from '@/hooks/useUserRole';
import { Invoice } from '@shared/schema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Shield, 
  CheckCircle, 
  RefreshCw, 
  Ban,
  ExternalLink,
  CreditCard,
  ArrowUpRight
} from 'lucide-react';
import { formatSOL } from '@/utils/currency';

interface InvoiceActionsProps {
  invoice: Invoice;
  onUpdate?: () => void;
}

export function InvoiceActions({ invoice, onUpdate }: InvoiceActionsProps) {
  const { payInvoiceWithEscrow, processEscrowPayment, releaseFundsFromEscrow, processRefund } = useSolanaInvoices();
  const { connected, address } = useWalletContext();
  const { userRole: role } = useUserRole();
  const { toast } = useToast();
  
  // Dialog state
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle escrow payment
  const handlePayInvoice = async () => {
    if (!connected || !address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to make a payment',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('Invoice details:', {
        id: invoice.id,
        recipient: invoice.recipientWalletAddress,
        amount: invoice.amount
      });
      
      if (!invoice.recipientWalletAddress) {
        throw new Error('Recipient wallet address is missing');
      }
      
      // Ensure amount is a number
      const amount = typeof invoice.amount === 'string' 
        ? parseFloat(invoice.amount) 
        : Number(invoice.amount);
        
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid invoice amount');
      }
      
      const result = await payInvoiceWithEscrow({
        invoiceId: invoice.id,
        recipientAddress: invoice.recipientWalletAddress,
        amount: amount,
      });
      
      if (result) {
        toast({
          title: 'Payment Successful',
          description: 'Your payment has been successfully processed on the Solana blockchain',
        });
        
        // Wait a bit and refresh the data
        setTimeout(() => {
          onUpdate?.();
        }, 2000);
      } else {
        // Transaction might have been canceled by user
        toast({
          title: 'Payment Not Completed',
          description: 'The transaction was not completed. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'There was an error processing your payment',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setIsPayDialogOpen(false);
    }
  };
  
  // Handle fund release from escrow
  const handleReleaseFunds = async () => {
    if (!connected || !address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to release funds',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Get the invoice amount as a number
      const amount = typeof invoice.amount === 'string' 
        ? parseFloat(invoice.amount) 
        : Number(invoice.amount);
        
      const result = await releaseFundsFromEscrow({
        escrowAccount: 'placeholder', // Using a placeholder until we have real escrow accounts
        recipientAddress: invoice.recipientWalletAddress || '',
        amount: amount,
        invoiceId: invoice.id
      });
      
      if (result) {
        toast({
          title: 'Funds Released',
          description: 'Payment has been released to the recipient',
        });
        
        // Update invoice data after successful fund release
        setTimeout(() => {
          onUpdate?.();
        }, 2000);
      }
    } catch (error) {
      console.error('Error releasing funds:', error);
      toast({
        title: 'Release Failed',
        description: 'There was an error releasing the funds',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setIsReleaseDialogOpen(false);
    }
  };
  
  // Handle refund from escrow
  const handleRefund = async () => {
    if (!connected || !address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to process refund',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // In a real implementation, the client's wallet address would be stored with the invoice
      // This is just for demonstration
      const clientAddress = invoice.creatorWalletAddress || '';
      
      // Get the invoice amount as a number
      const amount = typeof invoice.amount === 'string' 
        ? parseFloat(invoice.amount) 
        : Number(invoice.amount);
      
      const result = await processRefund({
        escrowAccount: 'placeholder', // Using placeholder as we don't have real escrow accounts yet
        senderAddress: clientAddress,
        amount: amount,
        invoiceId: invoice.id
      });
      
      if (result) {
        toast({
          title: 'Refund Processed',
          description: 'The funds have been refunded to the client',
        });
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error processing refund:', error);
    } finally {
      setIsProcessing(false);
      setIsRefundDialogOpen(false);
    }
  };
  
  // Function to view transaction on Solana Explorer
  const viewTransaction = () => {
    if (invoice.transactionHash) {
      // For devnet
      window.open(`https://explorer.solana.com/tx/${invoice.transactionHash}?cluster=devnet`, '_blank');
    } else {
      toast({
        title: 'No Transaction Found',
        description: 'This invoice does not have an associated transaction hash',
        variant: 'destructive',
      });
    }
  };
  
  // Handle direct payment without escrow
  const handleDirectPay = async () => {
    if (!connected || !address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to make a payment',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      if (!invoice.recipientWalletAddress) {
        throw new Error('Recipient wallet address is missing');
      }
      
      // Ensure amount is a number
      const amount = typeof invoice.amount === 'string' 
        ? parseFloat(invoice.amount) 
        : Number(invoice.amount);
        
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid invoice amount');
      }
      
      // Direct payment just uses the regular processEscrowPayment function
      // but we'll skip the escrow step for direct payments
      const result = await processEscrowPayment({
        senderWallet: address,
        recipientWallet: invoice.recipientWalletAddress,
        amount: amount,
        invoiceId: invoice.id,
        memo: `Direct payment for invoice #${invoice.id}`
      });
      
      if (result) {
        toast({
          title: 'Direct Payment Successful',
          description: 'Your payment has been successfully processed on the Solana blockchain',
        });
        
        // Wait a bit and refresh the data
        setTimeout(() => {
          onUpdate?.();
        }, 2000);
      } else {
        toast({
          title: 'Payment Not Completed',
          description: 'The transaction was not completed. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error processing direct payment:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'There was an error processing your direct payment',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setIsPayDialogOpen(false);
    }
  };
  
  // Render client actions
  const renderClientActions = () => {
    if (invoice.status === 'pending') {
      return (
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button
            onClick={() => setIsPayDialogOpen(true)}
            disabled={!connected || isProcessing}
            className="bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Shield className="h-4 w-4 mr-2" />
            Pay with Escrow
          </Button>
          
          <Button
            onClick={handleDirectPay}
            disabled={!connected || isProcessing}
            className="bg-gradient-to-br from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Direct Pay
          </Button>
        </div>
      );
    } else if (invoice.status === 'escrowed') {
      return (
        <div className="flex space-x-2">
          <Button
            onClick={() => setIsReleaseDialogOpen(true)}
            disabled={!connected || isProcessing}
            className="bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Release Funds
          </Button>
          <Button
            onClick={() => setIsRefundDialogOpen(true)}
            variant="outline"
            disabled={!connected || isProcessing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Request Refund
          </Button>
        </div>
      );
    } else if (invoice.status === 'paid' || invoice.status === 'refunded') {
      return (
        <Button
          variant="outline"
          onClick={viewTransaction}
          disabled={!invoice.transactionHash}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Transaction
        </Button>
      );
    }
    
    return null;
  };
  
  // Render freelancer actions
  const renderFreelancerActions = () => {
    if (invoice.status === 'escrowed') {
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center mb-2">
            <Shield className="h-4 w-4 mr-2 text-green-500" />
            <span>Funds are secured in escrow</span>
          </div>
          <p>
            The client will release the funds once they approve the work.
            Payment of {formatSOL(Number(invoice.amount))} is waiting.
          </p>
        </div>
      );
    } else if (invoice.status === 'paid') {
      return (
        <Button
          variant="outline"
          onClick={viewTransaction}
          disabled={!invoice.transactionHash}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Transaction
        </Button>
      );
    } else if (invoice.status === 'refunded') {
      return (
        <div className="text-sm text-red-600 dark:text-red-400 flex items-center">
          <Ban className="h-4 w-4 mr-2" />
          <span>This invoice has been refunded to the client</span>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <>
      <div className="mt-4">
        {role === 'client' ? renderClientActions() : renderFreelancerActions()}
      </div>
      
      {/* Pay Invoice Dialog */}
      <AlertDialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pay Invoice with Escrow</AlertDialogTitle>
            <AlertDialogDescription>
              Your payment of {formatSOL(Number(invoice.amount))} SOL will be held in a secure escrow account on the Solana blockchain. You can release the funds to the recipient once you're satisfied with the work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePayInvoice}
              disabled={isProcessing}
              className="bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isProcessing ? 'Processing...' : 'Pay with Escrow'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Release Funds Dialog */}
      <AlertDialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release Funds from Escrow</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to release {formatSOL(Number(invoice.amount))} SOL from escrow to {invoice.recipientName}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReleaseFunds}
              disabled={isProcessing}
              className="bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isProcessing ? 'Processing...' : 'Release Funds'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Refund Dialog */}
      <AlertDialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Refund</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to refund {formatSOL(Number(invoice.amount))} SOL from escrow back to your wallet. This action should only be taken if the work is not satisfactory or as agreed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefund}
              disabled={isProcessing}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {isProcessing ? 'Processing...' : 'Process Refund'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}