import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, FileText, Coins, Users } from "lucide-react";
import StatCard from "@/components/dashboard/stat-card";
import RecentInvoices from "@/components/dashboard/recent-invoices";
import InvoiceActionCards from "@/components/dashboard/invoice-action-cards";
import CryptoPriceWidget from "@/components/dashboard/crypto-price-widget";
import CurrencyConverter from "@/components/dashboard/currency-converter";
import PaymentMethods from "@/components/dashboard/payment-methods";

export default function Dashboard() {
  // Set document title
  useEffect(() => {
    document.title = "Dashboard - CryptoPay";
  }, []);

  // Fetch invoices for stats
  const { data: invoices } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  // Calculate statistics
  const calculateStats = () => {
    if (!invoices) return {
      totalRevenue: "$0.00",
      pendingInvoices: 0,
      cryptoReceived: "0.00 BTC",
      activeClients: 0
    };

    // Total revenue from paid invoices
    const totalRevenue = invoices
      .filter(inv => inv.status === "PAID")
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
    
    // Count of pending invoices
    const pendingInvoices = invoices.filter(inv => inv.status === "PENDING").length;
    
    // Total crypto received (simplified to BTC for this example)
    const cryptoReceived = invoices
      .filter(inv => inv.status === "PAID" && inv.cryptoAmount)
      .reduce((sum, inv) => sum + Number(inv.cryptoAmount), 0);
    
    // Count of unique clients with invoices
    const clientIds = new Set(invoices.map(inv => inv.clientId));
    
    return {
      totalRevenue: `$${totalRevenue.toFixed(2)}`,
      pendingInvoices,
      cryptoReceived: `${cryptoReceived.toFixed(2)} BTC`,
      activeClients: clientIds.size
    };
  };

  const stats = calculateStats();

  return (
    <div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          change={{
            value: "8.2%",
            isPositive: true,
            label: "vs. last month"
          }}
          icon={<DollarSign className="h-5 w-5" />}
          variant="primary"
        />
        
        <StatCard
          title="Pending Invoices"
          value={stats.pendingInvoices}
          change={{
            value: `${stats.pendingInvoices} new`,
            isPositive: true,
            label: "since yesterday"
          }}
          icon={<FileText className="h-5 w-5" />}
          variant="warning"
        />
        
        <StatCard
          title="Crypto Received"
          value={stats.cryptoReceived}
          change={{
            value: "12.3%",
            isPositive: true,
            label: "vs. last month"
          }}
          icon={<Coins className="h-5 w-5" />}
          variant="primary"
        />
        
        <StatCard
          title="Active Clients"
          value={stats.activeClients}
          change={{
            value: "5 new",
            isPositive: true,
            label: "since last week"
          }}
          icon={<Users className="h-5 w-5" />}
          variant="secondary"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <RecentInvoices />
          <InvoiceActionCards />
        </div>

        {/* Right Column (1/3 on large screens) */}
        <div className="space-y-6">
          <CryptoPriceWidget />
          <CurrencyConverter />
        </div>
      </div>

      {/* Payment Methods */}
      <PaymentMethods />
    </div>
  );
}
