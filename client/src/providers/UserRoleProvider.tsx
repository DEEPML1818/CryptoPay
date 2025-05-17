import { useState, useEffect, createContext, useContext } from 'react';
import { apiRequest } from '../lib/queryClient';

export type UserRole = 'client' | 'freelancer' | null;

interface UserRoleContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
}

const UserRoleContext = createContext<UserRoleContextType>({
  userRole: null,
  setUserRole: () => {},
});

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRoleState] = useState<UserRole>(null);
  
  // Load user role from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') as UserRole;
    if (savedRole) {
      setUserRoleState(savedRole);
    }
  }, []);
  
  // Set user role and save to localStorage and backend
  const setUserRole = async (role: UserRole) => {
    if (role) {
      // Save to localStorage for persistence
      localStorage.setItem('userRole', role);
      
      // Save wallet-specific role preference
      const walletAddress = localStorage.getItem('solanaWalletAddress');
      if (walletAddress) {
        localStorage.setItem(`cryptopayroll_role_${walletAddress}`, role);
      }
      
      // Also save to backend when API is available
      try {
        if (walletAddress) {
          // When API is available, we would call:
          // await apiRequest('/api/users/role', 'POST', { role, walletAddress });
          console.log('User role saved for wallet:', walletAddress, role);
          
          // Dispatch a custom event that components can listen for
          const roleChangedEvent = new CustomEvent('user-role-changed', {
            detail: { role, previousRole: userRole }
          });
          window.dispatchEvent(roleChangedEvent);
        }
      } catch (error) {
        console.error('Error saving user role to backend:', error);
        // Continue even if backend save fails - we'll have the localStorage backup
      }
    } else {
      // If role is null, remove from localStorage
      localStorage.removeItem('userRole');
      
      const walletAddress = localStorage.getItem('solanaWalletAddress');
      if (walletAddress) {
        localStorage.removeItem(`cryptopayroll_role_${walletAddress}`);
      }
    }
    
    // Update state
    setUserRoleState(role);
  };
  
  return (
    <UserRoleContext.Provider value={{ userRole, setUserRole }}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  return useContext(UserRoleContext);
}