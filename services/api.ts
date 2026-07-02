import { Platform } from 'react-native';
import { StorageService } from './storage';
import { Transaction, Budget, Goal, Subscription } from '../database/schema';
import { setCachedCurrency, setCachedCustomCategories } from '../utils/helpers';

// Polyfill global.crypto.getRandomValues for crypto-js in React Native (Hermes)
if (typeof global.crypto !== 'object') {
  global.crypto = {} as any;
}
if (typeof global.crypto.getRandomValues !== 'function') {
  global.crypto.getRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
    if (array) {
      const view = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      for (let i = 0; i < view.length; i++) {
        view[i] = Math.floor(Math.random() * 256);
      }
    }
    return array;
  };
}

import CryptoJS from 'crypto-js';

// Define your production Render backend API URL here
const PROD_API_URL = 'https://spendly-632z.onrender.com/api';

// Set API URL to production
const API_URL = PROD_API_URL;

export const ApiService = {
  // 1. User Registration
  register: async (name: string, email: string, password: string, phone: string) => {
    let response: Response | null = null;
    try {
      response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });
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
      response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
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
        error: 'Could not connect to server. If you do not have a local account, please Sign Up to run offline.',
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

  // 3. Sync all local data with backend server (Client-Side Encrypted Backup & Restore)
  syncData: async (initialPull = false): Promise<{ success: boolean; message: string }> => {
    try {
      const token = await StorageService.getAuthToken();
      if (!token) return { success: false, message: 'User not logged in.' };

      const profile = await StorageService.getUserProfile();
      if (!profile || !profile.id) return { success: false, message: 'User profile not loaded.' };
      
      const userId = profile.id; // Unique encryption key per user

      // Pull/Restore flow on fresh installations
      if (initialPull) {
        const response = await fetch(`${API_URL}/auth/backup`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log('No cloud backup found on server (404). Starting with clean local storage.');
            return { success: true, message: 'No server backup found. Running locally.' };
          }
          throw new Error(`Restore failed with status code ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.backupData) {
          try {
            // Decrypt backup payload using user's unique ID
            const bytes = CryptoJS.AES.decrypt(result.backupData, userId);
            const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
            if (decryptedText) {
              const data = JSON.parse(decryptedText);

              // Restore user records locally
              if (data.transactions) await StorageService.saveTransactionsList(data.transactions);
              if (data.budgets) await StorageService.saveBudgetsList(data.budgets);
              if (data.goals) await StorageService.saveGoalsList(data.goals);
              if (data.subscriptions) await StorageService.saveSubscriptionsList(data.subscriptions);
              if (typeof data.openingBalance === 'number') await StorageService.setOpeningBalance(data.openingBalance);
              if (data.profilePicture) await StorageService.setProfilePicture(data.profilePicture);
              if (data.customCategories) {
                await StorageService.saveCustomCategories(data.customCategories);
                setCachedCustomCategories(data.customCategories.income, data.customCategories.expense);
              }
            }
          } catch (decryptErr) {
            console.error('Failed to decrypt and restore backup payload:', decryptErr);
          }
        }
        return { success: true, message: 'Data restored successfully.' };
      }

      // Compile current database records for client-side backup
      const backupObj = {
        transactions: await StorageService.getTransactions(),
        budgets: await StorageService.getBudgets(),
        goals: await StorageService.getGoals(),
        subscriptions: await StorageService.getSubscriptions(),
        openingBalance: await StorageService.getOpeningBalance(),
        profilePicture: await StorageService.getProfilePicture(),
        customCategories: await StorageService.getCustomCategories(),
      };

      // Encrypt the JSON payload on the client device
      const encryptedString = CryptoJS.AES.encrypt(JSON.stringify(backupObj), userId).toString();

      const response = await fetch(`${API_URL}/auth/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ backupData: encryptedString }),
      });

      if (!response.ok) {
        throw new Error(`Backup failed with status code ${response.status}`);
      }

      return { success: true, message: 'Encrypted backup saved successfully.' };
    } catch (error: any) {
      console.warn('Backup/Restore Error:', error.message);
      return { 
        success: false, 
        message: 'Could not connect to server. Running offline.' 
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

  // 5. Reset all user data locally (Deactivated cloud reset)
  resetData: async (): Promise<{ success: boolean; message: string }> => {
    try {
      await StorageService.clearAll();
      return { success: true, message: 'All local data reset successfully' };
    } catch (e: any) {
      console.warn('Local data reset failed:', e.message);
      return { success: false, message: e.message || 'Reset failed' };
    }
  },

  // 6. Health check to test server connection
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
