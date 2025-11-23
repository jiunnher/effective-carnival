import { supabase, TABLES } from '../config/supabase';
import { Receipt, UserProfile, YearIncome } from '../engine/types';
import { StorageAdapter } from './StorageAdapter';

/**
 * Supabase Storage Adapter
 * Uses Supabase as backend with real-time sync
 */
export class SupabaseStorageAdapter implements StorageAdapter {
  private userId: string | null = null;

  constructor() {
    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.userId = session?.user?.id || null;
    });
  }

  private async ensureAuth() {
    if (!this.userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      this.userId = user?.id || null;
    }
    if (!this.userId) {
      throw new Error('User not authenticated');
    }
    return this.userId;
  }

  // Receipt operations
  async loadReceipts(): Promise<Receipt[]> {
    await this.ensureAuth();

    const { data, error } = await supabase
      .from(TABLES.RECEIPTS)
      .select('*')
      .eq('user_id', this.userId)
      .order('date', { ascending: false });

    if (error) throw error;

    return (
      data?.map((row) => ({
        id: row.id,
        status: row.status,
        amount: parseFloat(row.amount),
        description: row.description,
        category: row.category,
        subCategory: row.sub_category,
        date: row.date,
        fileUri: row.file_url,
      })) || []
    );
  }

  async saveReceipt(receipt: Receipt): Promise<void> {
    const userId = await this.ensureAuth();

    const { error } = await supabase.from(TABLES.RECEIPTS).upsert({
      id: receipt.id,
      user_id: userId,
      status: receipt.status,
      amount: receipt.amount,
      description: receipt.description,
      category: receipt.category,
      sub_category: receipt.subCategory,
      date: receipt.date,
      file_url: receipt.fileUri,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  async deleteReceipt(id: string): Promise<void> {
    await this.ensureAuth();

    const { error } = await supabase.from(TABLES.RECEIPTS).delete().eq('id', id).eq('user_id', this.userId);

    if (error) throw error;
  }

  // Income map operations
  async loadIncomeMap(): Promise<Record<number, YearIncome>> {
    const userId = await this.ensureAuth();

    const { data, error } = await supabase
      .from(TABLES.USER_DATA)
      .select('income_map')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    return data?.income_map || {};
  }

  async saveIncomeMap(map: Record<number, YearIncome>): Promise<void> {
    const userId = await this.ensureAuth();

    const { error } = await supabase
      .from(TABLES.USER_DATA)
      .upsert({
        user_id: userId,
        income_map: map,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;
  }

  // User profile operations
  async loadUserProfile(): Promise<UserProfile | null> {
    const userId = await this.ensureAuth();

    const { data, error } = await supabase
      .from(TABLES.USER_DATA)
      .select('profile')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data?.profile || null;
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    const userId = await this.ensureAuth();

    const { error } = await supabase
      .from(TABLES.USER_DATA)
      .upsert({
        user_id: userId,
        profile: profile,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;
  }

  // API key operations (stored in user_profiles for OCR quota tracking)
  async loadApiKey(): Promise<string | null> {
    // API key is now handled by backend, not stored client-side
    return null;
  }

  async saveApiKey(key: string): Promise<void> {
    // No-op: API keys managed by backend
  }

  // Utility operations
  async clearAll(): Promise<void> {
    const userId = await this.ensureAuth();

    // Delete all receipts
    await supabase.from(TABLES.RECEIPTS).delete().eq('user_id', userId);

    // Clear user data
    await supabase
      .from(TABLES.USER_DATA)
      .update({
        income_map: {},
        profile: {},
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }

  /**
   * Upload receipt image to Supabase Storage
   */
  async uploadReceiptImage(fileUri: string, receiptId: string): Promise<string> {
    const userId = await this.ensureAuth();

    // For React Native, we need to create a file object from the URI
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const fileName = `${userId}/${receiptId}.jpg`;

    const { data, error } = await supabase.storage.from('receipts').upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    if (error) throw error;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('receipts').getPublicUrl(fileName);

    return publicUrl;
  }
}

export const supabaseStorageAdapter = new SupabaseStorageAdapter();
