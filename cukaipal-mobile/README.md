# CukaiPal Mobile - React Native iOS App

A comprehensive Malaysian tax relief tracking application ported from React web to React Native using Expo.

## 📱 Overview

CukaiPal Mobile is a native iOS app that helps Malaysian taxpayers track their tax reliefs, manage receipts, and calculate their tax obligations based on LHDN (Lembaga Hasil Dalam Negeri) guidelines.

### Key Features

- ✅ **Tax Calculations**: Accurate progressive tax calculations for years 2019-2025
- 📊 **Relief Management**: Track 20+ tax relief categories with LHDN-compliant limits
- 📸 **Receipt Scanning**: Camera/gallery integration for receipt capture
- 🤖 **AI OCR**: Gemini AI integration for automatic receipt data extraction
- 💾 **Offline Storage**: All data stored locally using AsyncStorage
- 📤 **Export**: CSV and PDF export functionality
- 🔄 **Backup/Restore**: JSON-based backup and import system
- 👨‍👩‍👧‍👦 **Family Profiles**: Support for spouse and children relief calculations

## 🏗️ Architecture

### Clean Architecture Approach

The app follows a clean architecture pattern with clear separation of concerns:

```
src/
├── engine/          # Pure business logic (no dependencies)
│   ├── types.ts     # TypeScript interfaces and types
│   └── taxEngine.ts # Tax calculation functions and constants
├── storage/         # Data persistence layer
│   ├── StorageAdapter.ts        # Interface definition
│   └── NativeStorageAdapter.ts  # AsyncStorage implementation
├── context/         # React Context for global state
│   └── AppContext.tsx
├── components/      # Reusable UI components
│   ├── CategoryCard.tsx
│   ├── ReceiptItem.tsx
│   ├── TaxOptimizer.tsx
│   ├── Stepper.tsx
│   └── Modal.tsx
├── screens/         # Screen components
│   ├── DashboardScreen.tsx
│   ├── VaultScreen.tsx
│   ├── ProfileScreen.tsx
│   └── InboxScreen.tsx
└── navigation/      # Navigation configuration
    └── RootNavigator.tsx
```

### Design Principles

1. **Pure Tax Engine**: All tax logic is extracted into pure functions with no external dependencies
2. **Storage Abstraction**: Storage layer is abstracted to allow easy swapping of persistence mechanisms
3. **Type Safety**: Full TypeScript support with explicit type definitions
4. **Mobile-First**: Uses React Native primitives and Expo modules instead of browser APIs

## 🔄 Porting Changes from Web Version

### Storage Layer

**Web (IndexedDB)** → **Native (AsyncStorage)**
- Replaced `indexedDB` API with `@react-native-async-storage/async-storage`
- Changed `fileData` (base64) to `fileUri` (filesystem paths) for receipt images
- Atomic operations to prevent race conditions

### UI Components

**Web (HTML/CSS)** → **Native (React Native)**
- `<div>` → `<View>`
- `<p>` / `<span>` → `<Text>`
- `<button>` → `<Pressable>`
- `className` → `StyleSheet.create()`
- `lucide-react` → `lucide-react-native`

### File Operations

**Web** → **Native**
- `FileReader` → `expo-file-system`
- `window.open()` for downloads → `expo-sharing`
- HTML file input → `expo-image-picker` and `expo-document-picker`
- Blob/data URLs → File URIs

### Export Functionality

**Web** → **Native**
- CSV: `data:text/csv` + anchor click → `FileSystem.writeAsStringAsync` + `Sharing.shareAsync`
- PDF: `window.print()` → `expo-print` `printToFileAsync`

## 🛠️ Technology Stack

### Core
- **React Native**: 0.81.5
- **Expo**: ~54.0
- **TypeScript**: ~5.9.2

### Navigation
- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- `@react-navigation/native-stack`

### Expo Modules
- `expo-image-picker`: Camera and photo library access
- `expo-file-system`: File operations
- `expo-sharing`: Share/export functionality
- `expo-print`: PDF generation
- `expo-document-picker`: File imports

### Storage
- `@react-native-async-storage/async-storage`

### UI
- `lucide-react-native`: Icons

## 📦 Installation

