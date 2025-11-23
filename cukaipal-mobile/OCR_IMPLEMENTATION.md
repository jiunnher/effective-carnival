# OCR Implementation Guide

## Why Apple Vision Framework?

**Cost Comparison:**

| Solution | Cost per 1,000 images | Cost per user/year (50 receipts) | 10,000 users/year |
|----------|----------------------|----------------------------------|-------------------|
| **Apple Vision** | **$0** ✅ | **$0** ✅ | **$0** ✅ |
| Google Cloud Vision | $1.50 | $0.075 | $750 |
| AWS Textract | $1.50 | $0.075 | $750 |
| Azure Computer Vision | $1.00 | $0.050 | $500 |
| OpenAI Vision API | $10.00 | $0.50 | $5,000 |

**Other Benefits:**
- ✅ **Privacy**: All processing on-device, data never leaves phone
- ✅ **Offline**: Works without internet
- ✅ **Fast**: No network latency
- ✅ **Battery efficient**: Optimized for Apple Neural Engine
- ✅ **No backend needed**: Reduces infrastructure complexity

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

## Option 3: Hybrid Approach (Best of Both Worlds)

Use on-device OCR by default, fall back to cloud for complex receipts:

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

## Recommended Implementation

**For your app, I recommend:**

1. **Use react-native-text-recognition** (wraps Apple Vision + Google ML Kit)
2. **Start with on-device only** (free, private, offline)
3. **Add manual review step** (users verify extracted data)
4. **Collect feedback** (improve parsing over time)
5. **Skip cloud OCR entirely** (unless accuracy is poor)

**Estimated development time:** 4-8 hours

**Cost savings:** $750/year per 10,000 users = **Infinite ROI** 🚀

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
