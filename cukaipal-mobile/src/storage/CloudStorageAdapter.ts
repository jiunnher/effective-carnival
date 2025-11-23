import { apiClient } from '../services/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { Receipt, UserProfile, YearIncome } from '../engine/types';
import { NativeStorageAdapter } from './NativeStorageAdapter';

/**
 * Cloud Storage Adapter with Sync
 * Extends NativeStorageAdapter to add cloud sync capabilities
 */
export class CloudStorageAdapter extends NativeStorageAdapter {
  private syncInProgress = false;
  private lastSyncTime: Date | null = null;

  /**
   * Save receipt with cloud sync
   */
  async saveReceipt(receipt: Receipt): Promise<void> {
    // Save locally first
    await super.saveReceipt(receipt);

    // Sync to cloud
    try {
      await apiClient.post(API_ENDPOINTS.RECEIPTS.CREATE, receipt);
    } catch (error) {
      console.warn('Cloud sync failed for receipt, will retry later:', error);
      // Local save succeeded, so we don't throw
      // The sync will be retried on next full sync
    }
  }

  /**
   * Delete receipt from local and cloud
   */
  async deleteReceipt(id: string): Promise<void> {
    await super.deleteReceipt(id);

    try {
      await apiClient.delete(API_ENDPOINTS.RECEIPTS.DELETE(id));
    } catch (error) {
      console.warn('Cloud delete failed for receipt:', error);
    }
  }

  /**
   * Full sync with backend
   * Pull changes from server and push local changes
   */
  async syncAll(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping');
      return;
    }

    this.syncInProgress = true;
    try {
      // Get last sync timestamp
      const lastSync = this.lastSyncTime?.toISOString();

      // Pull changes from server
      const serverData = await apiClient.post<{
        receipts: Receipt[];
        incomeMap: Record<number, YearIncome>;
        userProfile: UserProfile;
        serverTimestamp: string;
      }>(API_ENDPOINTS.SYNC.PULL, { lastSync });

      // Merge server data with local
      // Server data takes precedence for conflicts
      const localReceipts = await super.loadReceipts();
      const mergedReceipts = this.mergeReceipts(localReceipts, serverData.receipts);

      // Update local storage
      for (const receipt of mergedReceipts) {
        await super.saveReceipt(receipt);
      }

      if (serverData.incomeMap) {
        await super.saveIncomeMap(serverData.incomeMap);
      }

      if (serverData.userProfile) {
        await super.saveUserProfile(serverData.userProfile);
      }

      // Push local changes to server (if any were made locally after last sync)
      await this.pushLocalChanges();

      this.lastSyncTime = new Date(serverData.serverTimestamp);
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Push local changes to server
   */
  private async pushLocalChanges(): Promise<void> {
    const receipts = await super.loadReceipts();
    const incomeMap = await super.loadIncomeMap();
    const userProfile = await super.loadUserProfile();

    await apiClient.post(API_ENDPOINTS.SYNC.PUSH, {
      receipts,
      incomeMap,
      userProfile,
    });
  }

  /**
   * Merge receipts with conflict resolution
   * Server wins for conflicts
   */
  private mergeReceipts(local: Receipt[], server: Receipt[]): Receipt[] {
    const merged = new Map<string, Receipt>();

    // Add all local receipts
    local.forEach((receipt) => merged.set(receipt.id, receipt));

    // Overwrite with server receipts (server wins)
    server.forEach((receipt) => merged.set(receipt.id, receipt));

    return Array.from(merged.values());
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isSyncing: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
    };
  }
}

export const cloudStorageAdapter = new CloudStorageAdapter();
