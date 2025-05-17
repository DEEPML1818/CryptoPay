import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { useSolanaPrice } from "@/hooks/useSolanaPrice";
import { formatCurrency, formatSOL } from "@/utils/currency";
import { useWalletContext } from "@/providers/WalletProvider";
import { apiRequest } from "@/lib/queryClient";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import {
  ArrowRightLeft,
  AlertCircle,
  Loader2,
  ArrowRight,
  Wallet,
  RefreshCw,
  ExternalLink,
  Check,
  Clock,
  Info,
} from "lucide-react";

// Define validation schema for cross-chain transfer
const transferSchema = z.object({
  fromChain: z.string().min(1, "Source chain is required"),
  toChain: z.string().min(1, "Destination chain is required"),
  toAddress: z.string().min(32, "Valid destination address is required"),
  amount: z.preprocess(
    (a) => parseFloat(a as string),
    z.number()
      .positive("Amount must be greater than 0")
      .min(0.001, "Minimum amount is 0.001")
  ),
  memo: z.string().optional(),
});

type TransferFormValues = z.infer<typeof transferSchema>;

// Supported chains for demo
const SUPPORTED_CHAINS = [
  { id: "solana", name: "Solana", symbol: "SOL", logo: "/solana-logo.png" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", logo: "/eth-logo.png" },
  { id: "polygon", name: "Polygon", symbol: "MATIC", logo: "/polygon-logo.png" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB", logo: "/arbitrum-logo.png" },
];

export default function CrossChainTransfer() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { address, balance, connected } = useWalletContext();
  const { data: solanaPrice } = useSolanaPrice();

  // Cross-chain transfer form
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromChain: "solana", // Default source chain is Solana
      toChain: "",
      toAddress: "",
      amount: undefined,
      memo: "",
    },
  });

  // Watch form values for real-time calculations
  const watchAmount = form.watch("amount");
  const watchFromChain = form.watch("fromChain");
  const watchToChain = form.watch("toChain");

  // Calculate USD value based on current price
  const usdAmount = watchAmount && solanaPrice?.price 
    ? (watchAmount * solanaPrice.price) 
    : 0;

  // Check if there's sufficient balance
  const insufficientBalance = watchAmount ? (balance || 0) < watchAmount : false;

  // Get estimated fee
  const [estimatedFee, setEstimatedFee] = useState(0.0005); // Default estimated fee

  // Submit handler for cross-chain transfer
  const onSubmit = async (values: TransferFormValues) => {
    if (!connected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to continue",
        variant: "destructive",
      });
      return;
    }
    
    if (insufficientBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough SOL to complete this transfer",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call our backend API to initiate the cross-chain transfer
      const response = await apiRequest(
        "POST", 
        "/api/walrus/wormhole/transfer", 
        {
          fromChain: values.fromChain,
          toChain: values.toChain,
          fromAddress: address,
          toAddress: values.toAddress,
          tokenAddress: "native", // Using native token for demo
          amount: values.amount,
          memo: values.memo || undefined,
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to initiate cross-chain transfer");
      }
      
      const data = await response.json();
      
      // Store the transaction ID
      setTransactionId(data.transactionId);
      setTransactionStatus("pending");
      
      toast({
        title: "Transfer Initiated",
        description: `Your cross-chain transfer has been initiated. Transaction ID: ${data.transactionId.slice(0, 8)}...`,
      });
      
      // Poll for status updates
      pollTransactionStatus(data.transactionId);
      
    } catch (error: any) {
      console.error("Cross-chain transfer error:", error);
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to initiate cross-chain transfer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to poll for transaction status updates
  const pollTransactionStatus = async (txId: string) => {
    const checkStatus = async () => {
      try {
        const response = await apiRequest(
          "GET", 
          `/api/walrus/wormhole/transfer/${txId}`
        );
        
        if (!response.ok) {
          throw new Error("Failed to check transfer status");
        }
        
        const data = await response.json();
        setTransactionStatus(data.status);
        
        // If still pending, continue polling
        if (data.status === "pending") {
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        } else if (data.status === "completed") {
          toast({
            title: "Transfer Completed",
            description: "Your cross-chain transfer has been completed successfully!",
          });
        } else if (data.status === "failed") {
          toast({
            title: "Transfer Failed",
            description: data.error || "Your cross-chain transfer failed. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking transaction status:", error);
        // Continue polling even if check fails
        setTimeout(checkStatus, 5000);
      }
    };
    
    // Start polling
    checkStatus();
  };
  
  // Function to get estimated fees
  const fetchEstimatedFees = async () => {
    if (!watchFromChain || !watchToChain || !watchAmount) return;
    
    try {
      const response = await apiRequest(
        "GET", 
        `/api/walrus/wormhole/estimate-fees?fromChain=${watchFromChain}&toChain=${watchToChain}&amount=${watchAmount}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to estimate fees");
      }
      
      const data = await response.json();
      setEstimatedFee(data.totalFee);
    } catch (error) {
      console.error("Error estimating fees:", error);
      // Set a default fee if estimation fails
      setEstimatedFee(0.0005);
    }
  };
  
  // Update fee estimate when relevant form values change
  useEffect(() => {
    if (watchFromChain && watchToChain && watchAmount) {
      fetchEstimatedFees();
    }
  }, [watchFromChain, watchToChain, watchAmount]);
  
  // Find chain details for selected chains
  const fromChainDetails = SUPPORTED_CHAINS.find(chain => chain.id === watchFromChain);
  const toChainDetails = SUPPORTED_CHAINS.find(chain => chain.id === watchToChain);
  
  return (
    <Layout>
      <div className="container py-6 max-w-3xl">
        <div className="flex flex-col space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Cross-Chain Transfer</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Transfer tokens between different blockchains using Wormhole bridge technology
          </p>
        </div>
        
        {/* Wallet info card */}
        <Card className="mb-6">
          <CardHeader className="py-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Wallet Connection</CardTitle>
              {connected ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Check className="w-3 h-3 mr-1" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                  <AlertCircle className="w-3 h-3 mr-1" /> Not Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          {connected ? (
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Wallet Address</p>
                  <p className="font-mono text-sm truncate max-w-md">
                    {address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
                  <p className="font-medium">{formatSOL(balance || 0)} SOL</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ≈ {formatCurrency((balance || 0) * (solanaPrice?.price || 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent>
              <div className="flex justify-center">
                <Button onClick={() => navigate('/settings')}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
        
        {/* Cross-chain transfer form */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer Tokens</CardTitle>
            <CardDescription>
              Send tokens from one blockchain to another via Wormhole bridge
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Source and destination chains */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fromChain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Chain</FormLabel>
                        <Select
                          disabled={true} // Locked to Solana for demo
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source chain" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SUPPORTED_CHAINS.map((chain) => (
                              <SelectItem key={chain.id} value={chain.id}>
                                <div className="flex items-center">
                                  <div className="w-5 h-5 mr-2 flex items-center justify-center">
                                    {chain.id === "solana" && <img src="https://cryptologos.cc/logos/solana-sol-logo.png" className="w-4 h-4" alt={chain.name} />}
                                  </div>
                                  {chain.name} ({chain.symbol})
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Source blockchain (currently limited to Solana for demo)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="toChain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Chain</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select destination chain" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SUPPORTED_CHAINS.filter(chain => chain.id !== "solana").map((chain) => (
                              <SelectItem key={chain.id} value={chain.id}>
                                <div className="flex items-center">
                                  <div className="w-5 h-5 mr-2 flex items-center justify-center">
                                    {chain.id === "ethereum" && <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" className="w-4 h-4" alt={chain.name} />}
                                    {chain.id === "polygon" && <img src="https://cryptologos.cc/logos/polygon-matic-logo.png" className="w-4 h-4" alt={chain.name} />}
                                    {chain.id === "arbitrum" && <img src="https://cryptologos.cc/logos/arbitrum-arb-logo.png" className="w-4 h-4" alt={chain.name} />}
                                  </div>
                                  {chain.name} ({chain.symbol})
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Destination blockchain for your tokens
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Destination address */}
                <FormField
                  control={form.control}
                  name="toAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`Enter ${toChainDetails?.name || 'destination'} wallet address`}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The wallet address on the destination chain that will receive the tokens
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.001"
                            min="0.001"
                            placeholder="0.00"
                            {...field}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
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
                
                {/* Memo */}
                <FormField
                  control={form.control}
                  name="memo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Memo (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Add a note to this transfer"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Add an optional note for this cross-chain transfer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Transfer summary */}
                {watchFromChain && watchToChain && watchAmount && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Transfer Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">From</span>
                        <span className="font-medium">{fromChainDetails?.name || watchFromChain}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">To</span>
                        <span className="font-medium">{toChainDetails?.name || watchToChain}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Amount</span>
                        <span className="font-medium">{watchAmount ? `${watchAmount} SOL` : '-'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">USD Value</span>
                        <span>{formatCurrency(usdAmount)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Estimated Fee</span>
                        <span>{estimatedFee} SOL</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Total</span>
                        <span>{(watchAmount + estimatedFee).toFixed(6)} SOL</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Transaction status */}
                {transactionId && (
                  <Alert className="mt-6">
                    <Info className="h-4 w-4" />
                    <AlertTitle>
                      Transfer {transactionStatus === 'completed' ? 'Completed' : transactionStatus === 'pending' ? 'In Progress' : 'Failed'}
                    </AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>Transaction ID: <span className="font-mono">{transactionId.slice(0, 8)}...{transactionId.slice(-4)}</span></p>
                      <div className="flex items-center mt-2">
                        {transactionStatus === 'pending' ? (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                            <Clock className="w-3 h-3 mr-1" /> Processing
                          </Badge>
                        ) : transactionStatus === 'completed' ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            <Check className="w-3 h-3 mr-1" /> Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                            <AlertCircle className="w-3 h-3 mr-1" /> Failed
                          </Badge>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" type="button" onClick={() => navigate('/payments')}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!connected || isSubmitting || insufficientBalance}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Initiate Transfer
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}