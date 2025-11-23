import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import { CategoryConfig } from '../engine/types';
import { TaxStats } from '../engine/types';

interface TaxOptimizerProps {
  stats: TaxStats;
  activeReliefs: CategoryConfig[];
}

export const TaxOptimizer: React.FC<TaxOptimizerProps> = ({ stats, activeReliefs }) => {
  const opportunities = activeReliefs
    .filter(
      (cat) =>
        !cat.isAutomatic &&
        stats.catStats[cat.id].percent < 100 &&
        stats.catStats[cat.id].remaining > 50
    )
    .sort((a, b) => stats.catStats[b.id].remaining - stats.catStats[a.id].remaining)
    .slice(0, 3);

  if (opportunities.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Lightbulb size={16} color="#d97706" />
        <Text style={styles.title}>Optimization Tips</Text>
      </View>
      {opportunities.map((cat) => (
        <View key={cat.id} style={styles.item}>
          <Text style={styles.itemText}>• {cat.title}</Text>
          <Text style={styles.savings}>
            Save ~RM {Math.round(stats.catStats[cat.id].remaining * 0.21)} tax
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350f',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 12,
    color: '#92400e',
  },
  savings: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
});
