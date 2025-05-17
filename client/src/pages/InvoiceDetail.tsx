import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useInvoice } from "@/hooks/useInvoices";
import { usePayInvoice } from "@/hooks/useTransactions";
import { useSolanaInvoices } from "@/hooks/useSolanaInvoices";
import { formatSOL, formatCurrency } from "@/utils/currency";
import { formatDate, isDatePast } from "@/utils/date";
import { useWalletContext } from "@/providers/WalletProvider";
import { useToast } from "@/hooks/use-toast";
import { STATUS_CONFIG, StatusType } from "@/types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter,
  CardDescription 
} from "@/components/ui/card";
import { 
  Alert,
  AlertTitle,
  AlertDescription 
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClipboardCopy, FileText, ArrowLeft, Share2, Printer, Download, AlertCircle } from "lucide-react";
import { Link } from "wouter";

interface InvoiceDetailProps {
  id?: string;
}

export default function InvoiceDetail({ id }: InvoiceDetailProps) {
  const [_, params] = useRoute("/invoices/:id");
  const { toast } = useToast();
  const [isPaying, setIsPaying] = useState(false);
  const invoiceId = id ? parseInt(id) : params?.id ? parseInt(params.id) : 0;
  const { data: invoice, isLoading, error } = useInvoice(invoiceId);
  const payInvoice = usePayInvoice();
  const { connected, address } = useWalletContext();

  // Back button functionality
  const handleBackClick = () => {
    window.history.back();
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusKey = status as StatusType;
    const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.draft;
    
    return (
      <Badge
        className={`${config.bgColor} ${config.color} ${config.darkBgColor} ${config.darkTextColor}`}
      >
        {config.label}
      </Badge>
    );
  };

  // Get blockchain connection from our Solana hook
  const { payInvoiceWithEscrow } = useSolanaInvoices();
  
  // Handle payment with direct blockchain integration
  const handlePayment = async () => {
    if (!connected || !address || !invoice?.recipientWalletAddress) {
      toast({
        title: "Error",
        description: "Please connect your wallet and ensure recipient address is valid",
        variant: "destructive"
      });
      return;
    }
    
    setIsPaying(true);
    
    try {
      // First, process the payment on the Solana blockchain
      const txHash = await payInvoiceWithEscrow({
        invoiceId: invoice.id,
        senderWallet: address,
        recipientWallet: invoice.recipientWalletAddress,
        amount: Number(invoice.amount)
      });
      
      if (!txHash) {
        throw new Error("Blockchain transaction failed");
      }
      
      // Then record the transaction in our database
      await payInvoice.mutateAsync({
        invoiceId: invoice.id,
        senderWalletAddress: address,
        recipientWalletAddress: invoice.recipientWalletAddress,
        amount: Number(invoice.amount),
        fiatAmount: Number(invoice.fiatAmount),
        transactionHash: txHash,
        memo: `Payment for invoice ${invoice.invoiceNumber}`
      });
      
      toast({
        title: "Payment Successful",
        description: `${formatSOL(Number(invoice.amount))} SOL has been sent to ${invoice.recipientName}`
      });
      
      // Reload after a short delay to show updated status
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment through the blockchain",
        variant: "destructive"
      });
    } finally {
      setIsPaying(false);
    }
  };

  // Check if invoice is overdue
  useEffect(() => {
    if (invoice && invoice.status === "pending" && isDatePast(invoice.dueDate)) {
      toast({
        title: "Invoice Overdue",
        description: "This invoice is past its due date",
        variant: "destructive"
      });
    }
  }, [invoice, toast]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2" />
              <div className="h-5 w-56 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !invoice) {
    return (
      <Layout>
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Invoice Not Found</h2>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            We couldn't find the invoice you're looking for. It may have been deleted or you don't have permission to view it.
          </AlertDescription>
        </Alert>
        <div className="mt-6">
          <Link href="/invoices">
            <Button>
              View All Invoices
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{invoice.invoiceNumber}</h2>
          {getStatusBadge(invoice.status)}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>
              Created on {formatDate(invoice.issueDate)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">From</h3>
                <p className="text-base font-medium">Your Company</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Wallet Address:</p>
                <p className="text-sm font-mono text-gray-600 dark:text-gray-300 truncate">
                  {address || "Wallet not connected"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">To</h3>
                <p className="text-base font-medium">{invoice.recipientName}</p>
                {invoice.recipientWalletAddress && (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Wallet Address:</p>
                    <div className="flex items-center">
                      <p className="text-sm font-mono text-gray-600 dark:text-gray-300 truncate">
                        {invoice.recipientWalletAddress}
                      </p>
                      <Button variant="ghost" size="icon" className="ml-1 h-6 w-6" onClick={() => {
                        navigator.clipboard.writeText(invoice.recipientWalletAddress || "");
                        toast({
                          title: "Copied to clipboard",
                          description: "Wallet address copied to clipboard"
                        });
                      }}>
                        <ClipboardCopy className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Invoice Number</h3>
                <p className="text-base font-medium">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Issue Date</h3>
                <p className="text-base">{formatDate(invoice.issueDate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</h3>
                <p className="text-base">{formatDate(invoice.dueDate)}</p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
              <p className="text-base text-gray-700 dark:text-gray-300">
                {invoice.description || "No description provided"}
              </p>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Amount (SOL)</h3>
                <p className="text-2xl font-bold">{formatSOL(invoice.amount)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">USD Equivalent</h3>
                <p className="text-2xl font-medium text-gray-500">{formatCurrency(invoice.fiatAmount || 0)}</p>
              </div>
            </div>

            {invoice.convertOnPayment && (
              <Alert className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Conversion Enabled</AlertTitle>
                <AlertDescription>
                  This invoice will be automatically converted to USD via Mercuryo upon payment.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Payment Status & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h3>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(invoice.status)}
                    {invoice.status === "paid" && invoice.paymentDate && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        on {formatDate(invoice.paymentDate)}
                      </span>
                    )}
                  </div>
                </div>

                {invoice.status === "pending" && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Methods</h3>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Direct Solana Transfer</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Send SOL directly to the recipient's wallet</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              {invoice.status === "pending" ? (
                <Button 
                  className="w-full" 
                  onClick={handlePayment}
                  disabled={isPaying || !connected}
                >
                  {isPaying ? "Processing Payment..." : "Pay Invoice"}
                </Button>
              ) : invoice.status === "paid" ? (
                <div className="text-center text-green-600 dark:text-green-400">
                  <p className="text-sm">This invoice has been paid</p>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">
                    {invoice.status === "draft" 
                      ? "This invoice is still a draft" 
                      : invoice.status === "overdue"
                      ? "This invoice is overdue"
                      : invoice.status === "refunded"
                      ? "This invoice has been refunded"
                      : ""}
                  </p>
                </div>
              )}
            </CardFooter>
          </Card>

          {/* Payment flow visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Process</CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src="https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=300" 
                alt="Payment process flow visualization" 
                className="w-full h-auto rounded-lg" 
              />
            </CardContent>
          </Card>

          {/* Blockchain Transaction Information */}
          {invoice.status === "paid" && invoice.transactionHash && (
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Transaction Hash</h3>
                    <div className="flex items-center">
                      <p className="text-sm font-mono truncate">{invoice.transactionHash}</p>
                      <Button variant="ghost" size="icon" className="ml-1 h-6 w-6" onClick={() => {
                        navigator.clipboard.writeText(invoice.transactionHash || "");
                        toast({
                          title: "Copied to clipboard",
                          description: "Transaction hash copied to clipboard"
                        });
                      }}>
                        <ClipboardCopy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Blockchain Explorer</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center"
                      onClick={() => window.open(`https://explorer.solana.com/tx/${invoice.transactionHash}?cluster=devnet`, '_blank')}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      View on Solana Explorer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Related Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Invoice PDF</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Receipt</span>
                  </div>
                  <Button variant="ghost" size="sm" disabled={invoice.status !== "paid"}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
