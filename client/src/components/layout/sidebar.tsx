import { Link, useLocation } from "wouter";
import { useTheme } from "@/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  LayoutDashboard, 
  File, 
  CreditCard, 
  RefreshCw, 
  Users, 
  Settings,
  Moon,
  Sun,
  PlusCircle,
  Clock,
  History,
  UserCheck,
  Receipt,
  CircleDollarSign,
  Wallet,
  LineChart
} from "lucide-react";

interface SidebarProps {
  // No longer need userRole prop as we get it from the context
}

export function Sidebar({}: SidebarProps) {
  const { userRole } = useUserRole();
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const isActive = (path: string) => location === path;
  
  // Common navigation items for all users
  const commonNavItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard className="mr-3 h-4 w-4" /> },
    { path: "/settings", label: "Settings", icon: <Settings className="mr-3 h-4 w-4" /> },
  ];
  
  // Navigation items specific to clients (businesses)
  const clientNavItems = [
    { path: "/invoices/create", label: "Create Invoice", icon: <PlusCircle className="mr-3 h-4 w-4" /> },
    { path: "/invoices", label: "Manage Invoices", icon: <File className="mr-3 h-4 w-4" /> },
    { path: "/payments", label: "Payments", icon: <CreditCard className="mr-3 h-4 w-4" /> },
    { path: "/payments/send", label: "Send Payment", icon: <CircleDollarSign className="mr-3 h-4 w-4" /> },
    { path: "/transactions", label: "Transaction History", icon: <History className="mr-3 h-4 w-4" /> },
    { path: "/contacts", label: "Freelancers", icon: <Users className="mr-3 h-4 w-4" /> },
    { path: "/conversions", label: "Currency Exchange", icon: <RefreshCw className="mr-3 h-4 w-4" /> },
  ];
  
  // Navigation items specific to freelancers
  const freelancerNavItems = [
    { path: "/invoices", label: "All Invoices", icon: <Receipt className="mr-3 h-4 w-4" /> },
    { path: "/invoices/create", label: "Create Invoice", icon: <PlusCircle className="mr-3 h-4 w-4" /> },
    { path: "/payments", label: "Payments", icon: <CreditCard className="mr-3 h-4 w-4" /> },
    { path: "/transactions", label: "Transaction History", icon: <History className="mr-3 h-4 w-4" /> },
    { path: "/contacts", label: "My Clients", icon: <UserCheck className="mr-3 h-4 w-4" /> },
    { path: "/conversions", label: "Currency Exchange", icon: <RefreshCw className="mr-3 h-4 w-4" /> },
  ];
  
  // Select navigation items based on user role - these are default items if no role is selected yet
  let navItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard className="mr-3 h-4 w-4" /> },
    { path: "/invoices", label: "Invoices", icon: <File className="mr-3 h-4 w-4" /> },
    { path: "/invoices/create", label: "Create Invoice", icon: <PlusCircle className="mr-3 h-4 w-4" /> },
    { path: "/payments", label: "Payments", icon: <CreditCard className="mr-3 h-4 w-4" /> },
    { path: "/payments/send", label: "Send Payment", icon: <CircleDollarSign className="mr-3 h-4 w-4" /> },
    { path: "/conversions", label: "Conversions", icon: <RefreshCw className="mr-3 h-4 w-4" /> },
    { path: "/contacts", label: "Contacts", icon: <Users className="mr-3 h-4 w-4" /> },
    { path: "/settings", label: "Settings", icon: <Settings className="mr-3 h-4 w-4" /> },
  ];
  
  // Update navigation based on role if defined
  if (userRole === 'client') {
    navItems = [...commonNavItems, ...clientNavItems];
  } else if (userRole === 'freelancer') {
    navItems = [...commonNavItems, ...freelancerNavItems];
  }

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <div className="flex items-center">
              <div className="bg-accent rounded-lg p-2 mr-2">
                <div className="text-white">
                  <CreditCard />
                </div>
              </div>
              <span className="text-xl font-bold text-primary dark:text-white">CryptoPay</span>
            </div>
          </div>
          
          <nav className="mt-5 flex-1 px-2 space-y-2">
            {navItems.map((item) => (
              <div key={item.path}>
                <Link href={item.path}>
                  <div
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                      isActive(item.path)
                        ? "bg-primary text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </div>
                </Link>
              </div>
            ))}
          </nav>
        </div>
        
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
        </div>
      </div>
    </div>
  );
}
