import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useUserRole } from "@/hooks/useUserRole";
import { useWalletContext } from "@/providers/WalletProvider"; 
import { useToast } from "@/hooks/use-toast";
import { 
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { connected, address } = useWalletContext();
  const { userRole, setUserRole } = useUserRole();
  const needsOnboarding = connected && !userRole;
  const { toast } = useToast();
  
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };
  
  // Handle role selection completion
  const handleRoleSelected = (selectedRole: string) => {
    setUserRole(selectedRole as 'client' | 'freelancer');
    
    toast({
      title: "Welcome to CryptoPay!",
      description: `Your dashboard is now personalized for ${selectedRole === 'client' ? 'managing client payments' : 'receiving freelancer payments'}.`,
    });
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar userRole={userRole} />
      
      {/* Mobile Sidebar */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0">
          <Sidebar userRole={userRole} />
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header 
          toggleMobileSidebar={toggleMobileSidebar} 
          userRole={userRole}
        />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      {/* Role selection modal for onboarding */}
      {connected && needsOnboarding && (
        <OnboardingModal 
          open={needsOnboarding}
          onComplete={handleRoleSelected}
        />
      )}
    </div>
  );
}
