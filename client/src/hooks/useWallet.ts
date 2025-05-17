import { useState, useCallback, useEffect } from 'react';
import { WalletState } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { 
  connectToPhantom,
  disconnectFromPhantom,
  isPhantomInstalled,
  getPhantomBalance,
  addPhantomEventListeners,
  createDemoWallet
} from '@/lib/solana-wallet';
import { useToast } from './use-toast';

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    connecting: false,
  });
  const { toast } = useToast();

  // Connect to wallet (Phantom if available, otherwise demo wallet)
  const connect = useCallback(async (demoWalletAddress?: string) => {
    if (walletState.connected) return;
    
    setWalletState(prev => ({ ...prev, connecting: true, error: undefined }));
    
    try {
      // Check if Phantom is installed and try to connect
      if (isPhantomInstalled()) {
        const phantomWallet = await connectToPhantom();
        
        if (phantomWallet) {
          // Successfully connected to Phantom
          setWalletState({
            connected: true,
            address: phantomWallet.publicKey,
            balance: phantomWallet.balance,
            connecting: false,
            isPhantomWallet: true
          });
          
          // Store wallet info for reconnection
          localStorage.setItem('walletAddress', phantomWallet.publicKey);
          localStorage.setItem('isPhantomWallet', 'true');
          
          // Notify the API
          try {
            await apiRequest('POST', '/api/wallet/connect', { 
              walletAddress: phantomWallet.publicKey,
              balance: phantomWallet.balance
            });
          } catch (e) {
            console.log("API notification failed, but wallet is connected locally");
          }
          
          toast({
            title: "Phantom Wallet Connected",
            description: `Connected to ${phantomWallet.publicKey.slice(0, 6)}...${phantomWallet.publicKey.slice(-4)}`,
          });
          
          return phantomWallet;
        }
      }
      
      // If Phantom connection failed or not available, use demo wallet
      if (demoWalletAddress) {
        // Use provided demo address
        const demoBalance = Math.floor(Math.random() * 1000) / 10;
        
        setWalletState({
          connected: true,
          address: demoWalletAddress,
          balance: demoBalance,
          connecting: false,
          isPhantomWallet: false
        });
        
        localStorage.setItem('walletAddress', demoWalletAddress);
        localStorage.setItem('isPhantomWallet', 'false');
        
        // Notify the API
        try {
          await apiRequest('POST', '/api/wallet/connect', { 
            walletAddress: demoWalletAddress,
            balance: demoBalance
          });
        } catch (e) {
          console.log("API notification failed, but demo wallet is connected locally");
        }
        
        toast({
          title: "Demo Wallet Connected",
          description: "Connected to demo wallet for testing",
        });
        
        return {
          publicKey: demoWalletAddress,
          balance: demoBalance
        };
      } else {
        // Create a new demo wallet
        const demoWallet = createDemoWallet();
        
        setWalletState({
          connected: true,
          address: demoWallet.publicKey,
          balance: demoWallet.balance,
          connecting: false,
          isPhantomWallet: false
        });
        
        localStorage.setItem('walletAddress', demoWallet.publicKey);
        localStorage.setItem('isPhantomWallet', 'false');
        
        // Notify the API
        try {
          await apiRequest('POST', '/api/wallet/connect', { 
            walletAddress: demoWallet.publicKey,
            balance: demoWallet.balance
          });
        } catch (e) {
          console.log("API notification failed, but demo wallet is connected locally");
        }
        
        toast({
          title: "Demo Wallet Created",
          description: "Created a demo wallet for testing",
        });
        
        return demoWallet;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      
      setWalletState(prev => ({ 
        ...prev, 
        connecting: false, 
        error: errorMessage
      }));
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    }
  }, [walletState.connected, toast]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    const isPhantom = localStorage.getItem('isPhantomWallet') === 'true';
    
    if (isPhantom) {
      // Try to disconnect from Phantom
      await disconnectFromPhantom();
    }
    
    setWalletState({
      connected: false,
      connecting: false,
    });
    
    // Clear from local storage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('isPhantomWallet');
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  }, [toast]);

  // Update balance periodically for Phantom wallets
  useEffect(() => {
    if (walletState.connected && walletState.isPhantomWallet && walletState.address) {
      const interval = setInterval(async () => {
        try {
          const balance = await getPhantomBalance(walletState.address);
          if (balance !== walletState.balance) {
            setWalletState(prev => ({
              ...prev,
              balance
            }));
          }
        } catch (error) {
          console.error('Error refreshing balance:', error);
        }
      }, 15000); // Check every 15 seconds
      
      return () => clearInterval(interval);
    }
  }, [walletState.connected, walletState.address, walletState.isPhantomWallet, walletState.balance]);

  // Listen for Phantom wallet events
  useEffect(() => {
    if (isPhantomInstalled()) {
      const onConnect = (publicKey: string) => {
        getPhantomBalance(publicKey).then(balance => {
          setWalletState({
            connected: true,
            address: publicKey,
            balance,
            connecting: false,
            isPhantomWallet: true
          });
          
          localStorage.setItem('walletAddress', publicKey);
          localStorage.setItem('isPhantomWallet', 'true');
        });
      };
      
      const onDisconnect = () => {
        setWalletState({
          connected: false,
          connecting: false,
        });
        
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('isPhantomWallet');
      };
      
      addPhantomEventListeners(onConnect, onDisconnect);
    }
  }, []);

  // Check if wallet was previously connected
  useEffect(() => {
    const tryReconnect = async () => {
      const savedWalletAddress = localStorage.getItem('walletAddress');
      const isPhantom = localStorage.getItem('isPhantomWallet') === 'true';
      
      if (savedWalletAddress && !walletState.connected && !walletState.connecting) {
        if (isPhantom && isPhantomInstalled()) {
          // Try to reconnect to Phantom
          connect();
        } else {
          // For demo wallet, just reconnect with the saved address
          connect(savedWalletAddress);
        }
      }
    };
    
    tryReconnect();
  }, [connect, walletState.connected, walletState.connecting]);

  return {
    ...walletState,
    connect,
    disconnect
  };
}
