import Keyv from 'keyv';
import { Invoice, Transaction } from '@shared/schema';
import { db } from './db';
import { eq, sql, and } from 'drizzle-orm';
import { invoices, transactions } from '@shared/schema';
import path from 'path';

/**
 * This class implements a key-value storage layer for CryptoPayRoll
 * that persists invoice data, transactions, and cross-chain operations
 */
export class KVStorage {
  private invoiceStore: Keyv;
  private transactionStore: Keyv;
  private wormholeStore: Keyv;
  
  constructor() {
    // Create storage namespaces
    this.invoiceStore = new Keyv({ namespace: 'invoices' });
    this.transactionStore = new Keyv({ namespace: 'transactions' });
    this.wormholeStore = new Keyv({ namespace: 'wormhole' });
    
    // Error handling
    this.invoiceStore.on('error', err => console.error('Invoice Storage Error:', err));
    this.transactionStore.on('error', err => console.error('Transaction Storage Error:', err));
    this.wormholeStore.on('error', err => console.error('Wormhole Storage Error:', err));
  }
  
  /**
   * Initialize the storage system
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing KV Storage...');
      
      // Sync existing invoices into KV store
      const existingInvoices = await db.select().from(invoices);
      for (const invoice of existingInvoices) {
        await this.saveInvoice(invoice);
      }
      
      // Sync existing transactions into KV store
      const existingTransactions = await db.select().from(transactions);
      for (const transaction of existingTransactions) {
        await this.saveTransaction(transaction);
      }
      
      console.log('KV Storage initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize KV Storage:', error);
      return false;
    }
  }
  
  /**
   * Save an invoice to storage
   */
  async saveInvoice(invoice: Invoice): Promise<Invoice> {
    await this.invoiceStore.set(`invoice:${invoice.id}`, invoice);
    
    // Also store by invoice number for lookup
    await this.invoiceStore.set(`invoice:number:${invoice.invoiceNumber}`, invoice.id);
    
    return invoice;
  }
  
  /**
   * Get an invoice by ID
   */
  async getInvoice(id: number): Promise<Invoice | null> {
    return await this.invoiceStore.get(`invoice:${id}`) || null;
  }
  
  /**
   * Get an invoice by invoice number
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    const id = await this.invoiceStore.get(`invoice:number:${invoiceNumber}`);
    if (!id) return null;
    return this.getInvoice(id);
  }
  
  /**
   * Update an invoice
   */
  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | null> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return null;
    
    const updatedInvoice = { ...invoice, ...updates, updatedAt: new Date() };
    await this.saveInvoice(updatedInvoice);
    
    // If the invoice number changed, update that reference too
    if (updates.invoiceNumber && updates.invoiceNumber !== invoice.invoiceNumber) {
      await this.invoiceStore.delete(`invoice:number:${invoice.invoiceNumber}`);
      await this.invoiceStore.set(`invoice:number:${updates.invoiceNumber}`, id);
    }
    
    return updatedInvoice;
  }
  
  /**
   * Save a transaction to storage
   */
  async saveTransaction(transaction: Transaction): Promise<Transaction> {
    await this.transactionStore.set(`tx:${transaction.id}`, transaction);
    return transaction;
  }
  
  /**
   * Get a transaction by ID
   */
  async getTransaction(id: number): Promise<Transaction | null> {
    return await this.transactionStore.get(`tx:${id}`) || null;
  }
  
  /**
   * Save Wormhole cross-chain transaction data
   */
  async saveWormholeTransaction(txData: {
    id: string;
    sourceChain: string;
    destinationChain: string;
    sourceAddress: string;
    destinationAddress: string;
    amount: number;
    tokenSymbol: string;
    status: string;
    timestamp: Date;
    [key: string]: any;
  }): Promise<any> {
    // Ensure ID exists
    const txId = txData.id || `wormhole-${Date.now()}`;
    
    // Save with timestamp
    const txWithTimestamp = {
      ...txData,
      id: txId,
      timestamp: txData.timestamp || new Date()
    };
    
    await this.wormholeStore.set(`wormhole:${txId}`, txWithTimestamp);
    return txWithTimestamp;
  }
  
  /**
   * Get a Wormhole transaction by ID
   */
  async getWormholeTransaction(id: string): Promise<any | null> {
    return await this.wormholeStore.get(`wormhole:${id}`) || null;
  }
  
  /**
   * Update a Wormhole transaction
   */
  async updateWormholeTransaction(id: string, updates: any): Promise<any | null> {
    const tx = await this.getWormholeTransaction(id);
    if (!tx) return null;
    
    const updatedTx = { ...tx, ...updates, updatedAt: new Date() };
    await this.wormholeStore.set(`wormhole:${id}`, updatedTx);
    
    return updatedTx;
  }
}

// Export a singleton instance
export const kvStorage = new KVStorage();