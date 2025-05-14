import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
    default:
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
        </svg>
      );
  }
};

export default function PaymentMethods() {
  const { data: cryptoPrices } = useQuery<any[]>({
    queryKey: ["/api/crypto-prices"],
  });

  const { data: wallets, isLoading } = useQuery<any[]>({
    queryKey: ["/api/wallets"],
  });

  // For demo, use some default cryptocurrencies if the real data isn't loaded yet
  const availableCryptos = cryptoPrices || [
    { symbol: "BTC", name: "Bitcoin" },
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "USDC", name: "USD Coin" },
  ];

  return (
    <div className="mt-6 bg-white dark:bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="font-semibold">Accepted Payment Methods</h2>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {availableCryptos.slice(0, 3).map((crypto) => (
            <div key={crypto.symbol} className="border border-border rounded-lg p-4 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 text-primary">
                <CryptoIcon symbol={crypto.symbol} />
              </div>
              <p className="text-sm font-medium">{crypto.name}</p>
              <p className="text-xs text-muted-foreground">{crypto.symbol}</p>
            </div>
          ))}
          
          <Dialog>
            <DialogTrigger asChild>
              <div className="border border-border rounded-lg p-4 flex flex-col items-center bg-background cursor-pointer hover:bg-primary/5 transition-colors">
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center mb-2">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Add New</p>
                <p className="text-xs text-muted-foreground">Method</p>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <p className="text-sm text-muted-foreground">
                  This feature will be available soon. You'll be able to add more cryptocurrency payment methods to accept from your clients.
                </p>
                <Button variant="outline">Close</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
