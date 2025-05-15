
import { formatInvoiceForPdf } from './invoice-templates';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const downloadInvoice = (invoice: any, client: any) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(20);
  doc.text('INVOICE', 105, 20, { align: 'center' });
  
  // Add invoice details
  doc.setFontSize(12);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 40);
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, 50);
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 20, 60);
  
  // Add client details
  doc.text('Bill To:', 20, 80);
  doc.setFontSize(11);
  doc.text(client.name, 20, 90);
  doc.text(client.address || '', 20, 100);
  
  // Add items table
  const items = JSON.parse(invoice.items);
  const tableData = items.map((item: any) => [
    item.description,
    item.quantity,
    `$${item.rate}`,
    `$${item.amount}`
  ]);
  
  doc.autoTable({
    startY: 120,
    head: [['Description', 'Quantity', 'Rate', 'Amount']],
    body: tableData,
  });
  
  // Add total
  const total = items.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
  doc.text(`Total: $${total.toFixed(2)}`, 150, doc.autoTable.previous.finalY + 20);
  
  // Save PDF
  doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
};
