# OCR Implementation Guide

## Recommended Strategy: Hybrid Approach 🎯

**Best of both worlds:** Use Apple Vision Framework first (free, fast, private), fall back to Gemini Vision API only when needed (complex receipts).

### Cost Comparison

| Solution | Cost per 1,000 images | Cost per user/year (50 receipts) | 10,000 users/year |
|----------|----------------------|----------------------------------|-------------------|
| **Hybrid (Apple Vision + Gemini fallback)** | **$0.00 - $0.15** ✅ | **$0.00 - $0.0075** ✅ | **$0 - $75** ✅ |
| Apple Vision only | $0 | $0 | $0 |
| Gemini Flash only | $0.10 | $0.005 | $50 |
| Google Cloud Vision | $1.50 | $0.075 | $750 |
| AWS Textract | $1.50 | $0.075 | $750 |
| Azure Computer Vision | $1.00 | $0.050 | $500 |
| OpenAI Vision API | $10.00 | $0.50 | $5,000 |

**Assumptions:**
- 80% of receipts successfully processed with Apple Vision (free)
- 20% fall back to Gemini ($0.00010 per image for Gemini 1.5 Flash)
- Average user scans 50 receipts/year

**Hybrid Approach Benefits:**
- ✅ **Lowest cost**: Free for 80%+ of scans, minimal cost for fallback
- ✅ **Best accuracy**: Gemini handles complex/faded receipts that Apple Vision struggles with
- ✅ **Privacy-first**: On-device processing by default
- ✅ **Offline-capable**: Works without internet for most receipts
- ✅ **Fast**: No network latency for successful on-device scans
- ✅ **Reliable**: Always has fallback for difficult receipts

---

## Option 1: React Native Text Recognition (Recommended)

Uses Apple Vision Framework on iOS and Google ML Kit on Android (both free).

### Installation

```bash
npm install react-native-text-recognition
```

For iOS, install pods:
```bash
cd ios && pod install && cd ..
```

### Usage

Update `src/services/receiptOCR.ts`:

```typescript
import TextRecognition from 'react-native-text-recognition';

export async function extractTextFromImage(imageUri: string): Promise<OCRResult> {
  try {
    // Use Apple Vision on iOS, ML Kit on Android
    const result = await TextRecognition.recognize(imageUri);

    // Result format:
    // {
    //   text: "full extracted text",
    //   blocks: [
    //     { text: "line text", frame: { x, y, width, height } }
    //   ]
    // }

    return {
      text: result.text,
      confidence: 0.95, // Vision framework doesn't provide confidence
      lines: result.blocks.map(block => ({
        text: block.text,
        boundingBox: block.frame,
      })),
    };
  } catch (error) {
    console.error('OCR failed:', error);
    throw error;
  }
}
```

---

## Option 2: Expo Image Manipulator + Vision Camera OCR

For Expo-managed workflow:

```bash
npx expo install expo-camera expo-image-manipulator
npm install vision-camera-ocr
```

### Usage

```typescript
import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { OCRFrame, scanOCR } from 'vision-camera-ocr';

export async function extractTextFromImage(imageUri: string): Promise<OCRResult> {
  // Preprocess image for better accuracy
  const manipulatedImage = await ImageManipulator.manipulateAsync(
    imageUri,
    [
      { resize: { width: 1024 } }, // Resize for faster processing
      { rotate: 0 }, // Ensure correct orientation
    ],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  // Perform OCR
  const result = await scanOCR(manipulatedImage.uri);

  return {
    text: result.text,
    confidence: 0.95,
    lines: result.blocks.map(block => ({
      text: block.text,
      boundingBox: block.frame,
    })),
  };
}
```

---

## ⭐ Hybrid Implementation (IMPLEMENTED)

The hybrid approach is **already implemented** in `src/services/receiptOCR.ts`!

### How It Works

