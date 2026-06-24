import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { StorageService } from '../services/storage';
import { TRANSLATIONS, LanguageCode, TranslationDict } from './translations';
import { setCachedCurrency } from './helpers';

export const COLORS = {
  light: {
    background: '#f8fafc', // Slate 50
    card: '#ffffff',
    text: '#0f172a', // Slate 900
    textSecondary: '#64748b', // Slate 500
    primary: '#6366f1', // Indigo 500
    primaryLight: '#e0e7ff', // Indigo 100
    primaryDark: '#4f46e5', // Indigo 600
    income: '#10b981', // Emerald 500
    incomeLight: '#d1fae5', // Emerald 100
    expense: '#f43f5e', // Rose 500
    expenseLight: '#ffe4e6', // Rose 100
    border: '#e2e8f0', // Slate 200
    shadow: '#0f172a',
    tabBarActive: '#6366f1',
    tabBarInactive: '#94a3b8',
    cardGlow: 'rgba(99, 102, 241, 0.03)',
  },
  dark: {
    background: '#090d16', // Deep Dark Navy/Slate
    card: '#131926', // Slate 800ish
    text: '#f8fafc', // Slate 50
    textSecondary: '#94a3b8', // Slate 400
    primary: '#818cf8', // Indigo 400
    primaryLight: '#1e293b', // Slate 800
    primaryDark: '#6366f1', // Indigo 500
    income: '#34d399', // Emerald 400
    incomeLight: '#064e3b', // Emerald 900
    expense: '#fb7185', // Rose 400
    expenseLight: '#4c0519', // Rose 900
    border: '#1e293b', // Slate 800
    shadow: '#000000',
    tabBarActive: '#818cf8',
    tabBarInactive: '#64748b',
    cardGlow: 'rgba(129, 140, 248, 0.05)',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const SIZES = {
  h1: 28,
  h2: 22,
  h3: 18,
  body: 16,
  caption: 12,
  buttonRadius: 16,
  cardRadius: 24,
};

export const SHADOWS = {
  light: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  dark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
};

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
  colors: typeof COLORS.light;
  shadows: typeof SHADOWS.light;
  spacing: typeof SPACING;
  sizes: typeof SIZES;
  language: LanguageCode;
  currency: string;
  setCurrency: (symbol: string) => Promise<void>;
  username: string;
  setUsername: (name: string) => Promise<void>;
  profilePicture: string;
  setProfilePicture: (pic: string) => Promise<void>;
  t: TranslationDict;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const language: LanguageCode = 'en';
  const [currency, setCurrencyState] = useState<string>('₹');
  const [username, setUsernameState] = useState<string>('');
  const [profilePicture, setProfilePictureState] = useState<string>('avatar1');

  useEffect(() => {
    const loadSettings = async () => {
      const storedTheme = await StorageService.getThemeMode();
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setThemeModeState(storedTheme);
      } else {
        const initialTheme = systemScheme === 'dark' ? 'dark' : 'light';
        setThemeModeState(initialTheme);
      }

      const storedCurr = await StorageService.getCurrencySymbol();
      if (storedCurr) {
        setCurrencyState(storedCurr);
        setCachedCurrency(storedCurr);
      }

      const storedPic = await StorageService.getProfilePicture();
      if (storedPic) setProfilePictureState(storedPic);

      const storedUser = await StorageService.getUserProfile();
      if (storedUser && storedUser.name) {
        setUsernameState(storedUser.name);
      }
    };
    loadSettings();
  }, [systemScheme]);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await StorageService.setThemeMode(mode);
  };

  const setCurrency = async (symbol: string) => {
    setCurrencyState(symbol);
    setCachedCurrency(symbol);
    await StorageService.setCurrencySymbol(symbol);
  };

  const setUsername = async (name: string) => {
    setUsernameState(name);
    const storedUser = await StorageService.getUserProfile();
    if (storedUser) {
      storedUser.name = name;
      await StorageService.setUserProfile(storedUser);
    }
  };

  const setProfilePicture = async (pic: string) => {
    setProfilePictureState(pic);
    await StorageService.setProfilePicture(pic);
  };

  const isDark = themeMode === 'dark';

  const colors = isDark ? COLORS.dark : COLORS.light;

  const shadows = isDark ? SHADOWS.dark : SHADOWS.light;
  
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        isDark,
        colors,
        shadows,
        spacing: SPACING,
        sizes: SIZES,
        language,
        currency,
        setCurrency,
        username,
        setUsername,
        profilePicture,
        setProfilePicture,
        t,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    const systemScheme = useColorScheme();
    const isDark = systemScheme === 'dark';
    const fallbackTheme: ThemeMode = isDark ? 'dark' : 'light';
    return {
      themeMode: fallbackTheme,
      setThemeMode: async () => {},
      isDark,
      colors: isDark ? COLORS.dark : COLORS.light,
      shadows: isDark ? SHADOWS.dark : SHADOWS.light,
      spacing: SPACING,
      sizes: SIZES,
      language: 'en' as LanguageCode,
      currency: '₹',
      setCurrency: async () => {},
      username: '',
      setUsername: async () => {},
      profilePicture: 'avatar1',
      setProfilePicture: async () => {},
      t: TRANSLATIONS.en,
    };
  }
  return context;
};
