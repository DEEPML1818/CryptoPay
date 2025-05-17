import { Layout } from "@/components/layout/Layout";
import { useTransactions } from "@/hooks/useTransactions";
import { formatSOL, formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, RefreshCcw } from "lucide-react";
import { Link } from "wouter";

export default function Payments() {
  const { data: transactions, isLoading } = useTransactions();
  
  // Transaction status badge
  const getStatusBadge = (status: string) => {
    let color = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    
    if (status === "success") {
      color = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    } else if (status === "pending") {
      color = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    } else if (status === "failed") {
      color = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
    
    return (
      <Badge className={color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  // Transaction type icon
  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <ArrowDown className="h-4 w-4 text-green-500" />;
      case "refund":
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      case "conversion":
        return <RefreshCcw className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };
  
  const columns = [
    {
      header: "Type",
      accessorKey: "transactionType",
      cell: (row: any) => (
        <div className="flex items-center">
          {getTransactionTypeIcon(row.transactionType)}
          <span className="ml-2 capitalize">
            {row.transactionType}
          </span>
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (row: any) => (
        <div>
          <div className="font-medium">{formatSOL(row.amount)}</div>
          {row.fiatAmount && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(row.fiatAmount)}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: any) => getStatusBadge(row.status),
    },
    {
      header: "Date",
      accessorKey: "timestamp",
      cell: (row: any) => formatDate(row.timestamp),
    },
    {
      header: "Recipient",
      accessorKey: "recipientWalletAddress",
      cell: (row: any) => (
        <span className="text-xs font-mono">
          {row.recipientWalletAddress.substring(0, 6)}...
          {row.recipientWalletAddress.substring(row.recipientWalletAddress.length - 4)}
        </span>
      ),
    },
  ];

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Payments</h2>
        
        <div className="flex space-x-3">
          <Link href="/invoices">
            <Button variant="outline" className="flex items-center">
              <ArrowDown className="mr-2 h-4 w-4" />
              Pay Invoice
            </Button>
          </Link>
          
          <Link href="/payments/send">
            <Button className="flex items-center">
              <ArrowUp className="mr-2 h-4 w-4" />
              Send Direct Payment
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Payment processing flow image */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6 overflow-hidden">
        <img 
          className="w-full h-64 object-cover" 
          src="https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80" 
          alt="Payment processing flow" 
        />
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Secure Payment Processing</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Track all your payments and transactions in one place. CryptoPay leverages Solana's high-speed blockchain for fast and secure payments.
          </p>
        </div>
      </div>
      
      {/* Transaction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatSOL(178.5)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(178.5 * 80)} USD
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatSOL(45.2)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(45.2 * 80)} USD
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {formatSOL(12.75)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(12.75 * 80)} USD
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={transactions || []}
            loading={isLoading}
            emptyState={
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </Layout>
  );
}
