import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWalletContext } from '@/providers/WalletProvider';
import { apiRequest } from '@/lib/queryClient';

interface OnboardingModalProps {
  open: boolean;
  onComplete: (role: string) => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [selectedRole, setSelectedRole] = useState<'client' | 'freelancer' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { address, connected } = useWalletContext();
  
  // Reset selected role when modal opens
  useEffect(() => {
    if (open) {
      setSelectedRole(null);
    }
  }, [open]);
  
  const handleSubmit = async () => {
    if (!selectedRole) {
      toast({
        title: "Please select a role",
        description: "You need to select a role to continue.",
        variant: "destructive"
      });
      return;
    }
    
    if (!connected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // For now, we'll store the role in localStorage while the API is being developed
      localStorage.setItem(`cryptopayroll_role_${address}`, selectedRole);
      
      toast({
        title: "Welcome to CryptoPayRoll!",
        description: `Your account is set up as a ${selectedRole === 'client' ? 'Client' : 'Freelancer'}.`,
      });
      
      // Notify parent component
      onComplete(selectedRole);
      
      // Later, we'll add API integration:
      /*
      const response = await apiRequest('/api/users/role', 'POST', {
        role: selectedRole,
        walletAddress: address
      });
      */
    } catch (error) {
      console.error('Error setting role:', error);
      toast({
        title: "Something went wrong",
        description: "We couldn't save your role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to CryptoPayRoll</DialogTitle>
          <DialogDescription>
            To personalize your experience, please select how you'll be using the platform
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedRole === 'client' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedRole('client')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium mb-2">Client / Business</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create invoices and make payments to freelancers
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedRole === 'freelancer' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedRole('freelancer')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-medium mb-2">Freelancer</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive payments and track your income
              </p>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!selectedRole || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Setting up your account...' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}