```typescript
// src/services/receiptOCR.ts

// 1. Try on-device OCR first (Apple Vision / Google ML Kit)
async function extractTextOnDevice(imageUri: string): Promise<OCRResult> {
  // Uses react-native-text-recognition
  // Apple Vision on iOS, Google ML Kit on Android
  // Both are FREE and run on-device
}

// 2. Fall back to Gemini if on-device fails or low confidence
async function extractTextWithGemini(imageUri: string): Promise<OCRResult> {
  // Uses Gemini 1.5 Flash Vision API
  // Sends image to cloud for more accurate OCR
  // Better at handling complex/faded receipts
}

// 3. Orchestrator - tries on-device first, falls back automatically
export async function extractTextFromImage(
  imageUri: string,
  forceCloud: boolean = false
): Promise<OCRResult & { method: 'device' | 'cloud' }> {
  if (forceCloud) {
    return await extractTextWithGemini(imageUri);
  }

  try {
    // Try on-device first
    const result = await extractTextOnDevice(imageUri);

    // Check quality thresholds
    if (result.text.length < 10) throw new Error('Text too short');

    const parsed = parseReceiptText(result);
    const fields = [parsed.amount, parsed.date, parsed.merchantName].filter(Boolean).length;

    if (fields < 1) throw new Error('Insufficient data');

    return { ...result, method: 'device' }; // Success!
  } catch {
    // On-device failed, try Gemini
    const result = await extractTextWithGemini(imageUri);
    return { ...result, method: 'cloud' };
  }
}
```

### Fallback Triggers

On-device OCR falls back to Gemini when:

1. **Text too short**: Less than 10 characters extracted
2. **Missing key fields**: Couldn't extract amount, date, or merchant
3. **OCR library error**: Technical failure on device
4. **User manually requests**: `forceCloud: true` parameter

### Cost Analysis

For 10,000 users scanning 50 receipts/year (500,000 scans):

| Scenario | Apple Vision | Gemini Fallback | Total Cost |
|----------|--------------|-----------------|------------|
| Best case (90% on-device) | 450,000 free | 50,000 × $0.0001 = $5 | **$5/year** |
| Expected (80% on-device) | 400,000 free | 100,000 × $0.0001 = $10 | **$10/year** |
| Worst case (70% on-device) | 350,000 free | 150,000 × $0.0001 = $15 | **$15/year** |

**Compare to always-cloud:**
- Google Cloud Vision: $750/year
- AWS Textract: $750/year
- Gemini only: $50/year

**Savings: $740-745/year** (vs Google Cloud Vision)

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd cukaipal-mobile

# Install on-device OCR library
npm install react-native-text-recognition

# Install CocoaPods (iOS)
cd ios && pod install && cd ..
```

### 2. Configure Gemini API

Create `.env` file in project root:

```bash
# .env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key:
1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy and paste into `.env`

**Pricing:** Gemini 1.5 Flash
- First 15 requests/minute: **FREE**
- After that: $0.10 per 1,000 images
- For your scale: ~$10-15/year

### 3. Update extractTextOnDevice() Implementation

In `src/services/receiptOCR.ts`, replace the mock with actual library:

```typescript
async function extractTextOnDevice(imageUri: string): Promise<OCRResult> {
  // Replace this:
  // const result = { text: 'mock...', blocks: [...] };

  // With this:
  import TextRecognition from 'react-native-text-recognition';
  const result = await TextRecognition.recognize(imageUri);

  return {
    text: result.text,
    confidence: 0.95,
    lines: result.blocks.map(block => ({
      text: block.text,
      boundingBox: block.frame,
    })),
  };
}
```

### 4. Test the Hybrid Flow

```typescript
// Test on-device success
const result1 = await scanReceipt();
console.log(result1.ocrMethod); // Should be 'device' for clear receipts

// Test Gemini fallback (force cloud)
const result2 = await extractTextFromImage(imageUri, true);
console.log(result2.method); // Will be 'cloud'
```

---

## Old Option 3: Hybrid Approach (Reference)

This was the original suggestion. Now fully implemented above!

