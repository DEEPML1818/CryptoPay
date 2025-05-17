import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

// Define the connection to Solana blockchain (devnet)
export const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Check if Phantom wallet is available in browser
export const isPhantomAvailable = (): boolean => {
  return window?.phantom?.solana?.isPhantom || false;
};

// Connect to Phantom wallet
export const connectToPhantom = async (): Promise<{ address: string; balance: number } | null> => {
  try {
    if (!isPhantomAvailable()) {
      // Open Phantom website if not installed
      window.open('https://phantom.app/', '_blank');
      throw new Error('Phantom wallet not found. Please install it and try again.');
    }

    // Get Phantom provider
    const provider = window.phantom?.solana;
    if (!provider) return null;

    // Connect to wallet
    const { publicKey } = await provider.connect();
    const address = publicKey.toString();
    
    // Get wallet balance
    const solanaBalance = await connection.getBalance(new PublicKey(address));
    const balance = solanaBalance / LAMPORTS_PER_SOL;
    
    return { address, balance };
  } catch (error) {
    console.error('Error connecting to Phantom wallet:', error);
    return null;
  }
};

// Disconnect from Phantom wallet
export const disconnectFromPhantom = async (): Promise<boolean> => {
  try {
    if (!isPhantomAvailable()) return false;
    
    const provider = window.phantom?.solana;
    if (!provider) return false;
    
    await provider.disconnect();
    return true;
  } catch (error) {
    console.error('Error disconnecting from Phantom wallet:', error);
    return false;
  }
};

// Get balance of a wallet address
export const getWalletBalance = async (address: string): Promise<number> => {
  if (!address) return 0;
  
  try {
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return 0;
  }
};

// For TypeScript compatibility with Phantom wallet
declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom: boolean;
        connect: () => Promise<{ publicKey: PublicKey }>;
        disconnect: () => Promise<void>;
        signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
        signTransaction?: (transaction: any) => Promise<any>;
        signAllTransactions?: (transactions: any[]) => Promise<any[]>;
        publicKey: PublicKey | null;
        isConnected: boolean;
        on: (event: string, callback: any) => void;
      };
    };
  }
}