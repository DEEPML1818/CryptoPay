import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CryptoPrice } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CurrencyConverter() {
  const [fromAmount, setFromAmount] = useState<string>("1000");
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("BTC");
  const [toAmount, setToAmount] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<string>("");

  // Fetch crypto prices
  const { data: cryptoPrices, isLoading } = useQuery<CryptoPrice[]>({
    queryKey: ["/api/crypto-prices"],
  });

  // Perform conversion
  const handleConversion = async () => {
    if (!fromAmount || !fromCurrency || !toCurrency) return;
    
    try {
      const response = await apiRequest(
        "POST",
        "/api/convert",
        {
          amount: fromAmount,
          fromCurrency,
          toCurrency,
        }
      );
      
      const data = await response.json();
      setToAmount(data.to.amount.toString());
      
      // Update exchange rate message
      if (fromCurrency === "USD") {
        setExchangeRate(`1 ${toCurrency} = $${(1 / data.to.amount * parseFloat(fromAmount)).toFixed(2)}`);
      } else if (toCurrency === "USD") {
        setExchangeRate(`1 ${fromCurrency} = $${(parseFloat(fromAmount) / data.to.amount).toFixed(2)}`);
      } else {
        setExchangeRate(`1 ${fromCurrency} = ${(data.to.amount / parseFloat(fromAmount)).toFixed(8)} ${toCurrency}`);
      }
    } catch (error) {
      console.error("Conversion failed:", error);
    }
  };

  // Swap currencies
  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  // Perform conversion when inputs change
  useEffect(() => {
    handleConversion();
  }, [fromAmount, fromCurrency, toCurrency]);

  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="font-semibold">Currency Converter</h2>
      </div>
      
      <div className="p-6">
        {/* From Currency */}
        <div className="mb-4">
          <label className="block text-muted-foreground text-sm mb-2">From</label>
          <div className="flex">
            <Input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="rounded-r-none"
            />
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="w-32 rounded-l-none">
                <SelectValue placeholder="USD" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                {cryptoPrices?.map((crypto) => (
                  <SelectItem key={crypto.symbol} value={crypto.symbol}>
                    {crypto.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Swap Button */}
        <div className="flex justify-center my-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwap}
            className="rounded-full"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
        
        {/* To Currency */}
        <div className="mb-6">
          <label className="block text-muted-foreground text-sm mb-2">To</label>
          <div className="flex">
            <Input
              type="text"
              value={toAmount}
              readOnly
              className="bg-background rounded-r-none"
            />
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="w-32 rounded-l-none">
                <SelectValue placeholder="BTC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                {cryptoPrices?.map((crypto) => (
                  <SelectItem key={crypto.symbol} value={crypto.symbol}>
                    {crypto.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">{exchangeRate}</p>
          <Button className="w-full bg-primary text-white" onClick={handleConversion}>
            Convert Now
          </Button>
        </div>
      </div>
    </div>
  );
}
