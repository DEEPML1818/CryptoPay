import Keyv from 'keyv';
import { Invoice, Transaction, insertInvoiceSchema } from '@shared/schema';
import SqliteStore from '@keyv/sqlite';

// Initialize Keyv with SQLite for persistent storage (our Walrus-like store)
const walrusStore = new Keyv({
  store: new SqliteStore({
    uri: 'sqlite://walrus.sqlite',
    table: 'walrus_store'
  }),
  namespace: 'invoices'
});

// Transaction history store
const txStore = new Keyv({
  store: new SqliteStore({
    uri: 'sqlite://walrus.sqlite',
    table: 'walrus_store'
  }),
  namespace: 'transactions'
});

// Error handling
walrusStore.on('error', err => console.error('Walrus Storage Error:', err));
txStore.on('error', err => console.error('Transaction Storage Error:', err));

export interface WalrusStorage {
  // Invoice operations
  saveInvoice(invoice: Invoice): Promise<Invoice>;
  getInvoice(id: number): Promise<Invoice | null>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null>;
  updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | null>;
  listInvoices(filters?: { creatorId?: number, status?: string }): Promise<Invoice[]>;
  
  // Transaction operations
  saveTransaction(transaction: Transaction): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | null>;
  listTransactions(userId?: number): Promise<Transaction[]>;
  
  // Cross-chain transaction operations
  saveWormholeTransaction(txData: any): Promise<any>;
  getWormholeTransaction(txId: string): Promise<any | null>;
  listWormholeTransactions(userId?: number): Promise<any[]>;
}

class WalrusStorageImpl implements WalrusStorage {
  // Invoice operations
  async saveInvoice(invoice: Invoice): Promise<Invoice> {
    // Generate keys based on invoice properties
    const invoiceKey = `invoice:${invoice.id}`;
    const invoiceByNumberKey = `invoice:number:${invoice.invoiceNumber}`;
    
    // Store invoice data with multiple keys for lookups
    await walrusStore.set(invoiceKey, invoice);
    await walrusStore.set(invoiceByNumberKey, invoice.id);
    
    // Also index by creator ID
    const creatorKey = `invoice:creator:${invoice.creatorId}`;
    const creatorInvoices = await walrusStore.get(creatorKey) || [];
    if (!creatorInvoices.includes(invoice.id)) {
      creatorInvoices.push(invoice.id);
      await walrusStore.set(creatorKey, creatorInvoices);
    }
    
    // Also index by status
    const statusKey = `invoice:status:${invoice.status}`;
    const statusInvoices = await walrusStore.get(statusKey) || [];
    if (!statusInvoices.includes(invoice.id)) {
      statusInvoices.push(invoice.id);
      await walrusStore.set(statusKey, statusInvoices);
    }
    
    return invoice;
  }
  
  async getInvoice(id: number): Promise<Invoice | null> {
    const key = `invoice:${id}`;
    return await walrusStore.get(key) || null;
  }
  
  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    const lookupKey = `invoice:number:${invoiceNumber}`;
    const invoiceId = await walrusStore.get(lookupKey);
    
    if (!invoiceId) {
      return null;
    }
    
