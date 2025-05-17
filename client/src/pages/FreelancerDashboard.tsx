import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { useInvoices, useSolanaPrice } from "@/hooks/useInvoices";
import { useTransactions } from "@/hooks/useTransactions";
import { useWalletContext } from "@/providers/WalletProvider";
import { Link } from "wouter";
import { formatSOL, formatCurrency } from "@/utils/currency";
import { Receipt, CheckCircle, Clock, UserCheck, TrendingUp, Wallet, PlusCircle, Download, ArrowDownToLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FreelancerDashboard() {
  const { data: invoices } = useInvoices();
  const { data: transactions } = useTransactions();
  const { data: solanaPrice } = useSolanaPrice();
  const { connected, balance } = useWalletContext();
  
  // Count invoices by status
  const pendingPayments = invoices?.filter((invoice) => invoice.status === "pending").length || 0;
  const paidInvoices = invoices?.filter((invoice) => invoice.status === "paid").length || 0;
  
  // Calculate USD value
  const solValue = balance || 0;
  const usdValue = solValue * (solanaPrice?.price || 80);
  
  // Calculate total incoming payments
  const totalIncoming = invoices
    ?.filter(invoice => invoice.status === "pending")
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0) || 0;
    
  // Count clients (for demo purposes)
  const clientCount = 4;
  
  return (
    <Layout>
      {/* Enhanced Header with Wallet Status */}
      <DashboardHeader />
      
      {/* Freelancer Overview Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Freelancer Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={<Receipt />}
            iconColor="text-amber-500 dark:text-amber-400"
            iconBgColor="bg-amber-100 dark:bg-amber-900/30"
            title="Pending Payments"
            value={pendingPayments}
            footer={
              <div className="text-sm flex items-center">
                <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400 font-medium">{formatSOL(totalIncoming)}</span>
                <span className="ml-1">pending</span>
              </div>
            }
          />
          
          <StatCard
            icon={<UserCheck />}
            iconColor="text-indigo-500 dark:text-indigo-400"
            iconBgColor="bg-indigo-100 dark:bg-indigo-900/30"
            title="Active Clients"
            value={clientCount}
            footer={
              <div className="text-sm">
                <Link href="/clients" className="font-medium text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Manage clients
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
                <span>≈ </span>
                <span className="ml-1 font-medium">{formatCurrency(usdValue)}</span>
              </div>
            }
          />
          
          <StatCard
            icon={<CheckCircle />}
            iconColor="text-green-500 dark:text-green-400"
            iconBgColor="bg-green-100 dark:bg-green-900/30"
            title="Completed Jobs"
            value={paidInvoices}
            footer={
              <div className="text-sm">
                <Link href="/invoices?status=paid" className="font-medium text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Payment history
                </Link>
              </div>
            }
          />
        </div>
      </div>
      
      {/* Earnings Chart for Freelancer */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Earnings Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsChart />
        </CardContent>
      </Card>
      
      {/* Main Content - Freelancer View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Received Invoices</CardTitle>
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
                <Link href="/invoices/received">
                  View All Invoices
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Incoming Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionList />
            <div className="flex justify-center mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/payments/incoming">
                  View All Payments
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions Section Specific to Freelancers */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Freelancer Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-auto py-4 flex flex-col" asChild>
              <Link href="/invoices/create">
                <PlusCircle className="h-6 w-6 mb-2" />
                <span>Create Invoice</span>
              </Link>
            </Button>
            <Button className="h-auto py-4 flex flex-col" variant="outline" asChild>
              <Link href="/wallet/withdraw">
                <ArrowDownToLine className="h-6 w-6 mb-2" />
                <span>Withdraw Funds</span>
              </Link>
            </Button>
            <Button className="h-auto py-4 flex flex-col" variant="outline" asChild>
              <Link href="/clients/add">
                <UserCheck className="h-6 w-6 mb-2" />
                <span>Add Client</span>
              </Link>
            </Button>
            <Button className="h-auto py-4 flex flex-col" variant="outline" asChild>
              <Link href="/reports">
                <Download className="h-6 w-6 mb-2" />
                <span>Generate Reports</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}