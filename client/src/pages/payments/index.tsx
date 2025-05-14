import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { navigateTo } from "@/lib/navigation";
import { PlusCircle, Filter, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DataCard from "@/components/ui/data-card";
import { Payment } from "@shared/schema";

export default function Payments() {
  useEffect(() => {
    document.title = "Payments - CryptoPay";
  }, []);

  const { data: payments, isLoading } = useQuery<(Payment & { invoice?: any })[]>({
    queryKey: ["/api/payments"],
  });

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "PENDING":
        return <Badge variant="warning">Pending</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredPayments = payments?.filter(payment => {
    // Apply status filter
    if (filter !== "all" && payment.status !== filter) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        payment.transactionId?.toLowerCase().includes(query) ||
        payment.invoice?.invoiceNumber.toLowerCase().includes(query) ||
        String(payment.amount).includes(query)
      );
    }
    
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        <Button 
          onClick={() => window.location.href = "/payments/request"}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Request Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <DataCard title="Total Received" contentClassName="text-center py-6">
          <p className="text-3xl font-bold text-primary">
            ${payments 
              ? payments
                  .filter(p => p.status === "COMPLETED")
                  .reduce((sum, p) => sum + Number(p.amount), 0)
                  .toFixed(2)
              : "0.00"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">All time</p>
        </DataCard>

        <DataCard title="Pending Payments" contentClassName="text-center py-6">
          <p className="text-3xl font-bold text-warning">
            ${payments 
              ? payments
                  .filter(p => p.status === "PENDING")
                  .reduce((sum, p) => sum + Number(p.amount), 0)
                  .toFixed(2)
              : "0.00"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">Awaiting confirmation</p>
        </DataCard>

        <DataCard title="Failed Transactions" contentClassName="text-center py-6">
          <p className="text-3xl font-bold text-destructive">
            ${payments 
              ? payments
                  .filter(p => p.status === "FAILED")
                  .reduce((sum, p) => sum + Number(p.amount), 0)
                  .toFixed(2)
              : "0.00"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">Requiring attention</p>
        </DataCard>
      </div>

      <DataCard title="Payment History">
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading payments...</div>
        ) : !filteredPayments || filteredPayments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No payments found</p>
            <Button 
              variant="link" 
              className="mt-2"
              onClick={() => window.location.href = "/payments/request"}
            >
              Request your first payment
            </Button>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Crypto</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.transactionId 
                        ? payment.transactionId.substring(0, 8) + '...'
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {payment.invoiceId ? (
                        <span 
                          className="text-primary hover:underline cursor-pointer"
                          onClick={() => window.location.href = `/invoices/${payment.invoiceId}`}
                        >
                          #{payment.invoice?.invoiceNumber || payment.invoiceId}
                        </span>
                      ) : (
                        "Direct Payment"
                      )}
                    </TableCell>
                    <TableCell>${Number(payment.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      {payment.cryptoAmount 
                        ? `${payment.cryptoAmount} ${payment.cryptoType}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataCard>
    </div>
  );
}
