import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { Archive, FileDown, FileSpreadsheet, Search } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { ReceiptItem } from '../components/ReceiptItem';
import { DEDUCTIBLES, formatCurrency, YA_YEARS } from '../engine/taxEngine';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

export const VaultScreen: React.FC = () => {
  const { receipts, selectedYear, setSelectedYear, deleteReceipt } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter receipts for selected year with search
  const yearReceipts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return receipts.filter((r) => {
      if (r.status !== 'verified') return false;
      if (new Date(r.date).getFullYear() !== selectedYear) return false;
      if (!query) return true;
      return (
        r.description.toLowerCase().includes(query) ||
        r.subCategory.includes(query) ||
        r.amount.toString().includes(query)
      );
    });
  }, [receipts, selectedYear, searchQuery]);

  const handleExportCSV = async () => {
    if (yearReceipts.length === 0) {
      Alert.alert('No Data', 'No verified receipts to export.');
      return;
    }

    try {
      const csvContent =
        'Date,Category,Sub-Category,Description,Amount\n' +
        yearReceipts
          .map((r) => `${r.date},${r.category},${r.subCategory},${r.description},${r.amount}`)
          .join('\n');

      const fileUri = `${FileSystem.cacheDirectory}cukaipal_export_${selectedYear}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export CSV file.');
    }
  };

  const handleExportPDF = async () => {
    if (yearReceipts.length === 0) {
      Alert.alert('No Data', 'No verified receipts to export.');
      return;
    }

    try {
      const rows = yearReceipts
        .map(
          (r) =>
            `<tr><td>${r.date}</td><td>${r.description}</td><td>${r.category}</td><td style="text-align:right">${formatCurrency(r.amount)}</td></tr>`
        )
        .join('');

      const html = `
        <html>
          <head>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background: #f5f5f5; }
              h1 { font-size: 24px; margin-bottom: 16px; }
            </style>
          </head>
          <body>
            <h1>CukaiPal YA ${selectedYear}</h1>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export PDF file.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Receipt', 'Are you sure you want to delete this receipt?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteReceipt(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Year Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.yearSelector}
          contentContainerStyle={styles.yearSelectorContent}
        >
          {YA_YEARS.map((year) => (
            <Pressable
              key={year}
              onPress={() => setSelectedYear(year)}
              style={[
                styles.yearButton,
                selectedYear === year ? styles.yearButtonActive : styles.yearButtonInactive,
              ]}
            >
              <Text
                style={[
                  styles.yearButtonText,
                  selectedYear === year
                    ? styles.yearButtonTextActive
                    : styles.yearButtonTextInactive,
                ]}
              >
                {year}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Header Card */}
        <View style={styles.headerCard}>
          <Archive size={32} color="#cbd5e1" />
          <Text style={styles.headerTitle}>Digital Vault</Text>
          <Text style={styles.headerSubtitle}>YA {selectedYear} Verified Docs</Text>
          <View style={styles.exportButtons}>
            <Pressable onPress={handleExportPDF} style={styles.exportButton}>
              <FileDown size={16} color="#ffffff" />
              <Text style={styles.exportButtonText}>Export PDF</Text>
            </Pressable>
            <Pressable onPress={handleExportCSV} style={styles.exportButtonSecondary}>
              <FileSpreadsheet size={16} color="#ffffff" />
              <Text style={styles.exportButtonText}>Export CSV</Text>
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search receipts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#cbd5e1"
          />
        </View>

        {/* Receipts List */}
        {yearReceipts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No receipts found</Text>
          </View>
        ) : (
          yearReceipts.map((r) => {
            const itemLabel =
              Object.values(DEDUCTIBLES).find((i) => i.id === r.subCategory)?.label || r.subCategory;
            return (
              <ReceiptItem
                key={r.id}
                receipt={r}
                label={itemLabel}
                onView={() => {}}
                onEdit={() => {}}
                onDelete={() => handleDelete(r.id)}
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  yearSelector: {
    marginBottom: 16,
  },
  yearSelectorContent: {
    gap: 8,
  },
  yearButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
  },
  yearButtonActive: {
    backgroundColor: '#1e293b',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  yearButtonInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  yearButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  yearButtonTextActive: {
    color: '#ffffff',
  },
  yearButtonTextInactive: {
    color: '#64748b',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exportButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
