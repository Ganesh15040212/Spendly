import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  StatusBar,
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
import { Budget, Goal } from '../database/schema';
import { formatCurrency, getTodayString, formatDateString, getStartAndEndDates, EXPENSE_CATEGORIES, getCachedCurrencySymbol } from '../utils/helpers';
import { translateCategory } from '../utils/translations';
import { Ionicons } from '@expo/vector-icons';

import { CustomDatePicker as DateTimePicker } from '../components/CustomDatePicker';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export const BudgetGoalsScreen: React.FC = () => {
  const { colors, spacing, sizes, shadows, t, currency, language } = useTheme();

  // Data States
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [spentByCategory, setSpentByCategory] = useState<Record<string, number>>({});

  // UI state
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState<'budgets' | 'goals'>('budgets');
  
  // Modals state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState<Goal | null>(null);

  // Form states (Budget)
  const [budgetCategory, setBudgetCategory] = useState(Object.keys(EXPENSE_CATEGORIES)[0]);
  const [budgetLimit, setBudgetLimit] = useState('');

  // Form states (Goal)
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDeadline, setGoalDeadline] = useState(getTodayString());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form states (Add Fund)
  const [fundAmount, setFundAmount] = useState('');

  // Load data
  const loadData = async () => {
    try {
      const budgetList = await StorageService.getBudgets();
      const goalList = await StorageService.getGoals();
      const transactions = await StorageService.getTransactions();

      // Compute monthly expenses by category to cross-check budgets
      const { startDate, endDate } = getStartAndEndDates('monthly');
      const monthlySpent: Record<string, number> = {};

      transactions.forEach(t => {
        if (t.type === 'expense' && t.date >= startDate && t.date <= endDate) {
          monthlySpent[t.category] = (monthlySpent[t.category] || 0) + t.amount;
        }
      });

      setBudgets(budgetList);
      setGoals(goalList);
      setSpentByCategory(monthlySpent);
    } catch (e) {
      console.error('Failed to load budget/goal data', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Save budget
  const handleSaveBudget = async () => {
    const limit = parseFloat(budgetLimit);
    if (isNaN(limit) || limit <= 0) return;

    // Get current YYYY-MM period
    const today = new Date();
    const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const newBudget: Budget = {
      category: budgetCategory,
      limitAmount: limit,
      period,
    };

    await StorageService.addOrUpdateBudget(newBudget);
    setShowBudgetModal(false);
    setBudgetLimit('');
    loadData();
  };

  // Delete budget
  const handleDeleteBudget = async (category: string, period: string) => {
    const executeDelete = async () => {
      await StorageService.deleteBudget(category, period);
      await ApiService.syncData();
      loadData();
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(t.deleteBudgetConfirm);
      if (confirmDelete) {
        executeDelete();
      }
    } else {
      Alert.alert(
        t.deleteWarning,
        t.deleteBudgetConfirm,
        [
          { text: t.cancel, style: 'cancel' },
          { text: t.yes, style: 'destructive', onPress: executeDelete },
        ]
      );
    }
  };

  // Save goal
  const handleSaveGoal = async () => {
    const target = parseFloat(goalTarget);
    const current = parseFloat(goalCurrent) || 0;
    if (isNaN(target) || target <= 0 || !goalName.trim()) return;

    await StorageService.addGoal({
      name: goalName.trim(),
      targetAmount: target,
      currentAmount: current,
      deadline: goalDeadline,
    });

    setShowGoalModal(false);
    setGoalName('');
    setGoalTarget('');
    setGoalCurrent('');
    setGoalDeadline(getTodayString());
    loadData();
  };

  // Add savings funds
  const handleAddFund = async () => {
    if (!showFundModal) return;
    const fund = parseFloat(fundAmount);
    if (isNaN(fund) || fund <= 0) return;

    const newCurrent = (showFundModal.currentAmount || 0) + fund;
    await StorageService.updateGoal(showFundModal.id || showFundModal._id || '', {
      currentAmount: Math.min(newCurrent, showFundModal.targetAmount),
    });

    setShowFundModal(null);
    setFundAmount('');
    loadData();
  };

  // Delete goal
  const handleDeleteGoal = async (id: string) => {
    const executeDelete = async () => {
      await StorageService.deleteGoal(id);
      await ApiService.syncData();
      loadData();
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(t.deleteGoalConfirm);
      if (confirmDelete) {
        executeDelete();
      }
    } else {
      Alert.alert(
        t.deleteWarning,
        t.deleteGoalConfirm,
        [
          { text: t.cancel, style: 'cancel' },
          { text: t.yes, style: 'destructive', onPress: executeDelete },
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
      setGoalDeadline(`${year}-${month}-${day}`);
    }
  };

  const getDatePickerValue = (): Date => {
    const [year, month, day] = goalDeadline.split('-');
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

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: sizes.h1 }]}>
          {t.tabBudgets}
        </Text>
      </View>

      {/* Switcher Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card, marginHorizontal: spacing.md }]}>
        <TouchableOpacity
          style={[styles.tab, activeSegment === 'budgets' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveSegment('budgets')}
        >
          <Text style={[styles.tabText, { color: activeSegment === 'budgets' ? '#ffffff' : colors.textSecondary }]} adjustsFontSizeToFit numberOfLines={1}>
            {t.budgets}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeSegment === 'goals' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveSegment('goals')}
        >
          <Text style={[styles.tabText, { color: activeSegment === 'goals' ? '#ffffff' : colors.textSecondary }]} adjustsFontSizeToFit numberOfLines={1}>
            {t.goals}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* ==================== BUDGETS TAB ==================== */}
        {activeSegment === 'budgets' && (
          <View style={[styles.tabContent, { paddingHorizontal: spacing.md }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {t.trackCategoryLimits}
              </Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowBudgetModal(true)}
              >
                <Ionicons name="add" size={18} color="#ffffff" />
                <Text style={styles.addBtnText} numberOfLines={1} adjustsFontSizeToFit>{t.setBudget}</Text>
              </TouchableOpacity>
            </View>

            {budgets.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.card }]} >
                <Ionicons name="shield-checkmark" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 10 }]}>
                  {t.noSpendingBudgets}
                </Text>
              </View>
            ) : (
              <View style={styles.budgetList}>
                {budgets.map(budget => {
                  const spent = spentByCategory[budget.category] || 0;
                  const ratio = Math.min(spent / budget.limitAmount, 1);
                  const percentage = Math.round((spent / budget.limitAmount) * 100);
                  
                  // Alert Colors
                  let progressColor = colors.income; // Under 50%
                  let alertText = '';
                  
                  if (percentage >= 100) {
                    progressColor = colors.expense;
                    alertText = '🚨 Budget Exceeded!';
                  } else if (percentage >= 90) {
                    progressColor = '#f43f5e'; // Rose
                    alertText = '⚠️ 90% Limit Reached';
                  } else if (percentage >= 75) {
                    progressColor = '#f59e0b'; // Amber
                    alertText = '⚠️ 75% Limit Reached';
                  } else if (percentage >= 50) {
                    progressColor = '#fbbf24'; // Yellow
                    alertText = '50% Budget Used';
                  }

                  return (
                    <View key={budget.category} style={[styles.itemCard, { backgroundColor: colors.card }, shadows]}>
                      <View style={styles.itemHeader}>
                        <View>
                          <Text style={[styles.itemName, { color: colors.text }]}>{translateCategory(budget.category, language)}</Text>
                          {alertText ? <Text style={[styles.alertText, { color: progressColor }]}>{alertText}</Text> : null}
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteBudget(budget.category, budget.period)}
                          style={[styles.deleteBtn, { backgroundColor: colors.expenseLight }]}
                        >
                          <Ionicons name="trash" size={14} color={colors.expense} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.itemValues}>
                        <Text style={[styles.itemSpent, { color: colors.text }]} adjustsFontSizeToFit numberOfLines={1}>
                          {formatCurrency(spent)} <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t.spentOf} {formatCurrency(budget.limitAmount)}</Text>
                        </Text>
                      </View>

                      {/* Progress bar */}
                      <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { backgroundColor: progressColor, width: `${ratio * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressPercent, { color: colors.textSecondary }]}>
                        {percentage}% {t.used}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ==================== GOALS TAB ==================== */}
        {activeSegment === 'goals' && (
          <View style={[styles.tabContent, { paddingHorizontal: spacing.md }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {t.saveSavingsGoals}
              </Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary, flexShrink: 0 }]}
                onPress={() => setShowGoalModal(true)}
              >
                <Ionicons name="add" size={18} color="#ffffff" />
                <Text style={styles.addBtnText} numberOfLines={1} adjustsFontSizeToFit>{t.addGoal}</Text>
              </TouchableOpacity>
            </View>

            {goals.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.card }]} >
                <Ionicons name="gift-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 10 }]}>
                  {t.noSavingsGoals}
                </Text>
              </View>
            ) : (
              <View style={styles.goalList}>
                {goals.map(goal => {
                  const ratio = Math.min((goal.currentAmount || 0) / goal.targetAmount, 1);
                  const percentage = Math.round(((goal.currentAmount || 0) / goal.targetAmount) * 100);

                  return (
                    <View key={goal.id || goal._id} style={[styles.itemCard, { backgroundColor: colors.card }, shadows]}>
                      <View style={styles.itemHeader}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={[styles.itemName, { color: colors.text }]} adjustsFontSizeToFit numberOfLines={1}>{goal.name}</Text>
                          <Text style={[styles.goalDeadline, { color: colors.textSecondary }]}>
                            {t.deadline}: {formatDateString(goal.deadline)}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                          <TouchableOpacity
                            onPress={() => setShowFundModal(goal)}
                            style={[styles.fundBtn, { backgroundColor: colors.incomeLight }]}
                          >
                            <Ionicons name="add-circle" size={16} color={colors.income} />
                            <Text style={[styles.fundBtnText, { color: colors.income }]} adjustsFontSizeToFit numberOfLines={1}>{t.addFunds}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteGoal(goal.id || goal._id || '')}
                            style={[styles.deleteBtn, { backgroundColor: colors.expenseLight }]}
                          >
                            <Ionicons name="trash" size={14} color={colors.expense} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.itemValues}>
                        <Text style={[styles.itemSpent, { color: colors.text, flex: 1, marginRight: 8 }]} adjustsFontSizeToFit numberOfLines={1}>
                          {formatCurrency(goal.currentAmount || 0)} <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t.savedLabel}</Text>
                        </Text>
                        <Text style={[styles.itemTarget, { color: colors.textSecondary, flex: 1, textAlign: 'right' }]} adjustsFontSizeToFit numberOfLines={1}>
                          {language === 'ta' ? 'இலக்கு' : language === 'hi' ? 'लक्ष्य' : language === 'es' ? 'Meta' : 'Target'}: {formatCurrency(goal.targetAmount)}
                        </Text>

                      </View>

                      {/* Progress bar */}
                      <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { backgroundColor: colors.primary, width: `${ratio * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressPercent, { color: colors.textSecondary }]}>
                        {percentage}% {t.completed}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ==================== BUDGET MODAL ==================== */}
      <Modal visible={showBudgetModal} transparent animationType="slide" onRequestClose={() => setShowBudgetModal(false)} statusBarTranslucent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.overlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.card, padding: spacing.lg }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text, fontSize: sizes.h2 }]}>{t.setBudget}</Text>
                  <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                    <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  {/* Category selector */}
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.selectCategory}</Text>
                  <View style={styles.categoryPicker}>
                    {Object.keys(EXPENSE_CATEGORIES).map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.catBtn,
                          { backgroundColor: colors.background, borderColor: colors.border },
                          budgetCategory === cat && { borderColor: colors.primary, borderWidth: 1.5 },
                        ]}
                        onPress={() => setBudgetCategory(cat)}
                      >
                        <Text style={{ color: colors.text, fontSize: 12 }}>{translateCategory(cat, language)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Amount input */}
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: spacing.md }]}>{t.budgetLimit} ({currency})</Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="e.g. 5000"
                      keyboardType="numeric"
                      value={budgetLimit}
                      onChangeText={setBudgetLimit}
                    />
                  </View>

                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveBudget}>
                    <Text style={styles.saveBtnText}>{t.save}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ==================== GOAL MODAL ==================== */}
      <Modal visible={showGoalModal} transparent animationType="slide" onRequestClose={() => setShowGoalModal(false)} statusBarTranslucent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.overlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.card, padding: spacing.lg }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text, fontSize: sizes.h2 }]}>{t.addGoal}</Text>
                  <TouchableOpacity onPress={() => setShowGoalModal(false)}>
                    <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  {/* Goal name */}
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.goalName}</Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background, marginBottom: 12 }]}>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="e.g. Buy Macbook Pro"
                      value={goalName}
                      onChangeText={setGoalName}
                    />
                  </View>

                  {/* Target amount */}
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.targetAmount} ({currency})</Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background, marginBottom: 12 }]}>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="e.g. 150000"
                      keyboardType="numeric"
                      value={goalTarget}
                      onChangeText={setGoalTarget}
                    />
                  </View>

                  {/* Initial savings */}
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.initialSavings} ({currency})</Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background, marginBottom: 12 }]}>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="e.g. 5000 (Optional)"
                      keyboardType="numeric"
                      value={goalCurrent}
                      onChangeText={setGoalCurrent}
                    />
                  </View>

                  {/* Target Deadline */}
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.deadline}</Text>
                  <TouchableOpacity
                    style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background, justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: colors.text }}>{formatDateString(goalDeadline)}</Text>
                    <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveGoal}>
                    <Text style={styles.saveBtnText}>{t.save}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ==================== ADD FUND MODAL ==================== */}
      <Modal visible={showFundModal !== null} transparent animationType="fade" onRequestClose={() => setShowFundModal(null)} statusBarTranslucent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.overlayCenter}>
              <View style={[styles.alertModal, { backgroundColor: colors.card, padding: spacing.lg }]}>
                <Text style={[styles.modalTitle, { color: colors.text, fontSize: sizes.h3, textAlign: 'center', marginBottom: 12 }]}>
                  {t.addFundsTitle} "{showFundModal?.name}"
                </Text>
                
                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background, marginBottom: 16 }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={`Amount (${getCachedCurrencySymbol()})`}
                    keyboardType="numeric"
                    value={fundAmount}
                    onChangeText={setFundAmount}
                    autoFocus
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    style={[styles.fundModalBtn, { borderColor: colors.border, borderWidth: 1 }]}
                    onPress={() => setShowFundModal(null)}
                  >
                    <Text style={{ color: colors.textSecondary }}>{t.cancel}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.fundModalBtn, { backgroundColor: colors.primary }]}
                    onPress={handleAddFund}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>{t.save}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date picker */}
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
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginVertical: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  tabContent: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: 16,
    gap: 10,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'stretch',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyBox: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  budgetList: {
    gap: 16,
  },
  goalList: {
    gap: 16,
  },
  itemCard: {
    borderRadius: 24,
    padding: 16,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  goalDeadline: {
    fontSize: 11,
    marginTop: 2,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  fundBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  itemValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
    marginBottom: 8,
  },
  itemSpent: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemTarget: {
    fontSize: 13,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
    fontWeight: '600',
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
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  catBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
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
  overlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertModal: {
    width: '100%',
    borderRadius: 24,
  },
  fundModalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default BudgetGoalsScreen;
