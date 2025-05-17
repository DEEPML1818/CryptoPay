import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';

interface RoleSelectionDialogProps {
  open: boolean;
  onComplete: () => void;
}

export function RoleSelectionDialog({ open, onComplete }: RoleSelectionDialogProps) {
  const [selectedRole, setSelectedRole] = React.useState<'client' | 'freelancer' | null>(null);
  const { setUserRole } = useUserRole();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast({
        title: "Please select a role",
        description: "You need to select a role to continue",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Save role to provider (which handles localStorage persistence)
      await setUserRole(selectedRole);
      
      toast({
        title: "Role selected",
        description: `You are now using CryptoPayRoll as a ${selectedRole === 'client' ? 'Client' : 'Freelancer'}`,
      });
      
      onComplete();
    } catch (error) {
      console.error('Error setting role:', error);
      toast({
        title: "Error",
        description: "Failed to set role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Welcome to CryptoPayRoll</DialogTitle>
          <DialogDescription>
            Choose how you want to use the platform. You can change this anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
          <Card 
            className={`cursor-pointer transition-all hover:border-blue-400 ${
              selectedRole === 'client' ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
            }`}
            onClick={() => setSelectedRole('client')}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium mb-1">Client</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Send payments and manage invoices
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all hover:border-purple-400 ${
              selectedRole === 'freelancer' ? 'ring-2 ring-purple-500 dark:ring-purple-400' : ''
            }`}
            onClick={() => setSelectedRole('freelancer')}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-medium mb-1">Freelancer</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Receive payments and track income
              </p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!selectedRole || isSubmitting}
            className={`w-full ${
              selectedRole === 'client'
                ? 'bg-blue-600 hover:bg-blue-700'
                : selectedRole === 'freelancer'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : ''
            }`}
          >
            {isSubmitting ? "Setting up..." : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}