import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../utils/theme';
import { getCategoryConfig, formatDateString, formatCurrency } from '../utils/helpers';
import { translateCategory } from '../utils/translations';
import { Transaction } from '../database/schema';
import { Ionicons } from '@expo/vector-icons';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  const { colors, spacing, sizes, language } = useTheme();
  const { amount, type, category, note, date } = transaction;

  const catConfig = getCategoryConfig(category, type);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border, padding: spacing.sm + 4 }]}>
      {/* Category Icon */}
      <View style={[styles.iconWrapper, { backgroundColor: catConfig.color + '20' }]}>
        <Ionicons name={catConfig.icon as any} size={20} color={catConfig.color} />
      </View>

      {/* Transaction Details */}
      <View style={styles.details}>
        <View style={styles.topRow}>
          <Text style={[styles.category, { color: colors.text }]}>{translateCategory(category, language)}</Text>

          <Text style={[styles.amount, { color: type === 'income' ? colors.income : colors.expense }]}>
            {type === 'income' ? '+' : '-'}{formatCurrency(amount)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.bottomLeft}>
            {note.trim() !== '' && (
              <Text style={[styles.note, { color: colors.textSecondary }]} numberOfLines={1}>
                {note}
              </Text>
            )}
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formatDateString(date)}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => onEdit(transaction)}
              style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={14} color={colors.primaryDark} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onDelete(transaction.id || transaction._id || '')}
              style={[styles.actionBtn, { backgroundColor: colors.expenseLight }]}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={14} color={colors.expense} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  details: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  category: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bottomLeft: {
    flex: 1,
    marginRight: 8,
  },
  note: {
    fontSize: 13,
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
