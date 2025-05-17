import { useState } from 'react';
import { useWalletContext } from '@/providers/WalletProvider';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Briefcase, Users } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface RoleSelectorProps {
  open: boolean;
  onComplete: (role: 'client' | 'freelancer') => void;
}

export function RoleSelector({ open, onComplete }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<'client' | 'freelancer'>('client');
  const { address } = useWalletContext();
  const { toast } = useToast();
  
  const handleContinue = () => {
    // Save role selection in localStorage for persistence
    if (address) {
      localStorage.setItem(`cryptopay_role_${address}`, selectedRole);
      
      toast({
        title: "Role selected!",
        description: `You've selected the ${selectedRole === 'client' ? 'Client' : 'Freelancer'} role.`,
      });
      
      onComplete(selectedRole);
    } else {
      toast({
        title: "No wallet connected",
        description: "Please connect your wallet before selecting a role.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to CryptoPay</DialogTitle>
          <DialogDescription>
            Select your role to personalize your experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as 'client' | 'freelancer')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`border rounded-lg p-4 ${selectedRole === 'client' ? 'border-primary bg-primary/5' : 'hover:border-gray-400'} cursor-pointer transition-colors`}
                   onClick={() => setSelectedRole('client')}>
                <RadioGroupItem value="client" id="client" className="sr-only" />
                <div className="flex flex-col items-center text-center py-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 h-12 w-12 rounded-full flex items-center justify-center mb-3">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <Label htmlFor="client" className="text-lg font-medium mb-2">Client / Business</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Create invoices, manage payroll, and track payments to freelancers
                  </p>
                </div>
              </div>
              
              <div className={`border rounded-lg p-4 ${selectedRole === 'freelancer' ? 'border-primary bg-primary/5' : 'hover:border-gray-400'} cursor-pointer transition-colors`}
                   onClick={() => setSelectedRole('freelancer')}>
                <RadioGroupItem value="freelancer" id="freelancer" className="sr-only" />
                <div className="flex flex-col items-center text-center py-4">
                  <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 h-12 w-12 rounded-full flex items-center justify-center mb-3">
                    <Users className="h-6 w-6" />
                  </div>
                  <Label htmlFor="freelancer" className="text-lg font-medium mb-2">Freelancer</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive invoices, track incoming payments, and manage your clients
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
          
          <div className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
            <p>You can change your role later in the settings</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={handleContinue} className="w-full">
            Continue as {selectedRole === 'client' ? 'Client' : 'Freelancer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}