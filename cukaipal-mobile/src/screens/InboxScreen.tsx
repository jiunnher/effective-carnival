import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Pressable,
  Alert,
} from 'react-native';
import { Inbox, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppContext } from '../context/AppContext';
import { ReceiptItem } from '../components/ReceiptItem';

export const InboxScreen: React.FC = () => {
  const { receipts, saveReceipt, deleteReceipt } = useAppContext();

  const pendingReceipts = receipts.filter((r) => r.status !== 'verified');

  const handleBatchUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      for (const asset of result.assets) {
        const newReceipt = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          status: 'pending' as const,
          date: new Date().toISOString().split('T')[0],
          description: asset.fileName || 'Uploaded Receipt',
          amount: 0,
          category: 'lifestyle',
          subCategory: 'lifestyle_books',
          fileUri: asset.uri,
        };
        await saveReceipt(newReceipt);
      }

      Alert.alert('Success', `${result.assets.length} receipt(s) uploaded successfully`);
    } catch (error) {
      Alert.alert('Upload Failed', 'Could not upload receipts');
    }
  };

  const handleProcess = (receipt: any) => {
    // TODO: Implement OCR processing
    Alert.alert('Process Receipt', 'OCR processing not yet implemented');
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
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.iconContainer}>
            <Inbox size={32} color="#6366f1" />
          </View>
          <Text style={styles.headerTitle}>Receipt Inbox</Text>
          <Text style={styles.headerSubtitle}>{pendingReceipts.length} items waiting</Text>
          <Pressable onPress={handleBatchUpload} style={styles.uploadButton}>
            <Upload size={16} color="#ffffff" />
            <Text style={styles.uploadButtonText}>Batch Upload</Text>
          </Pressable>
        </View>

        {/* Receipts List */}
        <View style={styles.receiptsList}>
          {pendingReceipts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No pending receipts</Text>
              <Text style={styles.emptyStateSubtext}>Upload receipts to get started</Text>
            </View>
          ) : (
            pendingReceipts.map((r) => (
              <ReceiptItem
                key={r.id}
                receipt={r}
                label="Pending"
                onView={() => handleProcess(r)}
                onProcess={() => handleProcess(r)}
                onDelete={() => handleDelete(r.id)}
              />
            ))
          )}
        </View>
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
  headerCard: {
    backgroundColor: '#eef2ff',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#312e81',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6366f1',
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  receiptsList: {
    gap: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
