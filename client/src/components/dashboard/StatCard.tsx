import { ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  icon: ReactNode;
  iconColor: string;
  iconBgColor: string;
  title: string;
  value: string | number;
  footer?: ReactNode;
}

export function StatCard({ 
  icon, 
  iconColor, 
  iconBgColor, 
  title, 
  value, 
  footer 
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold mt-1">
              {value}
            </p>
            {footer && (
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {footer}
              </div>
            )}
          </div>
          
          <div 
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBgColor}`}
          >
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}