import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Inbox, Settings as SettingsIcon } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import {
  getYearConfig,
  computeCategoryData,
  calculateProgressiveTax,
  formatCurrency,
  YA_YEARS,
} from '../engine/taxEngine';
import { CategoryCard } from '../components/CategoryCard';
import { TaxOptimizer } from '../components/TaxOptimizer';
import { Modal } from '../components/Modal';
import { CategoryConfig } from '../engine/types';

export const DashboardScreen: React.FC = () => {
  const {
    receipts,
    incomeMap,
    userProfile,
    selectedYear,
    setSelectedYear,
  } = useAppContext();

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryConfig | null>(null);

  // Compute active reliefs for selected year
  const activeReliefs = useMemo(
    () => getYearConfig(selectedYear, userProfile),
    [selectedYear, userProfile]
  );

  // Filter receipts for selected year
  const yearReceipts = useMemo(
    () =>
      receipts.filter(
        (r) => r.status === 'verified' && new Date(r.date).getFullYear() === selectedYear
      ),
    [receipts, selectedYear]
  );

  // Count pending receipts
  const pendingCount = receipts.filter((r) => r.status !== 'verified').length;

  // Compute stats
  const stats = useMemo(() => {
    let totalClaimable = 0;
    const catStats: any = {};
    activeReliefs.forEach((cat) => {
      const data = computeCategoryData(cat, yearReceipts);
      catStats[cat.id] = data;
      totalClaimable += data.claimable;
    });
    return { totalClaimable, catStats };
  }, [activeReliefs, yearReceipts]);

  // Tax calculations
  const grossIncome = Math.max(0, parseFloat(incomeMap[selectedYear]?.gross?.toString() || '0'));
  const otherIncome = Math.max(0, parseFloat(incomeMap[selectedYear]?.other?.toString() || '0'));
  const dividendIncome = Math.max(
    0,
    parseFloat(incomeMap[selectedYear]?.dividends?.toString() || '0')
  );

  const totalAggIncome = grossIncome + otherIncome + dividendIncome;
  const donationDeduction = Math.min(
    Math.max(0, userProfile.donations || 0),
    totalAggIncome * 0.1
  );

  const totalIncome = totalAggIncome - donationDeduction;
  const personalRelief = 9000;
  const chargeableIncome = Math.max(0, totalIncome - personalRelief - stats.totalClaimable);

  let taxCalculated = calculateProgressiveTax(chargeableIncome, selectedYear);

  // Budget 2025 Dividend Tax (2% on >100k)
  if (selectedYear >= 2025 && dividendIncome > 100000) {
    taxCalculated += (dividendIncome - 100000) * 0.02;
  }

  const zakatRebate = Math.max(0, userProfile.zakat || 0);
  let statutoryRebate = 0;
  if (chargeableIncome <= 35000 && chargeableIncome > 0) {
    statutoryRebate += 400;
    if (userProfile.status === 'married' && !userProfile.spouseWorking) {
      statutoryRebate += 400;
    }
  }

  const totalRebates = zakatRebate + statutoryRebate;
  const taxPayable = Math.max(0, taxCalculated - totalRebates);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.logo}>
          <Text style={styles.logoText}>CukaiPal</Text>
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerButton}>
            <Inbox size={24} color="#64748b" strokeWidth={2} />
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </Pressable>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userProfile.displayName.charAt(0)}</Text>
          </View>
        </View>
      </View>

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

        {/* Tax Summary Card */}
        <View style={styles.taxCard}>
          <View style={styles.taxCardGlow} />
          <View style={styles.taxCardContent}>
            <View style={styles.taxCardHeader}>
              <View>
                <Text style={styles.taxCardLabel}>Net Tax Payable</Text>
                <Text style={styles.taxCardAmount}>{formatCurrency(taxPayable)}</Text>
              </View>
            </View>
            <View style={styles.taxCardDetails}>
              <View style={styles.taxCardRow}>
                <Text style={styles.taxCardDetailLabel}>Donations</Text>
                <Text style={styles.taxCardDetailValue}>- {formatCurrency(donationDeduction)}</Text>
              </View>
              <View style={styles.taxCardRow}>
                <Text style={styles.taxCardDetailLabel}>Reliefs</Text>
                <Text style={styles.taxCardDetailValue}>
                  - {formatCurrency(stats.totalClaimable + personalRelief)}
                </Text>
              </View>
              <View style={styles.taxCardRow}>
                <Text style={styles.taxCardDetailLabel}>Rebates (Zakat/Statutory)</Text>
                <Text style={[styles.taxCardDetailValue, styles.taxCardDetailValueGreen]}>
                  - {formatCurrency(totalRebates)}
                </Text>
              </View>
              <View style={[styles.taxCardRow, styles.taxCardRowBold]}>
                <Text style={styles.taxCardDetailLabelBold}>Chargeable Income</Text>
                <Text style={styles.taxCardDetailValueBold}>
                  {formatCurrency(chargeableIncome)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tax Optimizer */}
        <TaxOptimizer stats={stats} activeReliefs={activeReliefs} />

        {/* Categories */}
        {activeReliefs.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            data={stats.catStats[cat.id]}
            onAddClick={() => {}}
            onInfoClick={() => {
              setSelectedCategory(cat);
              setShowInfoModal(true);
            }}
          />
        ))}
      </ScrollView>

      {/* Info Modal */}
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title={selectedCategory?.title || ''}
      >
        {selectedCategory && (
          <View>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Text style={styles.modalIcon}>{selectedCategory.icon}</Text>
              </View>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalLimit}>{formatCurrency(selectedCategory.limit)} Limit</Text>
                <Text style={styles.modalAdvice}>{selectedCategory.advice}</Text>
              </View>
            </View>

            {selectedCategory.details && (
              <View style={styles.modalDetails}>
                <Text style={styles.modalDetailsTitle}>Official LHDN Policy</Text>
                <Text style={styles.modalDetailsText}>{selectedCategory.details}</Text>
              </View>
            )}

            <View style={styles.modalItems}>
              <Text style={styles.modalItemsTitle}>Eligible Items</Text>
              {selectedCategory.items.map((item) => (
                <Text key={item.id} style={styles.modalItem}>
                  ✓ {item.label}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logo: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  headerButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 999,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
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
  taxCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  taxCardGlow: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 192,
    height: 192,
    backgroundColor: '#10b981',
    opacity: 0.2,
    borderRadius: 96,
  },
  taxCardContent: {
    position: 'relative',
    zIndex: 10,
  },
  taxCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  taxCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  taxCardAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -1,
  },
  taxCardDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
    gap: 4,
  },
  taxCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taxCardRowBold: {
    marginTop: 4,
    paddingTop: 8,
  },
  taxCardDetailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  taxCardDetailValue: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  taxCardDetailValueGreen: {
    color: '#10b981',
  },
  taxCardDetailLabelBold: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  taxCardDetailValueBold: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  modalHeader: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginBottom: 16,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 24,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalLimit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalAdvice: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  modalDetails: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
  },
  modalDetailsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  modalDetailsText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  modalItems: {
    marginBottom: 16,
  },
  modalItemsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  modalItem: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 20,
  },
});
