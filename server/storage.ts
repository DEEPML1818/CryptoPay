import { 
  users, User, InsertUser,
  clients, Client, InsertClient,
  wallets, Wallet, InsertWallet,
  invoices, Invoice, InsertInvoice,
  payments, Payment, InsertPayment,
  cryptoPrices, CryptoPrice, InsertCryptoPrice
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Client methods
  getClient(id: number): Promise<Client | undefined>;
  getClientsByUserId(userId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, data: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Wallet methods
  getWallet(id: number): Promise<Wallet | undefined>;
  getWalletsByUserId(userId: number): Promise<Wallet[]>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: number, data: Partial<Wallet>): Promise<Wallet | undefined>;
  deleteWallet(id: number): Promise<boolean>;
  
  // Invoice methods
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByUserId(userId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Payment methods
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByUserId(userId: number): Promise<Payment[]>;
  getPaymentsByInvoiceId(invoiceId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, data: Partial<Payment>): Promise<Payment | undefined>;
  
  // Crypto price methods
  getCryptoPrice(symbol: string): Promise<CryptoPrice | undefined>;
  getAllCryptoPrices(): Promise<CryptoPrice[]>;
  updateCryptoPrice(symbol: string, data: Partial<CryptoPrice>): Promise<CryptoPrice | undefined>;
  createCryptoPrice(price: InsertCryptoPrice): Promise<CryptoPrice>;
}

// For development use, will be replaced by DatabaseStorage
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private wallets: Map<number, Wallet>;
  private invoices: Map<number, Invoice>;
  private payments: Map<number, Payment>;
  private cryptoPrices: Map<string, CryptoPrice>;
  
  private userCurrentId: number;
  private clientCurrentId: number;
  private walletCurrentId: number;
  private invoiceCurrentId: number;
  private paymentCurrentId: number;
  private cryptoPriceCurrentId: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.wallets = new Map();
    this.invoices = new Map();
    this.payments = new Map();
    this.cryptoPrices = new Map();
    
    this.userCurrentId = 1;
    this.clientCurrentId = 1;
    this.walletCurrentId = 1;
    this.invoiceCurrentId = 1;
    this.paymentCurrentId = 1;
    this.cryptoPriceCurrentId = 1;
    
    // Initialize with some default crypto prices
    this.initCryptoPrices();
  }
  
  private initCryptoPrices() {
    const now = new Date();
    const defaultPrices = [
      { id: this.cryptoPriceCurrentId++, symbol: "BTC", name: "Bitcoin", price: "26543.12", priceChange24h: "1.2", lastUpdated: now },
      { id: this.cryptoPriceCurrentId++, symbol: "ETH", name: "Ethereum", price: "1834.67", priceChange24h: "3.5", lastUpdated: now },
      { id: this.cryptoPriceCurrentId++, symbol: "USDC", name: "USD Coin", price: "1.00", priceChange24h: "0.0", lastUpdated: now },
      { id: this.cryptoPriceCurrentId++, symbol: "SOL", name: "Solana", price: "24.59", priceChange24h: "2.8", lastUpdated: now }
    ];
    
    defaultPrices.forEach(price => {
      this.cryptoPrices.set(price.symbol, price);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      balance: "0",
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Client methods
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }
  
  async getClientsByUserId(userId: number): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(
      (client) => client.userId === userId
    );
  }
  
  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.clientCurrentId++;
    const now = new Date();
    const client: Client = { ...insertClient, id, createdAt: now };
    this.clients.set(id, client);
    return client;
  }
  
  async updateClient(id: number, data: Partial<Client>): Promise<Client | undefined> {
    const client = await this.getClient(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...data };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }
  
  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }
  
  // Wallet methods
  async getWallet(id: number): Promise<Wallet | undefined> {
    return this.wallets.get(id);
  }
  
  async getWalletsByUserId(userId: number): Promise<Wallet[]> {
    return Array.from(this.wallets.values()).filter(
      (wallet) => wallet.userId === userId
    );
  }
  
  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = this.walletCurrentId++;
    const now = new Date();
    const wallet: Wallet = { ...insertWallet, id, createdAt: now };
    this.wallets.set(id, wallet);
    return wallet;
  }
  
  async updateWallet(id: number, data: Partial<Wallet>): Promise<Wallet | undefined> {
    const wallet = await this.getWallet(id);
    if (!wallet) return undefined;
    
    const updatedWallet = { ...wallet, ...data };
    this.wallets.set(id, updatedWallet);
    return updatedWallet;
  }
  
  async deleteWallet(id: number): Promise<boolean> {
    return this.wallets.delete(id);
  }
  
  // Invoice methods
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }
  
  async getInvoicesByUserId(userId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.userId === userId
    );
  }
  
  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceCurrentId++;
    const now = new Date();
    const invoice: Invoice = { 
      ...insertInvoice, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.invoices.set(id, invoice);
    return invoice;
  }
  
  async updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = { 
      ...invoice, 
      ...data, 
      updatedAt: new Date() 
    };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoices.delete(id);
  }
  
  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }
  
  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.userId === userId
    );
  }
  
  async getPaymentsByInvoiceId(invoiceId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.invoiceId === invoiceId
    );
  }
  
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentCurrentId++;
    const now = new Date();
    const payment: Payment = { ...insertPayment, id, createdAt: now };
    this.payments.set(id, payment);
    return payment;
  }
  
  async updatePayment(id: number, data: Partial<Payment>): Promise<Payment | undefined> {
    const payment = await this.getPayment(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...data };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }
  
  // Crypto price methods
  async getCryptoPrice(symbol: string): Promise<CryptoPrice | undefined> {
    return this.cryptoPrices.get(symbol);
  }
  
  async getAllCryptoPrices(): Promise<CryptoPrice[]> {
    return Array.from(this.cryptoPrices.values());
  }
  
  async updateCryptoPrice(symbol: string, data: Partial<CryptoPrice>): Promise<CryptoPrice | undefined> {
    const price = await this.getCryptoPrice(symbol);
    if (!price) return undefined;
    
    const updatedPrice = { 
      ...price, 
      ...data, 
      lastUpdated: new Date() 
    };
    this.cryptoPrices.set(symbol, updatedPrice);
    return updatedPrice;
  }
  
  async createCryptoPrice(insertPrice: InsertCryptoPrice): Promise<CryptoPrice> {
    const id = this.cryptoPriceCurrentId++;
    const now = new Date();
    const price: CryptoPrice = { 
      ...insertPrice, 
      id, 
      lastUpdated: now 
    };
    this.cryptoPrices.set(price.symbol, price);
    return price;
  }
}

