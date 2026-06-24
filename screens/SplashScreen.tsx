import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../utils/theme';
import { NotificationService } from '../services/notification';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';
import { Ionicons } from '@expo/vector-icons';

export const SplashScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Run Splash Logo Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Perform initialization tasks
    const initApp = async () => {
      try {
        // 1. Request and schedule notifications (at 8:00 PM)
        await NotificationService.scheduleDailyReminder(20, 0);

        // 2. Perform a fast API Sync in background (fails silently if offline)
        await ApiService.syncData();
      } catch (err) {
        console.warn('Initialization warning:', err);
      } finally {
        // Allow the splash to show for at least 2.5 seconds total
        setTimeout(() => {
          router.replace('/(tabs)' as any);
        }, 1500);
      }
    };

    initApp();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
          <Ionicons name="wallet" size={60} color="#ffffff" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Spendly</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Daily Expense Tracker
        </Text>
      </Animated.View>

      <View style={[styles.loaderContainer, { bottom: spacing.xl }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loaderText, { color: colors.textSecondary, marginTop: spacing.sm }]}>
          Initializing storage...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 110,
    height: 110,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    marginTop: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  loaderContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  loaderText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
export default SplashScreen;
