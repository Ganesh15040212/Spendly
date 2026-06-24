import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useTheme } from '../utils/theme';
import { getCachedCurrencySymbol } from '../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

interface OpeningBalanceModalProps {
  visible: boolean;
  onClose: () => void;
  currentBalance: number;
  onSave: (balance: number) => void;
}

export const OpeningBalanceModal: React.FC<OpeningBalanceModalProps> = ({
  visible,
  onClose,
  currentBalance,
  onSave,
}) => {
  const { colors, spacing, sizes, t, currency } = useTheme();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (visible) {
      setInputValue(currentBalance > 0 ? currentBalance.toString() : '');
    }
  }, [visible, currentBalance]);

  const handleSave = () => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onSave(parsed);
      onClose();
    } else if (inputValue.trim() === '') {
      onSave(0);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card, padding: spacing.lg }]}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text, fontSize: sizes.h2 }]}>
                  {t.language === 'hi' ? 'प्रारंभिक शेष दर्ज करें' : t.language === 'ta' ? 'தொடக்க இருப்பை அமைக்கவும்' : t.language === 'es' ? 'Establecer Saldo Inicial' : 'Set Opening Balance'}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: spacing.md }]}>
                {t.language === 'hi'
                  ? 'अपने खाते का प्रारंभिक शेष कॉन्फ़िगर करें। यह शेष आपकी कुल आय और व्यय में जोड़ा जाएगा।'
                  : t.language === 'ta'
                  ? 'உங்கள் தொடக்கக் கணக்கின் இருப்பை உள்ளமைக்கவும். இந்த இருப்பு உங்கள் மொத்த வருமானம் மற்றும் செலவுகளுடன் சேர்க்கப்படும்.'
                  : t.language === 'es'
                  ? 'Configure el saldo inicial de su cuenta. Este saldo se sumará a sus ingresos y gastos totales.'
                  : 'Configure your starting account balance. This balance will be added to your total income and expenses.'}
              </Text>

              {/* Input */}
              <View style={[styles.inputContainer, { borderColor: colors.border, marginBottom: spacing.lg }]}>
                <Text style={[styles.currencyPrefix, { color: colors.text }]}>{currency}</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  value={inputValue}
                  onChangeText={setInputValue}
                  autoFocus
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                  onPress={onClose}
                >
                  <Text style={[styles.buttonText, { color: colors.textSecondary }]}>{t.cancel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                >
                  <Text style={[styles.buttonText, { color: '#ffffff', fontWeight: 'bold' }]}>{t.save}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    padding: 0, // Reset default padding in Android
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonText: {
    fontSize: 16,
  },
});
