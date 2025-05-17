import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  companyName: text("company_name"),
  email: text("email"),
  role: text("role"), // 'client' or 'freelancer'
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull(),
  creatorId: integer("creator_id").notNull(), // The user who created the invoice
  creatorWalletAddress: text("creator_wallet_address"), // Wallet address of the creator
  recipientId: integer("recipient_id"), // Optional: If recipient is a registered user
  recipientName: text("recipient_name").notNull(),
  recipientWalletAddress: text("recipient_wallet_address"),
  amount: decimal("amount", { precision: 18, scale: 9 }).notNull(), // SOL amount with precision
  fiatAmount: decimal("fiat_amount", { precision: 10, scale: 2 }), // USD equivalent
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, pending, paid, escrowed, released, refunded, overdue
  dueDate: timestamp("due_date").notNull(),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  paymentDate: timestamp("payment_date"),
  refundDate: timestamp("refund_date"),
  escrowDate: timestamp("escrow_date"),
  convertOnPayment: boolean("convert_on_payment").default(false),
  // Blockchain-related fields
  transactionHash: text("transaction_hash"), // Transaction hash on the blockchain
  escrowAccountAddress: text("escrow_account_address"), // PDA address for escrow
  onChainId: text("on_chain_id"), // ID reference on the blockchain
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id"),
  senderWalletAddress: text("sender_wallet_address").notNull(),
  recipientWalletAddress: text("recipient_wallet_address").notNull(),
  amount: decimal("amount", { precision: 18, scale: 9 }).notNull(),
  fiatAmount: decimal("fiat_amount", { precision: 10, scale: 2 }),
  transactionType: text("transaction_type").notNull(), // payment, conversion, refund
  signature: text("signature"), // Solana transaction signature
  transactionHash: text("transaction_hash"), // Blockchain transaction hash
  memo: text("memo"), // Optional memo for the transaction
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  status: text("status").notNull(), // success, pending, failed
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  walletAddress: text("wallet_address"),
  email: text("email"),
  company: text("company"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
  companyName: true,
  email: true,
  role: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
