import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Budget, Goal, Subscription, User } from '../database/schema';
import { CategoryConfig, setCachedCustomCategories } from '../utils/helpers';

const KEYS = {
  TRANSACTIONS: '@spendly_transactions',
  OPENING_BALANCE: '@spendly_opening_balance',
  AUTH_TOKEN: '@spendly_auth_token',
  USER_PROFILE: '@spendly_user_profile',
  BUDGETS: '@spendly_budgets',
  GOALS: '@spendly_goals',
  SUBSCRIPTIONS: '@spendly_subscriptions',
  THEME_MODE: '@spendly_theme_mode',
  CURRENCY_SYMBOL: '@spendly_currency_symbol',
  PROFILE_PICTURE: '@spendly_profile_picture',
  CUSTOM_CATEGORIES: '@spendly_custom_categories',
};

export const generateUUID = (): string => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

export const StorageService = {
  // Authentication Storage
  getAuthToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
  },

  setAuthToken: async (token: string): Promise<void> => {
    await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
  },

  getUserProfile: async (): Promise<User | null> => {
    const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : null;
  },

  setUserProfile: async (user: User): Promise<void> => {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(user));
  },

  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(KEYS.USER_PROFILE);
      await AsyncStorage.removeItem(KEYS.TRANSACTIONS);
      await AsyncStorage.removeItem(KEYS.OPENING_BALANCE);
      await AsyncStorage.removeItem(KEYS.BUDGETS);
      await AsyncStorage.removeItem(KEYS.GOALS);
      await AsyncStorage.removeItem(KEYS.SUBSCRIPTIONS);
      await AsyncStorage.removeItem(KEYS.CUSTOM_CATEGORIES);
      
      // Reset custom category memory caches
      setCachedCustomCategories({}, {});
    } catch (e) {
      console.error('Failed to clear storage during logout', e);
    }
  },

  // User Settings Preferences
  getThemeMode: async (): Promise<'light' | 'dark'> => {
    const mode = await AsyncStorage.getItem(KEYS.THEME_MODE);
    return (mode as 'light' | 'dark') || 'light';
  },
  setThemeMode: async (mode: 'light' | 'dark'): Promise<void> => {
    await AsyncStorage.setItem(KEYS.THEME_MODE, mode);
  },

  getCurrencySymbol: async (): Promise<string> => {
    return (await AsyncStorage.getItem(KEYS.CURRENCY_SYMBOL)) || '₹';
  },
  setCurrencySymbol: async (symbol: string): Promise<void> => {
    await AsyncStorage.setItem(KEYS.CURRENCY_SYMBOL, symbol);
  },

  getProfilePicture: async (): Promise<string> => {
    return (await AsyncStorage.getItem(KEYS.PROFILE_PICTURE)) || 'avatar1';
  },
  setProfilePicture: async (avatar: string): Promise<void> => {
    await AsyncStorage.setItem(KEYS.PROFILE_PICTURE, avatar);
  },

  // Opening Balance Storage
  getOpeningBalance: async (): Promise<number> => {
    try {
      const balance = await AsyncStorage.getItem(KEYS.OPENING_BALANCE);
      return balance ? parseFloat(balance) : 0;
    } catch (e) {
      return 0;
    }
  },

  setOpeningBalance: async (balance: number): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.OPENING_BALANCE, balance.toString());
    } catch (e) {
      console.error('Failed to save opening balance', e);
    }
  },

  // Transactions CRUD
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
      if (!data) return [];
      const parsed = JSON.parse(data) as Transaction[];
      return parsed.sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        return b.createdAt.localeCompare(a.createdAt);
      });
    } catch (e) {
      return [];
    }
  },

  saveTransactionsList: async (transactions: Transaction[]): Promise<void> => {
    await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  addTransaction: async (transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
    const transactions = await StorageService.getTransactions();
    const newTransaction: Transaction = {
      ...transactionData,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    transactions.unshift(newTransaction);
    await StorageService.saveTransactionsList(transactions);
    return newTransaction;
  },

  updateTransaction: async (id: string, updatedData: Partial<Transaction>): Promise<Transaction | null> => {
    const transactions = await StorageService.getTransactions();
    const index = transactions.findIndex(t => t.id === id || (t._id && t._id === id));
    if (index === -1) return null;

    const updatedTransaction = {
      ...transactions[index],
      ...updatedData,
    };
    transactions[index] = updatedTransaction;
    await StorageService.saveTransactionsList(transactions);
    return updatedTransaction;
  },

  deleteTransaction: async (id: string): Promise<boolean> => {
    const transactions = await StorageService.getTransactions();
    const filtered = transactions.filter(t => t.id !== id && (!t._id || t._id !== id));
    if (filtered.length === transactions.length) return false;
    await StorageService.saveTransactionsList(filtered);
    return true;
  },

  // Budgets Storage
  getBudgets: async (): Promise<Budget[]> => {
    const data = await AsyncStorage.getItem(KEYS.BUDGETS);
    return data ? JSON.parse(data) : [];
  },

  saveBudgetsList: async (budgets: Budget[]): Promise<void> => {
    await AsyncStorage.setItem(KEYS.BUDGETS, JSON.stringify(budgets));
  },

  addOrUpdateBudget: async (budgetData: Budget): Promise<Budget> => {
    const budgets = await StorageService.getBudgets();
    const idx = budgets.findIndex(
      b => b.category === budgetData.category && b.period === budgetData.period
    );
    if (idx > -1) {
      budgets[idx] = budgetData;
    } else {
      budgets.push(budgetData);
    }
    await StorageService.saveBudgetsList(budgets);
    return budgetData;
  },

  deleteBudget: async (category: string, period: string): Promise<void> => {
    const budgets = await StorageService.getBudgets();
    const filtered = budgets.filter(b => b.category !== category || b.period !== period);
    await StorageService.saveBudgetsList(filtered);
  },

  // Savings Goals Storage
  getGoals: async (): Promise<Goal[]> => {
    const data = await AsyncStorage.getItem(KEYS.GOALS);
    return data ? JSON.parse(data) : [];
  },

  saveGoalsList: async (goals: Goal[]): Promise<void> => {
    await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
  },

  addGoal: async (goalData: Omit<Goal, 'id'>): Promise<Goal> => {
    const goals = await StorageService.getGoals();
    const newGoal: Goal = {
      ...goalData,
      id: generateUUID(),
    };
    goals.push(newGoal);
    await StorageService.saveGoalsList(goals);
    return newGoal;
  },

  updateGoal: async (id: string, updatedData: Partial<Goal>): Promise<Goal | null> => {
    const goals = await StorageService.getGoals();
    const idx = goals.findIndex(g => g.id === id || (g._id && g._id === id));
    if (idx === -1) return null;
    const updated = { ...goals[idx], ...updatedData };
    goals[idx] = updated;
    await StorageService.saveGoalsList(goals);
    return updated;
  },

  deleteGoal: async (id: string): Promise<void> => {
    const goals = await StorageService.getGoals();
    const filtered = goals.filter(g => g.id !== id && (!g._id || g._id !== id));
    await StorageService.saveGoalsList(filtered);
  },

  // Subscriptions Storage
  getSubscriptions: async (): Promise<Subscription[]> => {
    const data = await AsyncStorage.getItem(KEYS.SUBSCRIPTIONS);
    return data ? JSON.parse(data) : [];
  },

  saveSubscriptionsList: async (subs: Subscription[]): Promise<void> => {
    await AsyncStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
  },

  addSubscription: async (subData: Omit<Subscription, 'id'>): Promise<Subscription> => {
    const subs = await StorageService.getSubscriptions();
    const newSub: Subscription = {
      ...subData,
      id: generateUUID(),
    };
    subs.push(newSub);
    await StorageService.saveSubscriptionsList(subs);
    return newSub;
  },

  deleteSubscription: async (id: string): Promise<void> => {
    const subs = await StorageService.getSubscriptions();
    const filtered = subs.filter(s => s.id !== id && (!s._id || s._id !== id));
    await StorageService.saveSubscriptionsList(filtered);
  },

  // Reset all user financial data but keep authentication
  resetUserData: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.TRANSACTIONS);
      await AsyncStorage.removeItem(KEYS.OPENING_BALANCE);
      await AsyncStorage.removeItem(KEYS.BUDGETS);
      await AsyncStorage.removeItem(KEYS.GOALS);
      await AsyncStorage.removeItem(KEYS.SUBSCRIPTIONS);
    } catch (e) {
      console.error('Failed to reset user data', e);
    }
  },

  // Custom Categories
  getCustomCategories: async (): Promise<{ income: Record<string, CategoryConfig>; expense: Record<string, CategoryConfig> }> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.CUSTOM_CATEGORIES);
      const parsed = data ? JSON.parse(data) : null;
      return {
        income: (parsed && parsed.income) ? parsed.income : {},
        expense: (parsed && parsed.expense) ? parsed.expense : {},
      };
    } catch (e) {
      return { income: {}, expense: {} };
    }
  },

  addCustomCategory: async (type: 'income' | 'expense', category: CategoryConfig): Promise<void> => {
    try {
      const data = await StorageService.getCustomCategories();
      if (!data[type]) {
        data[type] = {};
      }
      data[type][category.name] = category;
      await AsyncStorage.setItem(KEYS.CUSTOM_CATEGORIES, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to add custom category', e);
      throw e;
    }
  },

  deleteCustomCategory: async (type: 'income' | 'expense', categoryName: string): Promise<void> => {
    try {
      const data = await StorageService.getCustomCategories();
      if (data[type] && data[type][categoryName]) {
        delete data[type][categoryName];
        await AsyncStorage.setItem(KEYS.CUSTOM_CATEGORIES, JSON.stringify(data));
      }
    } catch (e) {
      console.error('Failed to delete custom category', e);
    }
  },

  saveCustomCategories: async (cats: { income: Record<string, CategoryConfig>; expense: Record<string, CategoryConfig> }): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.CUSTOM_CATEGORIES, JSON.stringify(cats));
    } catch (e) {
      console.error('Failed to save custom categories', e);
    }
  },

  // Clear all configurations
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.TRANSACTIONS);
      await AsyncStorage.removeItem(KEYS.OPENING_BALANCE);
      await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(KEYS.USER_PROFILE);
      await AsyncStorage.removeItem(KEYS.BUDGETS);
      await AsyncStorage.removeItem(KEYS.GOALS);
      await AsyncStorage.removeItem(KEYS.SUBSCRIPTIONS);
      await AsyncStorage.removeItem(KEYS.CUSTOM_CATEGORIES);
    } catch (e) {
      console.error('Failed to clear storage', e);
    }
  },
};
