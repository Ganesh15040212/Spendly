import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../utils/theme';
import { NotificationService } from '../services/notification';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const SplashScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Dynamically calculate bottom offset to position loader text above navigation bar
  const bottomOffset = (insets.bottom > 0 ? insets.bottom : 16) + 30;

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
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Perform initialization tasks
    const initApp = async () => {
      try {
        // Request and schedule notifications (at 8:00 PM)
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
        <View style={styles.logoCard}>
          <Image source={require('../assets/images/logo.jpg')} style={styles.logoImage} />
        </View>
      </Animated.View>

      <View style={[styles.loaderContainer, { bottom: bottomOffset }]}>
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
  logoCard: {
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  logoImage: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
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
