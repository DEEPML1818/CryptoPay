import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatSOL } from '@/utils/currency';
import { 
  isPhantomAvailable, 
  connectToPhantom, 
  disconnectFromPhantom 
} from '@/lib/solana-connection';

interface SolanaWalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export default function SolanaWalletConnect({ onConnect, onDisconnect }: SolanaWalletConnectProps) {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check if wallet was previously connected
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
      setWalletAddress(savedAddress);
      setConnected(true);
      
      // Set a demo balance for display purposes
      const savedBalance = localStorage.getItem('walletBalance');
      if (savedBalance) {
        setBalance(parseFloat(savedBalance));
      } else {
        const demoBalance = Math.floor(Math.random() * 1000) / 10;
        setBalance(demoBalance);
        localStorage.setItem('walletBalance', demoBalance.toString());
      }
    }
  }, []);

  // Connect to wallet
  const connectWallet = async () => {
    setLoading(true);
    
    try {
      // Try to connect to Phantom wallet if available
      if (isPhantomAvailable()) {
        const phantomWallet = await connectToPhantom();
        
        if (phantomWallet) {
          setWalletAddress(phantomWallet.address);
          setBalance(phantomWallet.balance);
          setConnected(true);
          
          // Save to localStorage
          localStorage.setItem('walletAddress', phantomWallet.address);
          localStorage.setItem('walletBalance', phantomWallet.balance.toString());
          
          toast({
            title: "Wallet Connected",
            description: `Connected to ${phantomWallet.address.slice(0, 6)}...${phantomWallet.address.slice(-4)}`,
          });
          
          // Notify parent component
          onConnect?.(phantomWallet.address);
          return;
        }
      }
      
      // Fallback to demo wallet
      const demoAddress = "8vdj7KAsMDc6Vj5EqMRGxhJw9qP7JhMu98f9rM9T9qFa";
      const demoBalance = Math.floor(Math.random() * 1000) / 10;
      
      setWalletAddress(demoAddress);
      setBalance(demoBalance);
      setConnected(true);
      
      // Save to localStorage
      localStorage.setItem('walletAddress', demoAddress);
      localStorage.setItem('walletBalance', demoBalance.toString());
      
      toast({
        title: "Demo Wallet Connected",
        description: "Connected to demo wallet for testing",
      });
      
      // Notify parent component
      onConnect?.(demoAddress);
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Disconnect from wallet
  const disconnectWallet = async () => {
    setLoading(true);
    
    try {
      // Try to disconnect from Phantom if it was used
      if (isPhantomAvailable()) {
        await disconnectFromPhantom();
      }
      
      // Clear state and localStorage
      setWalletAddress(null);
      setBalance(0);
      setConnected(false);
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletBalance');
      
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
      
      // Notify parent component
      onDisconnect?.();
      
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast({
        title: "Disconnect Failed",
        description: "Could not disconnect wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <Button
        onClick={connectWallet}
        disabled={loading}
        className="bg-gradient-to-r from-purple-500 to-blue-500"
      >
        <Wallet className="h-4 w-4 mr-2" />
        {loading ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="hidden md:block">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
        </div>
        <div className="text-xs text-gray-500">{formatSOL(balance)} SOL</div>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={disconnectWallet}
        disabled={loading}
      >
        <LogOut className="h-4 w-4 mr-2" />
        <span className="hidden md:inline">Disconnect</span>
      </Button>
    </div>
  );
}