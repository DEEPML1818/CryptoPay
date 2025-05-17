import { useWalletContext } from "@/providers/WalletProvider";
import { formatSOL } from "@/utils/currency";
import { CheckCircle, AlertCircle } from "lucide-react";

export function WalletStatus() {
  const { connected, address, balance } = useWalletContext();

  if (!connected) {
    return (
      <div className="p-3 mb-4 rounded-md bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
        <div className="flex items-center">
          <AlertCircle className="text-red-500 dark:text-red-400 h-4 w-4 mr-2" />
          <span>Wallet not connected</span>
        </div>
        <p className="mt-1 ml-6">Connect your Solana wallet to start creating and managing invoices</p>
      </div>
    );
  }

  return (
    <div className="p-3 mb-4 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">
      <div className="flex items-center">
        <CheckCircle className="text-green-500 dark:text-green-400 h-4 w-4 mr-2" />
        <span>Wallet connected</span>
      </div>
      <p className="mt-1 ml-6">
        <span className="font-mono text-xs">{address}</span>
        <span className="ml-2 text-xs">• Balance: {formatSOL(balance || 0)}</span>
      </p>
    </div>
  );
}
