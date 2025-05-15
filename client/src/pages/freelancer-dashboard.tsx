
import { useQuery } from "@tanstack/react-query";
import { Wallet, Clock, CheckCircle, TrendingUp } from "lucide-react";
import StatCard from "@/components/dashboard/stat-card";
import CryptoPriceWidget from "@/components/dashboard/crypto-price-widget";
import RecentInvoices from "@/components/dashboard/recent-invoices";

export default function FreelancerDashboard() {
  const { data: invoices } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  const stats = {
    totalEarned: invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0,
    pendingPayments: invoices?.filter(inv => inv.status === "PENDING").length || 0,
    completedJobs: invoices?.filter(inv => inv.status === "PAID").length || 0,
    activeClients: new Set(invoices?.map(inv => inv.clientId)).size || 0
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Earned"
          value={`$${stats.totalEarned.toFixed(2)}`}
          icon={<Wallet />}
          variant="primary"
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={<Clock />}
          variant="warning"
        />
        <StatCard
          title="Completed Jobs"
          value={stats.completedJobs}
          icon={<CheckCircle />}
          variant="success"
        />
        <StatCard
          title="Active Clients"
          value={stats.activeClients}
          icon={<TrendingUp />}
          variant="secondary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentInvoices />
        </div>
        <div>
          <CryptoPriceWidget />
        </div>
      </div>
    </div>
  );
}
