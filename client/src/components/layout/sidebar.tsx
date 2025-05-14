import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, FileText, DollarSign, Wallet, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigateTo } from "@/lib/navigation";

export default function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when changing routes on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ["/api/me"],
  });

  // Define user type for TypeScript
  interface User {
    username: string;
    email: string;
    fullName: string;
  }

  const userData = user as User | undefined;

  const navLinks = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
    { href: "/invoices", label: "Invoices", icon: <FileText className="mr-3 h-5 w-5" /> },
    { href: "/payments", label: "Payments", icon: <DollarSign className="mr-3 h-5 w-5" /> },
    { href: "/wallets", label: "Wallets", icon: <Wallet className="mr-3 h-5 w-5" /> },
    { href: "/clients", label: "Clients", icon: <Users className="mr-3 h-5 w-5" /> },
    { href: "/solana", label: "Solana", icon: <Wallet className="mr-3 h-5 w-5" /> },
    { href: "/settings", label: "Settings", icon: <Settings className="mr-3 h-5 w-5" /> },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "sidebar fixed md:relative z-50 w-64 h-full bg-white dark:bg-sidebar-background border-r border-border flex flex-col",
        isOpen ? "open" : ""
      )}>
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="text-primary font-bold text-xl">CryptoPay</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul>
            {navLinks.map((link) => (
              <li key={link.href} className="mb-1 px-2">
                <div 
                  onClick={() => navigateTo(link.href)}
                  className={cn(
                    "sidebar-link flex items-center px-4 py-3 text-sm rounded-lg cursor-pointer",
                    location === link.href
                      ? "active"
                      : "text-foreground hover:bg-background dark:hover:bg-sidebar-accent"
                  )}>
                  {link.icon}
                  {link.label}
                </div>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="bg-background dark:bg-sidebar-accent rounded-xl p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Current Balance</p>
            <p className="text-lg font-semibold">$12,543.45</p>
            <div className="flex items-center mt-2 text-xs text-secondary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-3 h-3 mr-1 fill-current"
              >
                <path d="M16.24 7.76C15.07 6.59 13.54 6 12 6v6l-4.24 4.24c2.34 2.34 6.14 2.34 8.49 0a5.99 5.99 0 0 0-.01-8.48Z" />
              </svg>
              <span>+2.4% from last month</span>
            </div>
          </div>
        </div>
        
        {userData && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                <span className="font-medium text-sm">
                  {userData.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{userData.fullName}</p>
                <p className="text-xs text-muted-foreground">{userData.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile toggle button - returned for use in header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden text-foreground focus:outline-none"
        aria-label="Toggle menu"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 6h16M4 12h16M4 18h16" 
          />
        </svg>
      </button>
    </>
  );
}
