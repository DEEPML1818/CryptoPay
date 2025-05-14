import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { liveCryptoService, CryptoPrice, CryptoPriceUpdate } from '@/lib/live-crypto-service';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';

export default function LiveCryptoPrices() {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentUpdates, setRecentUpdates] = useState<Map<string, CryptoPriceUpdate>>(new Map());
  
  // Initialize live crypto service on component mount
  useEffect(() => {
    liveCryptoService.initialize();
    loadPrices();
    
    // Listen for global price updates
    const unsubscribe = liveCryptoService.subscribe('*', handlePriceUpdate);
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Load initial prices
  const loadPrices = () => {
    setIsLoading(true);
    
    // Small delay to simulate network request
    setTimeout(() => {
      const allPrices = liveCryptoService.getAllPrices();
      setPrices(allPrices);
      setIsLoading(false);
      toast.success('Crypto prices loaded');
    }, 1000);
  };
  
  // Handle price updates
  const handlePriceUpdate = (update: CryptoPriceUpdate) => {
    // Store the recent update
    setRecentUpdates(prev => new Map(prev.set(update.symbol, update)));
    
    // Update the prices list
    setPrices(currentPrices => {
      return currentPrices.map(price => {
        if (price.symbol === update.symbol) {
          return {
            ...price,
            price: update.price,
            lastUpdated: new Date()
          };
        }
        return price;
      });
    });
  };
  
  // Format price with commas and decimal places
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      });
    } else {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 4,
        maximumFractionDigits: 6
      });
    }
  };
  
  // Check if a price was recently updated (within last 5 seconds)
  const wasRecentlyUpdated = (symbol: string) => {
    return recentUpdates.has(symbol);
  };
  
  // Get the appropriate CSS class for price change
  const getPriceChangeClass = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Live Crypto Prices</CardTitle>
            <CardDescription>
              Real-time cryptocurrency market data
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={loadPrices}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : prices.length === 0 ? (
          <div className="bg-slate-50 rounded-lg p-8 text-center">
            <p className="text-muted-foreground mb-2">No data available</p>
            <p className="text-sm text-muted-foreground">
              Unable to load cryptocurrency prices.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {prices.map((crypto) => (
              <div 
                key={crypto.symbol}
                className={cn(
                  "flex items-center justify-between p-3 rounded-md transition-colors",
                  wasRecentlyUpdated(crypto.symbol) ? "bg-blue-50" : "hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">
                    {crypto.symbol}
                  </Badge>
                  <span className="font-medium">{crypto.name}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">${formatPrice(crypto.price)}</div>
                    <div className={cn("text-xs flex items-center", getPriceChangeClass(crypto.priceChange24h))}>
                      {crypto.priceChange24h > 0 ? (
                        <ArrowUp className="h-3 w-3 mr-1" />
                      ) : crypto.priceChange24h < 0 ? (
                        <ArrowDown className="h-3 w-3 mr-1" />
                      ) : null}
                      {Math.abs(crypto.priceChange24h).toFixed(2)}%
                    </div>
                  </div>
                  
                  <div 
                    className={cn(
                      "w-2 h-2 rounded-full",
                      wasRecentlyUpdated(crypto.symbol) ? "bg-green-400" : "bg-gray-200"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}