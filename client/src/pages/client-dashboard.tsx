
import { useQuery } from "@tanstack/react-query";
import { DollarSign, FileText, Users, Building } from "lucide-react";
import StatCard from "@/components/dashboard/stat-card";
import RecentInvoices from "@/components/dashboard/recent-invoices";
import CryptoPriceWidget from "@/components/dashboard/crypto-price-widget";

export default function ClientDashboard() {
  const { data: invoices } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  const stats = {
    totalSpent: invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0,
    activeFreelancers: new Set(invoices?.map(inv => inv.userId)).size || 0,
    pendingInvoices: invoices?.filter(inv => inv.status === "PENDING").length || 0,
    completedProjects: invoices?.filter(inv => inv.status === "PAID").length || 0
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Spent"
          value={`$${stats.totalSpent.toFixed(2)}`}
          icon={<DollarSign />}
          variant="primary"
        />
        <StatCard
          title="Active Freelancers"
          value={stats.activeFreelancers}
          icon={<Users />}
          variant="secondary"
        />
        <StatCard
          title="Pending Invoices"
          value={stats.pendingInvoices}
          icon={<FileText />}
          variant="warning"
        />
        <StatCard
          title="Completed Projects"
          value={stats.completedProjects}
          icon={<Building />}
          variant="success"
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
