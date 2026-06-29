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
  ScrollView,
  Image,
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

export default function RegisterScreen() {
  const { colors, spacing, sizes, shadows, t } = useTheme();
  const router = useRouter();

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [secureText, setSecureText] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      setError(
        t.language === 'hi'
          ? 'कृपया सभी अनुरोधित फ़ील्ड भरें।'
          : t.language === 'ta'
          ? 'கேட்கப்பட்ட அனைத்து விவரங்களையும் நிரப்பவும்.'
          : t.language === 'es'
          ? 'Por favor complete todos los campos requeridos.'
          : 'Please fill in all requested fields.'
      );
      return;
    }

    if (password.length < 6) {
      setError(
        t.language === 'hi'
          ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
          : t.language === 'ta'
          ? 'கடவுச்சொல் குறைந்தது 6 எழுத்துக்களைக் கொண்டிருக்க வேண்டும்.'
          : t.language === 'es'
          ? 'La contraseña debe tener al menos 6 caracteres.'
          : 'Password must be at least 6 characters.'
      );
      return;
    }

    setLoading(true);
    const result = await ApiService.register(
      name.trim(),
      email.trim(),
      password,
      phone.trim()
    );
    setLoading(false);

    if (result.success) {
      // Sync local storage in background (pull initial data)
      ApiService.syncData(true);
      router.replace('/(tabs)');
    } else {
      setError(
        result.error || (t.language === 'hi'
          ? 'खाता पंजीकृत करने में विफल।'
          : t.language === 'ta'
          ? 'கணக்கை பதிவு செய்ய முடியவில்லை.'
          : t.language === 'es'
          ? 'Error al registrar la cuenta.'
          : 'Failed to register account.')
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
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={[styles.container, { paddingHorizontal: spacing.lg }]}>
              {/* Back Button */}
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>

              {/* Logo Section */}
              <View style={styles.logoSection}>
                <View style={styles.logoCard}>
                  <Image source={require('../assets/images/logo.jpg')} style={styles.logoImage} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t.language === 'hi' ? 'खाता बनाएं' : t.language === 'ta' ? 'கணக்கை உருவாக்கு' : t.language === 'es' ? 'Crear Cuenta' : 'Create Account'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
                  {t.language === 'hi'
                    ? 'Spendly के साथ अपने व्यक्तिगत वित्त का प्रबंधन शुरू करें'
                    : t.language === 'ta'
                    ? 'Spendly உடன் உங்கள் தனிப்பட்ட நிதிகளை நிர்வகிக்கத் தொடungகள்'
                    : t.language === 'es'
                    ? 'Comience a administrar sus finanzas personales con Spendly'
                    : 'Start managing your personal finances with Spendly'}
                </Text>
              </View>

              {/* Error Banner */}
              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.expenseLight }]}>
                  <Ionicons name="alert-circle" size={18} color={colors.expense} />
                  <Text style={[styles.errorText, { color: colors.expense }]}>{error}</Text>
                </View>
              ) : null}

              {/* Full Name */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.fullName.toUpperCase()}</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={colors.textSecondary + '70'}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.email.toUpperCase()}</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g. rahul@email.com"
                    placeholderTextColor={colors.textSecondary + '70'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.phone.toUpperCase()}</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Ionicons name="call-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g. +91 98765 43210"
                    placeholderTextColor={colors.textSecondary + '70'}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.password.toUpperCase()}</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={
                      t.language === 'hi'
                        ? 'एक मजबूत पासवर्ड चुनें'
                        : t.language === 'ta'
                        ? 'ஒரு வலுவான கடவுச்சொல்லைத் தேர்ந்தெடுக்கவும்'
                        : t.language === 'es'
                        ? 'Elija una contraseña segura'
                        : 'Choose a strong password'
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

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }, shadows]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>{t.signUp}</Text>
                )}
              </TouchableOpacity>

              {/* Redirect Prompts */}
              <View style={styles.loginPrompt}>
                <Text style={[styles.promptText, { color: colors.textSecondary }]}>{t.haveAccount} </Text>
                <TouchableOpacity onPress={() => router.replace('/login')}>
                  <Text style={[styles.linkText, { color: colors.primary, fontWeight: 'bold' }]}>{t.signIn}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  scrollContainer: {
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    paddingTop: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 4,
    marginBottom: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 12,
  },
  logoImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 20,
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
  submitBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginPrompt: {
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
