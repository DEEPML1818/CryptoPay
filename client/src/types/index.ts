import { Invoice, Transaction, User, Contact } from "@shared/schema";

export type InvoiceWithRecipient = Invoice & {
  recipient?: {
    name: string;
    walletAddress?: string;
  };
};

export type TransactionWithDetails = Transaction & {
  title: string;
  subtitle: string;
};

export interface WalletState {
  connected: boolean;
  address?: string;
  balance?: number;
  connecting: boolean;
  error?: string;
  isPhantomWallet?: boolean;
}

export interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export type StatusType = "draft" | "pending" | "paid" | "released" | "refunded" | "overdue";

export interface StatusConfig {
  color: string;
  bgColor: string;
  darkBgColor: string;
  darkTextColor: string;
  label: string;
}

export const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  draft: {
    color: "text-blue-800",
    bgColor: "bg-blue-100",
    darkBgColor: "dark:bg-blue-900",
    darkTextColor: "dark:text-blue-200",
    label: "Draft"
  },
  pending: {
    color: "text-yellow-800",
    bgColor: "bg-yellow-100",
    darkBgColor: "dark:bg-yellow-900",
    darkTextColor: "dark:text-yellow-200",
    label: "Pending"
  },
  paid: {
    color: "text-green-800",
    bgColor: "bg-green-100",
    darkBgColor: "dark:bg-green-900",
    darkTextColor: "dark:text-green-200",
    label: "Paid"
  },
  released: {
    color: "text-purple-800",
    bgColor: "bg-purple-100",
    darkBgColor: "dark:bg-purple-900",
    darkTextColor: "dark:text-purple-200",
    label: "Released"
  },
  refunded: {
    color: "text-gray-800",
    bgColor: "bg-gray-100",
    darkBgColor: "dark:bg-gray-700",
    darkTextColor: "dark:text-gray-200",
    label: "Refunded"
  },
  overdue: {
    color: "text-red-800",
    bgColor: "bg-red-100",
    darkBgColor: "dark:bg-red-900",
    darkTextColor: "dark:text-red-200",
    label: "Overdue"
  }
};
