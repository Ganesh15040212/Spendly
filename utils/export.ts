import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Transaction } from '../database/schema';
import { formatDateString, formatCurrency } from './helpers';

export const ExportService = {
  // Export Transactions to PDF
  exportToPDF: async (transactions: Transaction[], balanceSummary: { opening: number; income: number; expense: number; current: number }) => {
    try {
      const rowsHtml = transactions.map((t, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155;">${formatDateString(t.date)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 600; color: ${t.type === 'income' ? '#10b981' : '#ef4444'};">
            ${t.type === 'income' ? 'INCOME' : 'EXPENSE'}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155;">${t.category}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; font-style: italic;">${t.note || '-'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 600; text-align: right; color: ${t.type === 'income' ? '#10b981' : '#ef4444'};">
            ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
          </td>
        </tr>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Spendly Expense Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #0f172a; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #6366f1; padding-bottom: 15px; margin-bottom: 25px; }
            .title { font-size: 26px; font-weight: bold; color: #4f46e5; }
            .date { font-size: 14px; color: #64748b; }
            
            .summary-cards { display: flex; gap: 15px; margin-bottom: 30px; }
            .card { flex: 1; padding: 15px; border-radius: 12px; background-color: #f1f5f9; border: 1px solid #cbd5e1; }
            .card-title { font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; font-weight: bold; }
            .card-value { font-size: 18px; font-weight: bold; }
            
            .table-container { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #6366f1; color: white; padding: 12px; font-size: 14px; text-align: left; text-transform: uppercase; }
            tr:hover { background-color: #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">SPENDLY REPORTS</div>
              <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
            </div>
            <div style="font-size: 16px; font-weight: bold; color: #64748b;">Daily Expense Tracker</div>
          </div>
          
          <div class="summary-cards">
            <div class="card">
              <div class="card-title">Opening Balance</div>
              <div class="card-value" style="color: #4f46e5;">${formatCurrency(balanceSummary.opening)}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Income</div>
              <div class="card-value" style="color: #10b981;">+${formatCurrency(balanceSummary.income)}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Expense</div>
              <div class="card-value" style="color: #ef4444;">-${formatCurrency(balanceSummary.expense)}</div>
            </div>
            <div class="card" style="background-color: #e0e7ff; border-color: #818cf8;">
              <div class="card-title" style="color: #4f46e5;">Current Balance</div>
              <div class="card-value" style="color: #4f46e5;">${formatCurrency(balanceSummary.current)}</div>
            </div>
          </div>

          <h3>Transaction History (${transactions.length} Records)</h3>
          <table class="table-container">
            <thead>
              <tr>
                <th style="border-top-left-radius: 8px;">Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Note</th>
                <th style="text-align: right; border-top-right-radius: 8px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        await Print.printAsync({ html: htmlContent });
        return true;
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(uri, { 
            mimeType: 'application/pdf', 
            dialogTitle: 'Export PDF Report',
            UTI: 'com.adobe.pdf' 
          });
        } else {
          const permanentUri = `${(FileSystem as any).documentDirectory}Spendly_Report_${Date.now()}.pdf`;
          await FileSystem.copyAsync({ from: uri, to: permanentUri });
          Alert.alert(
            'Export Successful',
            `Sharing is not supported on this device/emulator. The PDF report has been saved locally at:\n\n${permanentUri}`
          );
        }
        return true;
      }
    } catch (error: any) {
      console.error('Failed to export PDF', error);
      Alert.alert('Export Error', `Failed to export PDF: ${error.message || error}`);
      return false;
    }
  },

  // Export Transactions to CSV (Excel compatible)
  exportToCSV: async (transactions: Transaction[]) => {
    try {
      const headers = 'Date,Type,Category,Note,Amount\n';
      const rows = transactions.map(t => {
        const cleanNote = t.note ? t.note.replace(/"/g, '""') : '';
        return `"${t.date}","${t.type.toUpperCase()}","${t.category}","${cleanNote}",${t.amount}`;
      }).join('\n');

      const csvContent = headers + rows;

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Spendly_Report_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      } else {
        const fileUri = `${(FileSystem as any).documentDirectory}Spendly_Report_${Date.now()}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: (FileSystem as any).EncodingType.UTF8 });
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(fileUri, { 
            mimeType: 'text/csv', 
            dialogTitle: 'Export CSV Report',
            UTI: 'public.comma-separated-values-text' 
          });
        } else {
          Alert.alert(
            'Export Successful',
            `Sharing is not supported on this device/emulator. The CSV report has been saved locally at:\n\n${fileUri}`
          );
        }
        return true;
      }
    } catch (error: any) {
      console.error('Failed to export CSV', error);
      Alert.alert('Export Error', `Failed to export CSV: ${error.message || error}`);
      return false;
    }
  }
};
