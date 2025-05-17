import { createContext, useContext, ReactNode } from "react";
import { useWallet } from "@/hooks/useWallet";
import { WalletState } from "@/types";

// Create context with default values
const WalletContext = createContext<
  WalletState & {
    connect: (walletAddress: string) => Promise<any>;
    disconnect: () => void;
  }
>({
  connected: false,
  connecting: false,
  connect: async () => null,
  disconnect: () => {},
});

// Custom hook to use the wallet context
export const useWalletContext = () => useContext(WalletContext);

// Provider component
export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();

  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}
