/**
 * Format a number as currency with proper crypto or fiat formatting
 * @param amount The amount to format
 * @param currency The currency code (e.g., 'SOL', 'USD')
 * @param options Additional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'SOL',
  options: {
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
    showSymbol?: boolean;
  } = {}
): string {
  const {
    maximumFractionDigits = currency === 'SOL' ? 4 : 2,
    minimumFractionDigits = 2,
    showSymbol = true
  } = options;

  // Handle cryptocurrency formatting
  if (currency === 'SOL') {
    const formattedAmount = amount.toLocaleString('en-US', {
      maximumFractionDigits,
      minimumFractionDigits
    });
    return showSymbol ? `${formattedAmount} SOL` : formattedAmount;
  }

  // Handle fiat currency formatting
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: currency,
    maximumFractionDigits,
    minimumFractionDigits
  });

  return currencyFormatter.format(amount);
}

/**
 * Format a wallet address for display (truncating the middle)
 * @param address The full wallet address
 * @param start Number of characters to show at start
 * @param end Number of characters to show at end
 * @returns Formatted address string
 */
export function formatWalletAddress(
  address: string,
  start: number = 6,
  end: number = 4
): string {
  if (!address) return '';
  if (address.length <= start + end) return address;
  
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Get real-time SOL to USD conversion
 * Uses the API to get current rates
 * @param solAmount Amount in SOL
 * @returns Converted USD amount
 */
export async function convertSolToUsd(solAmount: number): Promise<number> {
  try {
    const response = await fetch('/api/solana/price');
    const data = await response.json();
    return solAmount * data.price;
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    return solAmount * 80; // Fallback to approximate value
  }
}

/**
 * Format a timestamp to a readable date
 * @param timestamp The timestamp to format
 * @param includeTime Whether to include the time
 * @returns Formatted date string
 */
export function formatDate(
  timestamp: number | Date,
  includeTime: boolean = false
): string {
  const date = new Date(timestamp);
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  };
  
  return date.toLocaleDateString('en-US', options);
}