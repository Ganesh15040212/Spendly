import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../utils/theme';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';
import { Subscription } from '../database/schema';
import { formatCurrency, getCategoryConfig, getTodayString, formatDateString, getCachedCurrencySymbol } from '../utils/helpers';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { CustomDatePicker as DateTimePicker } from '../components/CustomDatePicker';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { translateCategory } from '../utils/translations';

export const AnalyticsScreen: React.FC = () => {
  const { colors, spacing, sizes, shadows, t, currency, language } = useTheme();

  // Data States
  const [transactions, setTransactions] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [showSubModal, setShowSubModal] = useState(false);

  // Form states (Subscription)
  const [subName, setSubName] = useState('');
  const [subCost, setSubCost] = useState('');
  const [subPeriod, setSubPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [subBillingDate, setSubBillingDate] = useState(getTodayString());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load local data
  const loadData = async () => {
    try {
      const allTx = await StorageService.getTransactions();
      const subsList = await StorageService.getSubscriptions();
      
      setTransactions(allTx);
      setSubscriptions(subsList);
    } catch (e) {
      console.error('Failed to load analytics data', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Save subscription
  const handleSaveSub = async () => {
    const cost = parseFloat(subCost);
    if (isNaN(cost) || cost <= 0 || !subName.trim()) return;

    await StorageService.addSubscription({
      name: subName.trim(),
      cost,
      period: subPeriod,
      nextBillingDate: subBillingDate,
    });

    setShowSubModal(false);
    setSubName('');
    setSubCost('');
    setSubPeriod('monthly');
    setSubBillingDate(getTodayString());
    loadData();
  };

  // Delete subscription
  const handleDeleteSub = async (id: string) => {
    const performDelete = async () => {
      await StorageService.deleteSubscription(id);
      await ApiService.syncData();
      loadData();
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm(t.deleteSubConfirm || 'Are you sure you want to delete this subscription?');
      if (confirm) {
        performDelete();
      }
    } else {
      Alert.alert(
        t.deleteWarning || 'Delete Warning',
        t.deleteSubConfirm || 'Are you sure you want to delete this subscription?',
        [
          { text: t.cancel || 'Cancel', style: 'cancel' },
          { text: t.delete || 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setSubBillingDate(`${year}-${month}-${day}`);
    }
  };

  const getDatePickerValue = (): Date => {
    const [year, month, day] = subBillingDate.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32;

  // 1. Process Category Expense Data for Pie Chart
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  // Aggregate expenses by category
  const expenseByCategory: Record<string, number> = {};
  let totalExpense = 0;

  expenseTransactions.forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    totalExpense += t.amount;
  });

  const pieChartData = Object.entries(expenseByCategory).map(([category, amount]) => {
    const catConfig = getCategoryConfig(category, 'expense');
    return {
      name: translateCategory(category, language),
      population: Math.round(amount),
      color: catConfig.color,
      legendFontColor: colors.text,
      legendFontSize: 11,
    };
  }).sort((a, b) => b.population - a.population);

  // 2. Process Monthly Data for Bar Chart (Last 6 Months)
  const getMonthlyBarData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySummary: Record<string, { income: number; expense: number }> = {};
    const labels: string[] = [];

    // Get current date
    const today = new Date();

    // Populate last 6 months keys (YYYY-MM)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthLabel = months[d.getMonth()];
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      labels.push(monthLabel);
      monthlySummary[key] = { income: 0, expense: 0 };
    }

    // Allocate transactions to months
    transactions.forEach(t => {
      const key = t.date.substring(0, 7);
      if (monthlySummary[key]) {
        if (t.type === 'income') {
          monthlySummary[key].income += t.amount;
        } else {
          monthlySummary[key].expense += t.amount;
        }
      }
    });

    const incomeData = Object.values(monthlySummary).map(m => Math.round(m.income));
    const expenseData = Object.values(monthlySummary).map(m => Math.round(m.expense));

    return {
      labels,
      datasets: [
        {
          data: incomeData,
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        },
        {
          data: expenseData,
          color: (opacity = 1) => `rgba(244, 63, 94, ${opacity})`,
        }
      ],
      legend: [t.income, t.expense]
    };
  };

  const monthlyBarData = getMonthlyBarData();

  // Helper config for charts
  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  // Compute monthly subscriptions total
  const monthlySubsTotal = subscriptions.reduce((sum, s) => {
    if (s.period === 'monthly') return sum + s.cost;
    return sum + (s.cost / 12); // Pro-rate yearly subscriptions
  }, 0);

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

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: sizes.h1 }]} adjustsFontSizeToFit={true} numberOfLines={1}>
          {t.tabAnalytics}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Pie Chart Card (Category Expenses) */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, marginHorizontal: spacing.md }, shadows]}>
          <Text style={[styles.chartTitle, { color: colors.text, marginBottom: spacing.md }]} adjustsFontSizeToFit={true} numberOfLines={1}>
            {t.categoryExpenses}
          </Text>

          {expenseTransactions.length === 0 ? (
            <Text style={[styles.noDataText, { color: colors.textSecondary, paddingVertical: spacing.xl }]}>
              {t.noExpensesToAnalyze}
            </Text>
          ) : (
            <PieChart
              data={pieChartData}
              width={chartWidth}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          )}
        </View>

        {/* Bar Chart Card (Income vs Expenses last 6 months) */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, marginHorizontal: spacing.md, marginTop: spacing.md }, shadows]}>
          <Text style={[styles.chartTitle, { color: colors.text, marginBottom: spacing.md }]} adjustsFontSizeToFit={true} numberOfLines={1}>
            {t.monthlyOverview}
          </Text>

          {transactions.length === 0 ? (
            <Text style={[styles.noDataText, { color: colors.textSecondary, paddingVertical: spacing.xl }]}>
              {t.noTransactions}
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 8 }}
            >
              <BarChart
                style={{ marginVertical: 8, borderRadius: 16 }}
                data={monthlyBarData}
                width={Math.max(chartWidth, 340)}
                height={220}
                chartConfig={chartConfig}
                yAxisLabel={getCachedCurrencySymbol()}
                yAxisSuffix=""
              />
            </ScrollView>
          )}
        </View>

        {/* ==================== SUBSCRIPTIONS SECTION ==================== */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, marginHorizontal: spacing.md, marginTop: spacing.md }, shadows]}>
          <View style={styles.subHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.chartTitle, { color: colors.text }]} adjustsFontSizeToFit={true} numberOfLines={1}>
                {t.activeSubs}
              </Text>
              <Text style={[styles.subTotal, { color: colors.textSecondary }]} adjustsFontSizeToFit={true} numberOfLines={1}>
                {t.totalCommitment}: {formatCurrency(monthlySubsTotal)}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.addSubBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowSubModal(true)}
            >
              <Ionicons name="add" size={16} color="#ffffff" />
              <Text style={styles.addSubBtnText}>{t.add}</Text>
            </TouchableOpacity>
          </View>

          {subscriptions.length === 0 ? (
            <Text style={[styles.noDataText, { color: colors.textSecondary, paddingVertical: spacing.lg }]}>
              {t.noSubsRegistered}
            </Text>
          ) : (
            <View style={styles.subsList}>
              {subscriptions.map(sub => (
                <View key={sub.id || sub._id} style={[styles.subItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.subItemLeft}>
                    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={[styles.subName, { color: colors.text }]}>{sub.name}</Text>
                      <Text style={[styles.subBilling, { color: colors.textSecondary }]}>
                        {t.renews}: {formatDateString(sub.nextBillingDate)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.subItemRight}>
                    <Text style={[styles.subCostVal, { color: colors.text }]}>
                      {formatCurrency(sub.cost)}<Text style={{ fontSize: 10, color: colors.textSecondary }}>/{sub.period === 'monthly' ? (language === 'ta' ? 'மாதம்' : language === 'hi' ? 'மாह' : language === 'es' ? 'mes' : 'mo') : (language === 'ta' ? 'வருடம்' : language === 'hi' ? 'वर्ष' : language === 'es' ? 'año' : 'yr')}</Text>
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteSub(sub.id || sub._id || '')}
                      style={styles.deleteSubBtn}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.expense} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ==================== ADD SUBSCRIPTION MODAL ==================== */}
      <Modal visible={showSubModal} transparent animationType="slide" onRequestClose={() => setShowSubModal(false)} statusBarTranslucent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.overlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.card, padding: spacing.lg }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text, fontSize: sizes.h2 }]}>{t.addSub}</Text>
                  <TouchableOpacity onPress={() => setShowSubModal(false)}>
                    <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  {/* Sub Name */}
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.subName}</Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background, marginBottom: 12 }]}>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="e.g. Netflix Premium, Spotify Family"
                      placeholderTextColor={colors.textSecondary}
                      value={subName}
                      onChangeText={setSubName}
                    />
                  </View>

                  {/* Sub Cost */}
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.billingCost} ({currency})</Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background, marginBottom: 12 }]}>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="e.g. 649"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      value={subCost}
                      onChangeText={setSubCost}
                    />
                  </View>

                  {/* Billing Period */}
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.billingPeriod}</Text>
                  <View style={styles.periodRow}>
                    <TouchableOpacity
                      style={[
                        styles.periodBtn,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        subPeriod === 'monthly' && { borderColor: colors.primary, borderWidth: 1.5 },
                      ]}
                      onPress={() => setSubPeriod('monthly')}
                    >
                      <Text style={{ color: colors.text }}>{t.monthly}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.periodBtn,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        subPeriod === 'yearly' && { borderColor: colors.primary, borderWidth: 1.5 },
                      ]}
                      onPress={() => setSubPeriod('yearly')}
                    >
                      <Text style={{ color: colors.text }}>{t.yearly}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Next Billing Date */}
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>{t.nextBilling}</Text>
                  <TouchableOpacity
                    style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background, justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: colors.text }}>{formatDateString(subBillingDate)}</Text>
                    <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveSub}>
                    <Text style={styles.saveBtnText}>{t.saveSubscription}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={getDatePickerValue()}
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
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 5,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  chartCard: {
    borderRadius: 24,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  subTotal: {
    fontSize: 12,
    marginTop: 2,
  },
  addSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
  },
  addSubBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subsList: {
    gap: 4,
  },
  subItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  subItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subBilling: {
    fontSize: 11,
    marginTop: 2,
  },
  subItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subCostVal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteSubBtn: {
    padding: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  modalBody: {},
  fieldLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    fontWeight: '500',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  periodBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
export default AnalyticsScreen;
