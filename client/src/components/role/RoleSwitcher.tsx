import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Users } from 'lucide-react';
import { useLocation } from 'wouter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * A component that allows users to switch between client and freelancer roles
 */
export function RoleSwitcher() {
  const { userRole, setUserRole } = useUserRole();
  const { toast } = useToast();
  const [isChanging, setIsChanging] = useState(false);
  const [location, navigate] = useLocation();

  // Handle role change with navigation update
  const handleRoleChange = async () => {
    setIsChanging(true);
    try {
      // Toggle between client and freelancer
      const newRole: UserRole = userRole === 'client' ? 'freelancer' : 'client';
      await setUserRole(newRole);
      
      // Update navigation based on new role
      if (location.includes('/client/') && newRole === 'freelancer') {
        // Redirect from client-specific to freelancer equivalent
        const newPath = location.replace('/client/', '/freelancer/');
        navigate(newPath);
      } else if (location.includes('/freelancer/') && newRole === 'client') {
        // Redirect from freelancer-specific to client equivalent
        const newPath = location.replace('/freelancer/', '/client/');
        navigate(newPath);
      } else if (location === '/') {
        // Refresh dashboard to show role-specific dashboard
        navigate('/');
      }
      
      toast({
        title: "Role switched",
        description: `You are now in ${newRole === 'client' ? 'Client' : 'Freelancer'} mode`,
      });
    } catch (error) {
      console.error('Error switching role:', error);
      toast({
        title: "Error switching role",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsChanging(false);
    }
  };

  // If no role is selected yet, don't render the switcher
  if (!userRole) return null;

  const isClient = userRole === 'client';

  return (
    <div className="flex items-center gap-2 p-2 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${isClient ? 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' : 'text-gray-500'}`}>
                <Briefcase className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Client</span>
              </div>
              
              <Switch
                checked={userRole === 'freelancer'}
                onCheckedChange={handleRoleChange}
                disabled={isChanging}
                className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-blue-600"
              />
              
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${!isClient ? 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30' : 'text-gray-500'}`}>
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Freelancer</span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Switch between client and freelancer modes</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}