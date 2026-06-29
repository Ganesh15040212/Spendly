// Client-side Database Schemas and Typings for AsyncStorage & Sync
import { CategoryConfig } from '../utils/helpers';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  profilePicture?: string;
  customCategories?: {
    income: Record<string, CategoryConfig>;
    expense: Record<string, CategoryConfig>;
  };
}

export type WalletType = 
  | 'Cash'
  | 'UPI'
  | 'Net Banking'
  | 'Digital Wallets'
  | 'Pay Later'
  | 'Cheque'
  | 'Credit Card'
  | 'Debit Card'
  | 'AutoPay'
  | 'IMPS'
  | 'Prepaid Payment Instruments (PPIs)'
  | 'NEFT/RTGS'
  | 'EMI'
  | 'QR';

export interface Transaction {
  _id?: string;       // MongoDB Server-side Object ID (synced)
  id: string;         // Local client-side Unique Identifier (offline tracking)
  amount: number;     // Transaction amount (numeric decimal)
  type: 'income' | 'expense'; // Transaction action type
  category: string;   // Category key (e.g. 'Food', 'Salary', etc.)
  wallet: string;     // Wallet source used
  note: string;       // Optional user memo
  date: string;       // ISO Date format: YYYY-MM-DD
  createdAt: string;  // Local timestamp creation string
}

export interface UserConfig {
  _id?: string;
  openingBalance: number; // Starting account balance
}

export interface Budget {
  _id?: string;
  category: string;
  limitAmount: number;
  period: string;      // Format: YYYY-MM
}

export interface Goal {
  _id?: string;
  id?: string;         // Local ID for goals
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;    // Format: YYYY-MM-DD
}

export interface Subscription {
  _id?: string;
  id?: string;         // Local ID for subscriptions
  name: string;
  cost: number;
  period: 'monthly' | 'yearly';
  nextBillingDate: string; // Format: YYYY-MM-DD
}
