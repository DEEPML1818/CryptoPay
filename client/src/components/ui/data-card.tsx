import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DataCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export default function DataCard({
  title,
  description,
  children,
  className,
  headerClassName,
  contentClassName,
}: DataCardProps) {
  return (
    <Card className={cn("dashboard-card border border-border shadow-sm", className)}>
      <CardHeader className={cn("pb-2", headerClassName)}>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={cn("", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
