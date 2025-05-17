import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatSOL } from '@/utils/currency';
import { useUserRole } from '@/hooks/useUserRole';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface WalletButtonProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export function WalletButton({ onConnect, onDisconnect }: WalletButtonProps) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { setUserRole } = useUserRole();
  
  // Create a connection to the Solana devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Check if Phantom is available in browser
  const isPhantomAvailable = (): boolean => {
    return window?.phantom?.solana?.isPhantom || false;
  };

  // Try to connect to Phantom wallet
  const connectToPhantom = async (): Promise<{ address: string, balance: number } | null> => {
    try {
      const provider = window.phantom?.solana;
      if (!provider) return null;

      const { publicKey } = await provider.connect();
      const address = publicKey.toString();
      
      // Get the real balance from the Solana blockchain
      const balanceResponse = await connection.getBalance(new PublicKey(address));
      const balance = balanceResponse / LAMPORTS_PER_SOL;
      
      console.log('Connected to Phantom wallet with address:', address);
      console.log('Wallet balance (SOL):', balance);
      
      return { address, balance };
    } catch (error) {
      console.error('Error connecting to Phantom:', error);
      return null;
    }
  };

  // Check for saved wallet on component mount and get real balance
  useEffect(() => {
    const savedAddress = localStorage.getItem('solanaWalletAddress');
    
    if (savedAddress) {
      // Set the address and connected state immediately
      setAddress(savedAddress);
      setConnected(true);
      
      // Then fetch the real balance from the blockchain
      const fetchRealBalance = async () => {
        try {
          const balanceResponse = await connection.getBalance(new PublicKey(savedAddress));
          const realBalance = balanceResponse / LAMPORTS_PER_SOL;
          setBalance(realBalance);
          localStorage.setItem('solanaWalletBalance', realBalance.toString());
          
          console.log('Updated wallet balance from blockchain:', realBalance);
        } catch (error) {
          console.error('Error fetching real balance for saved wallet:', error);
          
          // Fallback to saved balance
          const savedBalance = localStorage.getItem('solanaWalletBalance');
          if (savedBalance) {
            setBalance(parseFloat(savedBalance));
          }
        }
      };
      
      fetchRealBalance();
    }
  }, []);

  // Connect to wallet with real blockchain data
  const connectWallet = async () => {
    setLoading(true);
    
    try {
      let walletAddress: string;
      let walletBalance: number;
      
      // Try to connect to Phantom if available
      if (isPhantomAvailable()) {
        const phantomResult = await connectToPhantom();
        
        if (phantomResult) {
          walletAddress = phantomResult.address;
          walletBalance = phantomResult.balance;
          
          toast({
            title: "Phantom Wallet Connected",
            description: `Connected to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
          });
        } else {
          // If phantom connection failed, use a test wallet with real blockchain data
          walletAddress = "2TfpQA9m9kQdEKQ651kjTzBfZQfYtL7jS39gFQJjfxAU"; // A test wallet on devnet
          
          // Query the actual balance of this address from Solana blockchain
          try {
            const balanceResponse = await connection.getBalance(new PublicKey(walletAddress));
            walletBalance = balanceResponse / LAMPORTS_PER_SOL;
          } catch (e) {
            console.error('Error fetching test wallet balance:', e);
            walletBalance = 0;
          }
          
          toast({
            title: "Test Wallet Connected",
            description: "Using a test wallet with real blockchain data"
          });
        }
      } else {
        // If Phantom isn't available, use a test wallet with real blockchain data
        walletAddress = "2TfpQA9m9kQdEKQ651kjTzBfZQfYtL7jS39gFQJjfxAU"; // A test wallet on devnet
        
        // Query the actual balance of this address from Solana blockchain
        try {
          const balanceResponse = await connection.getBalance(new PublicKey(walletAddress));
          walletBalance = balanceResponse / LAMPORTS_PER_SOL;
        } catch (e) {
          console.error('Error fetching test wallet balance:', e);
          walletBalance = 0;
        }
        
        toast({
          title: "Test Wallet Connected",
          description: "Install Phantom wallet for full functionality"
        });
      }
      
      // Update state
      setAddress(walletAddress);
      
      // Get the real balance from Solana network
      try {
        if (window.phantom?.solana?.publicKey) {
          const balanceResponse = await connection.getBalance(
            new PublicKey(walletAddress)
          );
          const realBalance = balanceResponse / LAMPORTS_PER_SOL;
          setBalance(realBalance);
          localStorage.setItem('solanaWalletBalance', realBalance.toString());
        } else {
          // We still need a balance value if publicKey isn't available
          setBalance(walletBalance);
          localStorage.setItem('solanaWalletBalance', walletBalance.toString());
        }
      } catch (error) {
        console.error('Error fetching real wallet balance:', error);
        // Fallback only if the real data fetch fails
        setBalance(walletBalance);
        localStorage.setItem('solanaWalletBalance', walletBalance.toString());
      }
      
      setConnected(true);
      
      // Store wallet address in localStorage
      localStorage.setItem('solanaWalletAddress', walletAddress);
      
      // Emit a custom event for wallet connection
      const walletConnectedEvent = new CustomEvent('wallet-connected', {
        detail: { address: walletAddress }
      });
      window.dispatchEvent(walletConnectedEvent);
      
      // Also notify parent component through props
      onConnect?.(walletAddress);
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    setLoading(true);
    
    try {
      // Try to disconnect from Phantom if it's available
      if (isPhantomAvailable()) {
        try {
          await window.phantom?.solana?.disconnect();
        } catch (e) {
          console.log('Error disconnecting from Phantom:', e);
        }
      }
      
      // Update state
      setConnected(false);
      setAddress(null);
      setBalance(0);
      
      // Clear localStorage
      localStorage.removeItem('solanaWalletAddress');
      localStorage.removeItem('solanaWalletBalance');
      
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected"
      });
      
      // Emit a custom event for wallet disconnection
      const walletDisconnectedEvent = new CustomEvent('wallet-disconnected');
      window.dispatchEvent(walletDisconnectedEvent);
      
      // Also notify parent component
      onDisconnect?.();
      
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Render connection button if not connected
  if (!connected) {
    return (
      <Button
        onClick={connectWallet}
        disabled={loading}
        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
      >
        <Wallet className="h-4 w-4 mr-2" />
        {loading ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  // Render connected wallet info
  return (
    <div className="flex items-center space-x-2">
      <div className="hidden md:block">
        <div className="text-xs text-gray-500">{formatSOL(balance)} SOL</div>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={disconnectWallet}
        disabled={loading}
        className="bg-gradient-to-r from-purple-400 to-blue-400 hover:from-purple-500 hover:to-blue-500 text-white border-none"
      >
        <LogOut className="h-4 w-4 mr-2" />
        <span className="hidden md:inline">Disconnect</span>
      </Button>
    </div>
  );
}