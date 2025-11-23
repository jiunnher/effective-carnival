import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { PlusCircle, BookOpen } from 'lucide-react-native';
import { CategoryConfig, CategoryStats } from '../engine/types';
import { formatCurrency } from '../engine/taxEngine';

interface CategoryCardProps {
  category: CategoryConfig;
  data: CategoryStats;
  onAddClick: () => void;
  onInfoClick: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  data,
  onAddClick,
  onInfoClick,
}) => {
  return (
    <View
      style={[
        styles.container,
        data.isAutomatic ? styles.containerAutomatic : styles.containerNormal,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{category.icon}</Text>
          </View>
          <View>
            <Text style={styles.title}>{category.title}</Text>
            {data.isAutomatic ? (
              <View style={styles.autoBadge}>
                <Text style={styles.autoBadgeText}>Auto-Applied</Text>
              </View>
            ) : (
              <Pressable onPress={onInfoClick} style={styles.infoButton}>
                <BookOpen size={10} color="#94a3b8" />
                <Text style={styles.infoText}>Policy Note</Text>
              </Pressable>
            )}
          </View>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.amount}>{formatCurrency(data.claimable)}</Text>
          <Text style={styles.limitText}>of {formatCurrency(category.limit)}</Text>
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            data.percent >= 100 ? styles.progressBarComplete : styles.progressBarPartial,
            { width: `${data.percent}%` },
          ]}
        />
      </View>

      {!data.isAutomatic && (
        <View style={styles.footer}>
          <Text
            style={[
              styles.remainingText,
              data.remaining <= 0 ? styles.remainingTextComplete : styles.remainingTextPending,
            ]}
          >
            {data.remaining <= 0 ? 'Maximized' : `${formatCurrency(data.remaining)} left`}
          </Text>
          <Pressable onPress={onAddClick} style={styles.addButton}>
            <PlusCircle size={14} color="#64748b" />
            <Text style={styles.addButtonText}>Add Expense</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  containerAutomatic: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  containerNormal: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  autoBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  autoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  infoText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  limitText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  progressBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
  },
  progressBarComplete: {
    backgroundColor: '#10b981',
  },
  progressBarPartial: {
    backgroundColor: '#3b82f6',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  remainingTextComplete: {
    color: '#16a34a',
  },
  remainingTextPending: {
    color: '#64748b',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
});
