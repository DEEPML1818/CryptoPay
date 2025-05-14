import { PlusCircle, Link as LinkIcon } from "lucide-react";
import { navigateTo } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonIcon: React.ReactNode;
  href: string;
  bgColor: string;
  className?: string;
}

export function ActionCard({
  title,
  description,
  buttonText,
  buttonIcon,
  href,
  bgColor,
  className,
}: ActionCardProps) {
  return (
    <div 
      className={cn(
        "dashboard-card bg-white dark:bg-card rounded-xl shadow-sm border border-border p-6 flex flex-col justify-between min-h-[180px] relative overflow-hidden",
        className
      )}
      style={{ 
        position: "relative",
      }}
    >
      <div className={cn(
        "absolute inset-0 opacity-75",
        bgColor
      )} />
      <div className="relative z-10">
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-white text-opacity-80 text-sm mb-4">{description}</p>
        <Button 
          onClick={() => navigateTo(href)}
          className="bg-white text-foreground hover:bg-slate-100 inline-flex items-center"
        >
          {buttonIcon}
          {buttonText}
        </Button>
      </div>
    </div>
  );
}

export default function InvoiceActionCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ActionCard 
        title="Create New Invoice"
        description="Generate professional invoices with cryptocurrency payment options."
        buttonText="Create Invoice"
        buttonIcon={<PlusCircle className="mr-2 h-4 w-4" />}
        href="/invoices/create"
        bgColor="bg-primary"
      />
      
      <ActionCard 
        title="Request Payment"
        description="Create a payment request link to share with your clients."
        buttonText="Create Request"
        buttonIcon={<LinkIcon className="mr-2 h-4 w-4" />}
        href="/payments/request"
        bgColor="bg-secondary"
      />
    </div>
  );
}
