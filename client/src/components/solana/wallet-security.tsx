import { useState } from 'react';
import { useSolanaWallet } from '@/lib/solana-provider';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  ShieldCheck, 
  Lock, 
  Settings, 
  Key,
  Users,
  UserPlus,
  Fingerprint
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';

export default function WalletSecurity() {
  const solanaWallet = useSolanaWallet();
  const { isConnected, wallet } = solanaWallet;
  
  // Security settings states
  const [advancedSecurity, setAdvancedSecurity] = useState({
    twoFactorAuth: false,
    multisigEnabled: false,
    transactionLimit: true,
    delayedTransfers: false,
    biometricAuth: false
  });
  
  // Multisig management
  const [showMultisigDialog, setShowMultisigDialog] = useState(false);
  const [multisigCosigners, setMultisigCosigners] = useState<string[]>([
    'FG4fV9MFzKtPjNNjLYfgSx4q8QYyFRV7mTzXUwDe6RCY',
    'J2D4jxqoiMFfjKWzxcjQPZMgRB7tpuYGqUJsKFoEUDVV'
  ]);
  const [newCosigner, setNewCosigner] = useState('');
  
  // Handle security toggle changes
  const handleSecurityToggle = (setting: keyof typeof advancedSecurity) => {
    setAdvancedSecurity({
      ...advancedSecurity,
      [setting]: !advancedSecurity[setting]
    });
    
    toast.success(`${setting} has been ${advancedSecurity[setting] ? 'disabled' : 'enabled'}`);
  };
  
  // Add a new cosigner for multisig
  const addCosigner = () => {
    if (!newCosigner) {
      toast.error('Please enter a valid wallet address');
      return;
    }
    
    if (multisigCosigners.includes(newCosigner)) {
      toast.error('This wallet is already a cosigner');
      return;
    }
    
    setMultisigCosigners([...multisigCosigners, newCosigner]);
    setNewCosigner('');
    toast.success('New cosigner added to your multisig wallet');
  };
  
  // Remove a cosigner
  const removeCosigner = (address: string) => {
    setMultisigCosigners(multisigCosigners.filter(a => a !== address));
    toast.success('Cosigner removed from your multisig wallet');
  };
  
  // Helper to truncate addresses
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Enable multisig functionality
  const enableMultisig = () => {
    if (multisigCosigners.length < 2) {
      toast.error('You need at least 2 cosigners for multisig');
      return;
    }
    
    setAdvancedSecurity({
      ...advancedSecurity,
      multisigEnabled: true
    });
    
    setShowMultisigDialog(false);
    toast.success('Multisignature wallet configuration saved!');
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Security</CardTitle>
          <CardDescription>
            Connect your wallet to configure advanced security features
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-slate-50 rounded-lg p-8 text-center">
            <p className="text-muted-foreground mb-2">No wallet connected</p>
            <p className="text-sm text-muted-foreground">
              Please connect your Solana wallet to access security settings.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle>Wallet Security</CardTitle>
        </div>
        <CardDescription>
          Configure advanced security settings for your wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <Label htmlFor="two-factor" className="font-medium">Two-factor authentication</Label>
            </div>
            <Switch
              id="two-factor"
              checked={advancedSecurity.twoFactorAuth}
              onCheckedChange={() => handleSecurityToggle('twoFactorAuth')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <Label htmlFor="multisig" className="font-medium">Multisignature approval</Label>
            </div>
            <Dialog open={showMultisigDialog} onOpenChange={setShowMultisigDialog}>
              <DialogTrigger asChild>
                <Switch
                  id="multisig"
                  checked={advancedSecurity.multisigEnabled}
                  onCheckedChange={() => {
                    if (!advancedSecurity.multisigEnabled) {
                      setShowMultisigDialog(true);
                    } else {
                      handleSecurityToggle('multisigEnabled');
                    }
                  }}
                />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Multisig Configuration</DialogTitle>
                  <DialogDescription>
                    Add wallets that will need to approve your transactions
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <h4 className="text-sm font-medium mb-2">Current Cosigners ({multisigCosigners.length})</h4>
                  <div className="space-y-2 mb-4">
                    {multisigCosigners.map(address => (
                      <div key={address} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                        <span className="text-sm font-mono">{truncateAddress(address)}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeCosigner(address)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter wallet address" 
                      value={newCosigner}
                      onChange={(e) => setNewCosigner(e.target.value)}
                    />
                    <Button onClick={addCosigner}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowMultisigDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={enableMultisig}>
                    Save Configuration
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <Label htmlFor="limit" className="font-medium">Transaction limits</Label>
            </div>
            <Switch
              id="limit"
              checked={advancedSecurity.transactionLimit}
              onCheckedChange={() => handleSecurityToggle('transactionLimit')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <Label htmlFor="delayed" className="font-medium">Delayed transfers (24h)</Label>
            </div>
            <Switch
              id="delayed"
              checked={advancedSecurity.delayedTransfers}
              onCheckedChange={() => handleSecurityToggle('delayedTransfers')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-primary" />
              <Label htmlFor="biometric" className="font-medium">Biometric authentication</Label>
            </div>
            <Switch
              id="biometric"
              checked={advancedSecurity.biometricAuth}
              onCheckedChange={() => handleSecurityToggle('biometricAuth')}
            />
          </div>
        </div>
        
        {/* Security status summary */}
        <div className="rounded-lg bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm mb-1">Security Recommendation</h4>
            <p className="text-sm text-muted-foreground">
              Enable two-factor authentication and multisig approvals for maximum security. This adds additional protection against unauthorized transactions.
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button variant="default">
          Save Security Settings
        </Button>
      </CardFooter>
    </Card>
  );
}