    return this.getInvoice(invoiceId);
  }
  
  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | null> {
    const invoice = await this.getInvoice(id);
    
    if (!invoice) {
      return null;
    }
    
    // If status is changing, update status index
    if (updates.status && updates.status !== invoice.status) {
      // Remove from old status index
      const oldStatusKey = `invoice:status:${invoice.status}`;
      const oldStatusInvoices = await walrusStore.get(oldStatusKey) || [];
      const filteredOldStatusInvoices = oldStatusInvoices.filter((invId: number) => invId !== id);
      await walrusStore.set(oldStatusKey, filteredOldStatusInvoices);
      
      // Add to new status index
      const newStatusKey = `invoice:status:${updates.status}`;
      const newStatusInvoices = await walrusStore.get(newStatusKey) || [];
      if (!newStatusInvoices.includes(id)) {
        newStatusInvoices.push(id);
        await walrusStore.set(newStatusKey, newStatusInvoices);
      }
    }
    
    // Update the invoice
    const updatedInvoice = { ...invoice, ...updates, updatedAt: new Date() };
    await walrusStore.set(`invoice:${id}`, updatedInvoice);
    
    // If invoice number changed, update that index too
    if (updates.invoiceNumber && updates.invoiceNumber !== invoice.invoiceNumber) {
      // Remove old invoice number reference
      await walrusStore.delete(`invoice:number:${invoice.invoiceNumber}`);
      
      // Add new invoice number reference
      await walrusStore.set(`invoice:number:${updates.invoiceNumber}`, id);
    }
    
    return updatedInvoice;
  }
  
  async listInvoices(filters?: { creatorId?: number; status?: string }): Promise<Invoice[]> {
    let invoiceIds: number[] = [];
    
    // If we have filters, use the appropriate index
    if (filters) {
      if (filters.creatorId) {
        const creatorKey = `invoice:creator:${filters.creatorId}`;
        invoiceIds = await walrusStore.get(creatorKey) || [];
      } else if (filters.status) {
        const statusKey = `invoice:status:${filters.status}`;
        invoiceIds = await walrusStore.get(statusKey) || [];
      }
    } else {
      // Without filters, we need to scan for all invoice IDs
      // This isn't efficient but works for demonstration
      // In a real app, you'd maintain an "all invoices" index
      const allKeys = await walrusStore.keys();
      const idKeys = allKeys.filter((key: string) => key.startsWith('invoice:') && 
                                 !key.includes(':number:') && 
                                 !key.includes(':creator:') && 
                                 !key.includes(':status:'));
      
      invoiceIds = idKeys.map((key: string) => parseInt(key.split(':')[1]));
    }
    
    // Fetch all invoices by ID
    const invoices: Invoice[] = [];
    for (const id of invoiceIds) {
      const invoice = await this.getInvoice(id);
      if (invoice) {
        invoices.push(invoice);
      }
    }
    
    // Apply any additional filtering
    let filteredInvoices = invoices;
    
    if (filters) {
      if (filters.creatorId) {
        filteredInvoices = filteredInvoices.filter(inv => inv.creatorId === filters.creatorId);
      }
      if (filters.status) {
        filteredInvoices = filteredInvoices.filter(inv => inv.status === filters.status);
      }
    }
    
    return filteredInvoices;
  }
  
  // Transaction operations
  async saveTransaction(transaction: Transaction): Promise<Transaction> {
    const txKey = `tx:${transaction.id}`;
    await txStore.set(txKey, transaction);
    
    // Index by user ID for faster lookups
    if (transaction.userId) {
      const userTxKey = `tx:user:${transaction.userId}`;
      const userTxs = await txStore.get(userTxKey) || [];
      if (!userTxs.includes(transaction.id)) {
        userTxs.push(transaction.id);
        await txStore.set(userTxKey, userTxs);
      }
    }
    
    return transaction;
  }
  
  async getTransaction(id: number): Promise<Transaction | null> {
    const key = `tx:${id}`;
    return await txStore.get(key) || null;
  }
  
  async listTransactions(userId?: number): Promise<Transaction[]> {
    if (userId) {
      // Get transactions for a specific user
      const userTxKey = `tx:user:${userId}`;
      const txIds = await txStore.get(userTxKey) || [];
      
      const transactions: Transaction[] = [];
      for (const id of txIds) {
        const tx = await this.getTransaction(id);
        if (tx) {
          transactions.push(tx);
        }
      }
      
      return transactions;
    } else {
      // Get all transactions
      const allKeys = await txStore.keys();
      const txKeys = allKeys.filter((key: string) => key.startsWith('tx:') && !key.includes(':user:'));
      
      const transactions: Transaction[] = [];
      for (const key of txKeys) {
        const tx = await txStore.get(key);
        if (tx) {
          transactions.push(tx);
        }
      }
      
      return transactions;
    }
  }
  
  // Cross-chain Wormhole transaction operations
  async saveWormholeTransaction(txData: any): Promise<any> {
    const txId = txData.id || Date.now().toString();
    const txKey = `wormhole:tx:${txId}`;
    
    // Save tx data with timestamp if not provided
    const txWithTimestamp = {
      ...txData,
      id: txId,
      timestamp: txData.timestamp || new Date()
    };
    
    await txStore.set(txKey, txWithTimestamp);
    
    // Index by user ID if available
    if (txData.userId) {
      const userTxKey = `wormhole:tx:user:${txData.userId}`;
      const userTxs = await txStore.get(userTxKey) || [];
      if (!userTxs.includes(txId)) {
        userTxs.push(txId);
        await txStore.set(userTxKey, userTxs);
      }
    }
    
    return txWithTimestamp;
  }
  
  async getWormholeTransaction(txId: string): Promise<any | null> {
    const key = `wormhole:tx:${txId}`;
    return await txStore.get(key) || null;
  }
  
  async listWormholeTransactions(userId?: number): Promise<any[]> {
    if (userId) {
      // Get Wormhole transactions for a specific user
      const userTxKey = `wormhole:tx:user:${userId}`;
      const txIds = await txStore.get(userTxKey) || [];
      
      const transactions: any[] = [];
      for (const id of txIds) {
        const tx = await this.getWormholeTransaction(id);
        if (tx) {
          transactions.push(tx);
        }
      }
      
      return transactions;
    } else {
      // Get all Wormhole transactions
      const allKeys = await txStore.keys();
      const txKeys = allKeys.filter((key: string) => 
        key.startsWith('wormhole:tx:') && 
        !key.includes(':user:'));
      
      const transactions: any[] = [];
      for (const key of txKeys) {
        const tx = await txStore.get(key);
        if (tx) {
          transactions.push(tx);
        }
      }
      
      return transactions;
    }
  }
}

// Export a singleton instance
export const walrusStorage = new WalrusStorageImpl();

// Initialize the storage (create tables, indexes, etc.)
export async function initWalrusStorage() {
  try {
    console.log('Initializing Walrus Storage...');
    
    // You could add initial setup here if needed
    
    console.log('Walrus Storage initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Walrus Storage:', error);
    return false;
  }
}