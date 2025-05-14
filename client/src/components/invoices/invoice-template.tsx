import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";
import { FormattedInvoice, getTemplateOptions, generateTemplateStyles } from "@/lib/invoice-templates";
import { Download, Printer } from "lucide-react";

interface InvoiceTemplateProps {
  invoice: FormattedInvoice;
  templateName: string;
}

export default function InvoiceTemplate({ invoice, templateName }: InvoiceTemplateProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  // Get template options based on template name
  const templateOptions = getTemplateOptions(templateName);
  const templateStyles = generateTemplateStyles(templateOptions);
  
  // Handle print
  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    onBeforeGetContent: () => {
      setIsGenerating(true);
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 200);
      });
    },
    onAfterPrint: () => {
      setIsGenerating(false);
    },
  });
  
  // Get status stamp class
  const getStatusStampClass = () => {
    switch (invoice.status) {
      case "PAID":
        return "invoice-paid-stamp";
      case "PENDING":
        return "invoice-pending-stamp";
      case "OVERDUE":
        return "invoice-overdue-stamp";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          disabled={isGenerating}
        >
          <Printer className="mr-2 h-4 w-4" />
          {isGenerating ? "Generating..." : "Print"}
        </Button>
        <Button
          size="sm"
          onClick={handlePrint} // Same handler for PDF download for simplicity
          disabled={isGenerating}
        >
          <Download className="mr-2 h-4 w-4" />
          {isGenerating ? "Generating..." : "Download PDF"}
        </Button>
      </div>
      
      <style>{templateStyles}</style>
      
      <div
        ref={invoiceRef}
        className="invoice-template bg-white p-8 rounded-lg border border-border"
      >
        {/* Invoice Header */}
        <div className="invoice-header flex justify-between items-start">
          <div>
            <div className="invoice-logo text-primary text-4xl font-bold mb-2">
              <span style={{ fontFamily: templateOptions.fontFamily }}>CryptoPay</span>
            </div>
            <div className="text-sm mt-4">
              <p className="font-medium">{invoice.company.name}</p>
              <p>{invoice.company.address}</p>
              <p>{invoice.company.email}</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="invoice-title text-2xl font-bold mb-2">INVOICE</h1>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Invoice #:</span> {invoice.invoiceNumber}</p>
              <p><span className="font-medium">Issue Date:</span> {invoice.invoiceDate}</p>
              <p><span className="font-medium">Due Date:</span> {invoice.dueDate}</p>
              <div className="mt-3">
                <span 
                  className={`${getStatusStampClass()} inline-block px-4 py-1 rounded-full text-xs uppercase font-bold border-2`}
                >
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Client and Payment Info */}
        <div className="grid grid-cols-2 gap-8 mt-8">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Bill To:</h2>
            <div className="text-sm">
              <p className="font-medium">{invoice.client.name}</p>
              {invoice.client.company && <p>{invoice.client.company}</p>}
              <p>{invoice.client.address}</p>
              <p>{invoice.client.email}</p>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Payment Method:</h2>
            <div className="text-sm">
              <p className="font-medium">{invoice.paymentMethod}</p>
              {invoice.totalInCrypto && (
                <div className="mt-2">
                  <p><span className="font-medium">Crypto Amount:</span> {invoice.totalInCrypto.amount} {invoice.totalInCrypto.currency}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Invoice Items */}
        <div className="mt-8">
          <table className="invoice-table w-full">
            <thead>
              <tr>
                <th className="text-left py-2 px-4 text-sm">Description</th>
                <th className="text-right py-2 px-4 text-sm">Quantity</th>
                <th className="text-right py-2 px-4 text-sm">Rate</th>
                <th className="text-right py-2 px-4 text-sm">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-t border-border">
                  <td className="py-3 px-4 text-sm">{item.description}</td>
                  <td className="py-3 px-4 text-sm text-right">{item.quantity}</td>
                  <td className="py-3 px-4 text-sm text-right">${parseFloat(item.rate).toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-right">${parseFloat(item.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Invoice Summary */}
        <div className="mt-8 flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2 border-t border-border">
              <span className="text-sm font-medium">Subtotal:</span>
              <span className="text-sm">${invoice.subtotal.toFixed(2)}</span>
            </div>
            
            {invoice.tax > 0 && (
              <div className="flex justify-between py-2 border-t border-border">
                <span className="text-sm font-medium">Tax:</span>
                <span className="text-sm">${invoice.tax.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between py-2 border-t border-b border-border">
              <span className="font-medium invoice-total">Total:</span>
              <span className="font-medium invoice-total">${invoice.total.toFixed(2)}</span>
            </div>
            
            {invoice.totalInCrypto && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="font-medium text-primary">Crypto Total:</span>
                <span className="font-medium text-primary">
                  {invoice.totalInCrypto.amount} {invoice.totalInCrypto.currency}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8">
            <h2 className="text-sm font-medium mb-2">Notes:</h2>
            <p className="text-sm text-muted-foreground border-l-2 pl-4 py-2" style={{ borderColor: templateOptions.primaryColor }}>
              {invoice.notes}
            </p>
          </div>
        )}
        
        {/* Footer */}
        <div className="invoice-footer text-center mt-8 pt-8">
          <p className="text-sm">Thank you for your business!</p>
          <p className="text-xs text-muted-foreground mt-1">
            Payment is due by {invoice.dueDate}. Please include the invoice number with your payment.
          </p>
        </div>
      </div>
    </div>
  );
}
