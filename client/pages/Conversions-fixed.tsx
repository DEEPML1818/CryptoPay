import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSolanaPrice } from "@/hooks/useSolanaPrice";
import { formatCurrency } from "@/utils/currency";
import { RefreshCw, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWalletContext } from "@/providers/WalletProvider";

export default function Conversions() {
  const { toast } = useToast();
  const { connected } = useWalletContext();
  const { data: solanaPrice, isLoading: isPriceLoading } = useSolanaPrice();
  const [amount, setAmount] = useState<string>("");
  const [conversionType, setConversionType] = useState<"solanaToDollar" | "dollarToSolana">("solanaToDollar");
  const [isConverting, setIsConverting] = useState(false);
  
  // Calculate converted amount using real-time Solana price data
  const getConvertedAmount = () => {
    if (!amount || !solanaPrice) return 0;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;
    
    if (conversionType === "solanaToDollar") {
      // Convert SOL to USD using real-time price
      return numAmount * solanaPrice.price;
    } else {
      // Convert USD to SOL using real-time price
      return numAmount / solanaPrice.price;
    }
  };
  
  // Handle conversion submit
  const handleConvert = () => {
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to perform conversions",
        variant: "destructive"
      });
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to convert",
        variant: "destructive"
      });
      return;
    }
    
    setIsConverting(true);
    
    // Simulate conversion process
    setTimeout(() => {
      toast({
        title: "Conversion successful",
        description: `Converted ${amount} ${conversionType === "solanaToDollar" ? "SOL to USD" : "USD to SOL"}`,
      });
      
      setIsConverting(false);
      setAmount("");
    }, 1500);
  };
  
  // Toggle conversion direction
  const toggleConversionType = () => {
    setConversionType(prevType => 
      prevType === "solanaToDollar" ? "dollarToSolana" : "solanaToDollar"
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Currency Conversions</h2>
        <div className="flex items-center text-gray-500 dark:text-gray-400">
          <RefreshCw className="h-4 w-4 mr-2" />
          <span className="text-sm">
            Current Rate: 
            {isPriceLoading 
              ? " Loading..." 
              : ` 1 SOL = ${formatCurrency(solanaPrice?.price || 0, 'USD')}`
            }
          </span>
        </div>
      </div>
      
      {/* Currency conversion interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fiat-to-Crypto Conversion</CardTitle>
            <CardDescription>
              Convert between Solana (SOL) and USD using real-time exchange rates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  {conversionType === "solanaToDollar" ? "SOL Amount" : "USD Amount"}
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step={conversionType === "solanaToDollar" ? "0.01" : "1"}
                />
              </div>
              
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleConversionType}
                  className="rotate-90 md:rotate-0"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  {conversionType === "solanaToDollar" ? "USD Amount" : "SOL Amount"}
                </label>
                <Input
                  type="text"
                  value={conversionType === "solanaToDollar" 
                    ? `$${getConvertedAmount().toFixed(2)}` 
                    : `${getConvertedAmount().toFixed(4)} SOL`}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={handleConvert}
                disabled={isConverting || !connected || !amount || parseFloat(amount) <= 0}
                className="w-full"
              >
                {isConverting ? "Converting..." : "Convert"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>
                Fees may apply for conversions between cryptocurrencies and fiat currencies.
              </p>
            </div>
          </CardFooter>
        </Card>
        
        {/* Conversion Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Benefits of Crypto Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-500 dark:text-green-400 mr-2">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                </span>
                <span className="text-gray-700 dark:text-gray-300">Lower transaction fees compared to traditional payment processors</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-500 dark:text-green-400 mr-2">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                </span>
                <span className="text-gray-700 dark:text-gray-300">Near-instant settlement on Solana blockchain</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-500 dark:text-green-400 mr-2">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                </span>
                <span className="text-gray-700 dark:text-gray-300">No chargebacks or payment disputes</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-500 dark:text-green-400 mr-2">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                </span>
                <span className="text-gray-700 dark:text-gray-300">Global payments without currency exchange complications</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        {/* Conversion History */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">25.0 SOL → $2,000</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">2 days ago</div>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Completed
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">$500 → 6.25 SOL</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">1 week ago</div>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Completed
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}