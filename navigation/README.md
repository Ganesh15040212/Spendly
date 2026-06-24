# Navigation System

This project utilizes **Expo Router** (Expo SDK 54's official router) for file-based routing.

## Routing Mapping

The routes are declared inside the `app/` directory and map to our reusable screens:

1. **Root Layout** (`app/_layout.tsx`): Sets up the root Stack navigation, managing transitions for modals and nested tabs.
2. **Splash Screen** (`app/index.tsx`): The entry point screen that loads when the application starts, rendering the animated `SplashScreen`.
3. **Tab Group** (`app/(tabs)/_layout.tsx`): Bottom tab navigator containing three tabs:
   - **Dashboard** (`app/(tabs)/index.tsx` -> `screens/DashboardScreen.tsx`)
   - **History** (`app/(tabs)/history.tsx` -> `screens/HistoryScreen.tsx`)
   - **Analytics** (`app/(tabs)/analytics.tsx` -> `screens/AnalyticsScreen.tsx`)
4. **Modal Form** (`app/add-transaction.tsx` -> `screens/AddTransactionScreen.tsx`): Modal slide-up overlay to add or edit transactions.
