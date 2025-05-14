import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Smartphone, Code, Shield, Radio } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useSolanaWallet } from '@/lib/solana-provider';

export default function WalletSwitcher() {
  const solanaWallet = useSolanaWallet();
  const { wallet, disconnect, connect } = solanaWallet;
  const [activeWalletType, setActiveWalletType] = useState<'simulated' | 'real'>(
    // Determine if the current wallet is real or simulated
    wallet.address?.startsWith('Fake') ? 'simulated' : 'real'
  );
  
  // Switch between real and simulated wallets
  const handleWalletTypeChange = async (type: 'simulated' | 'real') => {
    if (type === activeWalletType) return;
    
    // Disconnect current wallet
    disconnect();
    
    // Short delay to simulate disconnection/connection process
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Connect to new wallet type
    try {
      // The real wallet connection is handled by the provider
      // Here we just need to show appropriate UI feedback
      connect();
      
      setActiveWalletType(type);
      toast.success(`Switched to ${type} wallet`);
    } catch (error) {
      console.error('Error switching wallet type:', error);
      toast.error('Failed to switch wallet type');
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Mode</CardTitle>
        <CardDescription>
          Switch between real and simulated Solana wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Tabs 
            value={activeWalletType} 
            onValueChange={(value) => handleWalletTypeChange(value as 'simulated' | 'real')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="real" className="relative">
                <div className="absolute right-2 top-1 w-2 h-2 rounded-full bg-green-500" />
                Real Wallet
              </TabsTrigger>
              <TabsTrigger value="simulated">Simulated</TabsTrigger>
            </TabsList>
            
            <TabsContent value="real" className="mt-4 space-y-4">
              <div className="bg-blue-50 p-4 rounded-md flex gap-3">
                <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm mb-1">Production Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Connected to an actual blockchain wallet. All transactions will be real and executed on the Solana devnet.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="devnet" defaultChecked />
                <Label htmlFor="devnet">Using Solana Devnet</Label>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={() => window.open('https://phantom.app/', '_blank')}
              >
                <Smartphone className="h-4 w-4" />
                Install Phantom Wallet
              </Button>
            </TabsContent>
            
            <TabsContent value="simulated" className="mt-4 space-y-4">
              <div className="bg-amber-50 p-4 rounded-md flex gap-3">
                <Radio className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm mb-1">Simulation Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Using a simulated wallet for testing and learning. No real transaction will occur, perfect for exploring the platform.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="developer" />
                <Label htmlFor="developer">Developer Debug Mode</Label>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={() => toast.info('Debug panel is only available in developer mode')}
              >
                <Code className="h-4 w-4" />
                Open Debug Console
              </Button>
            </TabsContent>
          </Tabs>
          
          <div className="text-xs text-center text-muted-foreground">
            Current Address: <span className="font-mono">{wallet.address.substring(0, 10)}...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}