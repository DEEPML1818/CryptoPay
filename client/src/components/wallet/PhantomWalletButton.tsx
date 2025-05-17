import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { Wallet, LogOut } from 'lucide-react';
import { formatSOL } from '@/utils/currency';

// PhantomWallet provider type
interface PhantomWindow extends Window {
  phantom?: {
    solana?: {
      isPhantom: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      on: (event: string, callback: any) => void;
      publicKey: { toString: () => string } | null;
      isConnected: boolean;
    };
  };
}

// Get the phantom window object
const getPhantom = (): PhantomWindow["phantom"]["solana"] | undefined => {
  if (typeof window !== 'undefined' && (window as PhantomWindow).phantom?.solana) {
    return (window as PhantomWindow).phantom.solana;
  }
  return undefined;
};

// Check if Phantom is installed
const isPhantomInstalled = (): boolean => {
  const phantom = getPhantom();
  return !!phantom?.isPhantom;
};

interface PhantomWalletButtonProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export function PhantomWalletButton({ onConnect, onDisconnect }: PhantomWalletButtonProps) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { setUserRole } = useUserRole();

  // Check for connection status on mount
  useEffect(() => {
    const phantom = getPhantom();
    if (phantom && phantom.isConnected && phantom.publicKey) {
      setConnected(true);
      const publicKey = phantom.publicKey.toString();
      setAddress(publicKey);
    }
  }, []);

  // Listen for wallet events
  useEffect(() => {
    const phantom = getPhantom();
    if (!phantom) return;

    const handleConnect = (publicKey: { toString: () => string }) => {
      setConnected(true);
      const address = publicKey.toString();
      setAddress(address);
      onConnect?.(address);
    };

    const handleDisconnect = () => {
      setConnected(false);
      setAddress(null);
      setBalance(null);
      onDisconnect?.();
    };

    phantom.on('connect', handleConnect);
    phantom.on('disconnect', handleDisconnect);

    return () => {
      // Ideally, we would remove listeners here, but Phantom doesn't provide a way to do this
      // This is a limitation of the current Phantom wallet API
    };
  }, [onConnect, onDisconnect]);

  const connectWallet = async () => {
    try {
      const phantom = getPhantom();
      
      if (!phantom) {
        window.open('https://phantom.app/', '_blank');
        toast({ 
          title: "Phantom Not Installed",
          description: "Please install the Phantom wallet extension to connect",
          variant: "destructive"
        });
        return;
      }
      
      setIsLoading(true);
      
      // Connect to Phantom
      const { publicKey } = await phantom.connect();
      const address = publicKey.toString();
      
      // For demo purposes, show a simulated balance
      const demoBalance = Math.floor(Math.random() * 10000) / 100;
      setBalance(demoBalance);
      
      toast({ 
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`
      });
      
      // Prompt user to select role after connecting wallet
      setTimeout(() => {
        setUserRole("client"); // You can change this to show role selection UI
      }, 500);
      
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({ 
        title: "Connection Failed",
        description: "There was an error connecting to your wallet",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      const phantom = getPhantom();
      if (!phantom) return;
      
      setIsLoading(true);
      await phantom.disconnect();
      
      toast({ 
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected"
      });
      
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast({ 
        title: "Disconnect Failed",
        description: "There was an error disconnecting your wallet",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!connected) {
    return (
      <Button
        onClick={connectWallet}
        disabled={isLoading}
        className="bg-gradient-to-r from-purple-500 to-blue-500"
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isLoading ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="hidden md:block">
        <p className="text-sm font-medium">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
        </p>
        {balance !== null && (
          <p className="text-xs text-muted-foreground">{formatSOL(balance)} SOL</p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={disconnectWallet}
        disabled={isLoading}
      >
        <LogOut className="h-4 w-4" />
        <span className="ml-2 md:hidden">Disconnect</span>
      </Button>
    </div>
  );
}