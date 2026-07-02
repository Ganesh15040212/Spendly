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

import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useTheme, ThemeProvider } from '../utils/theme';
import { StorageService } from '../services/storage';
import { setCachedCurrency } from '../utils/helpers';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'expo-notifications functionality is not fully supported in Expo Go',
]);

// Secure Routing Guard Controller
function NavigationGuard() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkAuthenticationState = async () => {
      const token = await StorageService.getAuthToken();
      
      // Determine if active route is in the Auth flow
      const activeSegment = segments[0] as string;
      const isAuthScreen = activeSegment === 'login' || activeSegment === 'register' || activeSegment === 'index' || !activeSegment;

      if (!token && !isAuthScreen) {
        // Force redirect to login if unauthenticated
        router.replace('/login' as any);
      } else if (token && (activeSegment === 'login' || activeSegment === 'register')) {
        // Prevent access to Auth forms if already logged in
        router.replace('/(tabs)' as any);
      }
    };

    checkAuthenticationState();
  }, [segments]);

  return null;
}

function RootLayoutContent() {
  const { colors } = useTheme();

  return (
    <>
      <NavigationGuard />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* Index (Splash Screen) */}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Auth Stack */}
        <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="register" options={{ headerShown: false, gestureEnabled: false }} />

        {/* Bottom Tab Group */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />

        {/* Add Transaction Modal */}
        <Stack.Screen
          name="add-transaction"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
