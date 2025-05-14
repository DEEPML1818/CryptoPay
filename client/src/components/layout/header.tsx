import { Bell, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface HeaderProps {
  mobileMenuButton: React.ReactNode;
  title?: string;
}

export default function Header({ mobileMenuButton, title = "Dashboard" }: HeaderProps) {
  const [location] = useLocation();
  
  // Derive page title from location if not provided
  const pageTitle = title || location.split("/").filter(Boolean).map(
    segment => segment.charAt(0).toUpperCase() + segment.slice(1)
  ).join(" ") || "Dashboard";

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-background border-b border-border py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-primary font-bold text-xl">CryptoPay</span>
        </div>
        {mobileMenuButton}
      </div>

      {/* Desktop Header */}
      <header className="hidden md:flex justify-between items-center px-8 py-4 bg-white dark:bg-background border-b border-border">
        <div>
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">Welcome back!</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          
          <div className="relative">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5 text-foreground" />
            </Button>
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-warning"></span>
          </div>
        </div>
      </header>
    </>
  );
}
