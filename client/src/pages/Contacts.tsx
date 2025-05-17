import { Layout } from "@/components/layout/Layout";
import { ContactsList } from "@/components/contacts/ContactsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function Contacts() {
  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Contacts</h2>
      </div>

      {/* Contacts info banner */}
      <Card className="mb-6">
        <CardHeader className="pb-2 flex flex-row items-center space-x-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Manage Your Business Contacts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400">
            Create and manage contacts for your clients and vendors. Easily access wallet addresses and contact information when creating invoices.
          </p>
        </CardContent>
      </Card>

      {/* Contacts image banner */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6 overflow-hidden">
        <img 
          className="w-full h-48 object-cover" 
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80" 
          alt="Business contacts and networking" 
        />
      </div>

      {/* Contacts list */}
      <ContactsList />
    </Layout>
  );
}
