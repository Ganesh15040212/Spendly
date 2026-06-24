import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../utils/theme';
import { ApiService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

// Wrapper to prevent click interception on React Native Web
const ConditionalWrapper = ({ children }: { children: React.ReactNode }) => {
  if (Platform.OS === 'web') {
    return <>{children}</>;
  }
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {children}
    </TouchableWithoutFeedback>
  );
};

export default function LoginScreen() {
  const { colors, spacing, sizes, shadows, t } = useTheme();
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError(
        t.language === 'hi'
          ? 'कृपया सभी क्रेडेंशियल भरें।'
          : t.language === 'ta'
          ? 'அனைத்து விவரங்களையும் நிரப்பவும்.'
          : t.language === 'es'
          ? 'Por favor complete todas las credenciales.'
          : 'Please fill in all credentials.'
      );
      return;
    }

    setLoading(true);
    const result = await ApiService.login(email.trim(), password);
    setLoading(false);

    if (result.success) {
      // Sync local storage in background
      ApiService.syncData();
      router.replace('/(tabs)');
    } else {
      setError(
        result.error || (t.language === 'hi'
          ? 'अमान्य क्रेडेंशियल। कृपया पुनः प्रयास करें।'
          : t.language === 'ta'
          ? 'தவறான விவரங்கள். மீண்டும் முயற்சிக்கவும்.'
          : t.language === 'es'
          ? 'Credenciales inválidas. Por favor intente de nuevo.'
          : 'Invalid credentials. Please try again.')
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#f8fafc' ? 'light-content' : 'dark-content'} />
      <ConditionalWrapper>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={[styles.container, { paddingHorizontal: spacing.lg }]}>
            {/* Logo Header */}
            <View style={styles.logoSection}>
              <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="wallet" size={40} color="#ffffff" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>{t.appName}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                SmartExpense AI Dashboard
              </Text>
            </View>

            {/* Error Banner */}
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.expenseLight }]}>
                <Ionicons name="alert-circle" size={18} color={colors.expense} />
                <Text style={[styles.errorText, { color: colors.expense }]}>{error}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.email.toUpperCase()}</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. user@spendly.com"
                  placeholderTextColor={colors.textSecondary + '70'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.password.toUpperCase()}</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={
                    t.language === 'hi'
                      ? 'अपना पासवर्ड दर्ज करें'
                      : t.language === 'ta'
                      ? 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்'
                      : t.language === 'es'
                      ? 'Ingrese su contraseña'
                      : 'Enter your password'
                  }
                  placeholderTextColor={colors.textSecondary + '70'}
                  secureTextEntry={secureText}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                  <Ionicons
                    name={secureText ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Action */}
            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: colors.primary }, shadows]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.loginBtnText}>{t.signIn}</Text>
              )}
            </TouchableOpacity>

            {/* Register Redirect */}
            <View style={styles.signupPrompt}>
              <Text style={[styles.promptText, { color: colors.textSecondary }]}>{t.noAccount} </Text>
              <TouchableOpacity onPress={() => router.push('/register' as any)}>
                <Text style={[styles.linkText, { color: colors.primary, fontWeight: 'bold' }]}>{t.signUp}</Text>
              </TouchableOpacity>
            </View>


          </View>
        </KeyboardAvoidingView>
      </ConditionalWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  loginBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  promptText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
  },
});
