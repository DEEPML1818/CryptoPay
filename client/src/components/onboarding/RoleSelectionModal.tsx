import { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Briefcase, Users } from 'lucide-react';

interface RoleSelectionModalProps {
  open: boolean;
  onComplete: (selectedRole: string) => void;
}

export function RoleSelectionModal({ open, onComplete }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const { setUserRole } = useUserRole();

  const handleRoleSelect = (role: 'client' | 'freelancer') => {
    setSelectedRole(role);
  };

  const handleConfirm = () => {
    if (selectedRole) {
      // Update user role in the app state and localStorage
      setUserRole(selectedRole as 'client' | 'freelancer');
      onComplete(selectedRole);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Choose Your Role</DialogTitle>
          <DialogDescription>
            Select how you'll primarily use CryptoPay. You can perform both roles, but your dashboard will be optimized for your primary role.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div 
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedRole === 'client' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
            }`}
            onClick={() => handleRoleSelect('client')}
          >
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-center font-medium mb-2">Business / Client</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Send payments, create invoices, and manage freelancers
            </p>
          </div>
          
          <div 
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedRole === 'freelancer' 
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
            }`}
            onClick={() => handleRoleSelect('freelancer')}
          >
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-center font-medium mb-2">Freelancer</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Receive payments, track invoices, and manage clients
            </p>
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <Button 
            onClick={handleConfirm}
            disabled={!selectedRole}
            className={`w-full sm:w-auto ${
              selectedRole === 'client' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : selectedRole === 'freelancer'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : ''
            }`}
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}