```typescript
export async function extractTextFromImage(
  imageUri: string,
  useCloud: boolean = false
): Promise<OCRResult> {
  if (!useCloud) {
    try {
      // Try on-device OCR first (free)
      return await extractTextOnDevice(imageUri);
    } catch (error) {
      console.warn('On-device OCR failed, falling back to cloud:', error);
      // Fall through to cloud OCR
    }
  }

  // Use cloud OCR for complex cases
  return await extractTextFromCloud(imageUri);
}

async function extractTextOnDevice(imageUri: string): Promise<OCRResult> {
  const result = await TextRecognition.recognize(imageUri);

  // Check if confidence is acceptable
  if (result.text.length < 10) {
    throw new Error('Low confidence, text too short');
  }

  return {
    text: result.text,
    confidence: 0.95,
    lines: result.blocks.map(block => ({
      text: block.text,
      boundingBox: block.frame,
    })),
  };
}

async function extractTextFromCloud(imageUri: string): Promise<OCRResult> {
  // Only called when on-device fails or user explicitly requests
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'receipt.jpg',
  } as any);

  const response = await fetch('YOUR_BACKEND_URL/api/receipts/ocr', {
    method: 'POST',
    body: formData,
  });

  return await response.json();
}
```

---

## Integration with Existing App

### Update InboxScreen to use OCR

```typescript
// src/screens/InboxScreen.tsx

import { scanReceipt, pickReceiptImage } from '../services/receiptOCR';
import { DEDUCTIBLES } from '../engine/taxEngine';

const handleScanReceipt = async () => {
  try {
    setIsScanning(true);

    // Use camera to scan receipt
    const parsed = await scanReceipt();

    if (!parsed) {
      // User canceled
      return;
    }

    // Create receipt from OCR data
    const newReceipt: Receipt = {
      id: Date.now().toString(),
      status: 'review', // Needs user review
      amount: parsed.amount || 0,
      description: parsed.description || 'Receipt',
      category: parsed.category || 'lifestyle',
      subCategory: parsed.category || 'lifestyle_books',
      date: parsed.date || new Date().toISOString().split('T')[0],
      fileUri: undefined, // Could store image if needed
    };

    // Show review modal
    setPendingReceipt(newReceipt);
    setShowReviewModal(true);

  } catch (error) {
    Alert.alert('Scan Failed', 'Could not scan receipt. Please try again.');
  } finally {
    setIsScanning(false);
  }
};
```

---

## Improving OCR Accuracy

### 1. Image Preprocessing

```typescript
import * as ImageManipulator from 'expo-image-manipulator';

async function preprocessImage(imageUri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [
      // Auto-rotate based on EXIF
      { rotate: 0 },

      // Resize to optimal size (1024px wide)
      { resize: { width: 1024 } },

      // Crop to receipt area (if you implement edge detection)
      // { crop: { originX: x, originY: y, width: w, height: h } },
    ],
    {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return manipulated.uri;
}
```

### 2. Enhanced Parsing Logic

