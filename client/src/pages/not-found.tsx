import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft, Wallet, FileText, CreditCard, RefreshCw } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Separator } from "@/components/ui/separator";

export default function NotFound() {
  const [location] = useLocation();

  // Common navigation suggestions based on what page might have been intended
  const getSuggestedRoutes = () => {
    const path = location.toLowerCase();
    
    if (path.includes("chain") || path.includes("wormhole") || path.includes("bridge")) {
      return [
        { href: "/cross-chain", label: "Cross-Chain Bridge", icon: <RefreshCw className="h-4 w-4 mr-2" /> },
      ];
    }
    
    if (path.includes("invoice") || path.includes("bill")) {
      return [
        { href: "/invoices", label: "View Invoices", icon: <FileText className="h-4 w-4 mr-2" /> },
        { href: "/invoices/create", label: "Create Invoice", icon: <FileText className="h-4 w-4 mr-2" /> },
      ];
    }
    
    if (path.includes("pay") || path.includes("transaction")) {
      return [
        { href: "/payments", label: "Payments", icon: <CreditCard className="h-4 w-4 mr-2" /> },
        { href: "/transactions", label: "Transaction History", icon: <CreditCard className="h-4 w-4 mr-2" /> },
      ];
    }
    
    // Default suggestions
    return [
      { href: "/", label: "Dashboard", icon: <Home className="h-4 w-4 mr-2" /> },
      { href: "/settings", label: "Settings", icon: <Wallet className="h-4 w-4 mr-2" /> },
    ];
  };
  
  const suggestedRoutes = getSuggestedRoutes();

  return (
    <Layout>
      <div className="container max-w-md mx-auto py-12">
        <Card className="border-red-200 dark:border-red-900 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <AlertCircle className="h-10 w-10 text-red-500 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold">Page Not Found</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                We couldn't find the page you're looking for
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="text-center">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-md mb-6 font-mono text-sm overflow-hidden overflow-ellipsis">
              {location}
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              The page may have been moved or deleted, or there might be a typo in the URL.
            </p>
            
            {suggestedRoutes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Were you looking for one of these?</p>
                <div className="flex flex-col gap-2">
                  {suggestedRoutes.map((route, index) => (
                    <Button 
                      key={index} 
                      variant="ghost" 
                      asChild 
                      className="w-full justify-start"
                    >
                      <Link href={route.href}>
                        {route.icon}
                        {route.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          
          <Separator />
          
          <CardFooter className="flex justify-between pt-4">
            <Button variant="outline" asChild className="flex items-center">
              <a href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </a>
            </Button>
            
            <Button asChild className="flex items-center">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
