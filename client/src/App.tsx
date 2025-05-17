import { useState, useEffect } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { WalletProvider } from "@/providers/WalletProvider";
import { UserProvider } from "@/providers/UserProvider";
import { UserRoleProvider } from "./providers/UserRoleProvider";
import { useUserRole } from "./hooks/useUserRole";
import { RoleSelectionDialog } from "@/components/onboarding/RoleSelectionDialog";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import ClientDashboard from "@/pages/ClientDashboard";
import FreelancerDashboard from "@/pages/FreelancerDashboard";
import Invoices from "@/pages/Invoices";
import InvoiceDetail from "@/pages/InvoiceDetail";
import CreateInvoice from "@/pages/CreateInvoice";
import Payments from "@/pages/Payments";
import SendPayment from "@/pages/SendPayment";
import Conversions from "@/pages/Conversions";
import TransactionHistory from "@/pages/TransactionHistory";
import CrossChainTransfer from "@/pages/CrossChainTransfer";
import Contacts from "@/pages/Contacts";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

// Home route that redirects based on user role
function HomeRoute() {
  const { userRole } = useUserRole();
  
  if (userRole === 'client') {
    return <ClientDashboard />;
  } else if (userRole === 'freelancer') {
    return <FreelancerDashboard />;
  } else {
    // If no role is set, show the default dashboard
    return <Dashboard />;
  }
}

// Role-based routing guard component
function RoleRoute({ component: Component, requiredRole }: { 
  component: React.ComponentType<any>, 
  requiredRole?: 'client' | 'freelancer' | 'any'
}) {
  const { userRole } = useUserRole();
  
  // If the route requires a specific role and the user doesn't have it, redirect to home
  if (requiredRole && requiredRole !== 'any' && userRole !== requiredRole) {
    // Redirect to home page
    return <Redirect to="/" />;
  }
  
  return <Component />;
}

function Router() {
  // Get current location to check if it's within the application's expected paths
  const [location] = useLocation();
  const isKnownPath = (path: string) => {
    const knownPaths = [
      '/', 
      '/client/dashboard', 
      '/client/invoices',
      '/freelancer/dashboard',
      '/freelancer/invoices/received',
      '/invoices',
      '/invoices/create',
      '/payments',
      '/payments/send',
      '/conversions',
      '/contacts',
      '/settings'
    ];
    
    // Also handle dynamic routes like /invoices/:id
    if (path.match(/^\/invoices\/\d+$/)) return true;
    
    return knownPaths.includes(path);
  };

  // If path is completely unknown, render the NotFound component directly
  if (!isKnownPath(location)) {
    return <NotFound />;
  }

  return (
    <AppLayout>
      <Switch>
        {/* Home route uses role-based redirection */}
        <Route path="/" component={HomeRoute} />
        
        {/* Client-specific routes */}
        <Route path="/client/dashboard">
          {() => <RoleRoute component={ClientDashboard} requiredRole="client" />}
        </Route>
        <Route path="/client/invoices">
          {() => <RoleRoute component={Invoices} requiredRole="client" />}
        </Route>
        
        {/* Freelancer-specific routes */}
        <Route path="/freelancer/dashboard">
          {() => <RoleRoute component={FreelancerDashboard} requiredRole="freelancer" />}
        </Route>
        <Route path="/freelancer/invoices/received">
          {() => <RoleRoute component={Invoices} requiredRole="freelancer" />}
        </Route>
        
        {/* Common routes accessible by any authenticated user */}
        <Route path="/invoices">
          {() => <RoleRoute component={Invoices} requiredRole="any" />}
        </Route>
        <Route path="/invoices/create">
          {() => <RoleRoute component={CreateInvoice} requiredRole="any" />}
        </Route>
        <Route path="/invoices/:id">
          {(params) => {
            const DetailWithParams = () => <InvoiceDetail id={params.id} />;
            return <RoleRoute component={DetailWithParams} requiredRole="any" />;
          }}
        </Route>
        <Route path="/payments">
          {() => <RoleRoute component={Payments} requiredRole="any" />}
        </Route>
        <Route path="/payments/send">
          {() => <RoleRoute component={SendPayment} requiredRole="any" />}
        </Route>
        <Route path="/conversions">
          {() => <RoleRoute component={Conversions} requiredRole="any" />}
        </Route>
        <Route path="/transactions">
          {() => <RoleRoute component={TransactionHistory} requiredRole="any" />}
        </Route>
        <Route path="/cross-chain">
          {() => <RoleRoute component={CrossChainTransfer} requiredRole="any" />}
        </Route>
        <Route path="/contacts">
          {() => <RoleRoute component={Contacts} requiredRole="any" />}
        </Route>
        <Route path="/settings">
          {() => <RoleRoute component={Settings} requiredRole="any" />}
        </Route>
        
        {/* Fallback route - catch all remaining routes */}
        <Route>
          {() => <NotFound />}
        </Route>
      </Switch>
    </AppLayout>
  );
}

function App() {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // Handle wallet connection/disconnection
  useEffect(() => {
    // Listen for wallet connection events
    const handleWalletConnect = (event: CustomEvent<{address: string}>) => {
      setWalletAddress(event.detail.address);
      
      // Check if user already has a role
      const savedRole = localStorage.getItem('userRole');
      if (!savedRole) {
        // If no role is saved, show the role selection modal
        setShowRoleModal(true);
      }
    };
    
    // Listen for wallet disconnect events
    const handleWalletDisconnect = () => {
      setWalletAddress(null);
      setShowRoleModal(false);
    };
    
    // Add event listeners
    window.addEventListener('wallet-connected' as any, handleWalletConnect as any);
    window.addEventListener('wallet-disconnected' as any, handleWalletDisconnect as any);
    
    // Check if wallet is already connected on mount
    const savedAddress = localStorage.getItem('solanaWalletAddress');
    if (savedAddress) {
      setWalletAddress(savedAddress);
      
      // Check if user already has a role
      const savedRole = localStorage.getItem('userRole');
      if (!savedRole) {
        // If wallet is connected but no role is set, show modal
        setShowRoleModal(true);
      }
    }
    
    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('wallet-connected' as any, handleWalletConnect as any);
      window.removeEventListener('wallet-disconnected' as any, handleWalletDisconnect as any);
    };
  }, []);
  
  // Handle role selection completion
  const handleRoleSelection = (selectedRole: string) => {
    setShowRoleModal(false);
    // Role is already saved in the hook
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WalletProvider>
          <UserProvider>
            <UserRoleProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
                
                {/* Role selection modal using our new component */}
                {walletAddress && showRoleModal && (
                  <RoleSelectionDialog 
                    open={showRoleModal} 
                    onComplete={() => setShowRoleModal(false)} 
                  />
                )}
              </TooltipProvider>
            </UserRoleProvider>
          </UserProvider>
        </WalletProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
