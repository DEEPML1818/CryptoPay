import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useWalletContext } from "./WalletProvider";
import { RoleSelector } from "@/components/onboarding/RoleSelector";

// Define user role type
export type UserRole = 'client' | 'freelancer' | null;

// Context interface
interface UserContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isRoleSet: boolean;
}

// Create context with default values
const UserContext = createContext<UserContextType>({
  role: null,
  setRole: () => {},
  isRoleSet: false
});

// Hook for components to use the user context
export const useUser = () => useContext(UserContext);

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const { connected, address } = useWalletContext();
  
  // Check if user has a saved role when wallet connects
  useEffect(() => {
    if (connected && address) {
      // Check localStorage for saved role
      const savedRole = localStorage.getItem(`cryptopayroll_role_${address}`);
      
      if (savedRole && (savedRole === 'client' || savedRole === 'freelancer')) {
        setRole(savedRole);
      } else {
        // No role set, show role selector
        setShowRoleSelector(true);
      }
    } else {
      // Wallet disconnected, reset role
      setRole(null);
      setShowRoleSelector(false);
    }
  }, [connected, address]);
  
  // Handle role selection completion
  const handleRoleSelected = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setShowRoleSelector(false);
  };
  
  // Check if a role is selected
  const isRoleSet = role !== null;
  
  return (
    <UserContext.Provider value={{ role, setRole, isRoleSet }}>
      {children}
      
      {/* Role selector modal */}
      {showRoleSelector && (
        <RoleSelector 
          open={showRoleSelector} 
          onComplete={handleRoleSelected} 
        />
      )}
    </UserContext.Provider>
  );
}