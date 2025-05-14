import React, { ReactNode, useState, useEffect, useContext, createContext } from 'react';
import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { apiRequest } from './queryClient';

// Network settings
const network = 'devnet';
const endpoint = clusterApiUrl(network);
const connection = new Connection(endpoint);

// Types
export interface SolanaWalletBalance {
  address: string;
  balance: number;
  lamports: number;
}

export interface SolanaInvoice {
  id: string;
  creator: string;
  amount: number;
  description: string;
  status: 'pending' | 'paid';
  createdAt: number;
  paidAt: number | null;
}

// Simplified wallet interface
interface Wallet {
  address: string;
  isConnected: boolean;
}

interface SolanaContextType {
  wallet: Wallet;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  getBalance: () => Promise<SolanaWalletBalance | null>;
  getInvoices: () => Promise<SolanaInvoice[]>;
  createInvoice: (amount: number, description: string) => Promise<SolanaInvoice | null>;
}

const SolanaContext = createContext<SolanaContextType>({
  wallet: { address: '', isConnected: false },
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
  getBalance: async () => null,
  getInvoices: async () => [],
  createInvoice: async () => null
});

export function useSolanaWallet() {
  return useContext(SolanaContext);
}

interface SolanaProviderProps {
  children: ReactNode;
}

// Simplified Solana Provider Component
export const SolanaProvider: React.FC<SolanaProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<Wallet>({ address: '', isConnected: false });

  // Check if phantom wallet exists
  useEffect(() => {
    const checkPhantom = () => {
      const phantomWallet = (window as any).phantom?.solana;
      if (phantomWallet) {
        console.log('Phantom wallet detected');
      } else {
        console.log('Phantom wallet not detected');
      }
    };
    
    checkPhantom();
  }, []);

  const connect = async () => {
    try {
      // Check if phantom wallet exists
      const phantom = (window as any).phantom?.solana;
      
      if (phantom) {
        // Real wallet connection
        const connection = await phantom.connect();
        const address = connection.publicKey.toString();
        
        setWallet({
          address,
          isConnected: true
        });
        
        console.log('Connected to wallet:', address);
      } else {
        // For development/demo - simulate wallet connection
        console.log('Using simulated wallet for development');
        const demoAddress = 'FakeSo1AnaAddressForSimu1ationPurposesXXXXXXXXXX';
        
        setWallet({
          address: demoAddress,
          isConnected: true
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnect = () => {
    try {
      // Real phantom wallet disconnect
      const phantom = (window as any).phantom?.solana;
      if (phantom && phantom.disconnect) {
        phantom.disconnect();
      }
      
      // Reset wallet state
      setWallet({
        address: '',
        isConnected: false
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Get wallet balance
  const getBalance = async (): Promise<SolanaWalletBalance | null> => {
    if (!wallet.isConnected) return null;
    
    try {
      // For real wallet, we'd query the blockchain
      // For now, use our API
      return await apiRequest('GET', `/api/solana/wallets/${wallet.address}/balance`);
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return null;
    }
  };

  // Get all invoices for the connected wallet
  const getInvoices = async (): Promise<SolanaInvoice[]> => {
    if (!wallet.isConnected) return [];
    
    try {
      const response: SolanaInvoice[] = await apiRequest('GET', `/api/solana/invoices?creator=${wallet.address}`);
      return response || [];
    } catch (error) {
      console.error('Error getting invoices:', error);
      return [];
    }
  };

  // Create a new invoice
  const createInvoice = async (amount: number, description: string): Promise<SolanaInvoice | null> => {
    if (!wallet.isConnected) return null;
    
    try {
      return await apiRequest('POST', '/api/solana/invoices', {
        creator: wallet.address,
        amount,
        description
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      return null;
    }
  };

  const value = {
    wallet,
    isConnected: wallet.isConnected,
    connect,
    disconnect,
    getBalance,
    getInvoices,
    createInvoice
  };

  return (
    <SolanaContext.Provider value={value}>
      {children}
    </SolanaContext.Provider>
  );
};