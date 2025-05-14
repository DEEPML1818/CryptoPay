import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Info, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Progress } from '@/components/ui/progress';
import { useSolanaWallet } from '@/lib/solana-provider';
import { cn } from '@/lib/utils';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  requiresAction?: boolean;
}

// Define the tutorial steps
const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to Solana Invoicing',
    description: "This guide will walk you through how to use our Solana blockchain invoicing platform. You'll learn how to connect your wallet, create invoices, and manage payments on the Solana blockchain.",
    icon: <Info className="h-8 w-8" />,
    action: 'Next: Connecting Your Wallet',
  },
  {
    title: 'Connect Your Wallet',
    description: "To get started, you need to connect a Solana wallet like Phantom, Solflare, or Ledger. No wallet? Don't worry! Our platform provides a simulated wallet for testing purposes.",
    icon: <Wallet className="h-8 w-8" />,
    action: 'Connect Wallet',
    requiresAction: true,
  },
  {
    title: 'Create Your First Invoice',
    description: "With your wallet connected, you can now create blockchain invoices. These are special invoices that live on the Solana blockchain and can be paid instantly with cryptocurrency.",
    icon: <FileText className="h-8 w-8" />,
    action: 'Create Invoice',
    requiresAction: true,
  },
  {
    title: 'Security Best Practices',
    description: "Blockchain transactions are irreversible, so it's important to follow security best practices. Always verify addresses before sending funds, enable advanced security features, and keep your wallet details private.",
    icon: <CheckCircle2 className="h-8 w-8" />,
    action: 'Finish Tutorial',
  }
];

export default function OnboardingTutorial() {
  const solanaWallet = useSolanaWallet();
  const { isConnected, connect } = solanaWallet;
  
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isStepInProgress, setIsStepInProgress] = useState(false);
  
  // Calculate progress percentage
  const progress = Math.round(((currentStep + 1) / tutorialSteps.length) * 100);
  
  // Handle next step
  const handleNextStep = async () => {
    const currentStepData = tutorialSteps[currentStep];
    
    // If the current step requires an action
    if (currentStepData.requiresAction) {
      setIsStepInProgress(true);
      
      // Handle specific actions
      if (currentStep === 1) { // Connect wallet step
        if (!isConnected) {
          try {
            await connect();
            handleStepComplete();
          } catch (error) {
            toast.error('Failed to connect wallet. Using demo wallet instead.');
            setTimeout(() => handleStepComplete(), 1000);
          }
        } else {
          handleStepComplete();
        }
      } else if (currentStep === 2) { // Create invoice step
        // Show the create invoice tab
        toast.info('Please create an invoice in the Create Invoice tab');
        setIsStepInProgress(false);
        
        // For demo purposes, we'll automatically complete this step after a delay
        setTimeout(() => {
          handleStepComplete();
        }, 3000);
      }
    } else {
      handleStepComplete();
    }
  };
  
  // Mark current step as complete and move to next
  const handleStepComplete = () => {
    setIsStepInProgress(false);
    
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Tutorial complete
      toast.success('Onboarding complete! You can now use all features.');
      setIsOpen(false);
    }
  };
  
  // Skip the tutorial
  const skipTutorial = () => {
    toast.info('Tutorial skipped. You can restart it anytime from the help menu.');
    setIsOpen(false);
  };
  
  if (!isOpen) {
    return (
      <div className="flex justify-center mb-6">
        <Button 
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="text-sm"
        >
          <Info className="mr-2 h-4 w-4" />
          Restart Tutorial
        </Button>
      </div>
    );
  }
  
  const currentStepData = tutorialSteps[currentStep];
  
  return (
    <Card className="mb-6 border-2 border-primary/10">
      <div className="px-6 pt-6">
        <Progress value={progress} className="h-2 mb-5" />
        
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 rounded-full bg-primary/10 p-3 text-primary">
            {currentStepData.icon}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">{currentStepData.title}</h3>
            <p className="text-muted-foreground mb-4">
              {currentStepData.description}
            </p>
            
            {/* Tutorial progress indicators */}
            <div className="flex gap-2 mb-4">
              {tutorialSteps.map((_, index) => (
                <div 
                  key={index}
                  className={cn(
                    "w-8 h-1 rounded-full transition-colors",
                    currentStep === index 
                      ? "bg-primary" 
                      : completedSteps.includes(index)
                        ? "bg-green-500"
                        : "bg-gray-200"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <CardFooter className="justify-between bg-slate-50 mt-6 p-4">
        <Button 
          variant="ghost" 
          onClick={skipTutorial}
        >
          Skip Tutorial
        </Button>
        
        <Button 
          onClick={handleNextStep}
          disabled={isStepInProgress}
          className={currentStep === tutorialSteps.length - 1 ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {isStepInProgress ? (
            <>Loading...</>
          ) : (
            <>
              {currentStepData.action}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}