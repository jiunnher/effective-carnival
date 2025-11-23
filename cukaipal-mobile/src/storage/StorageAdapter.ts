import { Receipt, UserProfile, YearIncome } from '../engine/types';

/**
 * Storage abstraction interface for persisting app data
 * Implementations should handle all persistence operations
 */
export interface StorageAdapter {
  // Receipt operations
  loadReceipts(): Promise<Receipt[]>;
  saveReceipt(receipt: Receipt): Promise<void>;
  deleteReceipt(id: string): Promise<void>;

  // Income operations
  loadIncomeMap(): Promise<Record<number, YearIncome>>;
  saveIncomeMap(map: Record<number, YearIncome>): Promise<void>;

  // User profile operations
  loadUserProfile(): Promise<UserProfile | null>;
  saveUserProfile(profile: UserProfile): Promise<void>;

  // API key operations
  loadApiKey(): Promise<string | null>;
  saveApiKey(key: string): Promise<void>;

  // Utility operations
  clearAll(): Promise<void>;
}
