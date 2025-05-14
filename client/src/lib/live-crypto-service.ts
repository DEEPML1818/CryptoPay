import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: Date;
}

export interface CryptoPriceUpdate {
  symbol: string;
  price: number;
  change: number;
  lastUpdated: Date;
}

// Define the LiveCryptoService as a singleton
class LiveCryptoService {
  private static instance: LiveCryptoService;
  private socket: Socket | null = null;
  private listeners: Map<string, (data: CryptoPriceUpdate) => void> = new Map();
  private prices: Map<string, CryptoPrice> = new Map();
  private apiKey: string | null = null;
  private isConnected: boolean = false;
  
  // Private constructor for singleton pattern
  private constructor() {}
  
  // Get the singleton instance
  public static getInstance(): LiveCryptoService {
    if (!LiveCryptoService.instance) {
      LiveCryptoService.instance = new LiveCryptoService();
    }
    return LiveCryptoService.instance;
  }
  
  // Initialize the service with API key
  public initialize(apiKey?: string): void {
    this.apiKey = apiKey || null;
    this.setupSocket();
    this.loadInitialPrices();
  }
  
  // Set up real-time socket connection
  private setupSocket(): void {
    // In a real application, we would connect to a cryptocurrency websocket feed
    // For demonstration, we'll simulate price updates
    setInterval(() => this.simulatePriceUpdates(), 5000);
  }
  
  // Load initial cryptocurrency prices
  private async loadInitialPrices(): Promise<void> {
    try {
      // Try to fetch real data if API key is provided
      if (this.apiKey) {
        const response = await axios.get(
          'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
          {
            headers: {
              'X-CMC_PRO_API_KEY': this.apiKey,
            },
            params: {
              limit: 10,
            },
          }
        );
        
        if (response.data && response.data.data) {
          response.data.data.forEach((crypto: any) => {
            this.prices.set(crypto.symbol, {
              symbol: crypto.symbol,
              name: crypto.name,
              price: crypto.quote.USD.price,
              priceChange24h: crypto.quote.USD.percent_change_24h,
              volume24h: crypto.quote.USD.volume_24h,
              marketCap: crypto.quote.USD.market_cap,
              lastUpdated: new Date(crypto.quote.USD.last_updated),
            });
          });
          this.isConnected = true;
          console.log('Loaded real cryptocurrency prices');
          return;
        }
      }
      
      // Fallback to API request from our backend
      const response = await axios.get('/api/crypto-prices?update=true');
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((crypto: any) => {
          this.prices.set(crypto.symbol, {
            symbol: crypto.symbol,
            name: crypto.name,
            price: parseFloat(crypto.price),
            priceChange24h: crypto.priceChange24h ? parseFloat(crypto.priceChange24h) : 0,
            volume24h: 0,
            marketCap: 0,
            lastUpdated: new Date(crypto.lastUpdated || Date.now()),
          });
        });
        this.isConnected = true;
        console.log('Loaded cryptocurrency prices from backend');
      }
    } catch (error) {
      console.error('Error loading cryptocurrency prices:', error);
      // Initialize with fallback data if both external API and backend fail
      this.initializeFallbackData();
    }
  }
  
  // Initialize with default crypto prices if APIs fail
  private initializeFallbackData(): void {
    // Default cryptocurrencies
    const defaultCryptos = [
      { symbol: 'BTC', name: 'Bitcoin', price: 63250.42, change: 2.1 },
      { symbol: 'ETH', name: 'Ethereum', price: 3477.18, change: 1.8 },
      { symbol: 'SOL', name: 'Solana', price: 137.54, change: 5.3 },
      { symbol: 'ADA', name: 'Cardano', price: 0.57, change: -1.2 },
      { symbol: 'DOT', name: 'Polkadot', price: 7.81, change: 0.9 },
      { symbol: 'AVAX', name: 'Avalanche', price: 38.24, change: 3.4 },
      { symbol: 'LINK', name: 'Chainlink', price: 17.91, change: 2.7 },
      { symbol: 'MATIC', name: 'Polygon', price: 0.72, change: -0.5 },
      { symbol: 'UNI', name: 'Uniswap', price: 8.33, change: 1.1 },
      { symbol: 'NEAR', name: 'NEAR Protocol', price: 5.91, change: 4.2 },
    ];
    
    defaultCryptos.forEach(crypto => {
      this.prices.set(crypto.symbol, {
        symbol: crypto.symbol,
        name: crypto.name,
        price: crypto.price,
        priceChange24h: crypto.change,
        volume24h: Math.random() * 1000000000,
        marketCap: Math.random() * 10000000000,
        lastUpdated: new Date(),
      });
    });
    
    this.isConnected = true;
    console.log('Initialized with fallback cryptocurrency data');
  }
  
  // Simulate real-time price updates
  private simulatePriceUpdates(): void {
    if (!this.isConnected) return;
    
    // Get a random cryptocurrency to update
    const symbols = Array.from(this.prices.keys());
    const randomIndex = Math.floor(Math.random() * symbols.length);
    const symbol = symbols[randomIndex];
    
    // Get the current price
    const currentPrice = this.prices.get(symbol);
    if (!currentPrice) return;
    
    // Generate a small random change (between -2% and +2%)
    const changePercent = (Math.random() * 4 - 2) / 100;
    const newPrice = currentPrice.price * (1 + changePercent);
    
    // Update the price
    this.prices.set(symbol, {
      ...currentPrice,
      price: newPrice,
      lastUpdated: new Date(),
    });
    
    // Notify listeners
    const update: CryptoPriceUpdate = {
      symbol,
      price: newPrice,
      change: changePercent * 100,
      lastUpdated: new Date()
    };
    
    this.notifyListeners(update);
  }
  
  // Notify all listeners of a price update
  private notifyListeners(update: CryptoPriceUpdate): void {
    // Notify symbol-specific listeners
    const listener = this.listeners.get(update.symbol);
    if (listener) {
      listener(update);
    }
    
    // Notify global listeners
    const globalListener = this.listeners.get('*');
    if (globalListener) {
      globalListener(update);
    }
  }
  
  // Subscribe to price updates for a specific cryptocurrency
  public subscribe(symbol: string, callback: (data: CryptoPriceUpdate) => void): () => void {
    this.listeners.set(symbol, callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(symbol);
    };
  }
  
  // Get all current cryptocurrency prices
  public getAllPrices(): CryptoPrice[] {
    return Array.from(this.prices.values());
  }
  
  // Get price for a specific cryptocurrency
  public getPrice(symbol: string): CryptoPrice | undefined {
    return this.prices.get(symbol);
  }
}

// Export singleton instance
export const liveCryptoService = LiveCryptoService.getInstance();