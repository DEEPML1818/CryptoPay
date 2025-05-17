import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { useInvoices, useSolanaPrice } from "@/hooks/useInvoices";
import { useTransactions } from "@/hooks/useTransactions";
import { useWalletContext } from "@/providers/WalletProvider";
import { useUserRole } from "@/hooks/useUserRole";
import { Link, useLocation } from "wouter";
import { formatSOL, formatCurrency } from "@/utils/currency";
import { File, CheckCircle, Clock, ArrowUpDown, TrendingUp, Wallet, CreditCard, Download, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: invoices } = useInvoices();
  const { data: transactions } = useTransactions();
  const { data: solanaPrice } = useSolanaPrice();
  const { connected, balance } = useWalletContext();
  const { userRole } = useUserRole();
  const [location, navigate] = useLocation();
  
  // Listen for role changes and update the dashboard
  useEffect(() => {
    // If role is set to client or freelancer, redirect to the appropriate dashboard
    if (userRole === 'client' && location === '/') {
      navigate('/client/dashboard');
    } else if (userRole === 'freelancer' && location === '/') {
      navigate('/freelancer/dashboard');
    }
    
    // Also listen for role switch events
    const handleRoleChange = (event: CustomEvent<{role: string}>) => {
      if (event.detail.role === 'client') {
        navigate('/client/dashboard');
      } else if (event.detail.role === 'freelancer') {
        navigate('/freelancer/dashboard');
      }
    };
    
    window.addEventListener('user-role-changed' as any, handleRoleChange as any);
    
    return () => {
      window.removeEventListener('user-role-changed' as any, handleRoleChange as any);
    };
  }, [userRole, location, navigate]);
  
  // Count invoices by status
  const pendingInvoices = invoices?.filter((invoice) => invoice.status === "pending").length || 0;
  const paidInvoices = invoices?.filter((invoice) => invoice.status === "paid").length || 0;
  const overdueInvoices = invoices?.filter((invoice) => invoice.status === "overdue").length || 0;
  
  // Calculate USD value
  const solValue = balance || 0;
  const usdValue = solValue * (solanaPrice?.price || 80);
  
  // Calculate total incoming and outgoing values
  const totalIncoming = invoices
    ?.filter(invoice => invoice.status === "pending")
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0) || 0;
    
  const totalOutgoing = transactions
    ?.filter(tx => tx.transactionType === "payment" && tx.status === "success")
    .reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
  
  return (
    <Layout>
      {/* Enhanced Header with Wallet Status */}
      <DashboardHeader />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={<Clock />}
          iconColor="text-amber-500 dark:text-amber-400"
          iconBgColor="bg-amber-100 dark:bg-amber-900/30"
          title="Pending Invoices"
          value={pendingInvoices}
          footer={
            <div className="text-sm flex items-center">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400 font-medium">{formatSOL(totalIncoming)}</span>
              <span className="ml-1">incoming</span>
            </div>
          }
        />
        
        <StatCard
          icon={<CheckCircle />}
          iconColor="text-green-500 dark:text-green-400"
          iconBgColor="bg-green-100 dark:bg-green-900/30"
          title="Paid Invoices"
          value={paidInvoices}
          footer={
            <div className="text-sm">
              <Link href="/invoices?status=paid" className="font-medium text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                View history
              </Link>
            </div>
          }
        />
        
        <StatCard
          icon={<Wallet />}
          iconColor="text-purple-500 dark:text-purple-400"
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          title="SOL Balance"
          value={formatSOL(solValue)}
          footer={
            <div className="text-sm flex items-center">
              <span>1 SOL = </span>
              <span className="ml-1 font-medium">{formatCurrency(solanaPrice?.price || 0)}</span>
            </div>
          }
        />
        
        <StatCard
          icon={<ArrowUpDown />}
          iconColor="text-blue-500 dark:text-blue-400"
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          title="Recent Activity"
          value={transactions?.length || 0}
          footer={
            <div className="text-sm">
              <Link href="/payments" className="font-medium text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                Transaction history
              </Link>
            </div>
          }
        />
      </div>
      
      {/* Analytics Charts */}
      <AnalyticsChart />
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Invoices</CardTitle>
            <div className="flex space-x-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">All</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">Pending</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">Paid</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <InvoiceTable />
            <div className="flex justify-center mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/invoices">
                  View All Invoices
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionList />
            <div className="flex justify-center mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/payments">
                  View All Transactions
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-auto py-4 flex flex-col" asChild>
              <Link href="/invoices/create">
                <File className="h-6 w-6 mb-2" />
                <span>New Invoice</span>
              </Link>
            </Button>
            <Button className="h-auto py-4 flex flex-col" variant="outline" asChild>
              <Link href="/payments/send">
                <ArrowUpDown className="h-6 w-6 mb-2" />
                <span>Send Payment</span>
              </Link>
            </Button>
            <Button className="h-auto py-4 flex flex-col" variant="outline" asChild>
              <Link href="/contacts">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mb-2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Manage Contacts</span>
              </Link>
            </Button>
            <Button className="h-auto py-4 flex flex-col" variant="outline" asChild>
              <Link href="/conversions">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mb-2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span>Currency Conversion</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
