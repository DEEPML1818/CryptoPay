import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useWalletContext } from '@/providers/WalletProvider';
import { formatSOL } from '@/utils/currency';
import { Copy, Wallet } from 'lucide-react';

export function WalletConnect() {
  const { connected, address, balance, connect, disconnect, error, connecting } = useWalletContext();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast({
        title: 'Address copied',
        description: 'Your wallet address has been copied to the clipboard.'
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (error) {
    return (
      <Card className="border-red-300 dark:border-red-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-red-600 dark:text-red-400">Connection Error</CardTitle>
          <CardDescription>
            There was a problem connecting to your wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => {
              // Use a demo wallet address for testing
              connect("8vdj7KAsMDc6Vj5EqMRGxhJw9qP7JhMu98f9rM9T9qFa");
            }}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!connected) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>
            Connect your Solana wallet to access CryptoPay features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => {
              // Use a demo wallet address for testing
              connect("8vdj7KAsMDc6Vj5EqMRGxhJw9qP7JhMu98f9rM9T9qFa");
            }}
            disabled={connecting} 
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <Wallet className="h-5 w-5 mr-2 text-primary" />
          Wallet Connected
        </CardTitle>
        <CardDescription>
          Your Solana wallet is connected to CryptoPay.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Address
            </div>
            <div className="flex items-center space-x-2">
              <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded">
                {address?.slice(0, 6)}...{address?.slice(-6)}
              </code>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={handleCopyAddress}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Balance
            </div>
            <div className="text-xl font-bold">{formatSOL(balance || 0)}</div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={disconnect} 
            className="w-full mt-2"
          >
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}