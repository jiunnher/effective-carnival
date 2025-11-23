import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

/**
 * Receipt OCR Service using Expo Image Manipulator + Text Recognition
 *
 * Note: For production, you may want to use:
 * - expo-image-manipulator for preprocessing
 * - react-native-text-recognition (wraps Apple Vision & Google ML Kit)
 */

export interface OCRResult {
  text: string;
  confidence: number;
  lines: {
    text: string;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
}

export interface ParsedReceipt {
  amount?: number;
  date?: string;
  merchantName?: string;
  description?: string;
  category?: string;
}

/**
 * Extract text from image using device OCR
 *
 * Implementation note: This is a placeholder that would use:
 * 1. react-native-text-recognition (Apple Vision on iOS, ML Kit on Android)
 * 2. Or expo-image-manipulator + manual processing
 *
 * For now, returns mock data. Replace with actual OCR library.
 */
export async function extractTextFromImage(imageUri: string): Promise<OCRResult> {
  // TODO: Implement actual OCR using react-native-text-recognition
  // For now, this is a placeholder

  // In production, you would:
  // import TextRecognition from 'react-native-text-recognition';
  // const result = await TextRecognition.recognize(imageUri);

  console.log('OCR would process image:', imageUri);

  // Mock response for development
  return {
    text: 'RECEIPT\nDate: 15/01/2024\nAmount: RM 150.00\nMerchant: ABC Pharmacy\nItem: Prescription Medicine',
    confidence: 0.95,
    lines: [
      { text: 'RECEIPT' },
      { text: 'Date: 15/01/2024' },
      { text: 'Amount: RM 150.00' },
      { text: 'Merchant: ABC Pharmacy' },
      { text: 'Item: Prescription Medicine' },
    ],
  };
}

/**
 * Parse OCR text into structured receipt data
 */
export function parseReceiptText(ocrResult: OCRResult): ParsedReceipt {
  const text = ocrResult.text.toLowerCase();
  const lines = ocrResult.lines.map(l => l.text);

  const parsed: ParsedReceipt = {};

  // Extract amount
  const amountPatterns = [
    /rm\s*(\d+(?:[,\.]\d{2})?)/i,
    /total[:\s]+(\d+(?:[,\.]\d{2})?)/i,
    /amount[:\s]+(\d+(?:[,\.]\d{2})?)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amountStr = match[1].replace(',', '.');
      parsed.amount = parseFloat(amountStr);
      break;
    }
  }

  // Extract date
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    /date[:\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      // Try to parse date (format: DD/MM/YYYY or YYYY/MM/DD)
      const parts = match[0].split(/[\/\-]/);
      if (parts.length === 3) {
        let year, month, day;

        if (parts[0].length === 4) {
          // YYYY/MM/DD format
          [year, month, day] = parts;
        } else {
          // DD/MM/YYYY format
          [day, month, year] = parts;
        }

        // Convert 2-digit year to 4-digit
        if (year.length === 2) {
          year = '20' + year;
        }

        // Create ISO date string
        const monthNum = parseInt(month).toString().padStart(2, '0');
        const dayNum = parseInt(day).toString().padStart(2, '0');
        parsed.date = `${year}-${monthNum}-${dayNum}`;
        break;
      }
    }
  }

  // Extract merchant name (usually first non-empty line or line with specific keywords)
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.length > 3 &&
      !trimmed.toLowerCase().includes('receipt') &&
      !trimmed.toLowerCase().includes('total') &&
      !trimmed.toLowerCase().includes('date') &&
      !trimmed.match(/^\d+/)
    ) {
      parsed.merchantName = trimmed;
      break;
    }
  }

  // Basic category detection based on keywords
  const categoryKeywords = {
    medical: ['pharmacy', 'clinic', 'hospital', 'doctor', 'medicine', 'health'],
    lifestyle_books: ['bookstore', 'book', 'mph', 'kinokuniya', 'popular'],
    lifestyle_tech: ['apple', 'samsung', 'laptop', 'phone', 'computer', 'electronic'],
    lifestyle_internet: ['unifi', 'maxis', 'digi', 'celcom', 'broadband', 'internet'],
    sports_equip: ['decathlon', 'sport', 'gym', 'fitness'],
    education_self: ['university', 'college', 'tuition', 'course', 'training'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      parsed.category = category;
      break;
    }
  }

  // Create description from merchant + item info
  if (parsed.merchantName) {
    parsed.description = parsed.merchantName;
  }

  return parsed;
}

/**
 * Full workflow: Pick image, OCR, parse
 */
export async function scanReceipt(): Promise<ParsedReceipt | null> {
  try {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      throw new Error('Camera permission is required to scan receipts');
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      exif: false,
    });

    if (result.canceled) {
      return null;
    }

    const imageUri = result.assets[0].uri;

    // Extract text using OCR
    const ocrResult = await extractTextFromImage(imageUri);

    // Parse into structured data
    const parsedReceipt = parseReceiptText(ocrResult);

    return parsedReceipt;
  } catch (error) {
    console.error('Receipt scan failed:', error);
    throw error;
  }
}

/**
 * Pick existing image from library and process
 */
export async function pickReceiptImage(): Promise<ParsedReceipt | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      throw new Error('Photo library permission is required');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    const imageUri = result.assets[0].uri;
    const ocrResult = await extractTextFromImage(imageUri);
    const parsedReceipt = parseReceiptText(ocrResult);

    return parsedReceipt;
  } catch (error) {
    console.error('Image pick failed:', error);
    throw error;
  }
}
