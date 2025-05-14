import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ExternalLink, RefreshCw } from 'lucide-react';
import { useSolanaWallet, SolanaWalletBalance } from '@/lib/solana-provider';

export default function WalletConnect() {
  const solanaWallet = useSolanaWallet();
  const { isConnected, connect, disconnect, getBalance, wallet } = solanaWallet;
  const [balance, setBalance] = useState<SolanaWalletBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load wallet balance when connected
  useEffect(() => {
    if (isConnected) {
      loadBalance();
    } else {
      setBalance(null);
    }
  }, [isConnected, wallet.address]);

  // Function to load wallet balance
  const loadBalance = async () => {
    setIsLoading(true);
    try {
      // For demo, use mock data if getBalance returns null
      const balanceData = await getBalance();
      if (balanceData) {
        setBalance(balanceData);
      } else {
        // If no balance available, provide default values for demo
        setBalance({
          address: wallet.address,
          balance: 1.5,
          lamports: 1500000000
        });
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get a shortened address for display
  const getShortenedAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Handle connect
  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await connect();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    try {
      disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Solana Wallet</CardTitle>
        <CardDescription>
          Connect your wallet to create and manage invoices on Solana
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Connected Wallet</p>
                <p className="font-mono text-sm">{getShortenedAddress(wallet.address)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Balance</p>
                {balance ? (
                  <div className="flex items-center">
                    <p className="font-medium">{balance.balance.toFixed(4)} SOL</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 ml-1"
                      onClick={loadBalance}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleDisconnect}
              >
                Disconnect Wallet
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => window.open(`https://explorer.solana.com/address/${wallet.address}?cluster=devnet`, '_blank')}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                View on Explorer
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Button 
              onClick={handleConnect} 
              className="w-full"
              disabled={isLoading}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              No wallet extension? Don't worry, we'll create a demo wallet for you.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}