import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Invoice } from "@shared/schema";
import { formatDate } from "@/utils/date";
import { formatSOL, formatCurrency } from "@/utils/currency";
import { STATUS_CONFIG, StatusType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { usePayInvoice } from "@/hooks/useTransactions";
import { useWalletContext } from "@/providers/WalletProvider";
import { useToast } from "@/hooks/use-toast";

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceDetailModal({ invoice, isOpen, onClose }: InvoiceDetailModalProps) {
  const { toast } = useToast();
  const [isPaying, setIsPaying] = useState(false);
  const payInvoice = usePayInvoice();
  const { address, connected } = useWalletContext();

  if (!invoice) return null;

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusKey = status as StatusType;
    const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.draft;
    
    return (
      <Badge
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${config.darkBgColor} ${config.darkTextColor}`}
      >
        {config.label}
      </Badge>
    );
  };

  // Handle payment
  const handlePayment = async () => {
    if (!connected || !address || !invoice.recipientWalletAddress) {
      toast({
        title: "Error",
        description: "Please connect your wallet and ensure recipient address is valid",
        variant: "destructive"
      });
      return;
    }
    
    setIsPaying(true);
    
    try {
      await payInvoice.mutateAsync({
        invoiceId: invoice.id,
        senderWalletAddress: address,
        recipientWalletAddress: invoice.recipientWalletAddress,
        amount: Number(invoice.amount),
        fiatAmount: Number(invoice.fiatAmount)
      });
      
      toast({
        title: "Payment Successful",
        description: "Your invoice payment has been processed"
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment",
        variant: "destructive"
      });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{invoice.invoiceNumber}</DialogTitle>
        </DialogHeader>
        
        {/* Invoice details */}
        <div className="mt-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">From</h4>
              <p className="text-sm text-gray-900 dark:text-white">Your Company</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">To</h4>
              <p className="text-sm text-gray-900 dark:text-white">{invoice.recipientName}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Issue Date</h4>
              <p className="text-sm text-gray-900 dark:text-white">{formatDate(invoice.issueDate)}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Due Date</h4>
              <p className="text-sm text-gray-900 dark:text-white">{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Amount</h4>
              <p className="text-sm text-gray-900 dark:text-white font-bold">{formatSOL(invoice.amount)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(invoice.fiatAmount || 0)} USD</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</h4>
              {getStatusBadge(invoice.status)}
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h4>
            <p className="text-sm text-gray-900 dark:text-white">
              {invoice.description || "No description provided"}
            </p>
          </div>
        </div>
        
        {/* Payment flow visualization */}
        <div className="mt-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Payment Process</h4>
          <img 
            src="https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=300" 
            alt="Payment process flow visualization" 
            className="w-full h-auto rounded-lg" 
          />
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Close
          </Button>
          <Button 
            onClick={handlePayment}
            disabled={
              isPaying || 
              !connected || 
              invoice.status !== 'pending'
            }
          >
            {isPaying ? "Processing..." : "Pay Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
