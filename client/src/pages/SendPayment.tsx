import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePayInvoice } from "@/hooks/useTransactions";
import { useSolanaPrice } from "@/hooks/useSolanaPrice";
import { useSolanaInvoices } from "@/hooks/useSolanaInvoices";
import { useWalletContext } from "@/providers/WalletProvider";
import { Layout } from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatSOL } from "@/utils/currency";
import { 
  CreditCard, ArrowRight, Check, X, Loader2, AlertCircle, 
  ClipboardCopy, Share2
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Schema for payment form validation
const paymentSchema = z.object({
  recipientWalletAddress: z.string()
    .min(32, { message: "Please enter a valid Solana wallet address" })
    .max(44, { message: "Please enter a valid Solana wallet address" }),
  amount: z.preprocess(
    (a) => parseFloat(a as string),
    z.number()
      .positive({ message: "Amount must be greater than 0" })
      .min(0.000001, { message: "Minimum amount is 0.000001 SOL" })
  ),
  memo: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function SendPayment() {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { address, balance } = useWalletContext();
  const { data: solanaPrice } = useSolanaPrice();
  const { mutateAsync: payInvoice } = usePayInvoice();
  const solanaInvoices = useSolanaInvoices();
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      recipientWalletAddress: "",
      amount: undefined,
      memo: "",
    },
  });
  
  // Calculate USD value based on current SOL price
  const watchAmount = form.watch("amount");
  const usdAmount = watchAmount && solanaPrice?.price 
    ? (watchAmount * solanaPrice.price) 
    : 0;
  
  // Check if there's sufficient balance
  const insufficientBalance = watchAmount ? (balance || 0) < watchAmount : false;
  
  // Cancel payment and go back to payments page
  const handleCancel = () => {
    navigate("/payments");
  };
  
  // Go to review step
  const handleContinue = () => {
    setStep(2);
  };
  
  // Track the transaction hash
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
  // Confirm and process payment
  const handleConfirmPayment = async (values: PaymentFormValues) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // First, process the escrow payment on Solana blockchain
      const txId = await solanaInvoices.processEscrowPayment({
        senderWallet: address || "",
        recipientWallet: values.recipientWalletAddress,
        amount: values.amount,
        memo: values.memo || "Payment from CryptoPay"
      });
      
      if (!txId) {
        throw new Error("Failed to process blockchain payment");
      }
      
      // Store the transaction hash
      setTransactionHash(txId);
      
      // The blockchain payment is already recorded on the server side in processEscrowPayment,
      // but we'll update our UI queries to ensure the latest data is displayed
      
      setPaymentSuccess(true);
      toast({
        title: "Payment Successful",
        description: `You sent ${formatSOL(values.amount)} to ${values.recipientWalletAddress.slice(0, 6)}...${values.recipientWalletAddress.slice(-4)}`,
      });
      
      // Automatically redirect after 3 seconds
      setTimeout(() => {
        navigate("/payments");
      }, 3000);
      
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err?.message || "Failed to process payment. Please try again.");
      setPaymentSuccess(false);
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
    }
  };
  
  // Submit handler that shows confirmation dialog
  const onSubmit = async (values: PaymentFormValues) => {
    if (insufficientBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough SOL to complete this transaction",
        variant: "destructive",
      });
      return;
    }
    
    // When coming from Review step (step 2), process the payment
    if (step === 2) {
      await handleConfirmPayment(values);
      setStep(3);
    } else {
      // In step 1, just show the confirmation dialog
      setShowConfirmDialog(true); 
    }
  };
  
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center space-x-2 mb-6">
          <h1 className="text-2xl font-semibold">Send Payment</h1>
        </div>
        
        {/* Payment flow steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
              step === 1 ? "bg-primary text-white" : "bg-primary/20 text-primary"
            }`}>
              1
            </div>
            <div className="h-0.5 w-16 bg-gray-200 dark:bg-gray-700 mx-2"></div>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
              step === 2 ? "bg-primary text-white" : "bg-primary/20 text-primary"
            }`}>
              2
            </div>
            <div className="h-0.5 w-16 bg-gray-200 dark:bg-gray-700 mx-2"></div>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
              step === 3 ? "bg-primary text-white" : "bg-primary/20 text-primary"
            }`}>
              3
            </div>
          </div>
          <div className="flex text-xs mt-2">
            <div className="flex-1 text-center">Payment Details</div>
            <div className="flex-1 text-center">Review</div>
            <div className="flex-1 text-center">Confirmation</div>
          </div>
        </div>
        
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Enter the payment details to send SOL tokens via the Solana blockchain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="recipientWalletAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Wallet Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter Solana wallet address" 
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the recipient's Solana wallet address
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (SOL)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="number"
                              step="0.000001"
                              min="0.000001"
                              placeholder="0.00"
                              {...field}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                              SOL
                            </div>
                          </div>
                        </FormControl>
                        <div className="flex justify-between">
                          <FormDescription>
                            {usdAmount > 0 && `≈ ${formatCurrency(usdAmount)} USD`}
                          </FormDescription>
                          <FormDescription>
                            Balance: {formatSOL(balance || 0)} SOL
                          </FormDescription>
                        </div>
                        {insufficientBalance && (
                          <div className="text-red-500 text-sm flex items-center mt-1">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Insufficient balance
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="memo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Memo (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Add a note to this payment" 
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Add an optional note that will be stored on-chain
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={handleCancel} type="button">
                      Cancel
                    </Button>
                    <Button type="button" onClick={() => form.handleSubmit(handleContinue)()}>
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
        
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Review Payment</CardTitle>
              <CardDescription>
                Please review your payment details before confirming.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                <div className="flex justify-between mb-3">
                  <span className="text-gray-500 dark:text-gray-400">From</span>
                  <span className="font-mono text-sm">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                  </span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-gray-500 dark:text-gray-400">To</span>
                  <span className="font-mono text-sm">
                    {form.getValues().recipientWalletAddress 
                      ? `${form.getValues().recipientWalletAddress.slice(0, 6)}...${form.getValues().recipientWalletAddress.slice(-4)}`
                      : ''}
                  </span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-gray-500 dark:text-gray-400">Amount</span>
                  <span className="font-medium">{formatSOL(form.getValues().amount || 0)} SOL</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-gray-500 dark:text-gray-400">USD Value</span>
                  <span>{formatCurrency(usdAmount)}</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-gray-500 dark:text-gray-400">Network Fee</span>
                  <span>0.000005 SOL</span>
                </div>
                {form.getValues().memo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Memo</span>
                    <span>{form.getValues().memo}</span>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatSOL((form.getValues().amount || 0) + 0.000005)} SOL</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button 
                onClick={() => setShowConfirmDialog(true)} 
                disabled={!!insufficientBalance}
              >
                Send Payment
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {paymentSuccess ? (
                  <>
                    <Check className="h-6 w-6 text-green-500 mr-2" />
                    Payment Successful
                  </>
                ) : (
                  <>
                    <X className="h-6 w-6 text-red-500 mr-2" />
                    Payment Failed
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentSuccess ? (
                <div className="text-center py-6">
                  <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-lg font-medium mb-2">
                    You've sent {formatSOL(form.getValues().amount || 0)} SOL
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    The transaction has been confirmed on the Solana blockchain.
                  </p>
                  
                  {transactionHash && (
                    <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-md mx-auto max-w-md">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transaction Details</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Transaction ID:</span>
                        <div className="flex items-center">
                          <span className="text-xs font-mono truncate max-w-xs">
                            {transactionHash.slice(0, 8)}...{transactionHash.slice(-8)}
                          </span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => {
                            navigator.clipboard.writeText(transactionHash || "");
                            toast({
                              title: "Copied",
                              description: "Transaction ID copied to clipboard"
                            });
                          }}>
                            <ClipboardCopy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => window.open(`https://explorer.solana.com/tx/${transactionHash}?cluster=devnet`, '_blank')}
                      >
                        <Share2 className="h-3 w-3 mr-1" />
                        View on Solana Explorer
                      </Button>
                    </div>
                  )}
                  
                  <Button asChild>
                    <a href="/payments">View Payment History</a>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-lg font-medium mb-2">
                    Payment Failed
                  </p>
                  <p className="text-red-500 dark:text-red-400 mb-1">
                    {error}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Please try again or contact support if the issue persists.
                  </p>
                  <div className="space-x-4">
                    <Button variant="outline" onClick={() => setStep(1)}>Try Again</Button>
                    <Button asChild>
                      <a href="/payments">Return to Payments</a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Blockchain Payment confirmation dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Blockchain Payment</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4 pt-2">
                <p>
                  You are about to send <span className="font-semibold">{formatSOL(form.getValues().amount || 0)} SOL</span> to:
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md font-mono text-sm break-all">
                  {form.getValues().recipientWalletAddress}
                </div>
                <p className="text-amber-600 dark:text-amber-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Blockchain transactions are irreversible. Please verify all details before confirming.
                </p>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Transaction Fee:</span>
                    <span>0.000005 SOL</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium mt-1">
                    <span>Total Amount:</span>
                    <span>{formatSOL((form.getValues().amount || 0) + 0.000005)} SOL</span>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isProcessing}
                onClick={() => {
                  handleConfirmPayment(form.getValues());
                  setStep(3);
                }}
                className="bg-primary hover:bg-primary/90"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Blockchain Transaction...
                  </>
                ) : (
                  <>Confirm & Sign Transaction</>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}