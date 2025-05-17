import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useTransactions } from "@/hooks/useTransactions";
import { useWalletContext } from "@/providers/WalletProvider";
import { formatSOL, formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { 
  ArrowDown, 
  ArrowUp, 
  RefreshCcw, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function TransactionHistory() {
  const { data: transactions, isLoading, refetch } = useTransactions();
  const { address, connected } = useWalletContext();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState(transactions || []);

  // Fetch transactions when wallet address changes
  useEffect(() => {
    if (connected && address) {
      refetch();
    }
  }, [connected, address, refetch]);

  // Update filtered transactions when data or search term changes
  useEffect(() => {
    if (!transactions) {
      setFilteredTransactions([]);
      return;
    }

    if (!searchTerm) {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter(tx => 
      tx.transactionHash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.memo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.senderWalletAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.recipientWalletAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm]);

  // Function to view transaction on Solana Explorer
  const viewTransaction = (hash: string) => {
    if (!hash) {
      toast({
        title: 'No Transaction Hash',
        description: 'This transaction does not have an associated blockchain hash',
        variant: 'destructive',
      });
      return;
    }
    
    // Open in Solana Explorer (devnet)
    window.open(`https://explorer.solana.com/tx/${hash}?cluster=devnet`, '_blank');
  };

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  // Function to get transaction type icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'receipt':
        return <ArrowDown className="h-4 w-4 text-blue-500" />;
      case 'refund':
        return <RefreshCcw className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCcw className="h-4 w-4 text-gray-500" />;
    }
  };

  // Function to copy transaction hash to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to Clipboard',
      description: 'Transaction hash copied to clipboard',
    });
  };

  // Format wallet address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              View all your blockchain transactions with real-time data
            </p>
          </div>
          <div className="flex mt-4 md:mt-0">
            <Button variant="outline" className="mr-2">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Search transactions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Transactions</CardTitle>
            <CardDescription>
              Search by transaction hash, memo, or wallet address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search transactions..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Transactions table */}
        <Card>
          <CardHeader>
            <CardTitle>Blockchain Transactions</CardTitle>
            <CardDescription>
              Showing {filteredTransactions.length} transactions from the Solana blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-60 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Transaction Hash</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((tx) => (
                      <TableRow key={tx.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="flex items-center">
                            {getTransactionIcon(tx.transactionType || 'unknown')}
                            <span className="ml-2 capitalize">{tx.transactionType}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {tx.transactionHash 
                            ? `${tx.transactionHash.substring(0, 8)}...${tx.transactionHash.substring(tx.transactionHash.length - 8)}`
                            : 'Not available'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatAddress(tx.senderWalletAddress || '')}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatAddress(tx.recipientWalletAddress || '')}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{formatSOL(tx.amount || 0)}</span>
                          {tx.fiatAmount && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">
                              ≈ {formatCurrency(tx.fiatAmount)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {tx.timestamp ? formatDate(tx.timestamp) : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(tx.status || 'unknown')}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {tx.transactionHash && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => copyToClipboard(tx.transactionHash || '')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => viewTransaction(tx.transactionHash || '')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
                {!connected && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Connect your wallet to view transactions
                  </p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {connected 
                ? `Showing transactions for wallet: ${formatAddress(address || '')}`
                : 'Connect your wallet to view your transactions'}
            </div>
            <Button onClick={() => refetch()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}