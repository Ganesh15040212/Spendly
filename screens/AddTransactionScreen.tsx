import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../utils/theme';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';
import { WalletType } from '../database/schema';
import {
  getTodayString,
  formatDateString,
  getMergedCategories,
  getCachedCurrencySymbol,
} from '../utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { CustomDatePicker as DateTimePicker } from '../components/CustomDatePicker';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { translateCategory, translateWallet as translateWalletHelper } from '../utils/translations';

export const AddTransactionScreen: React.FC = () => {
  const { colors, spacing, sizes, t, currency, language } = useTheme();
  const router = useRouter();
  
  // Params
  const params = useLocalSearchParams();
  const transactionId = params.id as string;
  const isEditMode = params.mode === 'edit' && transactionId;

  // Form State
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [wallet, setWallet] = useState<WalletType>('Cash');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayString());

  // UI State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');

  // Handle Edit Mode Load
  useEffect(() => {
    if (isEditMode) {
      const loadTransaction = async () => {
        const list = await StorageService.getTransactions();
        const found = list.find(t => t.id === transactionId || t._id === transactionId);
        if (found) {
          setType(found.type);
          setAmount(found.amount.toString());
          setCategory(found.category);
          setWallet(found.wallet || 'Cash');
          setNote(found.note);
          setDate(found.date);
        }
      };
      loadTransaction();
    }
  }, [isEditMode, transactionId]);

  const autofillApplied = React.useRef(false);

  // Handle Autofill Hooks (Voice & OCR)
  useEffect(() => {
    if (params && !autofillApplied.current) {
      if (params.amount) {
        setAmount(params.amount as string);
        autofillApplied.current = true;
      }
      if (params.type) {
        setType(params.type as 'income' | 'expense');
      }
      if (params.category) {
        setCategory(params.category as string);
      }
      if (params.note) {
        setNote(params.note as string);
      }
      if (params.date) {
        setDate(params.date as string);
      }
    }
  }, [params]);

  // Set default category when type changes
  useEffect(() => {
    const isAutofill = params && params.amount !== undefined;
    if (!isEditMode && !isAutofill) {
      const defaultCat = type === 'income' 
        ? Object.keys(getMergedCategories('income'))[0] 
        : Object.keys(getMergedCategories('expense'))[0];
      setCategory(defaultCat);
    }
  }, [type, isEditMode]);

  // Handle Save Action
  const handleSave = async () => {
    setError('');
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(
        language === 'hi'
          ? 'कृपया 0 से अधिक का वैध राशि दर्ज करें'
          : language === 'ta'
          ? 'தயவுசெய்து 0 ஐ விட அதிகமான சரியான தொகையை உள்ளிடவும்'
          : language === 'es'
          ? 'Por favor ingrese un monto válido mayor que 0'
          : 'Please enter a valid amount greater than 0'
      );
      return;
    }

    if (!category) {
      setError(
        language === 'hi'
          ? 'कृपया श्रेणी का चयन करें'
          : language === 'ta'
          ? 'பிரிவைத் தேர்ந்தெடுக்கவும்'
          : language === 'es'
          ? 'Por favor seleccione una categoría'
          : 'Please select a category'
      );
      return;
    }

    const payload = {
      amount: parsedAmount,
      type,
      category,
      wallet,
      note: note.trim(),
      date,
    };

    try {
      if (isEditMode) {
        await StorageService.updateTransaction(transactionId, payload);
      } else {
        await StorageService.addTransaction(payload);
      }
      
      // Sync in background
      ApiService.syncData();
      if (router.canGoBack()) {
        router.back();
      } else {
        try {
          router.back();
        } catch (e) {
          router.replace('/(tabs)' as any);
        }
      }
    } catch (e) {
      setError(
        language === 'hi'
          ? 'सहेजते समय एक त्रुटि हुई।'
          : language === 'ta'
          ? 'சேமிக்கும் போது பிழை ஏற்பட்டது.'
          : language === 'es'
          ? 'Ocurrió un error al guardar.'
          : 'An error occurred while saving.'
      );
    }
  };

  // Date Change Handler
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
    }
  };

  const getSelectedDateObject = (): Date => {
    const [year, month, day] = date.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const translateWallet = (w: WalletType) => {
    return translateWalletHelper(w, language);
  };

  const categoryList = getMergedCategories(type);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#f8fafc' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              try {
                router.back();
              } catch (e) {
                router.replace('/(tabs)' as any);
              }
            }
          }} 
          style={styles.headerBtn}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: sizes.h3 }]}>
          {isEditMode ? t.editTxTitle : t.addTxTitle}
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
          <Ionicons name="checkmark" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.expenseLight }]}>
              <Text style={[styles.errorText, { color: colors.expense }]}>{error}</Text>
            </View>
          ) : null}

          {/* Transaction Type Picker */}
          <View style={[styles.typeContainer, { backgroundColor: colors.card, marginHorizontal: spacing.md }]}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === 'expense' && { backgroundColor: colors.expenseLight },
              ]}
              onPress={() => setType('expense')}
            >
              <Ionicons
                name="arrow-up-circle"
                size={20}
                color={type === 'expense' ? colors.expense : colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeText,
                  { color: type === 'expense' ? colors.expense : colors.textSecondary },
                ]}
              >
                {t.expense}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === 'income' && { backgroundColor: colors.incomeLight },
              ]}
              onPress={() => setType('income')}
            >
              <Ionicons
                name="arrow-down-circle"
                size={20}
                color={type === 'income' ? colors.income : colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeText,
                  { color: type === 'income' ? colors.income : colors.textSecondary },
                ]}
              >
                {t.income}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Display */}
          <View style={[styles.amountContainer, { paddingHorizontal: spacing.md }]}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>{t.amount}</Text>
            <View style={styles.amountInputRow}>
              <Text style={[styles.amountSymbol, { color: type === 'income' ? colors.income : colors.expense }]}>{currency}</Text>
              <TextInput
                style={[
                  styles.amountInput,
                  { color: type === 'income' ? colors.income : colors.expense },
                ]}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary + '60'}
                value={amount}
                onChangeText={setAmount}
                autoFocus={!params.amount}
              />
            </View>
          </View>

          {/* Payment Wallet Selector */}
          <View style={[styles.fieldSection, { paddingHorizontal: spacing.md }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.wallet}</Text>
            <View style={styles.walletPicker}>
              {(['Cash', 'Bank', 'UPI', 'Credit Card', 'Digital Wallet'] as WalletType[]).map(w => {
                const isSelected = wallet === w;
                return (
                  <TouchableOpacity
                    key={w}
                    style={[
                      styles.walletOpt,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isSelected && { borderColor: colors.primary, borderWidth: 1.5 },
                    ]}
                    onPress={() => setWallet(w)}
                  >
                    <Text style={[styles.walletOptText, { color: colors.text, fontWeight: isSelected ? '700' : '500' }]}>
                      {translateWallet(w)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date Picker Button */}
          <View style={[styles.fieldSection, { paddingHorizontal: spacing.md }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.date}</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.dateBtnLeft}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {formatDateString(date)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Description / Note */}
          <View style={[styles.fieldSection, { paddingHorizontal: spacing.md }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.notes}</Text>
            <TextInput
              style={[
                styles.noteInput,
                { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
              ]}
              placeholder={t.notesPlaceholder}
              placeholderTextColor={colors.textSecondary + '70'}
              value={note}
              onChangeText={setNote}
              maxLength={100}
            />
          </View>

          {/* Category Picker Grid */}
          <View style={[styles.fieldSection, { paddingHorizontal: spacing.md }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.category}</Text>
            <View style={styles.categoryGrid}>
              {Object.values(categoryList).map(cat => {
                const isSelected = category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: colors.card },
                      isSelected && { borderColor: cat.color, borderWidth: 2 },
                    ]}
                    onPress={() => setCategory(cat.name)}
                  >
                    <View
                      style={[
                        styles.categoryIconCircle,
                        { backgroundColor: cat.color + '20' },
                      ]}
                    >
                      <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                    </View>
                    <Text style={[styles.categoryName, { color: colors.text }]} adjustsFontSizeToFit={true} numberOfLines={1}>
                      {translateCategory(cat.name, language)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Action Button Footer */}
          <View style={[styles.footer, { paddingHorizontal: spacing.md }]}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>
                {isEditMode ? t.saveChanges : t.addTxTitle}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Component */}
      {showDatePicker && (
        <DateTimePicker
          value={getSelectedDateObject()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginTop: 16,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  typeText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  amountContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountSymbol: {
    fontSize: 38,
    fontWeight: 'bold',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: 'bold',
    minWidth: 150,
    textAlign: 'center',
    padding: 0,
  },
  fieldSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  walletPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  walletOpt: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  walletOptText: {
    fontSize: 13,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
  },
  dateBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteInput: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    borderColor: 'transparent',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    marginTop: 20,
  },
  saveBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
export default AddTransactionScreen;
