import AsyncStorage from '@react-native-async-storage/async-storage';
import { Receipt, UserProfile, YearIncome } from '../engine/types';
import { StorageAdapter } from './StorageAdapter';
import { supabase } from '../config/supabase';

/**
 * Hybrid Storage Adapter
 *
 * Storage Strategy:
 * - Primary: Local storage (AsyncStorage) - instant, offline, free
 * - Backup: Supabase cloud - manual backup/restore for phone changes
 *
 * Benefits:
 * - Fast: All operations are local (no network latency)
 * - Private: Data stays on device by default
 * - Offline: Works without internet
 * - Safe: Can backup to cloud and restore on new phone
 * - Cheap: Only syncs when user explicitly backs up
 */
export class HybridStorageAdapter implements StorageAdapter {
  private readonly KEYS = {
    RECEIPTS: '@cukaipal:receipts',
    INCOME_MAP: '@cukaipal:income_map',
    USER_PROFILE: '@cukaipal:user_profile',
    API_KEY: '@cukaipal:api_key',
    LAST_BACKUP: '@cukaipal:last_backup',
  };

  // ========================================
  // LOCAL STORAGE (Primary)
  // ========================================

  async loadReceipts(): Promise<Receipt[]> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.RECEIPTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load receipts:', error);
      return [];
    }
  }

  async saveReceipt(receipt: Receipt): Promise<void> {
    const receipts = await this.loadReceipts();
    const index = receipts.findIndex((r) => r.id === receipt.id);

    if (index >= 0) {
      receipts[index] = receipt;
    } else {
      receipts.push(receipt);
    }

    await AsyncStorage.setItem(this.KEYS.RECEIPTS, JSON.stringify(receipts));
  }

  async deleteReceipt(id: string): Promise<void> {
    const receipts = await this.loadReceipts();
    const filtered = receipts.filter((r) => r.id !== id);
    await AsyncStorage.setItem(this.KEYS.RECEIPTS, JSON.stringify(filtered));
  }

  async loadIncomeMap(): Promise<Record<number, YearIncome>> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.INCOME_MAP);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load income map:', error);
      return {};
    }
  }

  async saveIncomeMap(map: Record<number, YearIncome>): Promise<void> {
    await AsyncStorage.setItem(this.KEYS.INCOME_MAP, JSON.stringify(map));
  }

  async loadUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return null;
    }
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(this.KEYS.USER_PROFILE, JSON.stringify(profile));
  }

  async loadApiKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.KEYS.API_KEY);
    } catch (error) {
      console.error('Failed to load API key:', error);
      return null;
    }
  }

  async saveApiKey(key: string): Promise<void> {
    await AsyncStorage.setItem(this.KEYS.API_KEY, key);
  }

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      this.KEYS.RECEIPTS,
      this.KEYS.INCOME_MAP,
      this.KEYS.USER_PROFILE,
      this.KEYS.API_KEY,
    ]);
  }

  // ========================================
  // CLOUD BACKUP/RESTORE (Manual)
  // ========================================

  /**
   * Backup all data to Supabase cloud
   * User triggers this manually or app can do it periodically
   */
  async backupToCloud(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Must be logged in to backup');
    }

    // Load all local data
    const [receipts, incomeMap, userProfile] = await Promise.all([
      this.loadReceipts(),
      this.loadIncomeMap(),
      this.loadUserProfile(),
    ]);

    // Create backup object
    const backup = {
      user_id: user.id,
      receipts,
      income_map: incomeMap,
      user_profile: userProfile,
      backed_up_at: new Date().toISOString(),
      device_info: {
        platform: 'ios', // or get from Platform.OS
        app_version: '1.0.0',
      },
    };

    // Save to Supabase (upsert - insert or update)
    const { error } = await supabase
      .from('backups')
      .upsert(backup, {
        onConflict: 'user_id',
      });

    if (error) {
      throw new Error(`Backup failed: ${error.message}`);
    }

    // Store last backup time locally
    await AsyncStorage.setItem(this.KEYS.LAST_BACKUP, new Date().toISOString());
  }

  /**
   * Restore data from Supabase cloud
   * User triggers this on new phone
   */
  async restoreFromCloud(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Must be logged in to restore');
    }

    // Fetch backup from Supabase
    const { data: backup, error } = await supabase
      .from('backups')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !backup) {
      throw new Error('No backup found');
    }

    // Clear existing local data
    await this.clearAll();

    // Restore data locally
    if (backup.receipts && backup.receipts.length > 0) {
      await AsyncStorage.setItem(this.KEYS.RECEIPTS, JSON.stringify(backup.receipts));
    }

    if (backup.income_map && Object.keys(backup.income_map).length > 0) {
      await AsyncStorage.setItem(this.KEYS.INCOME_MAP, JSON.stringify(backup.income_map));
    }

    if (backup.user_profile) {
      await AsyncStorage.setItem(this.KEYS.USER_PROFILE, JSON.stringify(backup.user_profile));
    }

    // Store last backup time
    await AsyncStorage.setItem(this.KEYS.LAST_BACKUP, backup.backed_up_at);
  }

  /**
   * Get last backup info
   */
  async getBackupInfo(): Promise<{
    lastBackup: Date | null;
    hasCloudBackup: boolean;
  }> {
    const lastBackupStr = await AsyncStorage.getItem(this.KEYS.LAST_BACKUP);
    const lastBackup = lastBackupStr ? new Date(lastBackupStr) : null;

    let hasCloudBackup = false;
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('backups')
          .select('backed_up_at')
          .eq('user_id', user.id)
          .single();

        hasCloudBackup = !!data;
      }
    } catch (error) {
      // Ignore error - user might be offline
    }

    return { lastBackup, hasCloudBackup };
  }

  /**
   * Auto-backup if it's been more than X days
   */
  async autoBackupIfNeeded(maxDaysSinceLastBackup: number = 7): Promise<boolean> {
    const { lastBackup } = await this.getBackupInfo();

    if (!lastBackup) {
      // Never backed up - do it now
      await this.backupToCloud();
      return true;
    }

    const daysSinceBackup = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceBackup >= maxDaysSinceLastBackup) {
      await this.backupToCloud();
      return true;
    }

    return false;
  }

  /**
   * Export data as JSON (for manual backup)
   */
  async exportAsJSON(): Promise<string> {
    const [receipts, incomeMap, userProfile] = await Promise.all([
      this.loadReceipts(),
      this.loadIncomeMap(),
      this.loadUserProfile(),
    ]);

    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      receipts,
      income_map: incomeMap,
      user_profile: userProfile,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import data from JSON (for manual restore)
   */
  async importFromJSON(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);

    if (data.version !== '1.0') {
      throw new Error('Invalid backup version');
    }

    // Clear existing data
    await this.clearAll();

    // Restore data
    if (data.receipts) {
      await AsyncStorage.setItem(this.KEYS.RECEIPTS, JSON.stringify(data.receipts));
    }

    if (data.income_map) {
      await AsyncStorage.setItem(this.KEYS.INCOME_MAP, JSON.stringify(data.income_map));
    }

    if (data.user_profile) {
      await AsyncStorage.setItem(this.KEYS.USER_PROFILE, JSON.stringify(data.user_profile));
    }
  }
}

export const hybridStorageAdapter = new HybridStorageAdapter();
