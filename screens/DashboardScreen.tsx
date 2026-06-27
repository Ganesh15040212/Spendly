import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../utils/theme';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';
import { Transaction, User, WalletType } from '../database/schema';
import { getTodayString, formatDateString, formatCurrency } from '../utils/helpers';
import { BalanceCard } from '../components/BalanceCard';
import { TransactionItem } from '../components/TransactionItem';
import { EmptyState } from '../components/EmptyState';
import { OpeningBalanceModal } from '../components/OpeningBalanceModal';
import { translateWallet } from '../utils/translations';
import { Ionicons } from '@expo/vector-icons';

import { CustomDatePicker as DateTimePicker } from '../components/CustomDatePicker';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export const DashboardScreen: React.FC = () => {
  const { colors, spacing, sizes, shadows, t, username, language } = useTheme();
  const router = useRouter();

  // Authentication State
  const [userProfile, setUserProfile] = useState<User | null>(null);

  // Financial States
  const [openingBalance, setOpeningBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  
  // Totals
  const [allTimeIncome, setAllTimeIncome] = useState(0);
  const [allTimeExpense, setAllTimeExpense] = useState(0);

  // Wallet-wise Balances
  const [wallets, setWallets] = useState<Record<string, number>>({
    'UPI': 0,
    'Net Banking': 0,
    'Digital Wallets': 0,
    'Pay Later': 0,
    'Cheque': 0,
    'Credit Card': 0,
    'Debit Card': 0,
    'AutoPay': 0,
    'IMPS': 0,
    'Prepaid Payment Instruments (PPIs)': 0,
    'NEFT/RTGS': 0,
    'EMI': 0,
    'QR': 0,
  });

  // Health Score & AI Insights
  const [healthScore, setHealthScore] = useState(100);
  const [healthLabel, setHealthLabel] = useState('Excellent');
  const [healthColor, setHealthColor] = useState('#10b981');
  const [insights, setInsights] = useState<string[]>([]);

  // Modal Visibility States
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Loader and Sync Status
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'failed'>('idle');

  // Load local data and calculate indicators
  const loadData = async () => {
    try {
      const profile = await StorageService.getUserProfile();
      setUserProfile(profile);

      const balance = await StorageService.getOpeningBalance();
      const allTx = await StorageService.getTransactions();
      const budgets = await StorageService.getBudgets();
      
      setOpeningBalance(balance);
      setTransactions(allTx);

      // Compute all-time totals and wallet breakdown
      let totalInc = 0;
      let totalExp = 0;
      
      const tempWallets: Record<string, number> = {
        'UPI': balance, // Default: main opening balance goes to UPI
        'Net Banking': 0,
        'Digital Wallets': 0,
        'Pay Later': 0,
        'Cheque': 0,
        'Credit Card': 0,
        'Debit Card': 0,
        'AutoPay': 0,
        'IMPS': 0,
        'Prepaid Payment Instruments (PPIs)': 0,
        'NEFT/RTGS': 0,
        'EMI': 0,
        'QR': 0,
      };

      allTx.forEach(tx => {
        const amt = tx.amount;
        const wType = tx.wallet || 'UPI';

        if (tx.type === 'income') {
          totalInc += amt;
          tempWallets[wType] = (tempWallets[wType] || 0) + amt;
        } else {
          totalExp += amt;
          tempWallets[wType] = (tempWallets[wType] || 0) - amt;
        }
      });

      setAllTimeIncome(totalInc);
      setAllTimeExpense(totalExp);
      setWallets(tempWallets);

      // Compute Financial Health Score & Insights
      calculateHealthAndInsights(totalInc, totalExp, allTx, budgets);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  // Health Score Formulation
  const calculateHealthAndInsights = (income: number, expense: number, txList: Transaction[], budgets: any[]) => {
    let score = 100;
    const tempInsights: string[] = [];

    // 1. Savings Rate
    const savings = income - expense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    if (savingsRate < 0) {
      score -= 35;
      tempInsights.push('You are spending more than your income this month. Create a budget limit to stabilize expenses.');
    } else if (savingsRate < 15) {
      score -= 20;
      tempInsights.push(`Your Savings Rate is ${Math.round(savingsRate)}%. Try to save at least 20% of your earnings.`);
    } else {
      tempInsights.push(`Great job! Your savings rate is healthy at ${Math.round(savingsRate)}%. Keep saving!`);
    }

    // 2. Budget Compliance
    // Check if any category monthly budgets are exceeded
    let budgetOverCount = 0;
    const monthlyExpenses: Record<string, number> = {};
    
    // Sum current month expenses
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    txList.forEach(tx => {
      if (tx.type === 'expense' && tx.date.substring(0, 7) === currentMonth) {
        monthlyExpenses[tx.category] = (monthlyExpenses[tx.category] || 0) + tx.amount;
      }
    });

    budgets.forEach(b => {
      const spent = monthlyExpenses[b.category] || 0;
      if (spent > b.limitAmount) {
        budgetOverCount++;
        score -= 15;
        tempInsights.push(`You have exceeded your ${b.category} monthly budget of ${formatCurrency(b.limitAmount)}.`);
      } else if (spent > b.limitAmount * 0.8) {
        score -= 5;
        tempInsights.push(`Warning: You have used over 80% of your ${b.category} budget.`);
      }
    });

    // Clamp score
    score = Math.max(Math.min(score, 100), 0);
    setHealthScore(score);

    // Health level labels
    if (score >= 90) {
      setHealthLabel('Excellent');
      setHealthColor(colors.income);
    } else if (score >= 70) {
      setHealthLabel('Good');
      setHealthColor('#3b82f6'); // Blue
    } else if (score >= 50) {
      setHealthLabel('Average');
      setHealthColor('#f59e0b'); // Amber
    } else {
      setHealthLabel('Needs Improvement');
      setHealthColor(colors.expense);
    }

    // Default insight if empty
    if (tempInsights.length === 1) {
      tempInsights.push('Set up savings goals to save systematically for laptops or vacations.');
    }
    setInsights(tempInsights.slice(0, 3)); // Max 3 insights
  };

  // Focus effect to load data
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [openingBalance])
  );

  const handleSync = async () => {
    setSyncStatus('syncing');
    const result = await ApiService.syncData();
    if (result.success) {
      setSyncStatus('success');
      await loadData();
    } else {
      setSyncStatus('failed');
    }
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await ApiService.syncData();
    await loadData();
    setRefreshing(false);
  };

  const handleSaveOpening = async (newBalance: number) => {
    await StorageService.setOpeningBalance(newBalance);
    setOpeningBalance(newBalance);
    ApiService.syncData();
  };

  const handleDeleteTransaction = async (id: string) => {
    const executeDelete = async () => {
      const success = await StorageService.deleteTransaction(id);
      if (success) {
        // Sync deletion to server before reloading so ghost data doesn't reappear
        await ApiService.syncData();
        await loadData();
      }
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(t.deleteTxConfirm);
      if (confirmDelete) {
        executeDelete();
      }
    } else {
      Alert.alert(
        t.deleteWarning,
        t.deleteTxConfirm,
        [
          { text: t.cancel, style: 'cancel' },
          { text: t.yes, style: 'destructive', onPress: executeDelete },
        ]
      );
    }
  };


  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setSelectedDate(`${year}-${month}-${day}`);
    }
  };

  const dailyTransactions = transactions.filter(t => t.date === selectedDate);

  const getSelectedDateObject = (): Date => {
    const [year, month, day] = selectedDate.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  if (loading) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={colors.text === '#f8fafc' ? 'light-content' : 'dark-content'} />
      
      {/* Header Panel */}
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>{t.welcome},</Text>
          <Text style={[styles.userNameText, { color: colors.text }]} adjustsFontSizeToFit numberOfLines={1}>
            {username || 'Spendly User'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* Sync status */}
          <TouchableOpacity
            onPress={handleSync}
            style={[styles.actionIconBtn, { borderColor: colors.border }]}
            disabled={syncStatus === 'syncing'}
          >
            {syncStatus === 'syncing' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name={
                  syncStatus === 'success'
                    ? 'cloud-done'
                    : syncStatus === 'failed'
                    ? 'cloud-offline'
                    : 'cloud-upload-outline'
                }
                size={20}
                color={
                  syncStatus === 'success'
                    ? colors.income
                    : syncStatus === 'failed'
                    ? colors.expense
                    : colors.text
                }
              />
            )}
          </TouchableOpacity>


        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Cumulative balance card */}
        <BalanceCard
          opening={openingBalance}
          income={allTimeIncome}
          expense={allTimeExpense}
          onEditOpening={() => setShowBalanceModal(true)}
        />

        {/* Multi-Wallet horizontal selector list */}
        <View style={styles.walletSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginHorizontal: spacing.md, marginBottom: spacing.sm }]}>
            {t.wallet}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 12 }}
          >
            {Object.keys(wallets).map(walletName => {
              const balance = wallets[walletName];

              let icon = 'card-outline';
              let walletColor = colors.primary;

              if (walletName === 'UPI') {
                icon = 'phone-portrait-outline';
                walletColor = '#8b5cf6';
              } else if (walletName === 'Net Banking') {
                icon = 'globe-outline';
                walletColor = '#3b82f6';
              } else if (walletName === 'Digital Wallets') {
                icon = 'wallet-outline';
                walletColor = '#f59e0b';
              } else if (walletName === 'Pay Later') {
                icon = 'time-outline';
                walletColor = '#06b6d4';
              } else if (walletName === 'Cheque') {
                icon = 'document-text-outline';
                walletColor = '#64748b';
              } else if (walletName === 'Credit Card') {
                icon = 'card-outline';
                walletColor = '#ec4899';
              } else if (walletName === 'Debit Card') {
                icon = 'card-outline';
                walletColor = '#10b981';
              } else if (walletName === 'AutoPay') {
                icon = 'repeat-outline';
                walletColor = '#6366f1';
              } else if (walletName === 'IMPS') {
                icon = 'flash-outline';
                walletColor = '#fb7185';
              } else if (walletName === 'Prepaid Payment Instruments (PPIs)') {
                icon = 'gift-outline';
                walletColor = '#a855f7';
              } else if (walletName === 'NEFT/RTGS') {
                icon = 'arrow-forward-outline';
                walletColor = '#14b8a6';
              } else if (walletName === 'EMI') {
                icon = 'calculator-outline';
                walletColor = '#eab308';
              } else if (walletName === 'QR') {
                icon = 'qr-code-outline';
                walletColor = '#f97316';
              }

              return (
                <View key={walletName} style={[styles.walletCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows]}>
                  <View style={[styles.walletIconCircle, { backgroundColor: walletColor + '20' }]}>
                    <Ionicons name={icon as any} size={20} color={walletColor} />
                  </View>
                  <Text style={[styles.walletName, { color: colors.textSecondary }]}>{translateWallet(walletName, language)}</Text>
                  <Text style={[styles.walletBalance, { color: colors.text }]}>{formatCurrency(balance)}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Financial health score board */}
        <View style={[styles.healthCard, { backgroundColor: colors.card, marginHorizontal: spacing.md }, shadows]}>
          <View style={styles.healthHeader}>
            <View>
              <Text style={[styles.healthLabelText, { color: colors.textSecondary }]}>{t.healthScore}</Text>
              <Text style={[styles.healthValueText, { color: colors.text }]}>
                {healthScore} <Text style={{ fontSize: 13, color: healthColor }}>
                  ({healthLabel === 'Excellent'
                    ? t.healthExcellent
                    : healthLabel === 'Good'
                    ? t.healthGood
                    : healthLabel === 'Average'
                    ? t.healthAverage
                    : t.healthImprovement})
                </Text>
              </Text>
            </View>
            <Ionicons name="heart-half-outline" size={40} color={healthColor} />
          </View>
          <View style={[styles.healthScoreBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.healthScoreBarFill, { backgroundColor: healthColor, width: `${healthScore}%` }]} />
          </View>

          {/* AI Insights lists */}
          <View style={styles.insightsList}>
            <Text style={[styles.insightsTitle, { color: colors.text }]}>{t.healthDescription}</Text>
            {insights.map((insight, idx) => (
              <View key={idx} style={styles.insightItem}>
                <Ionicons name="sparkles" size={14} color={colors.primary} style={{ marginTop: 2 }} />
                <Text style={[styles.insightText, { color: colors.textSecondary }]}>{insight}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Date filter selector bar */}
        <View style={[styles.dateBar, { marginHorizontal: spacing.md, marginTop: spacing.lg }]}>
          <Text style={[styles.dateLabel, { color: colors.text, flex: 1, marginRight: 8 }]} numberOfLines={2} adjustsFontSizeToFit>{t.recentTransactions}</Text>
          
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {formatDateString(selectedDate)}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Daily Transactions list view */}
        {dailyTransactions.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={[styles.listContainer, { backgroundColor: colors.card, marginHorizontal: spacing.md, marginTop: spacing.md }]}>
            {dailyTransactions.map(tx => (
              <TransactionItem
                key={tx.id || tx._id}
                transaction={tx}
                onEdit={item => {
                  router.push({
                    pathname: '/add-transaction' as any,
                    params: { id: item.id || item._id, mode: 'edit' },
                  });
                }}
                onDelete={handleDeleteTransaction}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/add-transaction' as any)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={30} color="#ffffff" />
      </TouchableOpacity>

      {/* Date picker modal */}
      {showDatePicker && (
        <DateTimePicker
          value={getSelectedDateObject()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Opening Balance Modal sheet */}
      <OpeningBalanceModal
        visible={showBalanceModal}
        currentBalance={openingBalance}
        onClose={() => setShowBalanceModal(false)}
        onSave={handleSaveOpening}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 5,
  },
  headerLeft: {},
  welcomeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  walletSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  walletCard: {
    width: 130,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    alignItems: 'flex-start',
  },
  walletIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  walletName: {
    fontSize: 11,
    fontWeight: '600',
  },
  walletBalance: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  healthCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 8,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  healthValueText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  healthScoreBarBg: {
    height: 6,
    borderRadius: 3,
    marginTop: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  healthScoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightsList: {
    gap: 10,
  },
  insightsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  insightItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  insightText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  dateBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
export default DashboardScreen;
