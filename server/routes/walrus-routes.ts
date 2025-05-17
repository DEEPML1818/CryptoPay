import { Router, Request as ExpressRequest } from 'express';
import { kvStorage } from '../kv-storage';
import { wormholeBridge } from '../wormhole-bridge';
import { z } from 'zod';
import { invoices, transactions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../db';

// Add type augmentation for request object
interface EnhancedRequest extends ExpressRequest {
  db: typeof db;
  eq: typeof eq;
}

const router = Router();

// Schema for validating invoice updates
const invoiceUpdateSchema = z.object({
  status: z.string().optional(),
  amount: z.string().optional(),
  dueDate: z.string().optional(),
  memo: z.string().optional(),
  paid: z.boolean().optional(),
  transactionHash: z.string().optional(),
});

// Schema for validating cross-chain transfers
const crossChainTransferSchema = z.object({
  fromChain: z.string(),
  toChain: z.string(),
  fromAddress: z.string(),
  toAddress: z.string(),
  tokenAddress: z.string(),
  amount: z.number().positive(),
  userId: z.number().optional(),
});

// GET all invoices (from persistent storage)
router.get('/invoices', async (req, res) => {
  try {
    // Get invoices from the database
    const invoicesData = await req.db.select().from(invoices);
    
    // Store in KV for quick access
    for (const invoice of invoicesData) {
      await kvStorage.saveInvoice(invoice);
    }
    
    res.json(invoicesData);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// GET invoice by ID (from KV storage for fast access)
router.get('/invoices/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Try to get from KV storage first for speed
    let invoice = await kvStorage.getInvoice(id);
    
    // If not in KV, get from database and cache in KV
    if (!invoice) {
      const [dbInvoice] = await req.db
        .select()
        .from(invoices)
        .where(eq(invoices.id, id));
      
      if (dbInvoice) {
        invoice = dbInvoice;
        await kvStorage.saveInvoice(dbInvoice);
      }
    }
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error(`Error fetching invoice ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// PATCH update an invoice (both DB and KV)
router.patch('/invoices/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Validate the update data
    const result = invoiceUpdateSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    // Update in database
    const [updated] = await req.db
      .update(invoices)
      .set(result.data)
      .where(eq(invoices.id, id))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Also update in KV storage
    await kvStorage.updateInvoice(id, result.data);
    
    res.json(updated);
  } catch (error) {
    console.error(`Error updating invoice ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// POST initiate a cross-chain transfer
router.post('/wormhole/transfer', async (req, res) => {
  try {
    // Validate the transfer data
    const result = crossChainTransferSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    // Ensure Wormhole bridge is initialized
    if (!wormholeBridge.isInitialized()) {
      return res.status(503).json({ error: 'Wormhole bridge not initialized' });
    }
    
    // Initiate the transfer
    const txId = await wormholeBridge.transferTokens(result.data);
    
    res.status(201).json({
      success: true,
      transactionId: txId,
      message: 'Cross-chain transfer initiated'
    });
  } catch (error: any) {
    console.error('Error initiating cross-chain transfer:', error);
    res.status(500).json({ error: error.message || 'Failed to initiate cross-chain transfer' });
  }
});

// GET check cross-chain transfer status
router.get('/wormhole/transfer/:id', async (req, res) => {
  try {
    const txId = req.params.id;
    
    const transaction = await wormholeBridge.getTransferStatus(txId);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error: any) {
    console.error(`Error checking transfer status for ${req.params.id}:`, error);
    res.status(500).json({ error: error.message || 'Failed to check transfer status' });
  }
});

// GET estimate cross-chain transfer fees
router.get('/wormhole/estimate-fees', async (req, res) => {
  try {
    const { fromChain, toChain, amount } = req.query;
    
    if (!fromChain || !toChain || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const fees = await wormholeBridge.estimateTransferFees({
      fromChain: fromChain as string,
      toChain: toChain as string,
      amount: parseFloat(amount as string)
    });
    
    res.json(fees);
  } catch (error: any) {
    console.error('Error estimating transfer fees:', error);
    res.status(500).json({ error: error.message || 'Failed to estimate transfer fees' });
  }
});

export default router;