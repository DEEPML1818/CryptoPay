import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CryptoPrice } from "@shared/schema";

// Icons for different cryptocurrencies
const CryptoIcon = ({ symbol }: { symbol: string }) => {
  switch (symbol) {
    case "BTC":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M13.6 11.2c.2-.8-.5-1.2-1.3-1.5l.3-1-1.6-.4-.3.9c-.4-.1-.8-.2-1.2-.3l.3-.9-1.6-.4-.3 1c-.3-.1-.6-.2-.9-.2v-.1l-2.2-.5-.4 1.6s.8.2.8.2c.5.1.4.5.4.7l-.9 3.7c-.1.1-.2.3-.5.2 0 0-.8-.2-.8-.2L3 14.6l2.1.5c.4.1.8.2 1.1.3l-.2 1.1 1.6.4.3-1c.4.1.8.2 1.2.3l-.3 1 1.6.4.3-1c2.2.4 3.8.2 4.5-1.6.5-1.5-.1-2.3-1.4-2.9.7-.5 1-1.1.8-1.9zM14 16.4c-.4 1.4-3 .6-3.8.5l.7-2.6c.8.2 3.4.7 3.1 2.1zm.3-3.5c-.3 1.3-2.6.6-3.2.5l.6-2.4c.6.2 2.6.5 2.6 1.9z"/>
        </svg>
      );
    case "ETH":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="m12 1.75-6.25 10.5L12 16l6.25-3.75L12 1.75M5.75 13.5 12 22.25l6.25-8.75L12 17.25 5.75 13.5Z"/>
        </svg>
      );
    case "USDC":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 2.5c-4.14 0-7.5 3.36-7.5 7.5s3.36 7.5 7.5 7.5 7.5-3.36 7.5-7.5-3.36-7.5-7.5-7.5zm.5 3.5v2.5h2.5v2h-2.5v2.5h-1v-2.5H9v-2h2.5V8h1z"/>
        </svg>
      );
    case "SOL":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="m10.53 11.59-5.4-5.61c-.17-.17-.41-.18-.58-.034l-1.4 1.35c-.17.16-.17.44-.001.593l5.32 5.52c.17.177.443.177.613 0l1.431-1.49c.088-.064.088-.21 0-.33zM21.428 6.33l-1.4-1.344c-.17-.17-.41-.18-.58-.034l-8.82 9.17c-.17.17-.45.17-.62 0L5.66 9.76c-.17-.177-.443-.177-.613 0l-1.4 1.456c-.17.177-.17.456 0 .633l4.358 4.52c.17.177.443.177.613 0L21.43 6.96c.087-.19.087-.456-.004-.63zm0 5.86l-1.4-1.344c-.17-.17-.41-.18-.58-.034l-5.4 5.61c-.17.17-.45.17-.62 0l-4.33-4.494c-.17-.177-.443-.177-.613 0l-1.4 1.456c-.17.177-.17.456 0 .633l4.329 4.494c.17.177.443.177.613 0l8.819-9.17c.14-.19.14-.456-.048-.63l.23.48z"/>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
        </svg>
      );
  }
};

export default function CryptoPriceWidget() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: cryptoPrices, isLoading, refetch } = useQuery<CryptoPrice[]>({
    queryKey: ["/api/crypto-prices"],
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Refetch with update query param to get latest from CoinGecko
    await refetch({ queryKey: ["/api/crypto-prices?update=true"] });
    setIsRefreshing(false);
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(price));
  };

  const formatPercentage = (change: string) => {
    const changeNum = Number(change);
    return `${changeNum > 0 ? '+' : ''}${changeNum.toFixed(1)}%`;
  };

  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-border">
        <h2 className="font-semibold">Crypto Prices</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      <div className="p-6 space-y-4">
        {isLoading ? (
          <div className="py-4 text-center text-muted-foreground">Loading prices...</div>
        ) : !cryptoPrices || cryptoPrices.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">No price data available</div>
        ) : (
          cryptoPrices.map((crypto) => (
            <div key={crypto.symbol} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 text-primary">
                  <CryptoIcon symbol={crypto.symbol} />
                </div>
                <div>
                  <p className="text-sm font-medium">{crypto.name}</p>
                  <p className="text-xs text-muted-foreground">{crypto.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatPrice(crypto.price)}</p>
                {crypto.priceChange24h && (
                  <p className={`text-xs ${Number(crypto.priceChange24h) >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                    {formatPercentage(crypto.priceChange24h)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
