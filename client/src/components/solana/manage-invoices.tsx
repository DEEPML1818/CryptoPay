import { useState, useEffect } from 'react';
import { useSolanaWallet, SolanaInvoice } from '@/lib/solana-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, RefreshCw } from 'lucide-react';

export default function ManageSolanaInvoices() {
  const solanaWallet = useSolanaWallet();
  const { isConnected, getInvoices, wallet } = solanaWallet;
  const [invoices, setInvoices] = useState<SolanaInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadInvoices();
    } else {
      setInvoices([]);
    }
  }, [isConnected, wallet.address]);

  const loadInvoices = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      const invoiceData = await getInvoices();
      setInvoices(invoiceData);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Solana Invoices</CardTitle>
          <CardDescription>
            Connect your wallet to view and manage your blockchain invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-slate-50 rounded-lg p-8 text-center">
            <p className="text-muted-foreground mb-2">No wallet connected</p>
            <p className="text-sm text-muted-foreground">
              Please connect your Solana wallet to view your invoices.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Your Solana Invoices</CardTitle>
            <CardDescription>
              View and manage your blockchain invoices
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={loadInvoices}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-slate-50 rounded-lg p-8 text-center">
            <p className="text-muted-foreground mb-2">No invoices found</p>
            <p className="text-sm text-muted-foreground">
              Create your first blockchain invoice to get started.
            </p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-xs">
                      {invoice.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{invoice.amount} SOL</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {invoice.description}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(invoice.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}