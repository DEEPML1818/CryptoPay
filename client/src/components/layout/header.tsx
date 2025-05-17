import { useState } from "react";
import { Menu, Bell, Search, Briefcase, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { WalletButton } from "@/components/wallet/WalletButton";
import { RoleSwitcher } from "@/components/role/RoleSwitcher";
import { useUserRole, UserRole } from "@/hooks/useUserRole";

interface HeaderProps {
  toggleMobileSidebar: () => void;
}

export function Header({ toggleMobileSidebar }: HeaderProps) {
  const [location] = useLocation();
  const { userRole } = useUserRole();
  
  // Get title based on current path
  const getTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/invoices":
        return "Invoices";
      case "/payments":
        return "Payments";
      case "/conversions":
        return "Conversions";
      case "/contacts":
        return "Contacts";
      case "/settings":
        return "Settings";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden px-4 text-gray-500 dark:text-gray-400 focus:outline-none"
        onClick={toggleMobileSidebar}
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          {/* Page title */}
          <div className="flex items-center">
            <h1 className="text-lg font-semibold">{getTitle()}</h1>
            
            {/* Role indicator badge */}
            {userRole && (
              <Badge 
                variant="outline" 
                className={`ml-3 hidden md:flex items-center gap-1 ${
                  userRole === 'client' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' 
                    : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
                }`}
              >
                {userRole === 'client' ? (
                  <>
                    <Briefcase className="h-3 w-3" />
                    <span>Business</span>
                  </>
                ) : (
                  <>
                    <Users className="h-3 w-3" />
                    <span>Freelancer</span>
                  </>
                )}
              </Badge>
            )}
          </div>
          
          {/* Search bar */}
          <div className="hidden md:block ml-6 max-w-lg">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
              <Input 
                placeholder={userRole === 'client' 
                  ? "Search invoices, freelancers..." 
                  : "Search invoices, clients..."}
                className="w-64 pl-9 h-9 text-sm bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              />
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6 space-x-3">
          {/* Role Switcher - only shown when wallet is connected and role is selected */}
          {userRole && <RoleSwitcher />}
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>
          
          {/* Wallet connection */}
          <WalletButton 
            onConnect={(address) => {
              // When wallet connects, user will be prompted to select role
              console.log("Connected wallet:", address);
            }}
            onDisconnect={() => {
              console.log("Wallet disconnected");
            }}
          />
          
          {/* Profile avatar */}
          <div className="relative">
            <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
              <AvatarImage 
                src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                alt="User profile" 
              />
              <AvatarFallback>
                {userRole === 'client' ? 'CL' : userRole === 'freelancer' ? 'FR' : 'CPR'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  );
}
