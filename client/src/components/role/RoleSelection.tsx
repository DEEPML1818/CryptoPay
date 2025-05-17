import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useWalletContext } from '@/providers/WalletProvider';

interface RoleSelectionProps {
  onRoleSelected: (role: 'client' | 'freelancer') => void;
}

export function RoleSelection({ onRoleSelected }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<'client' | 'freelancer' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { address } = useWalletContext();

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast({
        title: "Role Required",
        description: "Please select a role to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save role to backend
      await apiRequest('/api/users/role', 'POST', {
        role: selectedRole,
        walletAddress: address
      });

      toast({
        title: "Role Selected",
        description: `You've been registered as a ${selectedRole === 'client' ? 'Client' : 'Freelancer'}.`,
      });

      // Notify parent component
      onRoleSelected(selectedRole);
    } catch (error) {
      console.error('Error setting user role:', error);
      toast({
        title: "Error",
        description: "Failed to set user role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome to CryptoPay</CardTitle>
        <CardDescription>
          Select your role to personalize your dashboard and experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Option */}
          <div 
            className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md
              ${selectedRole === 'client' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'hover:border-gray-300'}`}
            onClick={() => setSelectedRole('client')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Business / Client</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create invoices, manage payroll, and send payments to freelancers
              </p>
              <ul className="mt-4 text-sm text-left space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Create and manage invoices</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Schedule automatic payments</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Track expenses and payments</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Freelancer Option */}
          <div 
            className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md
              ${selectedRole === 'freelancer' 
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                : 'hover:border-gray-300'}`}
            onClick={() => setSelectedRole('freelancer')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Freelancer</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive payments, track income, and manage client relationships
              </p>
              <ul className="mt-4 text-sm text-left space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Generate professional invoices</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Receive crypto payments securely</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Track payment status and history</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          size="lg"
          disabled={!selectedRole || isSubmitting}
          onClick={handleRoleSelection}
        >
          {isSubmitting 
            ? "Setting up your account..." 
            : `Continue as ${selectedRole === 'client' ? 'Client' : selectedRole === 'freelancer' ? 'Freelancer' : 'Selected Role'}`
          }
        </Button>
      </CardFooter>
    </Card>
  );
}