```typescript
export function parseReceiptText(ocrResult: OCRResult): ParsedReceipt {
  const text = ocrResult.text;
  const lines = ocrResult.lines.map(l => l.text);

  // More robust amount extraction
  const amountPatterns = [
    // RM 123.45, RM123.45, RM 123
    /(?:rm|ringgit)\s*(\d+(?:[,\.]\d{2})?)/i,

    // TOTAL: 123.45
    /total[:\s]*(?:rm)?\s*(\d+(?:[,\.]\d{2})?)/i,

    // Amount: 123.45
    /amount[:\s]*(?:rm)?\s*(\d+(?:[,\.]\d{2})?)/i,

    // Balance Due: 123.45
    /(?:balance|due)[:\s]*(?:rm)?\s*(\d+(?:[,\.]\d{2})?)/i,
  ];

  // Try each pattern
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amountStr = match[1].replace(',', '.');
      const amount = parseFloat(amountStr);

      // Validate amount is reasonable
      if (amount > 0 && amount < 1000000) {
        parsed.amount = amount;
        break;
      }
    }
  }

  // Date extraction with multiple formats
  const datePatterns = [
    // DD/MM/YYYY, DD-MM-YYYY
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,

    // With "Date:" prefix
    /date[:\s]+(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i,

    // Written format: 15 Jan 2024
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/i,
  ];

  // Enhanced merchant detection
  // Look for company name patterns (usually all caps, or has SDN BHD, etc)
  const merchantPatterns = [
    /([A-Z\s&]+(?:SDN\.?\s*BHD\.?|BHD\.?|PLT\.?))/i,
    /^([A-Z][A-Za-z\s&]+)$/m, // Line with capitalized words
  ];

  // Category detection with fuzzy matching
  const categoryKeywords = {
    medical: {
      keywords: ['pharmacy', 'clinic', 'hospital', 'dr ', 'doctor', 'medical', 'health', 'medicine', 'prescription'],
      subCategory: 'medical_checkup',
    },
    lifestyle_books: {
      keywords: ['bookstore', 'book', 'mph', 'kinokuniya', 'popular', 'times'],
      subCategory: 'lifestyle_books',
    },
    lifestyle_tech: {
      keywords: ['apple', 'samsung', 'laptop', 'phone', 'computer', 'electronic', 'tech', 'machines', 'store'],
      subCategory: 'lifestyle_tech',
    },
    lifestyle_internet: {
      keywords: ['unifi', 'maxis', 'digi', 'celcom', 'broadband', 'internet', 'telekom', 'tm'],
      subCategory: 'lifestyle_internet',
    },
    sports_equip: {
      keywords: ['decathlon', 'sport', 'gym', 'fitness', 'nike', 'adidas', 'athletic'],
      subCategory: 'sports_equip',
    },
  };

  return parsed;
}
```

### 3. User Feedback Loop

```typescript
// Allow users to correct OCR mistakes
// This helps improve parsing logic over time

interface OCRFeedback {
  originalText: string;
  correctedAmount?: number;
  correctedDate?: string;
  correctedMerchant?: string;
}

async function submitOCRFeedback(feedback: OCRFeedback) {
  // Store feedback in Supabase for analysis
  await supabase.from('ocr_feedback').insert({
    original_text: feedback.originalText,
    corrected_amount: feedback.correctedAmount,
    corrected_date: feedback.correctedDate,
    corrected_merchant: feedback.correctedMerchant,
    created_at: new Date().toISOString(),
  });

  // Later, analyze feedback to improve parsing patterns
}
```

---

## Testing OCR

### Manual Testing Checklist

Test with various receipt types:

- [ ] **Pharmacy receipts** (medical)
- [ ] **Bookstore receipts** (lifestyle_books)
- [ ] **Electronics store** (lifestyle_tech)
- [ ] **Telco bills** (lifestyle_internet)
- [ ] **Restaurant bills** (not claimable, but test parsing)
- [ ] **Crumpled receipts** (test robustness)
- [ ] **Faded receipts** (old thermal paper)
- [ ] **Handwritten receipts**
- [ ] **Non-English receipts** (Bahasa Malaysia)

### Automated Testing

```typescript
// __tests__/receiptOCR.test.ts

import { parseReceiptText } from '../services/receiptOCR';

describe('Receipt OCR Parsing', () => {
  test('extracts amount correctly', () => {
    const ocrResult = {
      text: 'RECEIPT\nTotal: RM 150.00',
      confidence: 0.95,
      lines: [
        { text: 'RECEIPT' },
        { text: 'Total: RM 150.00' },
      ],
    };

    const parsed = parseReceiptText(ocrResult);
    expect(parsed.amount).toBe(150.00);
  });

  test('extracts date correctly', () => {
    const ocrResult = {
      text: 'Date: 15/01/2024\nAmount: RM 100',
      confidence: 0.95,
      lines: [
        { text: 'Date: 15/01/2024' },
        { text: 'Amount: RM 100' },
      ],
    };

    const parsed = parseReceiptText(ocrResult);
    expect(parsed.date).toBe('2024-01-15');
  });

  test('detects medical category', () => {
    const ocrResult = {
      text: 'ABC PHARMACY SDN BHD\nPrescription Medicine\nRM 200.00',
      confidence: 0.95,
      lines: [
        { text: 'ABC PHARMACY SDN BHD' },
        { text: 'Prescription Medicine' },
        { text: 'RM 200.00' },
      ],
    };

    const parsed = parseReceiptText(ocrResult);
    expect(parsed.category).toBe('medical');
  });
});
```

