import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Basic Solana connection (devnet for development)
export const solanaConnection = new Connection(
  'https://api.devnet.solana.com',
  'confirmed'
);

// Type definitions for Phantom wallet
export interface PhantomEvent {
  connect: { publicKey: PublicKey };
  disconnect: undefined;
}

export type PhantomEventNames = keyof PhantomEvent;

export interface PhantomRequestMethod {
  connect: (input?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
}

export interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  isConnected: boolean;
  signTransaction: PhantomRequestMethod['signTransaction'];
  signAllTransactions: PhantomRequestMethod['signAllTransactions'];
  signMessage: PhantomRequestMethod['signMessage'];
  connect: PhantomRequestMethod['connect'];
  disconnect: PhantomRequestMethod['disconnect'];
  on: <T extends PhantomEventNames>(event: T, handler: (args: PhantomEvent[T]) => void) => void;
  request: <T extends keyof PhantomRequestMethod>(method: T, params: Parameters<PhantomRequestMethod[T]>[0]) => ReturnType<PhantomRequestMethod[T]>;
}

export const getPhantomProvider = (): PhantomProvider | undefined => {
  if (typeof window !== 'undefined' && window.phantom?.solana?.isPhantom) {
    return window.phantom.solana;
  }
  return undefined;
};

export const isPhantomInstalled = (): boolean => {
  return typeof window !== 'undefined' && window.phantom?.solana?.isPhantom || false;
};

export async function connectWallet(): Promise<{
  publicKey: string;
  balance: number;
} | null> {
  try {
    const provider = getPhantomProvider();
    
    if (!provider) {
      throw new Error('Phantom wallet not found. Please install it from https://phantom.app/');
    }
    
    const response = await provider.connect();
    const publicKey = response.publicKey.toString();
    
    // Get balance
    const balance = await getWalletBalance(publicKey);
    
    return {
      publicKey,
      balance
    };
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    return null;
  }
}

export async function disconnectWallet(): Promise<boolean> {
  try {
    const provider = getPhantomProvider();
    if (provider) {
      await provider.disconnect();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    return false;
  }
}

export async function getWalletBalance(publicKey: string): Promise<number> {
  try {
    const balance = await solanaConnection.getBalance(new PublicKey(publicKey));
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return 0;
  }
}

export async function signMessage(message: string): Promise<string | null> {
  try {
    const provider = getPhantomProvider();
    if (!provider) {
      throw new Error('Phantom wallet not connected');
    }
    
    const encodedMessage = new TextEncoder().encode(message);
    const { signature } = await provider.signMessage(encodedMessage);
    
    // Convert signature to hex string
    return Array.from(signature)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.error('Error signing message:', error);
    return null;
  }
}

// Add wallet event listeners
export function addWalletListeners(
  onConnect: (publicKey: string) => void,
  onDisconnect: () => void
): void {
  const provider = getPhantomProvider();
  if (provider) {
    // Remove any existing listeners
    // Add fresh ones
    provider.on('connect', ({ publicKey }) => {
      onConnect(publicKey.toString());
    });
    
    provider.on('disconnect', () => {
      onDisconnect();
    });
  }
}