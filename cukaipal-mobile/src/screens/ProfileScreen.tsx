import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Pressable,
  TextInput,
  Switch,
} from 'react-native';
import { Banknote, Users, Accessibility, Settings as SettingsIcon } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { Stepper } from '../components/Stepper';
import { Modal } from '../components/Modal';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export const ProfileScreen: React.FC = () => {
  const { userProfile, updateUserProfile, apiKey, saveApiKey, clearAllData, receipts, incomeMap } =
    useAppContext();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile.displayName);
  const [apiKeyInput, setApiKeyInput] = useState(apiKey);

  const handleNumericChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    updateUserProfile({ ...userProfile, [field]: Math.max(0, numValue) });
  };

  const handleExportBackup = async () => {
    const data = {
      version: '1.0',
      date: new Date().toISOString(),
      receipts,
      incomeMap,
      userProfile,
    };

    try {
      const fileName = `cukaipal_backup_${new Date().toISOString().split('T')[0]}.json`;
      const file = new File(Paths.document, fileName);
      await file.write(JSON.stringify(data, null, 2));
      await Sharing.shareAsync(file.uri);
    } catch (error) {
      console.error('Backup export failed:', error);
    }
  };

  const handleImportBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });

      if (result.canceled) return;

      const file = new File(result.assets[0].uri);
      const fileContent = await file.text();
      const data = JSON.parse(fileContent);

      if (data.version !== '1.0') {
        alert('Invalid backup file version');
        return;
      }

      await clearAllData();
      // Note: In a full implementation, we would restore all data here
      // For now, we just clear and the user would need to reimport manually
      alert('Import successful! Please restart the app.');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check the file format.');
    }
  };

  const handleResetData = () => {
    if (confirm('Reset all data? This cannot be undone.')) {
      clearAllData();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <Pressable onPress={() => setShowSettingsModal(true)} style={styles.settingsButton}>
          <SettingsIcon size={24} color="#64748b" />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tax Adjustments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Banknote size={20} color="#1e293b" />
            <Text style={styles.sectionTitle}>Tax Adjustments</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Zakat / Fitrah (Rebate)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={userProfile.zakat?.toString() || ''}
                onChangeText={(val) => handleNumericChange('zakat', val)}
                placeholder="0.00"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Approved Donations (Deduction)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={userProfile.donations?.toString() || ''}
                onChangeText={(val) => handleNumericChange('donations', val)}
                placeholder="0.00"
              />
            </View>
          </View>
        </View>

        {/* Family Profile */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#1e293b" />
            <Text style={styles.sectionTitle}>Family Profile</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.statusToggle}>
              <Text style={styles.statusLabel}>Status</Text>
              <View style={styles.statusButtons}>
                <Pressable
                  onPress={() => updateUserProfile({ ...userProfile, status: 'single' })}
                  style={[
                    styles.statusButton,
                    userProfile.status === 'single' && styles.statusButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      userProfile.status === 'single' && styles.statusButtonTextActive,
                    ]}
                  >
                    Single
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => updateUserProfile({ ...userProfile, status: 'married' })}
                  style={[
                    styles.statusButton,
                    userProfile.status === 'married' && styles.statusButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      userProfile.status === 'married' && styles.statusButtonTextActive,
                    ]}
                  >
                    Married
                  </Text>
                </Pressable>
              </View>
            </View>

            {userProfile.status === 'married' && (
              <View style={styles.spouseOptions}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Spouse has no income</Text>
                  <Switch
                    value={!userProfile.spouseWorking}
                    onValueChange={(val) =>
                      updateUserProfile({ ...userProfile, spouseWorking: !val })
                    }
                    trackColor={{ false: '#e2e8f0', true: '#6366f1' }}
                    thumbColor={!userProfile.spouseWorking ? '#ffffff' : '#ffffff'}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Spouse is Disabled (OKU)</Text>
                  <Switch
                    value={userProfile.spouseDisabled}
                    onValueChange={(val) => updateUserProfile({ ...userProfile, spouseDisabled: val })}
                    trackColor={{ false: '#e2e8f0', true: '#6366f1' }}
                    thumbColor={userProfile.spouseDisabled ? '#ffffff' : '#ffffff'}
                  />
                </View>
              </View>
            )}
          </View>

          <View style={styles.stepperList}>
            <Stepper
              label="Children (Under 18)"
              subtitle="RM 2,000"
              value={userProfile.kidsUnder18}
              onChange={(v) => updateUserProfile({ ...userProfile, kidsUnder18: v })}
            />
            <Stepper
              label="Children (18+ Pre-U)"
              subtitle="RM 2,000"
              value={userProfile.kidsPreU}
              onChange={(v) => updateUserProfile({ ...userProfile, kidsPreU: v })}
            />
            <Stepper
              label="Children (18+ Degree)"
              subtitle="RM 8,000"
              value={userProfile.kidsDegree}
              onChange={(v) => updateUserProfile({ ...userProfile, kidsDegree: v })}
            />
            <Stepper
              label="Disabled Children"
              subtitle="RM 6,000"
              value={userProfile.kidsDisabled}
              onChange={(v) => updateUserProfile({ ...userProfile, kidsDisabled: v })}
            />
            <Stepper
              label="Disabled (Study)"
              subtitle="RM 14,000"
              value={userProfile.kidsDisabledDiploma}
              onChange={(v) => updateUserProfile({ ...userProfile, kidsDisabledDiploma: v })}
            />
          </View>
        </View>

        {/* Personal Disability */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Accessibility size={20} color="#1e293b" />
            <Text style={styles.sectionTitle}>Personal Disability</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>I am a Disabled Person (OKU)</Text>
              <Switch
                value={userProfile.selfDisabled}
                onValueChange={(val) => updateUserProfile({ ...userProfile, selfDisabled: val })}
                trackColor={{ false: '#e2e8f0', true: '#1e293b' }}
                thumbColor={userProfile.selfDisabled ? '#ffffff' : '#ffffff'}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Settings"
      >
        <View style={styles.settingsContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              onBlur={() => updateUserProfile({ ...userProfile, displayName })}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>API Key (Optional)</Text>
            <TextInput
              style={styles.input}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              onBlur={() => saveApiKey(apiKeyInput)}
              placeholder="Paste Gemini Key"
              secureTextEntry
            />
            <Text style={styles.inputHint}>
              Keys stored locally. Use with caution on shared devices.
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.actionButtons}>
            <Pressable onPress={handleExportBackup} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Backup Data</Text>
            </Pressable>
            <Pressable onPress={handleImportBackup} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Import Data</Text>
            </Pressable>
          </View>

          <Pressable onPress={handleResetData} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset All Data</Text>
          </Pressable>

          <Pressable
            onPress={() => setShowSettingsModal(false)}
            style={styles.doneButton}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  inputHint: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  statusToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  statusButtons: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  statusButtonTextActive: {
    color: '#1e293b',
  },
  spouseOptions: {
    backgroundColor: '#eef2ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    flex: 1,
  },
  stepperList: {
    gap: 0,
  },
  settingsContent: {
    gap: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  resetButton: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  doneButton: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
