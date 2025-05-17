import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";
import { Button } from "@/components/ui/button";
import { useInvoices, useInvoice } from "@/hooks/useInvoices";
import { Plus, File } from "lucide-react";
import { Link } from "wouter";

export default function Invoices() {
  const { data: invoices } = useInvoices();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const { data: selectedInvoice } = useInvoice(selectedInvoiceId || 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Handle opening the invoice detail modal
  const handleViewInvoice = (id: number) => {
    setSelectedInvoiceId(id);
    setIsModalOpen(true);
  };
  
  // Handle closing the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvoiceId(null);
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Invoices</h2>
        <Link href="/invoices/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>
      
      {/* Invoice management interface image */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6 overflow-hidden">
        <img 
          className="w-full h-48 object-cover" 
          src="https://images.unsplash.com/photo-1661956602153-23384936a1d3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80" 
          alt="Invoice management interface" 
        />
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Manage Your Invoices</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Create, track, and manage all your invoices in one place. Get paid faster with cryptocurrency payments.
          </p>
        </div>
      </div>
      
      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <File className="text-primary h-5 w-5" />
            <span className="font-medium">
              {invoices?.length || 0} Invoice{(invoices?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              All
            </Button>
            <Button variant="outline" size="sm">
              Pending
            </Button>
            <Button variant="outline" size="sm">
              Paid
            </Button>
            <Button variant="outline" size="sm">
              Overdue
            </Button>
          </div>
        </div>
      </div>
      
      {/* Invoices Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">All Invoices</h3>
        </div>
        <InvoiceTable />
      </div>
      
      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice || null}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </Layout>
  );
}
