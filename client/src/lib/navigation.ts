/**
 * Navigation utility functions
 * This provides a simple API for navigating between pages without using router components directly
 */

/**
 * Navigate to a path and update browser history
 * @param path The path to navigate to
 * @param options Additional navigation options
 */
export const navigateTo = (path: string, options: { replace?: boolean } = {}): void => {
  if (options.replace) {
    window.history.replaceState(null, '', path);
    // Manually trigger a popstate event to notify our router
    window.dispatchEvent(new PopStateEvent('popstate'));
  } else {
    window.history.pushState(null, '', path);
    // Manually trigger a popstate event to notify our router
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};

/**
 * Generate route paths with parameters 
 */
export const routes = {
  home: () => '/',
  invoices: {
    list: () => '/invoices',
    create: () => '/invoices/create',
    view: (id: string | number) => `/invoices/${id}`
  },
  payments: {
    list: () => '/payments',
    request: () => '/payments/request'
  },
  clients: () => '/clients',
  wallets: () => '/wallets',
  solana: () => '/solana',
  settings: () => '/settings'
};