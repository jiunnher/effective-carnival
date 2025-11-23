import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Receipt OCR Service with Hybrid Approach
 *
 * Strategy:
 * 1. Try Apple Vision Framework first (free, on-device, private)
 * 2. If confidence is low or extraction fails, fall back to Gemini OCR (cloud, more accurate)
 *
 * Libraries needed:
 * - react-native-text-recognition (Apple Vision on iOS, Google ML Kit on Android)
 * - @google/generative-ai (Gemini API for fallback)
 */

// Gemini API configuration
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Fallback thresholds
const MIN_TEXT_LENGTH = 10; // Minimum characters to consider OCR successful
const MIN_REQUIRED_FIELDS = 1; // Minimum fields (amount, date, merchant) to extract

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
  ocrMethod?: 'device' | 'cloud'; // Track which method was used
}

/**
 * Extract text from image using on-device OCR (Apple Vision / Google ML Kit)
 */
async function extractTextOnDevice(imageUri: string): Promise<OCRResult> {
  try {
    // TODO: Install react-native-text-recognition
    // npm install react-native-text-recognition
    // cd ios && pod install && cd ..

    // import TextRecognition from 'react-native-text-recognition';
    // const result = await TextRecognition.recognize(imageUri);

    console.log('[OCR] Attempting on-device OCR with Apple Vision:', imageUri);

    // Mock response for development (replace with actual library call)
    const result = {
      text: 'RECEIPT\nDate: 15/01/2024\nAmount: RM 150.00\nMerchant: ABC Pharmacy\nItem: Prescription Medicine',
      confidence: 0.95,
      blocks: [
        { text: 'RECEIPT', frame: { x: 0, y: 0, width: 100, height: 20 } },
        { text: 'Date: 15/01/2024', frame: { x: 0, y: 25, width: 150, height: 20 } },
        { text: 'Amount: RM 150.00', frame: { x: 0, y: 50, width: 180, height: 20 } },
        { text: 'Merchant: ABC Pharmacy', frame: { x: 0, y: 75, width: 200, height: 20 } },
        { text: 'Item: Prescription Medicine', frame: { x: 0, y: 100, width: 220, height: 20 } },
      ],
    };

    return {
      text: result.text,
      confidence: 0.95, // Vision framework doesn't provide confidence, assume high
      lines: result.blocks.map((block: any) => ({
        text: block.text,
        boundingBox: block.frame,
      })),
    };
  } catch (error) {
    console.error('[OCR] On-device OCR failed:', error);
    throw error;
  }
}

/**
 * Extract text and structured data from image using Gemini Vision API
 */
async function extractTextWithGemini(imageUri: string): Promise<OCRResult> {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured. Set EXPO_PUBLIC_GEMINI_API_KEY in .env');
    }

    console.log('[OCR] Falling back to Gemini OCR for complex receipt');

    // Read image file and convert to base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Call Gemini API with vision model
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Extract all text from this receipt image. Format the response as JSON with this structure:
{
  "text": "full text extracted from receipt",
  "lines": ["line 1", "line 2", ...],
  "amount": extracted amount as number or null,
  "date": extracted date in YYYY-MM-DD format or null,
  "merchant": merchant/store name or null,
  "items": ["item 1", "item 2", ...] or []
}

Focus on accuracy. If you cannot confidently extract a field, set it to null.`,
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Low temperature for factual extraction
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const geminiText = data.candidates[0]?.content?.parts[0]?.text || '';

    // Parse JSON response from Gemini
    const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gemini did not return valid JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      text: parsed.text || '',
      confidence: 0.98, // Gemini is typically very accurate
      lines: (parsed.lines || []).map((line: string) => ({ text: line })),
    };
  } catch (error) {
    console.error('[OCR] Gemini OCR failed:', error);
    throw error;
  }
}

/**
 * Hybrid OCR: Try on-device first, fall back to Gemini if needed
 */
export async function extractTextFromImage(
  imageUri: string,
  forceCloud: boolean = false
): Promise<OCRResult & { method: 'device' | 'cloud' }> {
  // If user explicitly requests cloud OCR, skip device attempt
  if (forceCloud) {
    console.log('[OCR] Force cloud mode, using Gemini directly');
    const result = await extractTextWithGemini(imageUri);
    return { ...result, method: 'cloud' };
  }

  try {
    // Try on-device OCR first (free, private, fast)
    const deviceResult = await extractTextOnDevice(imageUri);

    // Check if result is acceptable
    if (deviceResult.text.length < MIN_TEXT_LENGTH) {
      console.log('[OCR] On-device result too short, trying Gemini fallback');
      throw new Error('Text too short, likely poor OCR quality');
    }

    // Parse to check if we got useful data
    const parsed = parseReceiptText(deviceResult);
    const fieldCount = [parsed.amount, parsed.date, parsed.merchantName].filter(Boolean).length;

    if (fieldCount < MIN_REQUIRED_FIELDS) {
      console.log(`[OCR] Only extracted ${fieldCount} fields, trying Gemini fallback`);
      throw new Error('Insufficient data extracted from on-device OCR');
    }

    console.log('[OCR] ✅ On-device OCR successful');
    return { ...deviceResult, method: 'device' };

  } catch (deviceError) {
    // On-device OCR failed or insufficient, try Gemini
    console.log('[OCR] On-device OCR failed, attempting Gemini fallback');

    try {
      const cloudResult = await extractTextWithGemini(imageUri);
      console.log('[OCR] ✅ Gemini fallback successful');
      return { ...cloudResult, method: 'cloud' };
    } catch (cloudError) {
      console.error('[OCR] ❌ Both on-device and cloud OCR failed');
      throw new Error('All OCR methods failed. Please try with a clearer image.');
    }
  }
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

    // Extract text using hybrid OCR (device first, cloud fallback)
    const ocrResult = await extractTextFromImage(imageUri);

    // Parse into structured data
    const parsedReceipt = parseReceiptText(ocrResult);

    // Track which OCR method was used
    parsedReceipt.ocrMethod = ocrResult.method;

    console.log(`[OCR] Receipt scanned using ${ocrResult.method} OCR`);

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

    // Extract text using hybrid OCR (device first, cloud fallback)
    const ocrResult = await extractTextFromImage(imageUri);

    // Parse into structured data
    const parsedReceipt = parseReceiptText(ocrResult);

    // Track which OCR method was used
    parsedReceipt.ocrMethod = ocrResult.method;

    console.log(`[OCR] Image processed using ${ocrResult.method} OCR`);

    return parsedReceipt;
  } catch (error) {
    console.error('Image pick failed:', error);
    throw error;
  }
}
