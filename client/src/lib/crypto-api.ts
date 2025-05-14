import { CryptoPrice } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Fetch all available crypto prices
export const fetchCryptoPrices = async (forceUpdate = false): Promise<CryptoPrice[]> => {
  try {
    const endpoint = forceUpdate ? "/api/crypto-prices?update=true" : "/api/crypto-prices";
    const response = await fetch(endpoint, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch crypto prices: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    throw error;
  }
};

// Fetch a specific crypto price by symbol
export const fetchCryptoPrice = async (symbol: string): Promise<CryptoPrice> => {
  try {
    const response = await fetch(`/api/crypto-prices/${symbol}`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch crypto price: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching crypto price for ${symbol}:`, error);
    throw error;
  }
};

// Convert between currencies
export interface ConversionResult {
  from: {
    currency: string;
    amount: number;
  };
  to: {
    currency: string;
    amount: number;
  };
}

export const convertCurrency = async (
  amount: string | number,
  fromCurrency: string,
  toCurrency: string
): Promise<ConversionResult> => {
  try {
    const response = await apiRequest(
      "POST",
      "/api/convert",
      {
        amount: amount.toString(),
        fromCurrency,
        toCurrency,
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error converting currency:", error);
    throw error;
  }
};

// Get fiat equivalent for a crypto amount
export const getCryptoFiatValue = async (
  cryptoAmount: number,
  cryptoSymbol: string,
  fiatCurrency = "USD"
): Promise<number> => {
  try {
    const result = await convertCurrency(
      cryptoAmount,
      cryptoSymbol,
      fiatCurrency
    );
    return result.to.amount;
  } catch (error) {
    console.error(`Error getting fiat value for ${cryptoSymbol}:`, error);
    throw error;
  }
};

// Get crypto equivalent for a fiat amount
export const getFiatCryptoValue = async (
  fiatAmount: number,
  cryptoSymbol: string,
  fiatCurrency = "USD"
): Promise<number> => {
  try {
    const result = await convertCurrency(
      fiatAmount,
      fiatCurrency,
      cryptoSymbol
    );
    return result.to.amount;
  } catch (error) {
    console.error(`Error getting crypto value for ${fiatCurrency}:`, error);
    throw error;
  }
};
