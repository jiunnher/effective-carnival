import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Clock, AlertCircle, Loader2, Edit2, Trash2 } from 'lucide-react-native';
import { Receipt } from '../engine/types';
import { formatCurrency } from '../engine/taxEngine';

interface ReceiptItemProps {
  receipt: Receipt;
  label: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onProcess?: () => void;
}

export const ReceiptItem: React.FC<ReceiptItemProps> = ({
  receipt,
  label,
  onView,
  onEdit,
  onDelete,
  onProcess,
}) => {
  const getStatusStyle = () => {
    switch (receipt.status) {
      case 'pending':
        return { bg: '#f8fafc', border: '#e2e8f0', icon: <Clock size={14} color="#94a3b8" /> };
      case 'analyzing':
        return { bg: '#eef2ff', border: '#c7d2fe', icon: <Loader2 size={14} color="#6366f1" /> };
      case 'review':
        return { bg: '#fffbeb', border: '#fde68a', icon: <AlertCircle size={14} color="#f59e0b" /> };
      default:
        return { bg: '#ffffff', border: '#f1f5f9', icon: null };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <Pressable
      onPress={onView}
      style={[
        styles.container,
        { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          {statusStyle.icon}
          <Text style={styles.status}>
            {receipt.status === 'verified' ? label : receipt.status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.description} numberOfLines={1}>
          {receipt.description || 'Unprocessed Receipt'}
        </Text>
        <Text style={styles.date}>
          {receipt.date} {receipt.fileUri && '📎'}
        </Text>
      </View>

      <View style={styles.actions}>
        <Text style={styles.amount}>{formatCurrency(receipt.amount || 0)}</Text>
        {receipt.status === 'review' || receipt.status === 'pending' ? (
          <Pressable onPress={onProcess} style={styles.processButton}>
            <Text style={styles.processButtonText}>
              {receipt.status === 'review' ? 'Verify' : 'Scan'}
            </Text>
          </Pressable>
        ) : receipt.status === 'analyzing' ? (
          <Text style={styles.analyzingText}>Processing...</Text>
        ) : (
          <View style={styles.actionButtons}>
            <Pressable onPress={onEdit} style={styles.iconButton}>
              <Edit2 size={14} color="#64748b" />
            </Pressable>
            <Pressable onPress={onDelete} style={[styles.iconButton, styles.deleteButton]}>
              <Trash2 size={14} color="#ef4444" />
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  status: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#64748b',
  },
  description: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  date: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  actions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  processButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  processButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  analyzingText: {
    fontSize: 10,
    color: '#6366f1',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
});
