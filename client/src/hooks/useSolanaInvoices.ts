import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { connection } from '@/lib/solana-connection';
import { useWalletContext } from '@/providers/WalletProvider';
import { solanaUtils } from '@/lib/solana';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Keypair
} from '@solana/web3.js';

// Explorer URL for viewing transactions on Solana devnet
const SOLANA_EXPLORER_URL = 'https://explorer.solana.com/tx/';
const NETWORK_PARAM = '?cluster=devnet';

/**
 * Hook for handling Solana blockchain invoice operations
 */
export function useSolanaInvoices() {
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const { toast } = useToast();
  const { address } = useWalletContext();

  /**
   * Create an invoice on the Solana blockchain
   */
  const createInvoiceOnChain = async (invoiceData: {
    recipientAddress: string;
    amount: number;
    dueDate: string;
    invoiceNumber: string;
  }): Promise<string | null> => {
    setIsCreating(true);
    try {
      if (!address) {
        throw new Error('Wallet not connected');
      }
      
      console.log('Creating invoice on Solana blockchain:', invoiceData);
      
      // Use the solanaUtils to create an invoice on-chain
      const transactionId = await solanaUtils.createInvoice({
        creator: address,
        recipient: invoiceData.recipientAddress,
        amount: invoiceData.amount,
        dueDate: invoiceData.dueDate,
        invoiceNumber: invoiceData.invoiceNumber
      });
      
      if (!transactionId) {
        throw new Error('Failed to create invoice on blockchain');
      }
      
      toast({
        title: "Invoice Created On-Chain",
        description: `Transaction ID: ${transactionId.slice(0, 8)}...${transactionId.slice(-4)}`,
      });
      
      return transactionId;
    } catch (error: any) {
      console.error('Error creating invoice on blockchain:', error);
      toast({
        title: "Blockchain Error",
        description: error.message || "Failed to create invoice on Solana blockchain",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Process payment through escrow to the blockchain
   */
  const processEscrowPayment = async (paymentData: {
    senderWallet: string;
    recipientWallet: string;
    amount: number;
    invoiceId?: string | number;
    memo?: string;
  }): Promise<string | null> => {
    setIsProcessing(true);
    try {
      // Check for Phantom wallet availability
      if (!window.phantom?.solana) {
        // Open Phantom website if not installed
        window.open('https://phantom.app/', '_blank');
        throw new Error('Phantom wallet not installed. Please install it and try again.');
      }
      
      // Check if wallet is connected
      if (!window.phantom.solana.isConnected || !window.phantom.solana.publicKey) {
        try {
          // Attempt to connect wallet
          await window.phantom.solana.connect();
        } catch (connErr) {
          console.error('Failed to connect to Phantom wallet:', connErr);
          throw new Error('Please connect your Phantom wallet before making a payment.');
        }
      }
      
      console.log('Processing payment on Solana blockchain:', paymentData);
      
      // Create a direct transfer transaction
      const lamports = paymentData.amount * LAMPORTS_PER_SOL;
      
      // Verify sender has enough balance
      try {
        const balance = await connection.getBalance(new PublicKey(paymentData.senderWallet));
        console.log('Current wallet balance (lamports):', balance);
        console.log('Required amount (lamports):', lamports);
        
        if (balance < lamports) {
          // Not enough balance, request airdrop in devnet
          toast({
            title: "Insufficient Balance",
            description: "Your wallet doesn't have enough SOL. Requesting an airdrop from devnet...",
          });
          
          const airdropSignature = await solanaUtils.requestAirdrop(paymentData.senderWallet, 2);
          
          if (airdropSignature) {
            toast({
              title: "Airdrop Successful",
              description: "Received 2 SOL from devnet. Proceeding with payment...",
            });
            
            // Wait for airdrop to be confirmed
            await connection.confirmTransaction(airdropSignature);
          }
        }
      } catch (balanceError) {
        console.error('Error checking balance:', balanceError);
      }
      
      // Create a transaction using SystemProgram.transfer
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(paymentData.senderWallet),
          toPubkey: new PublicKey(paymentData.recipientWallet),
          lamports,
        })
      );
      
      // Set recent blockhash and fee payer
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(paymentData.senderWallet);
      
      try {
        console.log('Requesting transaction signature...');
        
        // Ask the user to sign the transaction with Phantom
        const signedTransaction = await window.phantom.solana.signTransaction(transaction);
        console.log('Transaction signed successfully');
        
        // Send the signed transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        console.log('Transaction sent with signature:', signature);
        
        // Wait for confirmation with more detailed parameters
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        });
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        console.log('Transaction confirmed:', confirmation);
        
        // Record this payment in our database via the API
        const apiResponse = await fetch('/api/solana/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            senderWalletAddress: paymentData.senderWallet,
            recipientWalletAddress: paymentData.recipientWallet,
            amount: paymentData.amount,
            memo: paymentData.memo || `Payment for invoice ${paymentData.invoiceId || 'unknown'}`,
            transactionHash: signature,
            invoiceId: paymentData.invoiceId
          }),
        });
        
        if (!apiResponse.ok) {
          console.warn('API record failed, but blockchain transaction succeeded');
        }
        
        // Add link to Solana Explorer
        const explorerLink = `${SOLANA_EXPLORER_URL}${signature}${NETWORK_PARAM}`;
        
        toast({
          title: "Payment Successful",
          description: `Transaction confirmed on Solana blockchain. View on Solana Explorer: ${explorerLink}`,
        });
        
        // If this was for an invoice, update the invoice UI
        if (paymentData.invoiceId) {
          // Trigger a refetch of the invoice data
          setTimeout(() => {
            fetch(`/api/invoices/${paymentData.invoiceId}`).then(res => res.json());
          }, 1000);
        }
        
        return signature;
      } catch (err: any) {
        console.error('Error with Phantom signing:', err);
        
        // If user rejected or there was another error, handle gracefully
        if (err.message?.includes('User rejected')) {
          toast({
            title: "Transaction Cancelled",
            description: "You cancelled the transaction",
            variant: "destructive",
          });
          return null;
        }
        
        // For other errors, try airdrop if balance is low
        try {
          const balance = await connection.getBalance(new PublicKey(paymentData.senderWallet));
          if (balance < lamports) {
            toast({
              title: "Insufficient Balance",
              description: "Requesting SOL airdrop from devnet faucet...",
            });
            
            // Request airdrop (only works on devnet/testnet)
            const airdropSignature = await solanaUtils.requestAirdrop(paymentData.senderWallet, 2);
            
            if (airdropSignature) {
              toast({
                title: "Airdrop Successful",
                description: "Received 2 SOL from devnet. Please try payment again.",
              });
              return null;
            }
          }
        } catch (airdropError) {
          console.error('Failed to request airdrop:', airdropError);
        }
        
        toast({
          title: "Transaction Failed",
          description: err.message || "Failed to complete the transaction",
          variant: "destructive",
        });
        
        throw err; // Re-throw to be caught by outer catch
      }
    } catch (error: any) {
      console.error('Error processing payment on blockchain:', error);
      toast({
        title: "Blockchain Error",
        description: error.message || "Failed to process payment on Solana blockchain",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Release funds from escrow to recipient
   * In a full implementation, this would use an Anchor program
   */
  const releaseFundsFromEscrow = async (releaseData: {
    escrowAccount: string;
    recipientAddress: string;
    amount: number;
    invoiceId: string | number;
  }): Promise<string | null> => {
    setIsReleasing(true);
    try {
      if (!address) {
        throw new Error('Wallet not connected');
      }
      
      console.log('Releasing funds from escrow:', releaseData);
      
      // Use solanaUtils to release funds
      const transactionId = await solanaUtils.releaseFundsFromEscrow({
        invoiceId: releaseData.invoiceId,
        authorizer: address,
        recipient: releaseData.recipientAddress
      });
      
      if (!transactionId) {
        throw new Error('Failed to release funds from escrow');
      }
      
      // Add link to Solana Explorer (if it's a real transaction)
      let explorerLink = '';
      if (!transactionId.startsWith('release_')) {
        explorerLink = `${SOLANA_EXPLORER_URL}${transactionId}${NETWORK_PARAM}`;
      }
      
      toast({
        title: "Funds Released",
        description: explorerLink 
          ? `Escrow funds released to recipient. View on Solana Explorer: ${explorerLink}`
          : `Transaction ID: ${transactionId.slice(0, 8)}...${transactionId.slice(-4)}`,
      });
      
      return transactionId;
    } catch (error: any) {
      console.error('Error releasing funds from escrow:', error);
      toast({
        title: "Blockchain Error",
        description: error.message || "Failed to release funds from escrow",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsReleasing(false);
    }
  };

  /**
   * Process refund from escrow back to sender
   * In a full implementation, this would use an Anchor program
   */
  const processRefund = async (refundData: {
    escrowAccount: string;
    senderAddress: string;
    amount: number;
    invoiceId: string | number;
  }): Promise<string | null> => {
    setIsRefunding(true);
    try {
      if (!address) {
        throw new Error('Wallet not connected');
      }
      
      console.log('Processing refund from escrow:', refundData);
      
      // Use solanaUtils to process refund
      const transactionId = await solanaUtils.processRefund({
        invoiceId: refundData.invoiceId,
        authorizer: address,
        recipient: refundData.senderAddress // Original sender receives refund
      });
      
      if (!transactionId) {
        throw new Error('Failed to process refund from escrow');
      }
      
      // Add link to Solana Explorer (if it's a real transaction)
      let explorerLink = '';
      if (!transactionId.startsWith('refund_')) {
        explorerLink = `${SOLANA_EXPLORER_URL}${transactionId}${NETWORK_PARAM}`;
      }
      
      toast({
        title: "Refund Processed",
        description: explorerLink
          ? `Escrow funds refunded to original sender. View on Solana Explorer: ${explorerLink}`
          : `Transaction ID: ${transactionId.slice(0, 8)}...${transactionId.slice(-4)}`,
      });
      
      return transactionId;
    } catch (error: any) {
      console.error('Error processing refund from escrow:', error);
      toast({
        title: "Blockchain Error",
        description: error.message || "Failed to process refund from escrow",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsRefunding(false);
    }
  };

  // Pay an invoice with escrow
  const payInvoiceWithEscrow = async (data: {
    invoiceId: number;
    recipientAddress: string;
    amount: number;
  }): Promise<string | null> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }
    
    console.log('Paying invoice with escrow:', data);
    
    // Process the escrow payment
    return processEscrowPayment({
      senderWallet: address,
      recipientWallet: data.recipientAddress,
      amount: data.amount,
      invoiceId: data.invoiceId,
      memo: `Payment for invoice #${data.invoiceId}`
    });
  };

  // Request airdrop for testing on devnet
  const requestDevnetAirdrop = async (walletAddress: string, amount = 2): Promise<string | null> => {
    try {
      toast({
        title: "Requesting Airdrop",
        description: `Requesting ${amount} SOL from Solana devnet...`
      });
      
      const signature = await solanaUtils.requestAirdrop(walletAddress, amount);
      
      if (signature) {
        toast({
          title: "Airdrop Successful",
          description: `Received ${amount} SOL from devnet. Check your wallet balance.`,
        });
        return signature;
      } else {
        throw new Error('Airdrop failed');
      }
    } catch (error: any) {
      console.error('Error requesting airdrop:', error);
      toast({
        title: "Airdrop Failed",
        description: error.message || "Could not request SOL from devnet",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    createInvoiceOnChain,
    payInvoiceWithEscrow,
    processEscrowPayment,
    releaseFundsFromEscrow,
    processRefund,
    requestDevnetAirdrop,
    isCreating,
    isProcessing,
    isReleasing,
    isRefunding,
  };
}