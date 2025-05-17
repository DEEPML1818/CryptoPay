import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';

// Create Solana connection
export const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Type definitions for Phantom wallet
declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom: boolean;
        connect: () => Promise<{ publicKey: PublicKey }>;
        disconnect: () => Promise<void>;
        signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
        signTransaction: (transaction: Transaction) => Promise<Transaction>;
        signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
        publicKey: PublicKey | null;
        isConnected: boolean;
        on: (event: string, callback: any) => void;
      };
    };
  }
}

// Check if Phantom is installed
export const isPhantomInstalled = (): boolean => {
  return typeof window !== 'undefined' && window.phantom?.solana?.isPhantom || false;
};

// Connect to Phantom wallet
export const connectToPhantom = async (): Promise<{ publicKey: string; balance: number } | null> => {
  try {
    if (!isPhantomInstalled()) {
      window.open('https://phantom.app/', '_blank');
      throw new Error('Phantom wallet not installed. Please install it and try again.');
    }

    const provider = window.phantom?.solana;
    if (!provider) return null;

    const response = await provider.connect();
    const publicKey = response.publicKey.toString();
    
    // Get balance
    const balance = await connection.getBalance(response.publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    
    return {
      publicKey,
      balance: solBalance
    };
  } catch (error) {
    console.error('Error connecting to Phantom wallet:', error);
    return null;
  }
};

// Disconnect from Phantom wallet
export const disconnectFromPhantom = async (): Promise<boolean> => {
  try {
    const provider = window.phantom?.solana;
    if (!provider) return false;
    
    await provider.disconnect();
    return true;
  } catch (error) {
    console.error('Error disconnecting from Phantom wallet:', error);
    return false;
  }
};

// Get wallet balance
export const getPhantomBalance = async (publicKey: string): Promise<number> => {
  try {
    const balance = await connection.getBalance(new PublicKey(publicKey));
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting balance:', error);
    return 0;
  }
};

// Add wallet event listeners
export const addPhantomEventListeners = (
  onConnect: (publicKey: string) => void,
  onDisconnect: () => void
): void => {
  const provider = window.phantom?.solana;
  if (!provider) return;
  
  provider.on('connect', (publicKey: PublicKey) => {
    onConnect(publicKey.toString());
  });
  
  provider.on('disconnect', () => {
    onDisconnect();
  });
};

// Fallback utility for demo environment
export const createDemoWallet = (): { publicKey: string; balance: number } => {
  // Generate a dummy Solana-like address
  const randomBytes = new Array(32).fill(0).map(() => Math.floor(Math.random() * 256));
  const address = new PublicKey(randomBytes).toString();
  
  // Random balance between 1-100 SOL
  const balance = Math.floor(Math.random() * 9900 + 100) / 100;
  
  return {
    publicKey: address,
    balance
  };
};