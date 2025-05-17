import { Layout } from "@/components/layout/Layout";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "wouter";

export default function CreateInvoice() {
  return (
    <Layout>
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </Link>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Create New Invoice</h2>
      </div>

      {/* Invoice creation banner */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6 overflow-hidden">
        <div className="flex items-center p-6 bg-primary/10">
          <FileText className="w-10 h-10 text-primary mr-4" />
          <div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">New Invoice</h3>
            <p className="text-gray-500 dark:text-gray-400">Create an invoice to send to your clients</p>
          </div>
        </div>
      </div>

      {/* Invoice image banner */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6 overflow-hidden">
        <img 
          className="w-full h-48 object-cover" 
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80" 
          alt="Invoice management interface" 
        />
      </div>

      {/* Invoice Form */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm />
        </CardContent>
      </Card>
    </Layout>
  );
}
