import { useWalletContext } from "@/providers/WalletProvider";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import { formatSOL, formatCurrency } from "@/utils/currency";
import { useSolanaPrice } from "@/hooks/useInvoices";
import { Search, Bell, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function DashboardHeader() {
  const { connected, balance, address } = useWalletContext();
  const { data: solanaPrice } = useSolanaPrice();

  // Calculate USD value of balance
  const balanceUsd =
    connected && balance && solanaPrice ? balance * solanaPrice.price : 0;

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to CryptoPay
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Decentralized payroll & invoicing for your business
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search invoices..." className="w-64 pl-10" />
          </div>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>

          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex items-center gap-1"
            >
              <span>Demo User</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"></Card>
    </div>
  );
}
