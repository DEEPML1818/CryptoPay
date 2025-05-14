import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Invoices from "@/pages/invoices";
import CreateInvoice from "@/pages/invoices/create";
import ViewInvoice from "@/pages/invoices/view";
import Payments from "@/pages/payments";
import RequestPayment from "@/pages/payments/request";
import Wallets from "@/pages/wallets";
import Clients from "@/pages/clients";
import Settings from "@/pages/settings";
import Solana from "@/pages/solana";
import AppLayout from "@/components/layout/app-layout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/invoices/create" component={CreateInvoice} />
      <Route path="/invoices/:id">
        {(params) => <ViewInvoice id={params.id} />}
      </Route>
      <Route path="/payments" component={Payments} />
      <Route path="/payments/request" component={RequestPayment} />
      <Route path="/wallets" component={Wallets} />
      <Route path="/clients" component={Clients} />
      <Route path="/solana" component={Solana} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppLayout>
            <Router />
          </AppLayout>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
