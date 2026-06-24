import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../utils/theme';
import { formatCurrency } from '../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

interface BalanceCardProps {
  opening: number;
  income: number;
  expense: number;
  onEditOpening: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  opening,
  income,
  expense,
  onEditOpening,
}) => {
  const { colors, spacing, sizes, shadows, t } = useTheme();
  const currentBalance = opening + income - expense;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, padding: spacing.md }, shadows]}>
      {/* Current Balance Hero section */}
      <View style={[styles.mainSection, { borderBottomColor: colors.border, paddingBottom: spacing.md }]}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.mainTitle, { color: colors.textSecondary }]} adjustsFontSizeToFit={true} numberOfLines={1}>
            {t.currentBalance}
          </Text>
          <Text
            style={[
              styles.mainAmount,
              { color: currentBalance >= 0 ? colors.text : colors.expense, fontSize: sizes.h1 + 6 },
            ]}
            adjustsFontSizeToFit={true}
            numberOfLines={1}
          >
            {formatCurrency(currentBalance)}
          </Text>
        </View>

        {/* Opening Balance mini-card */}
        <TouchableOpacity
          onPress={onEditOpening}
          style={[styles.openingBadge, { backgroundColor: colors.primaryLight }]}
          activeOpacity={0.7}
        >
          <View style={styles.openingBadgeLeft}>
            <Text style={[styles.openingTitle, { color: colors.primaryDark }]} adjustsFontSizeToFit={true} numberOfLines={1}>
              {t.openingBalance}
            </Text>
            <Text style={[styles.openingAmount, { color: colors.primaryDark }]} adjustsFontSizeToFit={true} numberOfLines={1}>
              {formatCurrency(opening)}
            </Text>
          </View>
          <View style={[styles.editIconContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="pencil" size={12} color={colors.primary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Income / Expense details section */}
      <View style={[styles.detailsSection, { paddingTop: spacing.md }]}>
        {/* Income Card */}
        <View style={styles.detailCol}>
          <View style={[styles.iconContainer, { backgroundColor: colors.incomeLight }]}>
            <Ionicons name="arrow-down" size={18} color={colors.income} />
          </View>
          <View style={[styles.detailText, { flex: 1 }]}>
            <Text style={[styles.detailTitle, { color: colors.textSecondary }]} adjustsFontSizeToFit={true} numberOfLines={1}>
              {t.totalIncome}
            </Text>
            <Text style={[styles.detailAmount, { color: colors.income }]} adjustsFontSizeToFit={true} numberOfLines={1}>
              +{formatCurrency(income)}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Expense Card */}
        <View style={styles.detailCol}>
          <View style={[styles.iconContainer, { backgroundColor: colors.expenseLight }]}>
            <Ionicons name="arrow-up" size={18} color={colors.expense} />
          </View>
          <View style={[styles.detailText, { flex: 1 }]}>
            <Text style={[styles.detailTitle, { color: colors.textSecondary }]} adjustsFontSizeToFit={true} numberOfLines={1}>
              {t.totalExpense}
            </Text>
            <Text style={[styles.detailAmount, { color: colors.expense }]} adjustsFontSizeToFit={true} numberOfLines={1}>
              -{formatCurrency(expense)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    shadowColor: '#0f172a',
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 3,
  },
  mainSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
  },
  mainTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  mainAmount: {
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  openingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 8,
  },
  openingBadgeLeft: {
    justifyContent: 'center',
  },
  openingTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  openingAmount: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  editIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    justifyContent: 'center',
  },
  detailTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  divider: {
    width: 1.5,
    height: 35,
    marginHorizontal: 16,
  },
});
