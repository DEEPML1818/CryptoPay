import { useTransactions } from "@/hooks/useTransactions";
import { formatSOL, formatCurrency } from "@/utils/currency";
import { formatRelativeTime } from "@/utils/date";
import { ArrowDown, ArrowUp, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Transaction } from "@shared/schema";

export function TransactionList() {
  const { data: transactions, isLoading } = useTransactions();

  // Helper function to format transaction title/subtitle
  const formatTransactionDetails = (transaction: Transaction) => {
    const { transactionType, senderWalletAddress, recipientWalletAddress } = transaction;
    
    // Shorten wallet addresses for display
    const shortenAddress = (address: string) => {
      if (!address || address.length < 10) return address;
      return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
    };
    
    const senderShort = shortenAddress(senderWalletAddress);
    const recipientShort = shortenAddress(recipientWalletAddress);

    switch (transactionType) {
      case "payment":
        return {
          title: "Payment Received",
          subtitle: `${senderShort} → Your Wallet`,
          icon: <ArrowDown className="h-3 w-3" />,
          iconBackground: "bg-green-500",
          valueClass: "text-green-600 dark:text-green-400"
        };
      case "refund":
        return {
          title: "Payment Refunded",
          subtitle: `Your Wallet → ${recipientShort}`,
          icon: <ArrowUp className="h-3 w-3" />,
          iconBackground: "bg-red-500",
          valueClass: "text-red-600 dark:text-red-400"
        };
      case "conversion":
        return {
          title: "Currency Conversion",
          subtitle: "SOL → USD (via Mercuryo)",
          icon: <RefreshCcw className="h-3 w-3" />,
          iconBackground: "bg-blue-500",
          valueClass: "text-blue-600 dark:text-blue-400"
        };
      default:
        return {
          title: "Transaction",
          subtitle: `${senderShort} → ${recipientShort}`,
          icon: <RefreshCcw className="h-3 w-3" />,
          iconBackground: "bg-gray-500",
          valueClass: "text-gray-600 dark:text-gray-400"
        };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Blockchain dashboard visualization */}
        <div className="rounded-lg overflow-hidden mb-4">
          <img 
            className="w-full h-auto object-cover" 
            src="https://images.unsplash.com/photo-1639762681057-408e52192e55?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=600" 
            alt="Blockchain transaction activity dashboard" 
          />
        </div>
        
        <div className="flow-root mt-6">
          <ul role="list" className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
            {transactions && transactions.length > 0 ? (
              transactions.slice(0, 3).map((transaction) => {
                const details = formatTransactionDetails(transaction);
                
                return (
                  <li key={transaction.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className={`flex-shrink-0 ${details.iconBackground} rounded-full p-1 text-white`}>
                        {details.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {details.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate font-mono">
                          {details.subtitle}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-sm text-gray-500 dark:text-gray-400 text-right">
                        <div className={`font-semibold ${details.valueClass}`}>
                          {details.title.includes("Conversion") 
                            ? `${formatSOL(transaction.amount)} → ${formatCurrency(transaction.fiatAmount || 0)}` 
                            : formatSOL(transaction.amount)
                          }
                        </div>
                        <div className="text-xs">{formatRelativeTime(transaction.timestamp)}</div>
                      </div>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="py-8 text-center text-gray-500 dark:text-gray-400">
                No transactions found
              </li>
            )}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          View all transactions
        </Button>
      </CardFooter>
    </Card>
  );
}
