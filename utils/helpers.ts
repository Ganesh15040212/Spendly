import { Platform } from 'react-native';

let cachedCurrencySymbol = '₹';
let cachedCurrencyCode = 'INR';
let cachedLocale = 'en-IN';

let cachedCustomIncomeCategories: Record<string, CategoryConfig> = {};
let cachedCustomExpenseCategories: Record<string, CategoryConfig> = {};

export const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

export const getMergedWallets = (): string[] => {
  return [
    'Cash',
    'UPI',
    'Net Banking',
    'Digital Wallets',
    'Pay Later',
    'Cheque',
    'Credit Card',
    'Debit Card',
    'AutoPay',
    'IMPS',
    'Prepaid Payment Instruments (PPIs)',
    'NEFT/RTGS',
    'EMI',
    'QR'
  ];
};

export const setCachedCustomCategories = (
  income: Record<string, CategoryConfig>,
  expense: Record<string, CategoryConfig>
) => {
  cachedCustomIncomeCategories = income || {};
  cachedCustomExpenseCategories = expense || {};
};

export const setCachedCurrency = (symbol: string) => {
  cachedCurrencySymbol = symbol || '₹';
  if (symbol === '₹') {
    cachedCurrencyCode = 'INR';
    cachedLocale = 'en-IN';
  } else if (symbol === '$') {
    cachedCurrencyCode = 'USD';
    cachedLocale = 'en-US';
  } else if (symbol === '€') {
    cachedCurrencyCode = 'EUR';
    cachedLocale = 'en-IE';
  } else if (symbol === '£') {
    cachedCurrencyCode = 'GBP';
    cachedLocale = 'en-GB';
  } else if (symbol === '¥') {
    cachedCurrencyCode = 'JPY';
    cachedLocale = 'ja-JP';
  } else {
    cachedCurrencyCode = 'INR';
    cachedLocale = 'en-IN';
  }
};

export const getCachedCurrencySymbol = () => cachedCurrencySymbol;

