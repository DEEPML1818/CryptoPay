import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { navigateTo } from "@/lib/navigation";
import { Download, Send, Printer, Share2, MoreHorizontal, Copy, ExternalLink } from "lucide-react";
import { formatInvoiceForPdf, formatInvoiceItems, calculateInvoiceTotal } from "@/lib/invoice-templates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DataCard from "@/components/ui/data-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ViewInvoiceProps {
  id?: string;
}

export default function ViewInvoice({ id }: ViewInvoiceProps) {
  // Get ID from props or from URL params
  const params = useParams();
  const invoiceId = id || params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentLink, setPaymentLink] = useState("");

  useEffect(() => {
    document.title = "Invoice Details - CryptoPay";
  }, []);

  // Generate a shareable payment link
  useEffect(() => {
    if (invoiceId) {
      const baseUrl = window.location.origin;
      setPaymentLink(`${baseUrl}/payments/process/${invoiceId}`);
    }
  }, [invoiceId]);

  // Fetch invoice data
  const { data: invoice, isLoading } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
  });
  
  // Use a default empty invoice object to prevent TypeScript errors
  const invoiceData = invoice || {
    id: 0,
    userId: 0,
    clientId: 0, 
    template: "modern",
    invoiceNumber: "",
    amount: "0",
    cryptoAmount: null,
    cryptoType: null,
    status: "draft",
    dueDate: new Date(),
    notes: "",
    items: "[]",
    paymentMethod: "bank_transfer",
    createdAt: new Date(),
    updatedAt: new Date(),
    client: {
      id: 0,
      name: "",
      email: "",
      phone: "",
      address: "",
      company: "",
      userId: 0,
      createdAt: new Date(),
    }
  };

  // Format the date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Mark invoice as paid
  const markAsPaid = async () => {
    try {
      // Update invoice status on the server
      await apiRequest("PATCH", `/api/invoices/${invoiceId}`, {
        status: "paid",
      });
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      toast({
        title: "Success",
        description: "Invoice has been marked as paid",
      });
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        variant: "destructive", 
        title: "Error",
        description: "Failed to update invoice status",
      });
    }
  };

  // Send payment reminder
  const sendReminder = () => {
    // This would typically make an API call to send an email reminder
    toast({
      title: "Reminder Sent",
      description: "Payment reminder has been sent to the client",
    });
  };

  // Copy payment link
  const copyPaymentLink = () => {
    navigator.clipboard.writeText(paymentLink);
    toast({
      title: "Success",
      description: "Payment link copied to clipboard",
    });
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-center">
          <div className="spinner h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  // Only show the not found message if we're not loading and there's no actual invoice data
  if (!isLoading && !invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Invoice Not Found</h2>
        <p className="text-muted-foreground mb-6">The invoice you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigateTo('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  const items = formatInvoiceItems(invoiceData);
  const total = calculateInvoiceTotal(items);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoice #{invoiceData.invoiceNumber}</h1>
          <p className="text-muted-foreground">Created on {formatDate(invoiceData.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={copyPaymentLink}
          >
            <Copy className="w-4 h-4" />
            Copy Link
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={sendReminder}
          >
            <Send className="w-4 h-4" />
            Send Reminder
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Invoice Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.open(`/invoices/edit/${invoiceId}`, "_blank")}>
                Edit Invoice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={markAsPaid}>
                Mark as Paid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={sendReminder}>
                Send Reminder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigateTo("/invoices")}>
                Back to Invoices
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6 print:shadow-none print:border-none">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-primary">Invoice #{invoiceData.invoiceNumber}</h2>
              <div className="mt-1 space-y-1">
                <p className="text-sm"><span className="font-medium">Issue Date:</span> {formatDate(invoiceData.createdAt)}</p>
                <p className="text-sm"><span className="font-medium">Due Date:</span> {formatDate(invoiceData.dueDate)}</p>
                <div className="flex items-center mt-2">
                  <span className="font-medium text-sm mr-2">Status:</span>
                  <Badge 
                    variant={
                      invoiceData.status === "paid" ? "success" :
                      invoiceData.status === "pending" ? "warning" :
                      invoiceData.status === "overdue" ? "destructive" : 
                      "outline"
                    }
                  >
                    {invoiceData.status.charAt(0).toUpperCase() + invoiceData.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Bill To:</h3>
              <div className="text-sm space-y-1">
                <p className="font-semibold">{invoiceData.client?.name}</p>
                <p>{invoiceData.client?.company}</p>
                <p>{invoiceData.client?.email}</p>
                <p>{invoiceData.client?.address}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Payment Method:</h3>
              <div className="text-sm">
                <p className="capitalize">
                  {invoiceData.paymentMethod.replace('_', ' ')}
                </p>
                
                {invoiceData.paymentMethod === "cryptocurrency" && invoiceData.cryptoType && (
                  <div className="mt-2">
                    <p className="font-medium">{invoiceData.cryptoType}</p>
                    {invoiceData.cryptoAmount && invoiceData.cryptoType && (
                      <p className="text-sm text-muted-foreground">
                        {invoiceData.cryptoAmount} {invoiceData.cryptoType}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Amount Due:</p>
              <p className="text-2xl font-bold text-primary">${parseFloat(invoiceData.amount).toFixed(2)}</p>
              
              {invoiceData.paymentMethod === "cryptocurrency" && invoiceData.cryptoAmount && invoiceData.cryptoType && (
                <div className="mt-1">
                  <p className="text-sm text-muted-foreground">Crypto Equivalent:</p>
                  <p className="font-medium">
                    {invoiceData.cryptoType}: {invoiceData.cryptoAmount}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div>
          <h3 className="font-medium mb-4">Description of Services</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">${parseFloat(item.rate).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">${parseFloat(item.amount).toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-medium text-right">Total</td>
                  <td className="px-4 py-3 text-sm font-bold text-right">${total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {invoiceData.notes && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">Notes</h3>
            <p className="text-sm text-gray-600">
              {invoiceData.notes}
            </p>
          </div>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <DataCard
          title="Payment Details"
          items={[
            {
              label: "Due Date",
              value: formatDate(invoiceData.dueDate),
            },
            {
              label: "Amount Due",
              value: `$${parseFloat(invoiceData.amount).toFixed(2)}`,
              variant: "primary",
            },
            {
              label: "Status",
              value: invoiceData.status.charAt(0).toUpperCase() + invoiceData.status.slice(1),
              variant: 
                invoiceData.status === "paid" ? "success" :
                invoiceData.status === "pending" ? "warning" :
                invoiceData.status === "overdue" ? "destructive" : 
                "default",
            },
            {
              label: "Payment Method",
              value: invoiceData.paymentMethod.replace('_', ' '),
            },
          ]}
        />
        
        {invoiceData.paymentMethod === "cryptocurrency" && invoiceData.cryptoAmount && invoiceData.cryptoType && (
          <DataCard
            title="Cryptocurrency Payment"
            items={[
              {
                label: "Amount in Crypto",
                value: `${invoiceData.cryptoAmount} ${invoiceData.cryptoType}`,
                variant: "primary",
              },
              {
                label: "Payment Status",
                value: invoiceData.status === "paid" ? "Confirmed" : "Waiting for Payment",
                variant: invoiceData.status === "paid" ? "success" : "warning",
              },
            ]}
          />
        )}
      </div>
      
      <div className="text-center text-sm text-muted-foreground print:hidden">
        <p className="mb-1">
          Send payment to {invoiceData.client?.name} using Invoice #{invoiceData.invoiceNumber}
        </p>
        <div className="flex justify-center items-center gap-2 text-primary">
          <ExternalLink className="h-4 w-4" />
          <a href={paymentLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
            View online payment page
          </a>
        </div>
      </div>
    </div>
  );
}