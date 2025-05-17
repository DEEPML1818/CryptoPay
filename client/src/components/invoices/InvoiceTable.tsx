import { Link } from "wouter";
import { DataTable } from "@/components/ui/data-table";
import { Invoice } from "@shared/schema";
import { formatSOL, formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { Badge } from "@/components/ui/badge";
import { STATUS_CONFIG, StatusType } from "@/types";
import { Button } from "@/components/ui/button";
import { useInvoices } from "@/hooks/useInvoices";

export function InvoiceTable() {
  const { data: invoices, isLoading } = useInvoices();

  // Get the appropriate status badge for each invoice
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

  const columns = [
    {
      header: "Invoice",
      accessorKey: "invoiceNumber",
      cell: (row: Invoice) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {row.invoiceNumber}
        </span>
      ),
    },
    {
      header: "Client",
      accessorKey: "recipientName",
      cell: (row: Invoice) => (
        <span className="text-gray-500 dark:text-gray-300">
          {row.recipientName}
        </span>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (row: Invoice) => (
        <div>
          <div>{formatSOL(row.amount)}</div>
          <div className="text-xs text-gray-400">
            {formatCurrency(row.fiatAmount || 0)}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: Invoice) => getStatusBadge(row.status),
    },
    {
      header: "Due Date",
      accessorKey: "dueDate",
      cell: (row: Invoice) => (
        <span className="text-gray-500 dark:text-gray-300">
          {formatDate(row.dueDate)}
        </span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row: Invoice) => (
        <div className="text-right">
          <Link href={`/invoices/${row.id}`}>
            <Button 
              variant="link" 
              className="text-primary hover:text-indigo-900 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DataTable 
      columns={columns} 
      data={invoices || []} 
      loading={isLoading}
      emptyState={
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No invoices found</p>
          <Link href="/invoices/new">
            <Button variant="outline">Create your first invoice</Button>
          </Link>
        </div>
      }
    />
  );
}
