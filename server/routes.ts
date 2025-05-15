import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import { insertClientSchema, insertInvoiceSchema, insertUserSchema, insertWalletSchema, insertPaymentSchema } from "@shared/schema";
import { solanaApiHandlers } from "./solana-api";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Register Solana blockchain API routes
  app.post('/api/solana/invoices', solanaApiHandlers.createInvoice);
  app.post('/api/solana/payments', solanaApiHandlers.processPayment);
  app.get('/api/solana/invoices', solanaApiHandlers.getInvoices);
  app.get('/api/solana/invoices/:id', solanaApiHandlers.getInvoice);
  app.get('/api/solana/wallets/:address/balance', solanaApiHandlers.getWalletBalance);

  // User routes
  app.get("/api/me", async (req, res) => {
    try {
      // For demo purposes, return the first user
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      // For demo, assume user ID is 1
      const userId = 1;
      const clients = await storage.getClientsByUserId(userId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const userId = 1; // Demo user ID
      
      const validatedData = insertClientSchema.parse({
        ...req.body,
        userId,
      });
      
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const userId = 1; // Demo user ID
      const invoices = await storage.getInvoicesByUserId(userId);
      
      // Include client details with each invoice
      const invoicesWithClient = await Promise.all(
        invoices.map(async (invoice) => {
          const client = await storage.getClient(invoice.clientId);
          return { ...invoice, client };
        })
      );
      
      res.json(invoicesWithClient);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const userId = 1; // Demo user ID
      
      const validatedData = insertInvoiceSchema.parse({
        ...req.body,
        userId,
      });
      
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const client = await storage.getClient(invoice.clientId);
      
      res.json({ ...invoice, client });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // If payment is being processed
      if (req.body.status === "PAID") {
        const payment = await storage.createPayment({
          userId: invoice.userId,
          invoiceId: invoice.id,
          amount: invoice.amount,
          status: "COMPLETED",
          paymentMethod: invoice.paymentMethod,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      const updatedInvoice = await storage.updateInvoice(invoiceId, {
        ...req.body,
        paidAt: req.body.status === "PAID" ? new Date() : null
      });
      res.json(updatedInvoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Wallet routes
  app.get("/api/wallets", async (req, res) => {
    try {
      const userId = 1; // Demo user ID
      const wallets = await storage.getWalletsByUserId(userId);
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/wallets", async (req, res) => {
    try {
      const userId = 1; // Demo user ID
      
      const validatedData = insertWalletSchema.parse({
        ...req.body,
        userId,
      });
      
      const wallet = await storage.createWallet(validatedData);
      res.json(wallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Payment routes
  app.get("/api/payments", async (req, res) => {
    try {
      const userId = 1; // Demo user ID
      const payments = await storage.getPaymentsByUserId(userId);
      
      // Include invoice details with each payment
      const paymentsWithInvoice = await Promise.all(
        payments.map(async (payment) => {
          if (payment.invoiceId) {
            const invoice = await storage.getInvoice(payment.invoiceId);
            return { ...payment, invoice };
          }
          return payment;
        })
      );
      
      res.json(paymentsWithInvoice);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const userId = 1; // Demo user ID
      
      const validatedData = insertPaymentSchema.parse({
        ...req.body,
        userId,
      });
      
      const payment = await storage.createPayment(validatedData);
      
      // If payment is for an invoice, update invoice status
      if (payment.invoiceId && payment.status === 'COMPLETED') {
        await storage.updateInvoice(payment.invoiceId, { status: 'PAID' });
      }
      
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Crypto price routes
  app.get("/api/crypto-prices", async (req, res) => {
    try {
      // Check if we should update prices from external API
      const shouldUpdate = req.query.update === 'true';
      
      if (shouldUpdate) {
        try {
          const response = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
            params: {
              ids: "bitcoin,ethereum,usd-coin,solana",
              vs_currencies: "usd",
              include_24hr_change: true
            }
          });
          
          const data = response.data;
          
          // Update Bitcoin
          if (data.bitcoin) {
            await storage.updateCryptoPrice("BTC", {
              price: data.bitcoin.usd.toString(),
              priceChange24h: data.bitcoin.usd_24h_change?.toString()
            });
          }
          
          // Update Ethereum
          if (data.ethereum) {
            await storage.updateCryptoPrice("ETH", {
              price: data.ethereum.usd.toString(),
              priceChange24h: data.ethereum.usd_24h_change?.toString()
            });
          }
          
          // Update USD Coin
          if (data["usd-coin"]) {
            await storage.updateCryptoPrice("USDC", {
              price: data["usd-coin"].usd.toString(),
              priceChange24h: data["usd-coin"].usd_24h_change?.toString()
            });
          }
          
          // Update Solana
          if (data.solana) {
            await storage.updateCryptoPrice("SOL", {
              price: data.solana.usd.toString(),
              priceChange24h: data.solana.usd_24h_change?.toString()
            });
          }
        } catch (error) {
          console.error("Failed to update crypto prices from external API:", error);
          // Continue with stored prices
        }
      }
      
      const prices = await storage.getAllCryptoPrices();
      res.json(prices);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/crypto-prices/:symbol", async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const price = await storage.getCryptoPrice(symbol);
      
      if (!price) {
        return res.status(404).json({ message: "Crypto price not found" });
      }
      
      res.json(price);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Currency conversion API
  app.post("/api/convert", async (req, res) => {
    try {
      const { amount, fromCurrency, toCurrency } = req.body;
      
      if (!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      let convertedAmount = 0;
      
      // If converting from fiat to crypto
      if (fromCurrency === 'USD' && toCurrency !== 'USD') {
        const cryptoPrice = await storage.getCryptoPrice(toCurrency);
        if (!cryptoPrice) {
          return res.status(404).json({ message: "Crypto price not found" });
        }
        
        convertedAmount = parseFloat(amount) / parseFloat(cryptoPrice.price);
      } 
      // If converting from crypto to fiat
      else if (fromCurrency !== 'USD' && toCurrency === 'USD') {
        const cryptoPrice = await storage.getCryptoPrice(fromCurrency);
        if (!cryptoPrice) {
          return res.status(404).json({ message: "Crypto price not found" });
        }
        
        convertedAmount = parseFloat(amount) * parseFloat(cryptoPrice.price);
      }
      // If converting from crypto to crypto
      else if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
        const fromPrice = await storage.getCryptoPrice(fromCurrency);
        const toPrice = await storage.getCryptoPrice(toCurrency);
        
        if (!fromPrice || !toPrice) {
          return res.status(404).json({ message: "Crypto price not found" });
        }
        
        const usdValue = parseFloat(amount) * parseFloat(fromPrice.price);
        convertedAmount = usdValue / parseFloat(toPrice.price);
      }
      
      res.json({
        from: {
          currency: fromCurrency,
          amount: parseFloat(amount)
        },
        to: {
          currency: toCurrency,
          amount: convertedAmount
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