---

## Performance Optimization

### 1. Process in Background

```typescript
import { useEffect, useState } from 'react';

const [isProcessing, setIsProcessing] = useState(false);

const processImageAsync = async (imageUri: string) => {
  setIsProcessing(true);

  try {
    // Process in background thread (if using react-native-threads)
    const result = await extractTextFromImage(imageUri);
    return result;
  } finally {
    setIsProcessing(false);
  }
};
```

### 2. Cache Results

```typescript
// Cache OCR results to avoid reprocessing
const ocrCache = new Map<string, OCRResult>();

export async function extractTextFromImage(imageUri: string): Promise<OCRResult> {
  // Check cache first
  if (ocrCache.has(imageUri)) {
    return ocrCache.get(imageUri)!;
  }

  // Perform OCR
  const result = await TextRecognition.recognize(imageUri);

  // Cache result
  ocrCache.set(imageUri, result);

  return result;
}
```

---

## Migration Path

If you already have cloud OCR implemented:

### Phase 1: Add On-Device OCR (Week 1)
- Install `react-native-text-recognition`
- Implement basic on-device extraction
- Test with common receipt types

### Phase 2: A/B Test (Week 2-3)
- Route 50% of users to on-device OCR
- Compare accuracy and user satisfaction
- Monitor error rates

### Phase 3: Gradual Rollout (Week 4)
- Route 100% of users to on-device OCR
- Keep cloud OCR as fallback for complex cases
- Monitor cost savings

### Phase 4: Remove Cloud OCR (Week 5+)
- Once confident in on-device accuracy
- Remove cloud OCR backend
- **Save $750/year per 10,000 users**

---

## Recommended Implementation ✅ **IMPLEMENTED**

**The hybrid approach is already implemented!** Here's what you have:

1. ✅ **Hybrid OCR** (Apple Vision first, Gemini fallback)
2. ✅ **Automatic fallback logic** (based on text length and field extraction)
3. ✅ **Cost tracking** (`ocrMethod` field tracks 'device' vs 'cloud')
4. ✅ **Gemini integration** (ready for API key configuration)
5. ✅ **Manual review step** (InboxScreen shows parsed data for user verification)

**What you need to do:**

1. Install `react-native-text-recognition`:
   ```bash
   npm install react-native-text-recognition
   cd ios && pod install && cd ..
   ```

2. Get Gemini API key (free tier):
   - Visit: https://aistudio.google.com/apikey
   - Create API key
   - Add to `.env`: `EXPO_PUBLIC_GEMINI_API_KEY=your_key_here`

3. Replace mock in `extractTextOnDevice()` with actual library call (see Setup Instructions above)

**Cost savings:** $735-745/year per 10,000 users vs Google Cloud Vision = **98% cost reduction** 🚀

---

## Next Steps

1. Install OCR library:
   ```bash
   npm install react-native-text-recognition
   cd ios && pod install && cd ..
   ```

2. Update `receiptOCR.ts` with actual implementation

3. Test with real receipts

4. Deploy and monitor accuracy

5. Iterate on parsing logic based on user feedback

---

**Bottom Line:** Apple Vision Framework is the clear winner for your use case. Free, fast, private, and offline. No reason to use cloud OCR unless accuracy proves insufficient.
