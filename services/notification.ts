import type * as NotificationsType from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { StorageService } from './storage';
import { formatCurrency } from '../utils/helpers';
import { Transaction } from '../database/schema';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const isAndroidExpoGo = Platform.OS === 'android' && isExpoGo;

let Notifications: typeof NotificationsType | null = null;

if (!isAndroidExpoGo) {
  try {
    Notifications = require('expo-notifications');
  } catch (error) {
    console.error('Failed to load expo-notifications:', error);
  }
}

// Configure notification behavior when app is foregrounded
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const NotificationService = {
  // Request user permissions for notifications
  requestPermissions: async (): Promise<boolean> => {
    if (Platform.OS === 'web' || !Notifications) return false;
    
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Error requesting notification permissions:', e);
      return false;
    }
  },

  // Send an immediate local notification
  sendImmediateNotification: async (title: string, body: string): Promise<string | null> => {
    if (Platform.OS === 'web' || !Notifications) return null;

    try {
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) return null;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null, // send immediately
      });
      return identifier;
    } catch (e) {
      console.error('Failed to send immediate notification', e);
      return null;
    }
  },

  // Calculate and trigger alerts for budget limits and wallet balance warnings
  checkTransactionAlerts: async (tx: Transaction) => {
    if (Platform.OS === 'web' || !Notifications) return;

    try {
      const allTx = await StorageService.getTransactions();
      const budgets = await StorageService.getBudgets();
      const openingBalance = await StorageService.getOpeningBalance();
      
      const currentMonth = tx.date.substring(0, 7);

      // 1. Budget Limit Checks (Only for Expenses)
      if (tx.type === 'expense') {
        const budget = budgets.find(b => b.category === tx.category && b.period === currentMonth);
        if (budget) {
          // Total spent on this category in currentMonth
          const totalSpent = allTx
            .filter(t => t.category === tx.category && t.type === 'expense' && t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);

          const limit = budget.limitAmount;
          
          // Check if it crossed 100%
          if (totalSpent >= limit) {
            await NotificationService.sendImmediateNotification(
              `⚠️ Budget Exceeded: ${tx.category}`,
              `You spent ${formatCurrency(totalSpent)} / ${formatCurrency(limit)} this month on ${tx.category}.`
            );
          } 
          // Check if it crossed 80% (only if this transaction pushed it past 80%)
          else if (totalSpent >= limit * 0.8 && (totalSpent - tx.amount) < limit * 0.8) {
            await NotificationService.sendImmediateNotification(
              `⚠️ 80% Budget Reached: ${tx.category}`,
              `You have used 80% of your budget for ${tx.category}. Spent: ${formatCurrency(totalSpent)} / ${formatCurrency(limit)}.`
            );
          }
        }
      }

      // 2. Wallet Balance Warning (If wallet goes negative)
      const walletInitial = tx.wallet === 'Cash' ? openingBalance : 0;
      const walletTx = allTx.filter(t => t.wallet === tx.wallet);
      const walletBalance = walletTx.reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -t.amount);
      }, walletInitial);

      if (walletBalance < 0 && (walletBalance + (tx.type === 'income' ? -tx.amount : tx.amount)) >= 0) {
        await NotificationService.sendImmediateNotification(
          `⚠️ Negative Balance: ${tx.wallet}`,
          `Your ${tx.wallet} wallet balance has dropped below zero to ${formatCurrency(walletBalance)}.`
        );
      }
    } catch (e) {
      console.warn('Failed to calculate transaction notifications:', e);
    }
  },

  // Schedule a daily reminder at a specific hour/minute
  scheduleDailyReminder: async (hour = 20, minute = 0): Promise<string | null> => {
    if (Platform.OS === 'web' || !Notifications) return null;

    try {
      // 1. Request permission first
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) return null;

      // 2. Clear existing notifications to avoid duplicate schedules
      await Notifications.cancelAllScheduledNotificationsAsync();

      // 3. Schedule new daily trigger
      const trigger: NotificationsType.NotificationTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      };

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📝 Log your expenses!',
          body: "Don't forget to track today's expenses and income in Spendly.",
          sound: true,
        },
        trigger,
      });

      console.log(`Daily reminder scheduled successfully: ID ${identifier}`);
      return identifier;
    } catch (e) {
      console.error('Failed to schedule daily reminder notification', e);
      return null;
    }
  },
};
