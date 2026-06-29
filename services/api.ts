import { Platform } from 'react-native';
import { StorageService } from './storage';
import { Transaction, Budget, Goal, Subscription } from '../database/schema';
import { setCachedCurrency, setCachedCustomCategories } from '../utils/helpers';

// Define your production Render backend API URL here
const PROD_API_URL = 'https://spendly-632z.onrender.com/api';

// Automatically detect host IP based on emulator platform
const API_URL = !__DEV__
  ? PROD_API_URL
  : Platform.select({
      android: 'http://192.168.21.250:5000/api',
      ios: 'http://192.168.21.250:5000/api',
      default: 'http://localhost:5000/api',
    }) || 'http://localhost:5000/api';

const fetchWithTimeoutAndRetry = async (
  url: string,
  options: RequestInit,
  retries = 3,
  delayMs = 3000
): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      console.warn(`Connection attempt ${i + 1} failed:`, error.message || error);
      if (i === retries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Connection failed after multiple attempts');
};

export const ApiService = {
  // 1. User Registration
  register: async (name: string, email: string, password: string, phone: string) => {
    let response: Response | null = null;
    try {
      response = await fetchWithTimeoutAndRetry(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      }, 3, 3000);
    } catch (networkError: any) {
      console.warn('Server registration connection refused, entering local offline mode:', networkError.message);
      // Fallback: Create offline user profile locally in AsyncStorage
      const offlineUser = {
        id: 'local_offline_user_' + Date.now(),
        name,
        email,
        phone,
        role: 'user' as const,
      };
      await StorageService.setAuthToken('local_offline_token');
      await StorageService.setUserProfile(offlineUser);
      return { success: true as const, user: offlineUser, offline: true, error: undefined };
    }

    try {
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {
          success: false as const,
          error: 'The server returned an invalid HTML response. Please verify your backend server is running and your IP is configured correctly.',
          user: undefined,
          offline: undefined
        };
      }
      const result = await response.json();
      if (!response.ok) {
        return { success: false as const, error: result.error || 'Registration failed', user: undefined, offline: undefined };
      }
      // Save session credentials
      await StorageService.setAuthToken(result.token);
      await StorageService.setUserProfile(result.user);
      if (result.user.profilePicture) {
        await StorageService.setProfilePicture(result.user.profilePicture);
      }
      if (result.user.customCategories) {
        await StorageService.saveCustomCategories(result.user.customCategories);
        setCachedCustomCategories(result.user.customCategories.income, result.user.customCategories.expense);
      }
      return { success: true as const, user: result.user, offline: false, error: undefined };
    } catch (e: any) {
      return { success: false as const, error: e.message || 'Registration failed', user: undefined, offline: undefined };
    }
  },

  // 2. User Login
  login: async (email: string, password: string) => {
    let response: Response | null = null;
    try {
      response = await fetchWithTimeoutAndRetry(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }, 3, 3000);
    } catch (networkError: any) {
      console.warn('Server login connection refused, checking cached profile:', networkError.message);
      // Fallback: Check if a local profile matches this email to authenticate offline
      const cachedProfile = await StorageService.getUserProfile();
      if (cachedProfile && cachedProfile.email.toLowerCase() === email.toLowerCase()) {
        await StorageService.setAuthToken('local_offline_token');
        return { success: true as const, user: cachedProfile, offline: true, error: undefined };
      }
      return { 
        success: false as const, 
        error: 'Could not connect to server. If the server was sleeping (Render Free Tier), it takes about 50 seconds to wake up. Please wait a moment and try signing in again.',
        user: undefined,
        offline: undefined
      };
    }

    try {
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {
          success: false as const,
          error: 'The server returned an invalid HTML response. Please verify your backend server is running and your IP is configured correctly.',
          user: undefined,
          offline: undefined
        };
      }
      const result = await response.json();
      if (!response.ok) {
        return { success: false as const, error: result.error || 'Login failed', user: undefined, offline: undefined };
      }
      // Save session credentials
      await StorageService.setAuthToken(result.token);
      await StorageService.setUserProfile(result.user);
      if (result.user.profilePicture) {
        await StorageService.setProfilePicture(result.user.profilePicture);
      }
      if (result.user.customCategories) {
        await StorageService.saveCustomCategories(result.user.customCategories);
        setCachedCustomCategories(result.user.customCategories.income, result.user.customCategories.expense);
      }
      return { success: true as const, user: result.user, offline: false, error: undefined };
    } catch (e: any) {
      return { success: false as const, error: e.message || 'Login failed', user: undefined, offline: undefined };
    }
  },

  // 3. Sync all local data with backend server
  syncData: async (initialPull = false): Promise<{ success: boolean; message: string }> => {
    try {
      const token = await StorageService.getAuthToken();
      if (!token) return { success: false, message: 'User not logged in.' };

      const transactions = await StorageService.getTransactions();
      const budgets = await StorageService.getBudgets();
      const goals = await StorageService.getGoals();
      const subscriptions = await StorageService.getSubscriptions();
      const openingBalance = await StorageService.getOpeningBalance();
      const profilePicture = await StorageService.getProfilePicture();
      const customCategories = await StorageService.getCustomCategories();

      const response = await fetchWithTimeoutAndRetry(`${API_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactions,
          budgets,
          goals,
          subscriptions,
          openingBalance,
          profilePicture,
          customCategories,
          initialPull,
        }),
      }, 2, 2000);

      if (!response.ok) {
        throw new Error(`Sync failed with status code ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Map transaction records back to local storage
        const syncedTransactions: Transaction[] = result.transactions.map((t: any) => ({
          _id: t._id,
          id: t.id || t._id,
          amount: t.amount,
          type: t.type,
          category: t.category,
          wallet: t.wallet || 'Cash',
          note: t.note,
          date: t.date,
          createdAt: t.createdAt || new Date().toISOString(),
        }));
        await StorageService.saveTransactionsList(syncedTransactions);

        // Map budget records
        const syncedBudgets: Budget[] = result.budgets.map((b: any) => ({
          _id: b._id,
          category: b.category,
          limitAmount: b.limitAmount,
          period: b.period,
        }));
        await StorageService.saveBudgetsList(syncedBudgets);

        // Map savings goals records
        const syncedGoals: Goal[] = result.goals.map((g: any) => ({
          _id: g._id,
          id: g.id || g._id,
          name: g.name,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          deadline: g.deadline,
        }));
        await StorageService.saveGoalsList(syncedGoals);

        // Map subscription records
        const syncedSubs: Subscription[] = result.subscriptions.map((s: any) => ({
          _id: s._id,
          id: s.id || s._id,
          name: s.name,
          cost: s.cost,
          period: s.period || 'monthly',
          nextBillingDate: s.nextBillingDate,
        }));
        await StorageService.saveSubscriptionsList(syncedSubs);
        
        if (result.config && typeof result.config.openingBalance === 'number') {
          await StorageService.setOpeningBalance(result.config.openingBalance);
        }

        if (result.profilePicture) {
          await StorageService.setProfilePicture(result.profilePicture);
        }
        if (result.customCategories) {
          await StorageService.saveCustomCategories(result.customCategories);
          setCachedCustomCategories(result.customCategories.income, result.customCategories.expense);
        }

        return { success: true, message: 'Sync completed successfully!' };
      }

      return { success: false, message: 'Sync failed on server side.' };
    } catch (error: any) {
      console.warn('API Sync Error:', error.message);
      return { 
        success: false, 
        message: 'Could not connect to server. Running in offline mode.' 
      };
    }
  },

  // 4. Fetch Admin Statistics
  getAdminStats: async () => {
    try {
      const token = await StorageService.getAuthToken();
      if (!token) return { success: false, error: 'User not logged in' };

      const response = await fetch(`${API_URL}/admin/stats`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch admin stats');
      }

      return { success: true, stats: result.stats, users: result.users };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Reset all user data in the database
  resetData: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const token = await StorageService.getAuthToken();
      if (!token) return { success: false, message: 'User not logged in.' };

      const response = await fetch(`${API_URL}/auth/reset-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Reset failed with status code ${response.status}`);
      }

      const result = await response.json();
      return { success: result.success, message: result.message || 'Reset completed' };
    } catch (e: any) {
      console.warn('API reset failed:', e.message);
      return { success: false, message: e.message || 'Reset failed' };
    }
  },

  // Health check to test server connection
  testConnection: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }
};