// Standard Currency Formatter (Dynamic format based on configuration)
export const formatCurrency = (amount: number) => {
  try {
    return new Intl.NumberFormat(cachedLocale, {
      style: 'currency',
      currency: cachedCurrencyCode,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    // Fallback for environments where Intl is not fully supported
    return `${cachedCurrencySymbol}${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  }
};

// Date Format Helpers
export const getTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateString = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  // Format to standard human-readable format e.g. "Jun 23, 2026"
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Category details
export interface CategoryConfig {
  name: string;
  icon: string;
  color: string;
}

export const INCOME_CATEGORIES: Record<string, CategoryConfig> = {
  Salary: { name: 'Salary', icon: 'wallet-outline', color: '#10b981' }, // Emerald
  Bonus: { name: 'Bonus', icon: 'gift-outline', color: '#3b82f6' }, // Blue
  Business: { name: 'Business', icon: 'briefcase-outline', color: '#f59e0b' }, // Amber
  PeerShare: { name: 'Peer Transfer', icon: 'people-outline', color: '#8b5cf6' }, // Violet
  Freelance: { name: 'Freelance', icon: 'laptop-outline', color: '#06b6d4' }, // Cyan
  Investments: { name: 'Investments', icon: 'trending-up-outline', color: '#10b981' }, // Emerald
  RentIncome: { name: 'Rental Income', icon: 'home-outline', color: '#a855f7' }, // Purple
  Refund: { name: 'Refunds/Cashback', icon: 'arrow-undo-outline', color: '#14b8a6' }, // Teal
  Other: { name: 'Other', icon: 'cash-outline', color: '#64748b' }, // Slate
};

export const EXPENSE_CATEGORIES: Record<string, CategoryConfig> = {
  Food: { name: 'Food', icon: 'restaurant-outline', color: '#f59e0b' }, // Amber
  Travel: { name: 'Travel', icon: 'car-outline', color: '#06b6d4' }, // Cyan
  Shopping: { name: 'Shopping', icon: 'cart-outline', color: '#ec4899' }, // Pink
  Medical: { name: 'Medical', icon: 'medical-outline', color: '#ef4444' }, // Red
  Entertainment: { name: 'Entertainment', icon: 'play-circle-outline', color: '#8b5cf6' }, // Violet
  Bills: { name: 'Bills', icon: 'receipt-outline', color: '#3b82f6' }, // Blue
  Groceries: { name: 'Groceries', icon: 'basket-outline', color: '#10b981' }, // Emerald
  Fuel: { name: 'Fuel', icon: 'speedometer-outline', color: '#f59e0b' }, // Amber
  Education: { name: 'Education', icon: 'book-outline', color: '#6366f1' }, // Indigo
  Subscriptions: { name: 'Subscriptions', icon: 'repeat-outline', color: '#ff007f' }, // Rose Pink
  RentEMI: { name: 'Rent & Loans', icon: 'home-outline', color: '#f43f5e' }, // Rose Red
  Insurance: { name: 'Insurance', icon: 'shield-checkmark-outline', color: '#0ea5e9' }, // Sky Blue
  GiftsCharity: { name: 'Gifts & Charity', icon: 'heart-outline', color: '#ec4899' }, // Pink
  Taxes: { name: 'Taxes', icon: 'calculator-outline', color: '#dc2626' }, // Dark Red
  Other: { name: 'Other', icon: 'options-outline', color: '#64748b' }, // Slate
};

export const getCategoryConfig = (category: string, type: 'income' | 'expense'): CategoryConfig => {
  const staticMap = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const customMap = type === 'income' ? cachedCustomIncomeCategories : cachedCustomExpenseCategories;
  return staticMap[category] || customMap[category] || { name: category, icon: 'help-circle-outline', color: '#64748b' };
};

export const getMergedCategories = (type: 'income' | 'expense'): Record<string, CategoryConfig> => {
  const staticMap = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const customMap = type === 'income' ? cachedCustomIncomeCategories : cachedCustomExpenseCategories;
  return { ...staticMap, ...customMap };
};

// Date Range Filter Helpers
export const getStartAndEndDates = (filterType: 'today' | 'weekly' | 'monthly' | 'all') => {
  const today = new Date();
  
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDate(today);

  if (filterType === 'today') {
    return { startDate: todayStr, endDate: todayStr };
  }

  if (filterType === 'weekly') {
    // Current week start (Monday)
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diff));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    return { startDate: formatDate(startOfWeek), endDate: formatDate(endOfWeek) };
  }

  if (filterType === 'monthly') {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { startDate: formatDate(startOfMonth), endDate: formatDate(endOfMonth) };
  }

  return { startDate: '', endDate: '' };
};

// Local AI Natural Language Parser for Voice and Text entry
export interface ParsedTransaction {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  note: string;
}

export const parseNaturalLanguageTransaction = (text: string): ParsedTransaction => {
  const lowercaseText = text.toLowerCase();
  
  // 1. Extract amount
  // Matches "₹300", "Rs 500", "300 rupees", "300.50", "25000", etc.
  const amountRegex = /(?:rs\.?|rupees?|₹)?\s*(\d+(?:\.\d{1,2})?)/i;
  const match = lowercaseText.match(amountRegex);
  let amount = 0;
  if (match && match[1]) {
    amount = parseFloat(match[1]);
  } else {
    // Try to find any standalone number
    const fallbackMatch = lowercaseText.match(/\b\d+(?:\.\d{1,2})?\b/);
    if (fallbackMatch) {
      amount = parseFloat(fallbackMatch[0]);
    }
  }

  // 2. Determine Type (Default to expense)
  let type: 'income' | 'expense' = 'expense';
  const incomeKeywords = [
    'received', 'salary', 'income', 'add', 'bonus', 'freelance', 'business', 
    'got', 'earn', 'earned', 'peer', 'transfer', 'shared', 'gifted', 'deposit'
  ];
  
  if (incomeKeywords.some(keyword => lowercaseText.includes(keyword))) {
    type = 'income';
  }

  // 3. Determine Category based on keywords
  let category = 'Other';

  if (type === 'expense') {
    if (/(food|swiggy|zomato|dinner|lunch|restaurant|eat|cafe|grocer|pizza)/i.test(lowercaseText)) {
      category = 'Food';
    } else if (/(travel|petrol|fuel|cab|taxi|uber|ola|bus|train|flight|auto|ticket|metro)/i.test(lowercaseText)) {
      category = 'Travel';
    } else if (/(shop|shopping|amazon|flipkart|clothes|shoes|watch|mall|bought|buy)/i.test(lowercaseText)) {
      category = 'Shopping';
    } else if (/(medical|doctor|hospital|medicine|pharmacy|pill|dentist|health|fortis|apollo)/i.test(lowercaseText)) {
      category = 'Medical';
    } else if (/(movie|cinema|netflix|spotify|hotstar|prime|game|entertainment|play|match)/i.test(lowercaseText)) {
      category = 'Entertainment';
    } else if (/(bill|recharge|phone|electricity|water|wifi|broadband|rent|insurance)/i.test(lowercaseText)) {
      category = 'Bills';
    }
  } else {
    // Income Categories
    if (/(salary|paycheck|monthly salary)/i.test(lowercaseText)) {
      category = 'Salary';
    } else if (/(bonus|extra)/i.test(lowercaseText)) {
      category = 'Bonus';
    } else if (/(business|profit|sale|client)/i.test(lowercaseText)) {
      category = 'Business';
    } else if (/(peer|friend|share|wallet|transfer|sent|gave|shared|people)/i.test(lowercaseText)) {
      category = 'Peer Transfer';
    }
  }

  // 4. Note is the input text capitalized nicely
  const note = text.charAt(0).toUpperCase() + text.slice(1);

  return {
    amount,
    type,
    category,
    note,
  };
};