// Create a demo user
const initMemStorage = async () => {
  const storage = new MemStorage();

  // Create demo user
  const user = await storage.createUser({
    username: "demo",
    password: "password123",
    email: "demo@example.com",
    fullName: "John Smith",
    company: "Demo Company",
  });

  // Create demo clients
  const clients = [
    {
      userId: user.id,
      name: "TechCorp Inc.",
      email: "contact@techcorp.com",
      company: "TechCorp Inc.",
      phone: "+1234567890",
      address: "123 Tech Street, San Francisco, CA",
    },
    {
      userId: user.id,
      name: "Global Designs",
      email: "info@globaldesigns.com",
      company: "Global Designs",
      phone: "+0987654321",
      address: "456 Design Ave, New York, NY",
    },
    {
      userId: user.id,
      name: "Eco Dynamics",
      email: "hello@ecodynamics.com",
      company: "Eco Dynamics",
      phone: "+1122334455",
      address: "789 Eco Road, Portland, OR",
    },
  ];

  for (const client of clients) {
    await storage.createClient(client);
  }

  // Create demo invoices
  const demoClients = await storage.getClientsByUserId(user.id);
  if (demoClients.length > 0) {
    const invoices = [
      {
        userId: user.id,
        clientId: demoClients[0].id,
        invoiceNumber: "INV-001",
        amount: "3200.00",
        cryptoAmount: "0.12",
        cryptoType: "BTC",
        status: "PAID",
        dueDate: new Date(2023, 7, 15),
        paymentMethod: "CRYPTO",
        items: JSON.stringify([
          { description: "Web Development", quantity: 1, rate: 3200, amount: 3200 }
        ]),
        notes: "Thank you for your business",
        template: "default",
      },
      {
        userId: user.id,
        clientId: demoClients[1].id,
        invoiceNumber: "INV-002",
        amount: "1450.00",
        cryptoAmount: "0.05",
        cryptoType: "BTC",
        status: "PENDING",
        dueDate: new Date(2023, 7, 12),
        paymentMethod: "CRYPTO",
        items: JSON.stringify([
          { description: "Logo Design", quantity: 1, rate: 800, amount: 800 },
          { description: "Brand Identity", quantity: 1, rate: 650, amount: 650 }
        ]),
        notes: "Please pay by the due date",
        template: "modern",
      },
      {
        userId: user.id,
        clientId: demoClients[2].id,
        invoiceNumber: "INV-003",
        amount: "2780.00",
        cryptoAmount: "0.10",
        cryptoType: "BTC",
        status: "PAID",
        dueDate: new Date(2023, 7, 10),
        paymentMethod: "CRYPTO",
        items: JSON.stringify([
          { description: "SEO Services", quantity: 1, rate: 1500, amount: 1500 },
          { description: "Content Writing", quantity: 8, rate: 160, amount: 1280 }
        ]),
        notes: "Thank you for your business",
        template: "minimal",
      },
      {
        userId: user.id,
        clientId: demoClients[0].id,
        invoiceNumber: "INV-004",
        amount: "5600.00",
        cryptoAmount: "0.21",
        cryptoType: "BTC",
        status: "OVERDUE",
        dueDate: new Date(2023, 7, 5),
        paymentMethod: "CRYPTO",
        items: JSON.stringify([
          { description: "App Development", quantity: 1, rate: 5600, amount: 5600 }
        ]),
        notes: "Payment is overdue. Please process immediately.",
        template: "default",
      },
    ];

    for (const invoice of invoices) {
      await storage.createInvoice(invoice);
    }
  }

  // Create wallet
  await storage.createWallet({
    userId: user.id,
    type: "BTC",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    label: "Bitcoin Wallet",
    isDefault: true,
  });

  return storage;
};

export const storage = await initMemStorage();
