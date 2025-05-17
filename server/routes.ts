import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertInvoiceSchema, insertTransactionSchema, insertContactSchema } from "@shared/schema";
import fetch from 'node-fetch';

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes with /api prefix
  
  // User routes
  app.get("/api/me", async (req, res) => {
    // Mock user authentication
    const user = await storage.getUserByUsername("demo");
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Don't send password in response
    const { password, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  });
  
  // Invoice routes
  app.post("/api/invoices", async (req, res) => {
    try {
      // Get raw data first
      const data = req.body;
      
      // Handle date conversions
      if (typeof data.dueDate === 'string') {
        data.dueDate = new Date(data.dueDate);
      }
      
      if (typeof data.issueDate === 'string') {
        data.issueDate = new Date(data.issueDate);
      }
      
      // Now validate the converted data
      const validatedData = insertInvoiceSchema.parse(data);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      } else {
        console.error("Invoice creation error:", error);
        res.status(500).json({ message: "Failed to create invoice" });
      }
    }
  });
  
  app.get("/api/invoices", async (req, res) => {
    const creatorId = req.query.creatorId ? Number(req.query.creatorId) : undefined;
    const status = req.query.status as string | undefined;
    
    try {
      const invoices = await storage.listInvoices(creatorId, status);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  
  app.get("/api/invoices/:id", async (req, res) => {
    const id = Number(req.params.id);
    
    try {
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });
  
  app.patch("/api/invoices/:id", async (req, res) => {
    const id = Number(req.params.id);
    
    try {
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const updateSchema = insertInvoiceSchema.partial();
      const validatedUpdate = updateSchema.parse(req.body);
      
      const updatedInvoice = await storage.updateInvoice(id, validatedUpdate);
      res.json(updatedInvoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid update data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update invoice" });
      }
    }
  });
  
  // Transaction routes
  app.post("/api/transactions", async (req, res) => {
    try {
      // Handle transaction data
      const validatedData = insertTransactionSchema.parse(req.body);
      
      // Check if this is a blockchain transaction
      if (req.body.transactionHash || req.body.memo) {
        console.log("Processing blockchain transaction with hash:", req.body.transactionHash);
        
        // If this transaction is linked to an invoice, update the invoice status
        if (validatedData.invoiceId) {
          const invoice = await storage.getInvoice(validatedData.invoiceId);
          if (invoice) {
            await storage.updateInvoice(invoice.id, { 
              status: 'paid',
              paymentDate: new Date(),
              transactionHash: validatedData.transactionHash
            });
          }
        }
      }
      
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        console.error("Transaction creation error:", error);
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });
  
  app.get("/api/transactions", async (req, res) => {
    const userId = req.query.userId ? Number(req.query.userId) : 1; // Default to user 1 for demo
    
    try {
      const transactions = await storage.listTransactions(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  
  // Contact routes
  app.post("/api/contacts", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create contact" });
      }
    }
  });
  
  app.get("/api/contacts", async (req, res) => {
    const userId = req.query.userId ? Number(req.query.userId) : 1; // Default to user 1 for demo
    
    try {
      const contacts = await storage.listContacts(userId);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });
  
  // User role endpoints
  app.post("/api/users/role", async (req, res) => {
    try {
      const { role, walletAddress } = req.body;
      
      if (!role || !walletAddress) {
        return res.status(400).json({ message: "Role and wallet address are required" });
      }
      
      if (role !== 'client' && role !== 'freelancer') {
        return res.status(400).json({ message: "Role must be either 'client' or 'freelancer'" });
      }
      
      // Check if user exists with this wallet address
      let user = await storage.getUserByWalletAddress(walletAddress);
      
      if (user) {
        // Update existing user
        user = await storage.updateUser(user.id, { role });
      } else {
        // Create new user with this wallet address and role
        user = await storage.createUser({
          username: `user_${Date.now()}`, // Generate a temporary username
          password: Math.random().toString(36).slice(2), // Generate a random password
          walletAddress,
          role
        });
      }
      
      // Return user with role (excluding password)
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error setting user role:", error);
      res.status(500).json({ message: "Failed to set user role" });
    }
  });
  
  app.get("/api/users/current", async (req, res) => {
    try {
      const { walletAddress } = req.query;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      const user = await storage.getUserByWalletAddress(walletAddress as string);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error getting current user:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Real Solana wallet routes
  app.post("/api/wallet/connect", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // Fetch actual wallet balance from Solana devnet
      const balance = await getWalletBalance(walletAddress);
      
      res.json({ 
        connected: true, 
        walletAddress,
        balance
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      res.status(500).json({ connected: false, message: "Failed to connect wallet" });
    }
  });
  
  // Helper function to get wallet balance from Solana devnet
  async function getWalletBalance(walletAddress: string): Promise<number> {
    try {
      // Solana devnet endpoint
      const endpoint = 'https://api.devnet.solana.com';
      
      // Query RPC for the account balance
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [walletAddress]
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Solana RPC error:', data.error);
        return 0;
      }
      
      // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
      const solBalance = data.result?.value / 1000000000 || 0;
      return solBalance;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return 0;
    }
  }
  
  app.get("/api/solana/price", async (req, res) => {
    try {
      // Fetch real Solana price from CoinGecko API
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch Solana price");
      }
      
      const data = await response.json();
      const price = data?.solana?.usd;
      
      if (!price) {
        throw new Error("Invalid price data from API");
      }
      
      // Return real SOL/USD price
      res.json({ price });
    } catch (error) {
      console.error("Error fetching Solana price:", error);
      // Fallback to a reasonable price if API fails
      res.json({ price: 80.00, source: "fallback" });
    }
  });
  
  // Solana blockchain payment endpoint
  app.post("/api/solana/payment", async (req, res) => {
    try {
      const { 
        senderWalletAddress, 
        recipientWalletAddress, 
        amount, 
        memo,
        transactionHash
      } = req.body;
      
      if (!senderWalletAddress || !recipientWalletAddress || !amount) {
        return res.status(400).json({ message: "Missing required payment information" });
      }
      
      // Record the blockchain transaction
      const transaction = await storage.createTransaction({
        senderWalletAddress,
        recipientWalletAddress,
        amount: amount.toString(),
        transactionType: 'payment',
        status: 'success',
        timestamp: new Date(),
        transactionHash: transactionHash || `sim_${Date.now()}`,
        memo: memo || "Direct payment through CryptoPay",
      });
      
      // Return transaction data
      res.status(201).json({
        success: true,
        transaction,
        message: "Payment processed successfully"
      });
    } catch (error) {
      console.error("Blockchain payment error:", error);
      res.status(500).json({ success: false, message: "Failed to process blockchain payment" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
