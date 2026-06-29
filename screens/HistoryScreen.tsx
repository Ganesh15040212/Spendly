import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../utils/theme';
import { StorageService } from '../services/storage';
import { Transaction } from '../database/schema';
import { ExportService } from '../utils/export';
import {
  getTodayString,
  formatDateString,
  formatCurrency,
  getStartAndEndDates,
} from '../utils/helpers';
import { TransactionItem } from '../components/TransactionItem';
import { EmptyState } from '../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { CustomDatePicker as DateTimePicker } from '../components/CustomDatePicker';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';

type FilterType = 'today' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'all';

export const HistoryScreen: React.FC = () => {
  const { colors, spacing, sizes, shadows, t, language } = useTheme();
  const router = useRouter();

  // Data State
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Custom Dates (For Custom Filter)
  const [customStartDate, setCustomStartDate] = useState(getTodayString());
  const [customEndDate, setCustomEndDate] = useState(getTodayString());
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end' | null>(null);

  // Summaries
  const [summary, setSummary] = useState({ income: 0, expense: 0, current: 0 });

  // UI State
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Load local data
  const loadData = async () => {
    try {
      const balance = await StorageService.getOpeningBalance();
      const allTx = await StorageService.getTransactions();
      setOpeningBalance(balance);
      setAllTransactions(allTx);
    } catch (e) {
      console.error('Failed to load transaction history', e);
    } finally {
      setLoading(false);
    }
  };

  // Reload when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Apply filters and search
  useEffect(() => {
    let result = [...allTransactions];

    // 1. Apply Date Filter
    if (activeFilter !== 'all' && activeFilter !== 'custom') {
      const { startDate, endDate } = getStartAndEndDates(activeFilter);
      if (startDate && endDate) {
        result = result.filter(t => t.date >= startDate && t.date <= endDate);
      }
    } else if (activeFilter === 'custom') {
      result = result.filter(t => t.date >= customStartDate && t.date <= customEndDate);
    }

    // 2. Apply Search Query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => {
        const amountStr = t.amount.toString();
        const categoryStr = t.category.toLowerCase();
        const walletStr = (t.wallet || 'Cash').toLowerCase();
        const noteStr = t.note.toLowerCase();
        const dateStr = formatDateString(t.date).toLowerCase();
        return (
          amountStr.includes(query) ||
          categoryStr.includes(query) ||
          walletStr.includes(query) ||
          noteStr.includes(query) ||
          dateStr.includes(query)
        );
      });
    }

    setFilteredTransactions(result);

    // 3. Compute active list summary
    let matchedIncome = 0;
    let matchedExpense = 0;
    result.forEach(t => {
      if (t.type === 'income') matchedIncome += t.amount;
      else matchedExpense += t.amount;
    });

    setSummary({
      income: matchedIncome,
      expense: matchedExpense,
      current: openingBalance + matchedIncome - matchedExpense,
    });
  }, [allTransactions, activeFilter, customStartDate, customEndDate, searchQuery, openingBalance]);

  // Delete transaction handler
  const handleDeleteTransaction = async (id: string) => {
    const executeDelete = async () => {
      const success = await StorageService.deleteTransaction(id);
      if (success) {
        loadData();
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

  // Export handlers
  const getFilterLabel = (filter: FilterType): string => {
    if (filter === 'all') return t.filterAll;
    if (filter === 'today') return t.filterToday;
    if (filter === 'weekly') return t.filterWeekly;
    if (filter === 'monthly') return t.filterMonthly;
    if (filter === 'yearly') return t.filterYearly;
    if (filter === 'custom') {
      return `${formatDateString(customStartDate)} - ${formatDateString(customEndDate)}`;
    }
    return '';
  };

  const handleExportPDF = () => {
    setShowPreviewModal(true);
  };

  const handleDownloadPDF = async () => {
    setShowPreviewModal(false);
    setExporting(true);
    await ExportService.exportToPDF(
      filteredTransactions,
      {
        opening: openingBalance,
        income: summary.income,
        expense: summary.expense,
        current: summary.current,
      },
      getFilterLabel(activeFilter)
    );
    setExporting(false);
  };

  const handlePrintPreviewPDF = async () => {
    setShowPreviewModal(false);
    setExporting(true);
    await ExportService.previewPDF(
      filteredTransactions,
      {
        opening: openingBalance,
        income: summary.income,
        expense: summary.expense,
        current: summary.current,
      },
      getFilterLabel(activeFilter)
    );
    setExporting(false);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    await ExportService.exportToCSV(filteredTransactions);
    setExporting(false);
  };

  // Custom date picker callbacks
  const onDatePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const mode = datePickerMode;
    setDatePickerMode(null);
    
    if (selectedDate && mode) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      if (mode === 'start') {
        setCustomStartDate(dateStr);
      } else {
        setCustomEndDate(dateStr);
      }
    }
  };

  const getDatePickerValue = (): Date => {
    const dateStr = datePickerMode === 'start' ? customStartDate : customEndDate;
    const [year, month, day] = dateStr.split('-');
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
        <Text
          style={[styles.headerTitle, { color: colors.text, fontSize: 16, flex: 1, marginRight: 8 }]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {t.historyTitle}
        </Text>

        
        {/* Export Buttons */}
        <View style={styles.exportActions}>
          <TouchableOpacity
            style={[styles.exportBtn, { borderColor: colors.border }]}
            onPress={handleExportPDF}
            disabled={exporting || filteredTransactions.length === 0}
          >
            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
            <Text style={[styles.exportText, { color: colors.primary }]}>PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportBtn, { borderColor: colors.border }]}
            onPress={handleExportCSV}
            disabled={exporting || filteredTransactions.length === 0}
          >
            <Ionicons name="grid-outline" size={16} color={colors.income} />
            <Text style={[styles.exportText, { color: colors.income }]}>CSV</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t.searchPlaceholder}
          placeholderTextColor={colors.textSecondary + '70'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.trim() !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 8 }}
      >
        {(['all', 'today', 'weekly', 'monthly', 'yearly', 'custom'] as FilterType[]).map(filter => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                { backgroundColor: colors.card, borderColor: colors.border },
                isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: colors.textSecondary, fontWeight: '600' },
                  isActive && { color: '#ffffff' },
                ]}
              >
                {filter === 'all'
                  ? t.filterAll
                  : filter === 'today'
                  ? t.filterToday
                  : filter === 'weekly'
                  ? t.filterWeekly
                  : filter === 'monthly'
                  ? t.filterMonthly
                  : filter === 'yearly'
                  ? t.filterYearly
                  : t.filterCustom}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Custom Date Pickers */}
      {activeFilter === 'custom' && (
        <View style={[styles.customDateContainer, { paddingHorizontal: spacing.md }]}>
          <TouchableOpacity
            style={[styles.customDateBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setDatePickerMode('start')}
          >
            <Text style={[styles.customDateBtnLabel, { color: colors.textSecondary }]}>
              {t.startDate}
            </Text>
            <Text style={[styles.customDateBtnValue, { color: colors.text }]}>
              {formatDateString(customStartDate)}
            </Text>
          </TouchableOpacity>

          <View style={[styles.customDateConnector, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={[styles.customDateBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setDatePickerMode('end')}
          >
            <Text style={[styles.customDateBtnLabel, { color: colors.textSecondary }]}>
              {t.endDate}
            </Text>
            <Text style={[styles.customDateBtnValue, { color: colors.text }]}>
              {formatDateString(customEndDate)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Financial Summary */}
      <View style={[styles.rangeSummary, { backgroundColor: colors.primaryLight + '40', marginHorizontal: spacing.md }]}>
        <View style={styles.rangeSummaryItem}>
          <Text style={[styles.rangeSummaryLabel, { color: colors.textSecondary }]}>{t.income.toUpperCase()}</Text>
          <Text style={[styles.rangeSummaryVal, { color: colors.income }]}>
            +{formatCurrency(summary.income)}
          </Text>
        </View>
        <View style={[styles.rangeSummaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.rangeSummaryItem}>
          <Text style={[styles.rangeSummaryLabel, { color: colors.textSecondary }]}>{t.expense.toUpperCase()}</Text>
          <Text style={[styles.rangeSummaryVal, { color: colors.expense }]}>
            -{formatCurrency(summary.expense)}
          </Text>
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView contentContainerStyle={styles.listScroll} showsVerticalScrollIndicator={false}>
        {filteredTransactions.length === 0 ? (
          <EmptyState
            message={t.noHistoryFound}
            subMessage={t.adjustFilters}
          />
        ) : (
          <View style={[styles.listContainer, { backgroundColor: colors.card, marginHorizontal: spacing.md }]}>
            {filteredTransactions.map(tx => (
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

      {/* Date Pickers */}
      {datePickerMode !== null && (
        <DateTimePicker
          value={getDatePickerValue()}
          mode="date"
          display="default"
          onChange={onDatePickerChange}
        />
      )}

      {/* PDF Report Preview Modal */}
      <Modal
        visible={showPreviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPreviewModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.reportModalContent, { backgroundColor: colors.background }]}>
            {/* Modal Header */}
            <View style={[styles.reportModalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="document-text" size={24} color={colors.primary} />
                <Text style={[styles.reportModalTitle, { color: colors.text }]}>Report Preview</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
                <Ionicons name="close-circle" size={26} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Report Content */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.md }}>
              
              {/* Paper Document Layout */}
              <View style={[styles.reportPaper, { backgroundColor: colors.card, borderColor: colors.border }, shadows]}>
                
                {/* Brand Header */}
                <View style={styles.reportPaperHeader}>
                  <View>
                    <Text style={[styles.reportPaperBrand, { color: colors.primary }]}>SPENDLY REPORT</Text>
                    <Text style={[styles.reportPaperSubtitle, { color: colors.textSecondary }]}>
                      Period: {getFilterLabel(activeFilter)}
                    </Text>
                  </View>
                  <Text style={[styles.reportPaperDate, { color: colors.textSecondary }]}>
                    {new Date().toLocaleDateString()}
                  </Text>
                </View>

                <View style={[styles.reportPaperDivider, { backgroundColor: colors.border }]} />

                {/* Financial Totals Grid */}
                <View style={styles.reportSummaryGrid}>
                  <View style={[styles.reportSummaryCard, { borderColor: colors.border }]}>
                    <Text style={[styles.reportCardLabel, { color: colors.textSecondary }]}>Starting</Text>
                    <Text style={[styles.reportCardVal, { color: colors.text }]}>{formatCurrency(openingBalance)}</Text>
                  </View>
                  
                  <View style={[styles.reportSummaryCard, { borderColor: colors.border }]}>
                    <Text style={[styles.reportCardLabel, { color: colors.textSecondary }]}>Income</Text>
                    <Text style={[styles.reportCardVal, { color: colors.income }]}>+{formatCurrency(summary.income)}</Text>
                  </View>
                  
                  <View style={[styles.reportSummaryCard, { borderColor: colors.border }]}>
                    <Text style={[styles.reportCardLabel, { color: colors.textSecondary }]}>Expenses</Text>
                    <Text style={[styles.reportCardVal, { color: colors.expense }]}>-{formatCurrency(summary.expense)}</Text>
                  </View>

                  <View style={[styles.reportSummaryCard, { borderColor: colors.border }]}>
                    <Text style={[styles.reportCardLabel, { color: colors.textSecondary }]}>Ending</Text>
                    <Text style={[styles.reportCardVal, { color: colors.text }]}>{formatCurrency(summary.current)}</Text>
                  </View>
                </View>

                {/* Profit/Loss Card */}
                {(() => {
                  const profitLoss = summary.income - summary.expense;
                  const isProfit = profitLoss >= 0;
                  return (
                    <View style={[
                      styles.reportProfitLossCard,
                      {
                        backgroundColor: isProfit ? colors.income + '15' : colors.expense + '15',
                        borderColor: isProfit ? colors.income + '50' : colors.expense + '50',
                      }
                    ]}>
                      <Text style={[styles.reportCardLabel, { color: isProfit ? colors.income : colors.expense }]}>
                        {isProfit ? 'Net Profit' : 'Net Loss'}
                      </Text>
                      <Text style={[styles.reportProfitLossVal, { color: isProfit ? colors.income : colors.expense }]}>
                        {isProfit ? '+' : ''}{formatCurrency(profitLoss)}
                      </Text>
                    </View>
                  );
                })()}

                {/* Comparative Performance Insight */}
                {(() => {
                  const profitLoss = summary.income - summary.expense;
                  const isProfit = profitLoss >= 0;
                  const percent = Math.abs((profitLoss / (openingBalance || 1)) * 100).toFixed(1);
                  return (
                    <View style={[
                      styles.reportInsightBox,
                      {
                        backgroundColor: isProfit ? colors.income + '08' : colors.expense + '08',
                        borderColor: isProfit ? colors.income + '20' : colors.expense + '20',
                      }
                    ]}>
                      <Text style={[styles.reportInsightTitle, { color: isProfit ? colors.income : colors.expense }]}>
                        {isProfit ? 'Financial Growth Trend' : 'Budget Warning Trend'}
                      </Text>
                      <Text style={[styles.reportInsightText, { color: colors.text }]}>
                        {isProfit
                          ? `You saved a total of ${formatCurrency(profitLoss)} during this period. Your overall balance increased by ${percent}% compared to your starting opening balance.`
                          : `Your expenses exceeded your income by ${formatCurrency(Math.abs(profitLoss))} during this period. Your overall balance decreased by ${percent}% compared to your starting opening balance.`}
                      </Text>
                    </View>
                  );
                })()}

                {/* Transactions Preview Title */}
                <Text style={[styles.reportSectionTitle, { color: colors.text }]}>
                  Transactions ({filteredTransactions.length} records)
                </Text>

                {/* mini-table headers */}
                <View style={[styles.reportTableHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.tableColHeader, { flex: 2.5, color: colors.textSecondary }]}>Date</Text>
                  <Text style={[styles.tableColHeader, { flex: 2, color: colors.textSecondary }]}>Category</Text>
                  <Text style={[styles.tableColHeader, { flex: 2, color: colors.textSecondary, textAlign: 'right' }]}>Amount</Text>
                </View>

                {/* table rows preview (max 10 items) */}
                {filteredTransactions.slice(0, 10).map((tx, idx) => (
                  <View key={tx.id || tx._id} style={[
                    styles.reportTableRow,
                    {
                      borderBottomColor: colors.border + '50',
                      backgroundColor: idx % 2 === 0 ? colors.background + '20' : 'transparent',
                    }
                  ]}>
                    <Text style={[styles.tableCell, { flex: 2.5, color: colors.text }]}>
                      {formatDateString(tx.date)}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 2, color: colors.text }]}>
                      {tx.category}
                    </Text>
                    <Text style={[
                      styles.tableCell,
                      {
                        flex: 2,
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: tx.type === 'income' ? colors.income : colors.expense,
                      }
                    ]}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </Text>
                  </View>
                ))}

                {filteredTransactions.length > 10 && (
                  <Text style={[styles.moreRecordsLabel, { color: colors.textSecondary }]}>
                    ...and {filteredTransactions.length - 10} more records in exported document.
                  </Text>
                )}
              </View>
            </ScrollView>

            {/* Modal Footer Actions */}
            <View style={[styles.reportModalFooter, { borderTopColor: colors.border, gap: 10 }]}>
              <TouchableOpacity
                style={[styles.footerActionBtn, { backgroundColor: colors.primary }]}
                onPress={handlePrintPreviewPDF}
              >
                <Ionicons name="eye-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.footerActionText}>Print Preview</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.footerActionBtn, { backgroundColor: colors.income }]}
                onPress={handleDownloadPDF}
              >
                <Ionicons name="share-social-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.footerActionText}>Share / Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontWeight: 'bold',
  },
  exportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  exportText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    height: '100%',
  },
  filterScroll: {
    maxHeight: 46,
    marginBottom: 8,
  },
  filterTab: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  filterTabText: {
    fontSize: 12,
  },
  customDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  customDateBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  customDateBtnLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  customDateBtnValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  customDateConnector: {
    width: 8,
    height: 2,
  },
  rangeSummary: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  rangeSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  rangeSummaryLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  rangeSummaryVal: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  rangeSummaryDivider: {
    width: 1,
    height: 24,
    alignSelf: 'center',
  },
  listScroll: {
    paddingBottom: 40,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  reportModalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '85%',
    overflow: 'hidden',
  },
  reportModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reportModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportPaper: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  reportPaperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportPaperBrand: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  reportPaperSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  reportPaperDate: {
    fontSize: 11,
  },
  reportPaperDivider: {
    height: 1.5,
    marginBottom: 16,
  },
  reportSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  reportSummaryCard: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  reportCardLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  reportCardVal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reportProfitLossCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  reportProfitLossVal: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  reportInsightBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  reportInsightTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reportInsightText: {
    fontSize: 12,
    lineHeight: 18,
  },
  reportSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reportTableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tableColHeader: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  reportTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 11,
  },
  moreRecordsLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  reportModalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: 16,
  },
  footerActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
export default HistoryScreen;
