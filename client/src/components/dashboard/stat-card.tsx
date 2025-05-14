import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const iconVariants = cva(
  "w-10 h-10 rounded-lg flex items-center justify-center",
  {
    variants: {
      variant: {
        primary: "bg-primary/10 text-primary",
        secondary: "bg-secondary/10 text-secondary",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
      }
    },
    defaultVariants: {
      variant: "primary"
    }
  }
);

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    isPositive: boolean;
    label: string;
  };
  icon: React.ReactNode;
  variant?: "primary" | "secondary" | "warning" | "destructive";
  className?: string;
}

export default function StatCard({
  title,
  value,
  change,
  icon,
  variant = "primary",
  className
}: StatCardProps) {
  return (
    <div className={cn(
      "dashboard-card bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-border",
      className
    )}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className={iconVariants({ variant })}>
          {icon}
        </div>
      </div>
      
      {change && (
        <div className="flex items-center text-xs">
          <span className={cn(
            "font-medium flex items-center",
            change.isPositive ? "text-secondary" : "text-destructive"
          )}>
            {change.isPositive ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-3 h-3 mr-1 fill-current"
              >
                <path d="M16.24 7.76C15.07 6.59 13.54 6 12 6v6l-4.24 4.24c2.34 2.34 6.14 2.34 8.49 0a5.99 5.99 0 0 0-.01-8.48Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-3 h-3 mr-1 fill-current"
              >
                <path d="m16.24 16.24-4.24-4.24-4.24 4.24a5.99 5.99 0 0 1 0-8.49c2.34-2.34 6.14-2.34 8.49 0a5.99 5.99 0 0 1-.01 8.49Z" />
              </svg>
            )}
            {change.value}
          </span>
          <span className="text-muted-foreground ml-2">{change.label}</span>
        </div>
      )}
    </div>
  );
}
