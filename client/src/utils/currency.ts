/**
 * Format a SOL amount with proper decimal places
 * @param amount The SOL amount to format (number or string)
 * @returns Formatted SOL string
 */
export function formatSOL(amount: number | string): string {
  // Convert string to number if needed
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle invalid or NaN values
  if (isNaN(numericAmount)) return '0.00';
  
  return numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
}

/**
 * Format a number as currency with proper crypto or fiat formatting
 * @param amount The amount to format (number or string)
 * @param currency The currency code (e.g., 'SOL', 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  // Convert string to number if needed
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle invalid or NaN values
  if (isNaN(numericAmount)) return currency === 'SOL' ? '0.00 SOL' : '$0.00';
  
  // Handle cryptocurrency formatting
  if (currency === 'SOL') {
    return `${formatSOL(numericAmount)} SOL`;
  }

  // Handle fiat currency formatting
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  });

  return currencyFormatter.format(numericAmount);
}

/**
 * Format a wallet address for display (truncating the middle)
 * @param address The full wallet address
 * @returns Formatted address string
 */
export function formatWalletAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Convert between different currencies
 * @param amount The amount to convert
 * @param fromCurrency The source currency
 * @param toCurrency The target currency
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string
): number {
  // For now, using a fixed exchange rate of 80 USD per SOL
  const exchangeRate = 80;

  if (fromCurrency === 'SOL' && toCurrency === 'USD') {
    return amount * exchangeRate;
  } else if (fromCurrency === 'USD' && toCurrency === 'SOL') {
    return amount / exchangeRate;
  }

  // If currencies are the same, return unchanged
  return amount;
}