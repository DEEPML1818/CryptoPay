import { Invoice } from "@shared/schema";

export interface InvoiceTemplateOptions {
  showHeader: boolean;
  showFooter: boolean;
  showLogo: boolean;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

// Default template options
export const defaultTemplateOptions: InvoiceTemplateOptions = {
  showHeader: true,
  showFooter: true,
  showLogo: true,
  primaryColor: "#0052FF",
  secondaryColor: "#05B169",
  fontFamily: "Inter, sans-serif",
};

// Modern template options
export const modernTemplateOptions: InvoiceTemplateOptions = {
  showHeader: true,
  showFooter: true,
  showLogo: true,
  primaryColor: "#0052FF",
  secondaryColor: "#05B169",
  fontFamily: "Inter, sans-serif",
};

// Minimal template options
export const minimalTemplateOptions: InvoiceTemplateOptions = {
  showHeader: false,
  showFooter: false,
  showLogo: false,
  primaryColor: "#1E2026",
  secondaryColor: "#05B169",
  fontFamily: "Inter, sans-serif",
};

// Get template options based on template name
export const getTemplateOptions = (templateName: string): InvoiceTemplateOptions => {
  switch (templateName) {
    case "modern":
      return modernTemplateOptions;
    case "minimal":
      return minimalTemplateOptions;
    case "default":
    default:
      return defaultTemplateOptions;
  }
};

// Generate CSS styles for the invoice template
export const generateTemplateStyles = (options: InvoiceTemplateOptions): string => {
  return `
    .invoice-template {
      font-family: ${options.fontFamily};
      color: #1E2026;
    }
    
    .invoice-header {
      ${options.showHeader ? "display: block;" : "display: none;"}
      border-bottom: 1px solid #E6E8EB;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .invoice-footer {
      ${options.showFooter ? "display: block;" : "display: none;"}
      border-top: 1px solid #E6E8EB;
      padding-top: 1.5rem;
      margin-top: 2rem;
      font-size: 0.875rem;
      color: #6E7591;
    }
    
    .invoice-logo {
      ${options.showLogo ? "display: block;" : "display: none;"}
    }
    
    .invoice-title {
      color: ${options.primaryColor};
      font-weight: 700;
    }
    
    .invoice-table th {
      background-color: ${options.primaryColor}10;
      color: ${options.primaryColor};
    }
    
    .invoice-total {
      color: ${options.primaryColor};
      font-weight: 700;
    }
    
    .invoice-paid-stamp {
      border: 2px solid ${options.secondaryColor};
      color: ${options.secondaryColor};
    }
    
    .invoice-pending-stamp {
      border: 2px solid ${options.primaryColor};
      color: ${options.primaryColor};
    }
    
    .invoice-overdue-stamp {
      border: 2px solid #FFA726;
      color: #FFA726;
    }
  `;
};

// Format items for display in the invoice
export const formatInvoiceItems = (invoice: Invoice): any[] => {
  try {
    if (typeof invoice.items === 'string') {
      return JSON.parse(invoice.items);
    }
    return invoice.items as any[];
  } catch (error) {
    console.error("Error parsing invoice items:", error);
    return [];
  }
};

// Calculate invoice total
export const calculateInvoiceTotal = (items: any[]): number => {
  try {
    return items.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);
  } catch (error) {
    console.error("Error calculating invoice total:", error);
    return 0;
  }
};

// Format invoice for PDF generation
export interface FormattedInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  client: {
    name: string;
    email: string;
    address: string;
    company?: string;
  };
  company: {
    name: string;
    email: string;
    address: string;
  };
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  totalInCrypto?: {
    amount: string;
    currency: string;
  };
  notes?: string;
  status: string;
  paymentMethod: string;
}

export const formatInvoiceForPdf = (invoice: Invoice, client: any): FormattedInvoice => {
  const items = formatInvoiceItems(invoice);
  const total = calculateInvoiceTotal(items);
  
  return {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: new Date(invoice.createdAt).toLocaleDateString(),
    dueDate: new Date(invoice.dueDate).toLocaleDateString(),
    client: {
      name: client?.name || 'Unknown Client',
      email: client?.email || 'N/A',
      address: client?.address || 'N/A',
      company: client?.company
    },
    company: {
      name: 'Your Company',
      email: 'company@example.com',
      address: '123 Business St, City, Country'
    },
    items,
    subtotal: total,
    tax: 0, // Assuming no tax for simplicity
    total,
    totalInCrypto: invoice.cryptoAmount ? {
      amount: invoice.cryptoAmount,
      currency: invoice.cryptoType || 'BTC'
    } : undefined,
    notes: invoice.notes,
    status: invoice.status,
    paymentMethod: invoice.paymentMethod || 'CRYPTO'
  };
};
