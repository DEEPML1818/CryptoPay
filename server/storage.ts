import { 
  users, type User, type InsertUser,
  invoices, type Invoice, type InsertInvoice,
  transactions, type Transaction, type InsertTransaction,
  contacts, type Contact, type InsertContact
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Invoice methods
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  listInvoices(creatorId?: number, status?: string): Promise<Invoice[]>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  listTransactions(userId: number): Promise<Transaction[]>;
  
  // Contact methods
  createContact(contact: InsertContact): Promise<Contact>;
  getContact(id: number): Promise<Contact | undefined>;
  listContacts(userId: number): Promise<Contact[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Invoice methods
  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    // Generate an invoice number if not provided
    const invoiceToInsert = { 
      ...insertInvoice
    };
    
    if (!invoiceToInsert.invoiceNumber) {
      // Get the current highest invoice ID to generate a new number
      const [lastInvoice] = await db.select({ id: invoices.id })
        .from(invoices)
        .orderBy(desc(invoices.id))
        .limit(1);
      
      const nextId = lastInvoice ? lastInvoice.id + 1 : 1;
      invoiceToInsert.invoiceNumber = `INV-${String(nextId).padStart(3, '0')}`;
    }
    
    const [invoice] = await db
      .insert(invoices)
      .values(invoiceToInsert)
      .returning();
    
    return invoice;
  }
  
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }
  
  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber));
    return invoice;
  }
  
  async updateInvoice(id: number, invoiceUpdate: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(invoiceUpdate)
      .where(eq(invoices.id, id))
      .returning();
    
    return updatedInvoice;
  }
  
  async listInvoices(creatorId?: number, status?: string): Promise<Invoice[]> {
    let conditions = [];
    
    if (creatorId !== undefined) {
      conditions.push(eq(invoices.creatorId, creatorId));
    }
    
    if (status !== undefined) {
      conditions.push(eq(invoices.status, status));
    }
    
    // Apply all conditions if any exist
    if (conditions.length > 0) {
      return await db.select()
        .from(invoices)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(invoices.issueDate));
    }
    
    // No conditions, return all invoices
    return await db.select()
      .from(invoices)
      .orderBy(desc(invoices.issueDate));
  }
  
  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    
    // If this transaction is for an invoice, update the invoice status
    if (transaction.invoiceId && transaction.status === 'success') {
      if (transaction.transactionType === 'payment') {
        // Update invoice status
        await this.updateInvoice(transaction.invoiceId, { 
          status: 'paid'
        });
      } else if (transaction.transactionType === 'refund') {
        await this.updateInvoice(transaction.invoiceId, { status: 'refunded' });
      }
    }
    
    return transaction;
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }
  
  async listTransactions(userId: number): Promise<Transaction[]> {
    // Get user wallet address
    const user = await this.getUser(userId);
    if (!user || !user.walletAddress) return [];
    
    // Find all transactions where user is sender or recipient
    return await db.select()
      .from(transactions)
      .where(
        or(
          eq(transactions.senderWalletAddress, user.walletAddress),
          eq(transactions.recipientWalletAddress, user.walletAddress)
        )
      )
      .orderBy(desc(transactions.timestamp));
  }
  
  // Contact methods
  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(insertContact)
      .returning();
    
    return contact;
  }
  
  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }
  
  async listContacts(userId: number): Promise<Contact[]> {
    return await db.select()
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(contacts.name);
  }
  
  // Initialize with a sample user for testing
  async initialize() {
    const existingUser = await this.getUserByUsername("demo");
    if (!existingUser) {
      await this.createUser({
        username: "demo",
        password: "demo123",
        walletAddress: "8vdj...3Kma",
        companyName: "Demo Company",
        email: "demo@example.com"
      });
    }
  }
}

// Create and initialize database storage
export const storage = new DatabaseStorage();
// Initialize the storage with sample data
storage.initialize().catch(console.error);
