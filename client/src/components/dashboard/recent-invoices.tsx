import { useQuery } from "@tanstack/react-query";
import { navigateTo } from "@/lib/navigation";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@shared/schema";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RecentInvoices() {
  const { data: invoices, isLoading } = useQuery<(Invoice & { client?: any })[]>({
    queryKey: ["/api/invoices"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge variant="success">Paid</Badge>;
      case "PENDING":
        return <Badge variant="warning">Pending</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-border">
        <h2 className="font-semibold">Recent Invoices</h2>
        <span 
          onClick={() => navigateTo('/invoices')}
          className="text-primary text-sm font-medium cursor-pointer hover:underline"
        >
          View All
        </span>
      </div>
      
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading invoices...</div>
        ) : !invoices || invoices.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No invoices found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-background dark:bg-muted text-muted-foreground">
                <th className="text-xs font-medium text-left py-3 px-6">Invoice</th>
                <th className="text-xs font-medium text-left py-3 px-6">Client</th>
                <th className="text-xs font-medium text-left py-3 px-6">Amount</th>
                <th className="text-xs font-medium text-left py-3 px-6">Status</th>
                <th className="text-xs font-medium text-left py-3 px-6">Date</th>
                <th className="text-xs font-medium text-left py-3 px-6">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border hover:bg-background dark:hover:bg-muted">
                  <td className="py-4 px-6">
                    <span className="text-sm font-medium">#{invoice.invoiceNumber}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-primary">
                          {(invoice.client?.name || "Client").split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                      <span className="text-sm">{invoice.client?.name || "Unknown Client"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="text-sm font-medium">${Number(invoice.amount).toFixed(2)}</div>
                      {invoice.cryptoAmount && (
                        <div className="text-xs text-muted-foreground">
                          {invoice.cryptoAmount} {invoice.cryptoType}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(invoice.dueDate)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-primary">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigateTo(`/invoices/${invoice.id}`)}>
                          View Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem>Download PDF</DropdownMenuItem>
                        <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
