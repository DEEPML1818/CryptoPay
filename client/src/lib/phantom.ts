// Helper functions for interacting with Phantom and other Solana wallets
import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Check if Phantom wallet is available in the browser
export function isPhantomAvailable(): boolean {
  return window?.phantom?.solana?.isPhantom || false;
}

// Types for Phantom wallet
export interface PhantomProvider {
  publicKey: { toString: () => string } | null;
  isConnected: boolean;
  isPhantom: boolean;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (args: any) => void) => void;
}

// Declare the phantom property on the window global
declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
    };
  }
}

// Get the Phantom provider if it exists
export function getPhantomProvider(): PhantomProvider | undefined {
  const window = globalThis as unknown as WindowWithPhantom;
  return window.phantom?.solana;
}

// Solana connection (devnet for development)
export const solanaConnection = new Connection(
  'https://api.devnet.solana.com',
  'confirmed'
);

// Get Solana balance
export async function getSolanaBalance(publicKey: string): Promise<number> {
  try {
    const balance = await solanaConnection.getBalance(new PublicKey(publicKey));
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error fetching Solana balance:', error);
    return 0;
  }
}

// Connect to Phantom wallet
export async function connectPhantomWallet(): Promise<{ 
  publicKey: string; 
  balance: number;
} | null> {
  try {
    const provider = getPhantomProvider();
    
    if (!provider) {
      window.open('https://phantom.app/', '_blank');
      throw new Error('Phantom wallet not found! Please install Phantom browser extension.');
    }
    
    const response = await provider.connect();
    const publicKey = response.publicKey.toString();
    const balance = await getSolanaBalance(publicKey);
    
    return { 
      publicKey,
      balance
    };
  } catch (error) {
    console.error('Error connecting to Phantom wallet:', error);
    return null;
  }
}

// Disconnect from Phantom wallet
export async function disconnectPhantomWallet(): Promise<boolean> {
  try {
    const provider = getPhantomProvider();
    
    if (provider) {
      await provider.disconnect();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error disconnecting from Phantom wallet:', error);
    return false;
  }
}

// Sign a message with Phantom wallet
export async function signMessageWithPhantom(message: string): Promise<string | null> {
  try {
    const provider = getPhantomProvider();
    
    if (!provider || !provider.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    const encodedMessage = new TextEncoder().encode(message);
    const signedMessage = await provider.signMessage(encodedMessage);
    
    return Buffer.from(signedMessage.signature).toString('hex');
  } catch (error) {
    console.error('Error signing message with Phantom:', error);
    return null;
  }
}

// Listen for wallet connection status changes
export function listenToWalletEvents(
  onConnect: (publicKey: string) => void,
  onDisconnect: () => void
): void {
  const provider = getPhantomProvider();
  
  if (provider) {
    provider.on('connect', (publicKey: PublicKey) => {
      onConnect(publicKey.toString());
    });
    
    provider.on('disconnect', () => {
      onDisconnect();
    });
  }
}