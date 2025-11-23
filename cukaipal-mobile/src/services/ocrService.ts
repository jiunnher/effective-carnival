import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { CategoryConfig } from '../engine/types';

export interface OCRResult {
  amount: number;
  date: string;
  description: string;
  subCategory: string;
  reason: string;
  confidence: number;
}

export interface OCRRequest {
  fileUri: string;
  year: number;
  availableCategories: CategoryConfig[];
}

class OCRService {
  /**
   * Process receipt using backend API
   * This replaces the client-side Gemini API call
   */
  async processReceipt(request: OCRRequest): Promise<OCRResult> {
    try {
      // Upload image first
      const uploadResponse = await apiClient.uploadFile<{ imageUrl: string }>(
        API_ENDPOINTS.RECEIPTS.UPLOAD_IMAGE,
        request.fileUri
      );

      // Get available subcategories for the AI
      const subcategories = request.availableCategories.flatMap((cat) =>
        cat.items ? cat.items.map((item) => `${item.id} (${item.label})`) : []
      );

      // Process with OCR
      const ocrResponse = await apiClient.post<OCRResult>(API_ENDPOINTS.RECEIPTS.OCR, {
        imageUrl: uploadResponse.imageUrl,
        year: request.year,
        subcategories,
      });

      return ocrResponse;
    } catch (error: any) {
      console.error('OCR processing error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to process receipt. Please try again.'
      );
    }
  }

  /**
   * Fallback to local processing (requires user's API key)
   * Use this as a backup or for offline mode
   */
  async processReceiptLocal(
    fileUri: string,
    apiKey: string,
    subcategories: string[]
  ): Promise<OCRResult> {
    // This would be the original Gemini API implementation
    // Kept as fallback for offline mode or when backend is unavailable
    throw new Error('Local OCR not implemented. Please use online mode.');
  }
}

export const ocrService = new OCRService();
