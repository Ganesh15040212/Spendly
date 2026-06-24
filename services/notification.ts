import type * as NotificationsType from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

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
