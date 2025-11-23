import AsyncStorage from '@react-native-async-storage/async-storage';
import { Receipt, UserProfile, YearIncome } from '../engine/types';
import { StorageAdapter } from './StorageAdapter';

const STORAGE_KEYS = {
  RECEIPTS: '@cukaipal_receipts',
  INCOME_MAP: '@cukaipal_income_map',
  USER_PROFILE: '@cukaipal_user_profile',
  API_KEY: '@cukaipal_api_key',
};

/**
 * Native React Native implementation of StorageAdapter using AsyncStorage
 * Stores all data as JSON strings in AsyncStorage
 * Receipt files are stored as URIs pointing to filesystem locations
 */
export class NativeStorageAdapter implements StorageAdapter {
  async loadReceipts(): Promise<Receipt[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECEIPTS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading receipts:', error);
      return [];
    }
  }

  async saveReceipt(receipt: Receipt): Promise<void> {
    try {
      const receipts = await this.loadReceipts();
      const index = receipts.findIndex((r) => r.id === receipt.id);

      if (index >= 0) {
        receipts[index] = receipt;
      } else {
        receipts.push(receipt);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
    } catch (error) {
      console.error('Error saving receipt:', error);
      throw error;
    }
  }

  async deleteReceipt(id: string): Promise<void> {
    try {
      const receipts = await this.loadReceipts();
      const filtered = receipts.filter((r) => r.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting receipt:', error);
      throw error;
    }
  }

  async loadIncomeMap(): Promise<Record<number, YearIncome>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.INCOME_MAP);
      if (!data) return {};
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading income map:', error);
      return {};
    }
  }

  async saveIncomeMap(map: Record<number, YearIncome>): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INCOME_MAP, JSON.stringify(map));
    } catch (error) {
      console.error('Error saving income map:', error);
      throw error;
    }
  }

  async loadUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }

  async loadApiKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.API_KEY);
    } catch (error) {
      console.error('Error loading API key:', error);
      return null;
    }
  }

  async saveApiKey(key: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, key);
    } catch (error) {
      console.error('Error saving API key:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.RECEIPTS,
        STORAGE_KEYS.INCOME_MAP,
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.API_KEY,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storageAdapter = new NativeStorageAdapter();
