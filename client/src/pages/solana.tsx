import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { SolanaProvider } from '@/lib/solana-provider';
import WalletConnect from '@/components/solana/wallet-connect';
import CreateSolanaInvoice from '@/components/solana/create-invoice';
import ManageSolanaInvoices from '@/components/solana/manage-invoices';
import TransactionHistory from '@/components/solana/transaction-history';
import WalletSecurity from '@/components/solana/wallet-security';
import LiveCryptoPrices from '@/components/solana/live-crypto-prices';
import OnboardingTutorial from '@/components/solana/onboarding-tutorial';
import WalletSwitcher from '@/components/solana/wallet-switcher';

// Initialize live crypto service
import { liveCryptoService } from '@/lib/live-crypto-service';

export default function SolanaPage() {
  const [activeTab, setActiveTab] = useState('create');
  const [showTutorial, setShowTutorial] = useState(true);

  // Initialize live crypto service
  useEffect(() => {
    liveCryptoService.initialize();
  }, []);

  return (
    <SolanaProvider>
      <ToastContainer position="top-right" theme="colored" />
      
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Solana Blockchain</h1>
            <p className="text-muted-foreground">
              Complete cryptocurrency payment platform powered by Solana
            </p>
          </div>
        </div>

        {showTutorial && (
          <OnboardingTutorial />
        )}

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            This dApp connects to the Solana devnet. All transactions use real blockchain technology but with test tokens.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column - Wallet and Security */}
          <div className="space-y-8">
            <WalletConnect />
            <WalletSwitcher />
            <WalletSecurity />
          </div>

          {/* Middle and right columns - Tabs and content */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="create">Create Invoice</TabsTrigger>
                <TabsTrigger value="manage">Manage Invoices</TabsTrigger>
                <TabsTrigger value="history">Transaction History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="create" className="mt-0">
                <CreateSolanaInvoice />
              </TabsContent>
              
              <TabsContent value="manage" className="mt-0">
                <ManageSolanaInvoices />
              </TabsContent>
              
              <TabsContent value="history" className="mt-0">
                <TransactionHistory />
              </TabsContent>
            </Tabs>
            
            <LiveCryptoPrices />
          </div>
        </div>
      </div>
    </SolanaProvider>
  );
}