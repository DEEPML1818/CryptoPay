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
import { File, CheckCircle, Clock, ArrowUpDown, TrendingUp, Wallet, Users, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ClientDashboard() {
  const { data: invoices } = useInvoices();
  const { data: transactions } = useTransactions();
  const { data: solanaPrice } = useSolanaPrice();
  const { connected, balance } = useWalletContext();
  
  // Count invoices by status
  const pendingInvoices = invoices?.filter((invoice) => invoice.status === "pending").length || 0;
  const paidInvoices = invoices?.filter((invoice) => invoice.status === "paid").length || 0;
  const overdueInvoices = invoices?.filter((invoice) => invoice.status === "overdue").length || 0;
  
  // Calculate USD value
  const solValue = balance || 0;
  const usdValue = solValue * (solanaPrice?.price || 80);
  
  // Calculate total outgoing payments
  const totalOutgoing = transactions
    ?.filter(tx => tx.transactionType === "payment" && tx.status === "success")
    .reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
    
  // Count freelancers (for demo purposes)
  const freelancerCount = 6;
  
  return (
    <Layout>
      {/* Enhanced Header with Wallet Status */}
      <DashboardHeader />
      
      {/* Business Overview Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Business Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={<Clock />}
            iconColor="text-amber-500 dark:text-amber-400"
            iconBgColor="bg-amber-100 dark:bg-amber-900/30"
            title="Pending Invoices"
            value={pendingInvoices}
            footer={
              <div className="text-sm">
                <Link href="/invoices?status=pending" className="font-medium text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  View pending
                </Link>
              </div>
            }
          />
          
          <StatCard
            icon={<Users />}
            iconColor="text-green-500 dark:text-green-400"
            iconBgColor="bg-green-100 dark:bg-green-900/30"
            title="Active Freelancers"
            value={freelancerCount}
            footer={
              <div className="text-sm">
                <Link href="/contacts" className="font-medium text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Manage freelancers
                </Link>
              </div>
            }
          />
          
          <StatCard
            icon={<Wallet />}
            iconColor="text-purple-500 dark:text-purple-400"
            iconBgColor="bg-purple-100 dark:bg-purple-900/30"
            title="SOL Balance from Wallet"
            value={formatSOL(balance || 0)}
            footer={
              <div className="text-sm flex items-center">
                <span>≈ </span>
                <span className="ml-1 font-medium">{formatCurrency(usdValue)}</span>
              </div>
            }
          />
          
          <StatCard
            icon={<ArrowUpDown />}
            iconColor="text-blue-500 dark:text-blue-400"
            iconBgColor="bg-blue-100 dark:bg-blue-900/30"
            title="Monthly Payments"
            value={formatSOL(totalOutgoing)}
            footer={
              <div className="text-sm">
                <Link href="/payments" className="font-medium text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Payment history
                </Link>
              </div>
            }
          />
        </div>
      </div>
      
      {/* Analytics Chart for Business */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Payment Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsChart />
        </CardContent>
      </Card>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Outgoing Invoices</CardTitle>
            <Link href="/invoices/create">
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                New Invoice
              </Button>
            </Link>
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
      
      {/* Quick Actions Section Specific to Business */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Business Actions</CardTitle>
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
              <Link href="/schedules/create">
                <Clock className="h-6 w-6 mb-2" />
                <span>Schedule Payment</span>
              </Link>
            </Button>
            <Button className="h-auto py-4 flex flex-col" variant="outline" asChild>
              <Link href="/contacts/add">
                <Users className="h-6 w-6 mb-2" />
                <span>Add Freelancer</span>
              </Link>
            </Button>
            <Button className="h-auto py-4 flex flex-col" variant="outline" asChild>
              <Link href="/wallet/deposit">
                <Wallet className="h-6 w-6 mb-2" />
                <span>Fund Wallet</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}