```bash
cd cukaipal-mobile
npm install
```

## 🚀 Running the App

### iOS Simulator
```bash
npm run ios
```

### Android Emulator
```bash
npm run android
```

### Expo Go (Development)
```bash
npm start
```

Then scan the QR code with Expo Go app on your device.

## 🎯 Key Implementation Details

### Tax Engine

The tax engine is completely pure and testable:

```typescript
// Pure function - no side effects
export const calculateProgressiveTax = (
  chargeableIncome: number,
  year: number
): number => {
  // Progressive tax calculation logic
}
```

### Storage Pattern

All storage operations use async/await with the StorageAdapter interface:

```typescript
// Save receipt
await storageAdapter.saveReceipt(receipt);

// Load all receipts
const receipts = await storageAdapter.loadReceipts();
```

### Context-Based State Management

Global state is managed through React Context:

```typescript
const { receipts, userProfile, saveReceipt, updateUserProfile } = useAppContext();
```

### OCR Integration

The app uses Gemini AI for receipt OCR (user provides their own API key):

```typescript
// OCR happens on the device
// Images are sent to Gemini API for text extraction
// Structured data is returned and validated against LHDN categories
```

## 📝 Tax Relief Categories Supported

### Automatic Reliefs
- Spouse (non-working): RM4,000
- Self Disabled (OKU): RM6,000
- Spouse Disabled: RM5,000
- Child Relief: Variable based on age/education

### Manual Expense Categories
- **Lifestyle** (RM2,500): Books, tech, internet
- **Sports** (RM1,000): Equipment, gym, training
- **Medical** (RM10,000): Serious diseases, fertility, checkups
- **Medical (Parents)** (RM8,000): Parent care expenses
- **Education** (RM7,000): Degree/Masters/PhD fees
- **Insurance** (RM3,000): Education/Medical premiums
- **PRS/Annuity** (RM3,000): Retirement schemes
- **SSPN** (RM8,000): Education savings
- **Childcare** (RM3,000): Registered centers
- **Breastfeeding** (RM1,000): Equipment
- **EV Charging** (RM2,500): Installation/subscription
- **SOCSO/EIS** (RM350): Employee contributions
- **Life Insurance/EPF** (RM7,000): Premiums and contributions

## 🔐 Security & Privacy

- All data stored locally on device
- No external servers (except optional Gemini API for OCR)
- API keys stored in AsyncStorage (user-provided)
- Backup files are user-controlled

## 📊 Tax Calculation Formula

```
Aggregate Income = Employment + Dividends + Other Income
Total Income = Aggregate Income - Donations (max 10%)
Chargeable Income = Total Income - Personal Relief (RM9,000) - Total Reliefs
Tax = Progressive Tax Calculation
Tax Payable = Tax - Rebates (Zakat + Statutory)
```

### Budget 2025 Changes
- Dividend income > RM100,000 subject to 2% tax
- New tax brackets post-2023

## 🧪 Testing Recommendations

1. **Unit Tests**: Test pure tax engine functions
2. **Integration Tests**: Test storage adapter operations
3. **E2E Tests**: Test complete user flows (add receipt → verify → export)

## 🚧 Future Enhancements

### Phase 2
- [ ] Full OCR implementation with camera integration
- [ ] Receipt image compression optimization
- [ ] SQLite for better performance with large datasets
- [ ] Biometric authentication
- [ ] Cloud sync (optional)

### Phase 3
- [ ] Tax planning recommendations
- [ ] Year-over-year comparisons
- [ ] LHDN e-Filing integration
- [ ] Multi-language support (BM/EN/ZH)

## 📄 License

Private - All rights reserved

## 👥 Credits

**Original Web Version**: CukaiPal React Component
**Mobile Port**: Ported to React Native with Expo
**Tax Rules**: Based on LHDN Malaysia guidelines (2019-2025)

## 🆘 Support

For issues or questions:
1. Check the README
2. Review TypeScript types in `src/engine/types.ts`
3. Examine tax logic in `src/engine/taxEngine.ts`

## 📱 Minimum Requirements

- iOS 13.0 or later
- Android 5.0 (API 21) or later
- 100MB free storage

---

**Built with ❤️ for Malaysian taxpayers**
