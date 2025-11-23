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

/**
 * Check if device has internet connectivity
 */
async function hasInternetConnection(): Promise<boolean> {
  try {
    // Try a quick HEAD request to Google (reliable and fast)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    // Network error = offline
    return false;
  }
}

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
  geminiCategory?: string; // Category suggested by Gemini (if used)
  geminiCategoryConfidence?: string; // Confidence from Gemini
}

export interface ParsedReceipt {
  amount?: number;
  date?: string;
  merchantName?: string;
  description?: string;
  category?: string; // Deductible ID (e.g., 'medical_vax', 'sports_equip', 'lifestyle_books')
  suggestedCategories?: string[]; // Alternative suggestions if uncertain
  confidence?: 'high' | 'medium' | 'low'; // Classification confidence
  ocrMethod?: 'device' | 'cloud'; // Track which method was used
  classificationMethod?: 'ai' | 'keyword' | 'offline'; // How category was determined
  needsAiReview?: boolean; // True if classified offline, needs AI review when online
  rawText?: string; // Store raw OCR text for later re-classification
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
 * Classify receipt text using Gemini AI (text-only, cheaper than vision)
 */
async function classifyWithGemini(
  text: string,
  merchantName: string
): Promise<{ category?: string; confidence: 'high' | 'medium' | 'low' }> {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    // Use Gemini 1.5 Flash (text-only) for classification
    // Cost: $0.000075 per request (10x cheaper than vision!)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Classify this Malaysian receipt into a tax deductible category.

Receipt text:
${text}

Merchant: ${merchantName}

Tax deductible categories:
- "medical_vax": Vaccination only
- "medical_dental": Dental treatment/exam only
- "medical_checkup": Medical checkup, screening, mental health only
- "medical_serious": Prescription medicine for illness/disease only
- "medical_fertility": Fertility treatment, IVF only
- "sports_equip": Sports equipment (shoes, bicycle, gym equipment)
- "sports_training": Gym membership, personal training
- "lifestyle_books": Books, journals, magazines
- "lifestyle_tech": Computer, smartphone, tablet only (max RM2500)
- "lifestyle_internet": Internet bill, broadband
- "education_self": University fees, courses, tuition

Important rules:
- Supplements (vitamin, protein powder) = NOT deductible (return null)
- Snacks, food, drinks = NOT deductible (return null)
- Cosmetics, skincare = NOT deductible (return null)
- Clothing (except sports shoes) = NOT deductible (return null)
- General shopping = NOT deductible (return null)

Respond with ONLY a JSON object:
{"category": "category_id" or null, "confidence": "high" or "medium" or "low", "reason": "brief explanation"}

Focus on the ACTUAL ITEMS purchased, not just the store name.`,
            }],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    const data = await response.json();
    const geminiText = data.candidates[0]?.content?.parts[0]?.text || '';
    const jsonMatch = geminiText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`[Gemini Classification] ${parsed.category} (${parsed.confidence}): ${parsed.reason}`);
      return {
        category: parsed.category,
        confidence: parsed.confidence,
      };
    }

    return { category: undefined, confidence: 'low' };
  } catch (error) {
    console.error('[Gemini Classification] Failed:', error);
    return { category: undefined, confidence: 'low' };
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
                text: `Extract all text from this Malaysian receipt image. Format the response as JSON with this structure:
{
  "text": "full text extracted from receipt",
  "lines": ["line 1", "line 2", ...],
  "amount": extracted amount as number or null,
  "date": extracted date in YYYY-MM-DD format or null,
  "merchant": merchant/store name or null,
  "items": ["item 1", "item 2", ...] or [],
  "category": "deductible category ID" or null,
  "categoryConfidence": "high" or "medium" or "low"
}

For the category field, classify the receipt into one of these Malaysian tax deductible categories:
- "medical_vax": Vaccination
- "medical_dental": Dental treatment/exam
- "medical_checkup": Medical checkup, screening, mental health
- "medical_serious": Prescription medicine, serious disease treatment
- "medical_fertility": Fertility treatment, IVF
- "sports_equip": Sports equipment (shoes, bicycle, gym equipment)
- "sports_training": Gym membership, personal training
- "sports_facility": Sports facility rental
- "lifestyle_books": Books, journals, magazines
- "lifestyle_tech": Computer, smartphone, tablet
- "lifestyle_internet": Internet bill, broadband
- "education_self": University fees, courses, tuition

Focus on the ITEMS purchased, not just the store name. For example:
- Buying snacks at a pharmacy → null (not deductible)
- Buying prescription medicine at pharmacy → "medical_serious"
- Vaccination receipt → "medical_vax"

If you cannot confidently classify the receipt, set category to null.`,
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
      geminiCategory: parsed.category, // Category suggested by Gemini
      geminiCategoryConfidence: parsed.categoryConfidence,
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
    const parsed = await parseReceiptText(deviceResult);
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
 * Classify receipt into tax deductible categories
 */
function classifyReceipt(
  text: string,
  merchantName: string
): { category?: string; suggested: string[]; confidence: 'high' | 'medium' | 'low' } {
  const textLower = text.toLowerCase();
  const merchantLower = merchantName.toLowerCase();
  const suggested: string[] = [];

  // Medical categories - most specific first

  // Vaccination
  if (
    textLower.includes('vaccine') ||
    textLower.includes('vaccination') ||
    textLower.includes('immunisation') ||
    textLower.includes('immunization') ||
    textLower.includes('vaksin') ||  // Malay
    textLower.includes('covid') ||
    textLower.includes('flu shot')
  ) {
    return { category: 'medical_vax', suggested: [], confidence: 'high' };
  }

  // Dental
  if (
    textLower.includes('dental') ||
    textLower.includes('dentist') ||
    textLower.includes('tooth') ||
    textLower.includes('teeth') ||
    textLower.includes('gigi') ||  // Malay for tooth
    textLower.includes('scaling') ||
    textLower.includes('filling') ||
    textLower.includes('extraction') ||
    textLower.includes('braces') ||
    textLower.includes('orthodontic')
  ) {
    return { category: 'medical_dental', suggested: [], confidence: 'high' };
  }

  // Medical checkup / mental health
  if (
    textLower.includes('checkup') ||
    textLower.includes('check-up') ||
    textLower.includes('screening') ||
    textLower.includes('medical exam') ||
    textLower.includes('mental health') ||
    textLower.includes('psychiatr') ||
    textLower.includes('psycholog') ||
    textLower.includes('counselling') ||
    textLower.includes('counseling')
  ) {
    return { category: 'medical_checkup', suggested: [], confidence: 'high' };
  }

  // Serious disease / fertility
  if (
    textLower.includes('chemotherapy') ||
    textLower.includes('dialysis') ||
    textLower.includes('ivf') ||
    textLower.includes('fertility') ||
    textLower.includes('cancer') ||
    textLower.includes('kidney') ||
    textLower.includes('oncology')
  ) {
    const category = textLower.includes('fertility') || textLower.includes('ivf')
      ? 'medical_fertility'
      : 'medical_serious';
    return { category, suggested: [], confidence: 'high' };
  }

  // General medical (clinic, hospital, pharmacy items)
  const medicalStores = [
    'guardian', 'watsons', 'caring', 'alpro', 'pharmacy', 'farmasi',
    'clinic', 'klinik', 'hospital', 'poliklinik'
  ];
  const medicalItems = [
    'prescription', 'medicine', 'ubat', 'tablet', 'capsule', 'syrup',
    'antibiotic', 'panadol', 'paracetamol', 'ibuprofen'
  ];

  const isMedicalStore = medicalStores.some(store => merchantLower.includes(store));
  const hasMedicalItems = medicalItems.some(item => textLower.includes(item));

  if (isMedicalStore || hasMedicalItems) {
    // Medical store but could be various medical items
    suggested.push('medical_vax', 'medical_checkup', 'medical_dental');
    return { category: 'medical_serious', suggested, confidence: 'medium' };
  }

  // Sports categories

  // Sports equipment
  const sportsEquipmentItems = [
    'running shoe', 'sport shoe', 'kasut sukan', 'sneaker',
    'bicycle', 'basikal', 'treadmill', 'dumbbell', 'barbell',
    'yoga mat', 'resistance band', 'kettlebell', 'tennis racket',
    'badminton racket', 'football', 'basketball', 'swimming goggle'
  ];

  if (sportsEquipmentItems.some(item => textLower.includes(item))) {
    return { category: 'sports_equip', suggested: [], confidence: 'high' };
  }

  // Sports stores
  const sportsStores = ['decathlon', 'sport', 'nike', 'adidas', 'sukan'];
  if (sportsStores.some(store => merchantLower.includes(store))) {
    suggested.push('sports_equip', 'sports_facility');
    return { category: 'sports_equip', suggested, confidence: 'medium' };
  }

  // Gym membership / training
  if (
    textLower.includes('gym membership') ||
    textLower.includes('fitness membership') ||
    textLower.includes('personal training') ||
    textLower.includes('coach') ||
    merchantLower.includes('gym') ||
    merchantLower.includes('fitness')
  ) {
    return { category: 'sports_training', suggested: [], confidence: 'high' };
  }

  // Lifestyle categories

  // Books & journals
  const bookStores = ['mph', 'kinokuniya', 'popular', 'times', 'borders', 'pustaka', 'bookstore'];
  const bookItems = ['book', 'buku', 'journal', 'magazine', 'novel', 'textbook'];

  if (
    bookStores.some(store => merchantLower.includes(store)) ||
    bookItems.some(item => textLower.includes(item))
  ) {
    return { category: 'lifestyle_books', suggested: [], confidence: 'high' };
  }

  // Tech products (PC, smartphone, tablet)
  const techStores = ['machines', 'senheng', 'courts', 'harvey norman', 'apple', 'samsung'];
  const techItems = [
    'laptop', 'notebook', 'computer', 'pc', 'macbook',
    'iphone', 'smartphone', 'phone', 'telefon',
    'ipad', 'tablet', 'galaxy tab'
  ];

  if (
    techStores.some(store => merchantLower.includes(store)) ||
    techItems.some(item => textLower.includes(item))
  ) {
    return { category: 'lifestyle_tech', suggested: [], confidence: 'high' };
  }

  // Internet bill
  const telcos = ['unifi', 'maxis', 'digi', 'celcom', 'telekom', 'tm', 'yes', 'u mobile', 'time'];
  const internetKeywords = ['broadband', 'internet bill', 'fibre', 'wifi', 'data plan'];

  if (
    telcos.some(telco => merchantLower.includes(telco)) ||
    internetKeywords.some(keyword => textLower.includes(keyword))
  ) {
    return { category: 'lifestyle_internet', suggested: [], confidence: 'high' };
  }

  // Education categories

  // Self education
  const educationInstitutions = [
    'university', 'universiti', 'college', 'kolej',
    'institute', 'institut', 'academy', 'akademi'
  ];
  const educationItems = [
    'tuition', 'course fee', 'yuran', 'semester',
    'registration fee', 'exam fee', 'matriculation'
  ];

  if (
    educationInstitutions.some(inst => merchantLower.includes(inst)) ||
    educationItems.some(item => textLower.includes(item))
  ) {
    return { category: 'education_self', suggested: [], confidence: 'high' };
  }

  // If no category matched, return low confidence with suggestions
  return { category: undefined, suggested: [], confidence: 'low' };
}

/**
 * Parse OCR text into structured receipt data
 */
export async function parseReceiptText(ocrResult: OCRResult): Promise<ParsedReceipt> {
  const text = ocrResult.text.toLowerCase();
  const lines = ocrResult.lines.map(l => l.text);

  const parsed: ParsedReceipt = {};

  // Extract amount - prioritize "Total" keywords
  // Try to find the FINAL total, not subtotals or item prices
  const amountPatterns = [
    // Malaysian receipts - "Jumlah" means "Total" in Malay
    /(?:grand\s+)?jumlah[:\s]+rm?\s*(\d+(?:[,\.]\d{2})?)/i,
    /(?:grand\s+)?total[:\s]+rm?\s*(\d+(?:[,\.]\d{2})?)/i,

    // English variations
    /net\s+total[:\s]+rm?\s*(\d+(?:[,\.]\d{2})?)/i,
    /final\s+amount[:\s]+rm?\s*(\d+(?:[,\.]\d{2})?)/i,
    /amount\s+payable[:\s]+rm?\s*(\d+(?:[,\.]\d{2})?)/i,

    // Balance/Payment (Malaysian receipts)
    /bayaran[:\s]+rm?\s*(\d+(?:[,\.]\d{2})?)/i,  // "Payment" in Malay
    /baki[:\s]+rm?\s*(\d+(?:[,\.]\d{2})?)/i,     // "Balance" in Malay

    // Generic patterns (last resort)
    /total[:\s]+rm?\s*(\d+(?:[,\.]\d{2})?)/i,
    /amount[:\s]+rm?\s*(\d+(?:[,\.]\d{2})?)/i,
    /rm\s*(\d+(?:[,\.]\d{2})?)/i,  // Just "RM 123.45"
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amountStr = match[1].replace(',', '.');
      parsed.amount = parseFloat(amountStr);
      break;
    }
  }

  // Fallback: If no amount found, find all numbers and take the largest
  // (likely the total on a receipt)
  if (!parsed.amount) {
    const allNumbers = text.match(/\d+(?:[,\.]\d{2})?/g);
    if (allNumbers && allNumbers.length > 0) {
      const numbers = allNumbers.map(n => parseFloat(n.replace(',', '.')));
      const maxNumber = Math.max(...numbers);
      // Only use if it's a reasonable receipt amount (> 1 RM, < 10000 RM)
      if (maxNumber > 1 && maxNumber < 10000) {
        parsed.amount = maxNumber;
      }
    }
  }

  // Extract date - handle Malaysian formats
  const datePatterns = [
    // With "Date" keyword (most reliable)
    /date[:\s]+(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i,
    /tarikh[:\s]+(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i,  // "Date" in Malay

    // ISO format (YYYY-MM-DD or YYYY/MM/DD)
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,

    // DD/MM/YYYY or DD-MM-YYYY (common in Malaysia)
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,

    // Short year (DD/MM/YY)
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})/,
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

  // Category classification
  // Strategy: Check internet → Try AI → Fall back to keywords
  // Store raw text for later re-classification when online

  let geminiClassification: { category?: string; confidence: 'high' | 'medium' | 'low' } | null = null;
  const isOnline = await hasInternetConnection();

  // Store raw text for potential re-classification
  parsed.rawText = ocrResult.text;

  // If Gemini already classified during vision OCR, use that
  if (ocrResult.geminiCategory && ocrResult.geminiCategoryConfidence === 'high') {
    parsed.category = ocrResult.geminiCategory;
    parsed.confidence = 'high';
    parsed.suggestedCategories = [];
    parsed.classificationMethod = 'ai';
    parsed.needsAiReview = false;
  } else if (!isOnline || !GEMINI_API_KEY) {
    // OFFLINE MODE or NO API KEY: Use keywords immediately, mark for AI review later
    console.log('[Classification] Offline or no API key - using keyword classification');
    const keywordClassification = classifyReceipt(text, parsed.merchantName || '');

    parsed.category = keywordClassification.category;
    parsed.suggestedCategories = keywordClassification.suggested;
    parsed.confidence = keywordClassification.confidence;
    parsed.classificationMethod = 'offline';
    parsed.needsAiReview = true; // Flag for background re-classification when online

    console.log('[Classification] ⚠️ Classified offline, will re-classify when internet available');
  } else {
    // ONLINE MODE: Try Gemini AI classification
    try {
      geminiClassification = await classifyWithGemini(text, parsed.merchantName || '');

      if (geminiClassification.category && geminiClassification.confidence === 'high') {
        // High confidence AI classification - use it!
        parsed.category = geminiClassification.category;
        parsed.confidence = 'high';
        parsed.suggestedCategories = [];
        parsed.classificationMethod = 'ai';
        parsed.needsAiReview = false;
      } else {
        // Medium/low confidence or no category - combine with keyword classification
        const keywordClassification = classifyReceipt(text, parsed.merchantName || '');

        // Use Gemini's category if available, otherwise keyword
        parsed.category = geminiClassification.category || keywordClassification.category;
        parsed.confidence = geminiClassification.confidence || keywordClassification.confidence;
        parsed.classificationMethod = geminiClassification.category ? 'ai' : 'keyword';
        parsed.needsAiReview = false; // Already used AI (even if medium confidence)

        // Combine suggestions
        parsed.suggestedCategories = [
          ...(geminiClassification.category && keywordClassification.category !== geminiClassification.category
            ? [keywordClassification.category]
            : []
          ),
          ...keywordClassification.suggested,
        ].filter(Boolean) as string[];
      }
    } catch (error) {
      // Gemini classification failed - fall back to keywords
      console.log('[Classification] AI classification failed, using keywords');
      const classification = classifyReceipt(text, parsed.merchantName || '');
      parsed.category = classification.category;
      parsed.suggestedCategories = classification.suggested;
      parsed.confidence = classification.confidence;
      parsed.classificationMethod = 'keyword';
      parsed.needsAiReview = true; // Mark for retry when network is stable
    }
  }

  // Create description from merchant + item info
  if (parsed.merchantName) {
    parsed.description = parsed.merchantName;
  }

  return parsed;
}

/**
 * Re-classify a receipt that was classified offline
 * Use this when device comes back online to improve accuracy
 */
export async function reclassifyReceipt(
  rawText: string,
  merchantName: string,
  currentCategory?: string
): Promise<{ category?: string; confidence: 'high' | 'medium' | 'low'; changed: boolean } | null> {
  try {
    // Check if we're online now
    const isOnline = await hasInternetConnection();

    if (!isOnline || !GEMINI_API_KEY) {
      console.log('[Re-classification] Still offline or no API key');
      return null;
    }

    // Try AI classification
    const aiClassification = await classifyWithGemini(rawText, merchantName);

    if (aiClassification.category) {
      const changed = aiClassification.category !== currentCategory;

      if (changed) {
        console.log(
          `[Re-classification] ✅ Updated: ${currentCategory} → ${aiClassification.category} (${aiClassification.confidence})`
        );
      } else {
        console.log(`[Re-classification] ✓ Confirmed: ${aiClassification.category} (${aiClassification.confidence})`);
      }

      return {
        category: aiClassification.category,
        confidence: aiClassification.confidence,
        changed,
      };
    }

    return null;
  } catch (error) {
    console.error('[Re-classification] Failed:', error);
    return null;
  }
}

/**
 * Batch re-classify multiple receipts
 * Call this when app comes online or in background
 */
export async function reclassifyPendingReceipts(
  receipts: Array<{
    id: string;
    rawText: string;
    merchantName: string;
    currentCategory?: string;
  }>
): Promise<
  Array<{
    id: string;
    newCategory?: string;
    confidence?: 'high' | 'medium' | 'low';
    changed: boolean;
  }>
> {
  const results = [];

  for (const receipt of receipts) {
    const result = await reclassifyReceipt(receipt.rawText, receipt.merchantName, receipt.currentCategory);

    if (result) {
      results.push({
        id: receipt.id,
        newCategory: result.category,
        confidence: result.confidence,
        changed: result.changed,
      });
    } else {
      results.push({
        id: receipt.id,
        changed: false,
      });
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
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
    const parsedReceipt = await parseReceiptText(ocrResult);

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
    const parsedReceipt = await parseReceiptText(ocrResult);

    // Track which OCR method was used
    parsedReceipt.ocrMethod = ocrResult.method;

    console.log(`[OCR] Image processed using ${ocrResult.method} OCR`);

    return parsedReceipt;
  } catch (error) {
    console.error('Image pick failed:', error);
    throw error;
  }
}
