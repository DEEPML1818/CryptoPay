
import { Building, User } from "lucide-react";
import { navigateTo } from "@/lib/navigation";

export default function PortalSelect() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Welcome to CryptoPay</h1>
        <div className="flex gap-6">
          <div
            onClick={() => navigateTo("/client-dashboard")}
            className="p-8 border rounded-lg cursor-pointer hover:border-primary transition-colors"
          >
            <Building className="w-12 h-12 mb-4 mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Client Portal</h2>
            <p className="text-muted-foreground mt-2">Manage your freelancers and payments</p>
          </div>
          <div
            onClick={() => navigateTo("/freelancer-dashboard")}
            className="p-8 border rounded-lg cursor-pointer hover:border-primary transition-colors"
          >
            <User className="w-12 h-12 mb-4 mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Freelancer Portal</h2>
            <p className="text-muted-foreground mt-2">Track earnings and manage invoices</p>
          </div>
        </div>
      </div>
    </div>
  );
}
