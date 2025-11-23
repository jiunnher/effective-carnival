# Complete Setup Guide: Testing CukaiPal on iPhone

This guide will walk you through setting up and testing CukaiPal Mobile on your iPhone from scratch.

---

## 📋 Prerequisites

### 1. Development Environment

**Required Software:**
- **macOS** (required for iOS development)
- **Xcode** 14.0 or later (free from Mac App Store)
- **Node.js** 18 or later
- **npm** or **yarn**
- **CocoaPods** (iOS dependency manager)

**Install Xcode:**
```bash
# Download from Mac App Store or:
xcode-select --install
```

**Install Node.js:**
```bash
# Using Homebrew (recommended)
brew install node

# Verify installation
node --version
npm --version
```

**Install CocoaPods:**
```bash
sudo gem install cocoapods

# Verify installation
pod --version
```

### 2. Apple Developer Account

**Free Account (Testing Only):**
- Sign in with your Apple ID in Xcode
- Free provisioning allows 7-day certificate
- Limited to 3 devices
- Good for testing

**Paid Account ($99/year):**
- Required for App Store submission
- 1-year certificates
- Unlimited devices
- Get at: https://developer.apple.com

---

## 🔑 Step 1: Get API Keys

### Gemini API Key (Required for AI Classification)

1. Go to https://aistudio.google.com/apikey
2. Sign in with Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza...`)

**Cost:** FREE tier includes:
- 15 requests/minute
- 1,500 requests/day
- Perfect for testing!

### Supabase (Required for Authentication)

1. Go to https://supabase.com
2. Sign up (free tier available)
3. Create new project
4. Go to **Project Settings** → **API**
5. Copy:
   - Project URL
   - Anon/Public key

**Cost:** FREE tier includes:
- 50,000 monthly active users
- 500 MB database
- Unlimited API requests

### RevenueCat (Optional - for Subscriptions)

1. Go to https://www.revenuecat.com
2. Sign up (free tier available)
3. Create new project
4. Add iOS app
5. Copy API key from **Settings**

**Cost:** FREE until $2,500 monthly tracked revenue

### Google OAuth (Required for Google Sign In)

1. Go to https://console.cloud.google.com
2. Create new project
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Select **iOS** application
6. Enter bundle ID: `com.yourcompany.cukaipal` (or your custom bundle ID)
7. Copy the **Client ID**

---

## 📦 Step 2: Install Project Dependencies

```bash
# Navigate to project
cd cukaipal-mobile

# Install Node packages
npm install

# Install iOS dependencies (CocoaPods)
cd ios
pod install
cd ..
```

**Expected output:**
```
✓ Installing CocoaPods dependencies (this may take a few minutes)
✓ Pod installation complete! There are X dependencies
```

---

## 🔧 Step 3: Configure Environment Variables

Create `.env` file in project root:

```bash
# Create .env file
touch .env
```

Add your API keys to `.env`:

```bash
# Gemini AI (for OCR classification)
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyC_your_actual_key_here

# Supabase (for authentication & cloud backup)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_key_here

# RevenueCat (optional - for subscriptions)
EXPO_PUBLIC_REVENUECAT_API_KEY=appl_your_key_here

# Google OAuth (for Google Sign In)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
```

**⚠️ Important:**
- Replace all placeholder values with your actual keys
- Never commit `.env` to git (it's already in `.gitignore`)

---

## 🍎 Step 4: Configure Xcode Project

### A. Open in Xcode

```bash
# Open the iOS workspace (not .xcodeproj!)
open ios/CukaipalMobile.xcworkspace
```

### B. Configure Signing & Capabilities

1. In Xcode, select **CukaipalMobile** project in navigator
2. Select **CukaipalMobile** target
3. Go to **Signing & Capabilities** tab
4. Check **"Automatically manage signing"**
5. Select your **Team** (Apple ID)
6. Change **Bundle Identifier** if needed:
   - Default: `com.yourcompany.cukaipal`
   - Must be unique (e.g., `com.yourname.cukaipal`)

**Screenshot reference:**
```
┌─────────────────────────────────────────┐
│ Signing & Capabilities                  │
├─────────────────────────────────────────┤
│ ☑ Automatically manage signing          │
│                                         │
│ Team: Your Name (Personal Team)         │
│ Bundle Identifier: com.yourname.cukaipal│
│ Provisioning Profile: Xcode Managed     │
│ Signing Certificate: Apple Development  │
└─────────────────────────────────────────┘
```

### C. Add Apple Sign In Capability

1. Click **"+ Capability"** button
2. Search for **"Sign in with Apple"**
3. Double-click to add

### D. Configure Info.plist

Open `ios/CukaipalMobile/Info.plist` and add:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan receipts for tax relief tracking</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to select receipt images</string>

<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR-CLIENT-ID-HERE</string>
    </array>
  </dict>
</array>
```

**⚠️ Replace `YOUR-CLIENT-ID-HERE` with your Google OAuth Client ID (reversed)**

Example:
- Client ID: `123456-abc.apps.googleusercontent.com`
- Reversed: `com.googleusercontent.apps.123456-abc`

---

## 📲 Step 5: Connect Your iPhone

### Physical Device Setup

1. **Enable Developer Mode on iPhone:**
   - Settings → Privacy & Security → Developer Mode → ON
   - Restart iPhone if prompted

2. **Trust Your Computer:**
   - Connect iPhone to Mac with USB cable
   - Unlock iPhone
   - Tap **"Trust"** when prompted
   - Enter iPhone passcode

3. **Select Device in Xcode:**
   - In Xcode toolbar, click device selector
   - Select your iPhone (e.g., "Your iPhone")
   - Should show iOS version

### Simulator (Alternative)

If you don't have a physical device connected:
```bash
# List available simulators
xcrun simctl list devices

# Boot iPhone 14 Pro simulator (example)
xcrun simctl boot "iPhone 14 Pro"
```

---

## 🚀 Step 6: Build and Run

### Option A: Using Expo CLI (Recommended for Development)

```bash
# Start Expo development server
npm start

# Press 'i' for iOS simulator
# OR scan QR code with Expo Go app on iPhone
```

### Option B: Using Xcode (Recommended for Real Device Testing)

1. In Xcode, click **▶ Run** button (or Cmd+R)
2. Wait for build to complete (first build takes 5-10 minutes)
3. App will install and launch on your iPhone

**Build Progress:**
```
Building... (this may take a while)
↓
Installing on iPhone...
↓
Launching app...
↓
✅ App running on iPhone!
```

### Option C: Using Terminal

```bash
# Build and run on connected device
npm run ios --device

# Run on specific simulator
npm run ios --simulator="iPhone 14 Pro"
```

---

## 🧪 Step 7: Test Core Features

### Test 1: Authentication

1. Open app on iPhone
2. Tap **"Sign in with Apple"**
3. Authenticate with Face ID / Touch ID
4. Should see Dashboard screen

**Expected:** Seamless login, no password needed

### Test 2: Offline OCR (Apple Vision)

1. Turn on **Airplane Mode** on iPhone
2. Tap **Vault** tab → **"+"** button
3. Take photo of a receipt (or select from library)
4. Should see parsed receipt data instantly

**Expected:**
- ✅ Amount extracted
- ✅ Date extracted
- ✅ Category assigned (keyword-based)
- ⚠️ Shows "Will verify online" badge

**Test Receipt Example:**
```
┌─────────────────────────┐
│ GUARDIAN PHARMACY       │
│ Date: 23/11/2024        │
│                         │
│ Paracetamol     RM 8.50 │
│ Vitamin C      RM 15.00 │
│                         │
│ Total:        RM 23.50  │
└─────────────────────────┘
```

### Test 3: AI Classification (Online)

1. Turn off **Airplane Mode**
2. Scan same receipt again
3. Should see AI classification

**Expected:**
- ✅ Paracetamol → `medical_serious` (AI knows it's prescription)
- ✅ Vitamin C → `null` (AI knows supplements aren't deductible)
- 🎯 High confidence classification

### Test 4: Background Re-classification

1. Keep app in Airplane Mode
2. Scan 3 different receipts
3. Turn off Airplane Mode
4. Bring app to foreground (swipe up, tap app)
5. Wait 5 seconds

**Expected:**
- 🔄 Console shows "Re-classifying X receipts..."
- ✅ Categories updated automatically
- 📢 Notification: "Categories improved!"

### Test 5: Tax Calculation

1. Go to **Dashboard** tab
2. Fill in profile:
   - Employment income: RM 60,000
   - Marital status: Single
3. Add receipts to each category
4. Check tax calculation

**Expected:**
- ✅ Progressive tax calculated correctly
- ✅ Relief amounts deducted
- ✅ Tax savings shown

### Test 6: Export

1. Go to **Profile** tab
2. Tap **"Export CSV"**
3. Share to Files app or email

**Expected:**
- ✅ CSV file generated
- ✅ Share sheet opens
- ✅ Can save or send

---

## 🔍 Step 8: Verify Logs

### View Console Logs in Xcode

1. In Xcode, open **Console** (Cmd+Shift+C)
2. Filter by "OCR" or "Classification"
3. Should see:

```
[OCR] Attempting on-device OCR with Apple Vision: file://...
[OCR] ✅ On-device OCR successful
[Classification] Offline or no API key - using keyword classification
[Classification] ⚠️ Classified offline, will re-classify when internet available
```

When online:
```
[Gemini Classification] medical_serious (high): Prescription medicine is tax deductible
[Classification] ✅ AI classification successful
```

When background sync runs:
```
[Re-classification] ✅ Updated: medical_serious → medical_vax (high)
```

---

## 🐛 Troubleshooting

### Issue 1: Build Failed - "No Bundle Identifier"

**Solution:**
1. Open Xcode
2. Select target → Signing & Capabilities
3. Set unique Bundle Identifier
4. Select Team (your Apple ID)

### Issue 2: "Untrusted Developer" on iPhone

**Solution:**
1. iPhone → Settings → General → VPN & Device Management
2. Tap your Apple ID under "Developer App"
3. Tap **"Trust"**
4. Confirm

### Issue 3: Camera Permission Denied

**Solution:**
1. iPhone → Settings → CukaiPal
2. Enable **Camera** and **Photos** access
3. Restart app

### Issue 4: OCR Returns Empty Text

**Problem:** `extractTextOnDevice()` is still using mock data

**Solution:**
Install actual OCR library:
```bash
npm install react-native-text-recognition
cd ios && pod install && cd ..
```

Then update `src/services/receiptOCR.ts:80-115`:
```typescript
async function extractTextOnDevice(imageUri: string): Promise<OCRResult> {
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

### Issue 5: Gemini API Error "Invalid API Key"

**Solution:**
1. Check `.env` file has correct key
2. Verify key at https://aistudio.google.com/apikey
3. Restart Metro bundler:
   ```bash
   # Kill existing bundler
   killall node

   # Restart
   npm start
   ```

### Issue 6: "Pod Install Failed"

**Solution:**
```bash
# Clean CocoaPods cache
cd ios
rm -rf Pods
rm Podfile.lock
pod deintegrate
pod install
cd ..
```

### Issue 7: "Module not found: expo-file-system"

**Solution:**
```bash
npm install expo-file-system
npx expo prebuild --clean
```

### Issue 8: Google Sign In Not Working

**Solution:**
1. Verify `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env`
2. Check Info.plist has correct URL scheme (reversed client ID)
3. Ensure Google+ API is enabled in Google Cloud Console

---

## 📊 Performance Testing

### Test Offline Performance

```bash
# Test OCR speed (should be ~0.1s)
1. Airplane Mode ON
2. Scan receipt
3. Check console for timing
```

**Expected:**
```
[OCR] Attempting on-device OCR: 0.1s
[Classification] Keyword matching: 0.01s
Total: ~0.11s ✅ Very fast!
```

### Test AI Classification Speed

```bash
# Test Gemini speed (should be ~0.5s)
1. Airplane Mode OFF
2. Scan receipt
3. Check console for timing
```

**Expected:**
```
[OCR] On-device OCR: 0.1s
[Gemini Classification] API call: 0.5s
Total: ~0.6s ✅ Still fast!
```

### Test Battery Impact

1. Use app normally for 30 minutes
2. Check battery usage:
   - iPhone → Settings → Battery
   - CukaiPal should show < 5% usage

---

## 📈 Test Data Setup

### Sample Profile

```
Employment Income: RM 60,000
Status: Married
Spouse Working: No
Children U18: 2
```

### Sample Receipts

**Medical - Vaccination:**
```
Guardian Pharmacy
COVID-19 Vaccine Booster
RM 50.00
```

**Sports - Equipment:**
```
Decathlon
Running Shoes - Kiprun
RM 299.00
```

**Lifestyle - Books:**
```
MPH Bookstore
"Tax Planning Guide 2024"
RM 45.00
```

**Lifestyle - Tech:**
```
Machines (Apple Premium Reseller)
iPhone 15 Pro
RM 5,399.00 (only RM 2,500 deductible)
```

**Education:**
```
Universiti Malaya
Semester 1 Tuition Fee
RM 3,500.00
```

---

## 🎯 Testing Checklist

### Basic Features
- [ ] App launches successfully
- [ ] Apple Sign In works
- [ ] Google Sign In works
- [ ] Dashboard loads
- [ ] Profile can be edited
- [ ] Navigation between tabs works

### OCR & Classification
- [ ] Camera opens for receipt scan
- [ ] Photo library selection works
- [ ] OCR extracts text (amount, date, merchant)
- [ ] AI classification assigns correct category
- [ ] Offline mode works (keywords)
- [ ] Background re-classification works

### Tax Calculations
- [ ] Income input saves
- [ ] Receipts add to correct categories
- [ ] Tax calculation is accurate
- [ ] Relief limits enforced (e.g., RM 2,500 for lifestyle)
- [ ] Tax breakdown shows correctly

### Data Persistence
- [ ] Receipts persist after app restart
- [ ] Profile data persists
- [ ] Categories maintain totals

### Export
- [ ] CSV export works
- [ ] PDF export works (if implemented)
- [ ] Backup/restore works

### Offline Capabilities
- [ ] Works in Airplane Mode
- [ ] Syncs when back online
- [ ] No crashes when offline

### Performance
- [ ] App launches in < 3 seconds
- [ ] OCR completes in < 1 second
- [ ] UI is responsive (no lag)
- [ ] Battery usage is reasonable

---

## 🚀 Next Steps After Testing

### 1. Replace OCR Mock

Once testing confirms everything works:
```bash
npm install react-native-text-recognition
```

Update `extractTextOnDevice()` with real library.

### 2. Configure Supabase Database

Create `backups` table for cloud sync:
```sql
CREATE TABLE backups (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  receipts JSONB DEFAULT '[]'::jsonb,
  income_map JSONB DEFAULT '{}'::jsonb,
  user_profile JSONB,
  backed_up_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own backup" ON backups
  FOR ALL USING (auth.uid() = user_id);
```

### 3. Set Up RevenueCat Products

1. RevenueCat Dashboard → Products
2. Create:
   - Monthly: RM 9.90 (`monthly_subscription`)
   - Yearly: RM 99.00 (`yearly_subscription`)
3. Link to App Store Connect

### 4. TestFlight Beta Testing

1. Archive app in Xcode (Product → Archive)
2. Upload to App Store Connect
3. Submit for TestFlight review
4. Invite beta testers

### 5. Monitor Costs

Check usage after 1 week:
```
Gemini API Dashboard → Usage
- Verify < 1,500 requests/day (free tier)
- Check classification accuracy

Supabase Dashboard → Usage
- Verify database size < 500 MB
- Check API request count
```

---

## 📞 Support Resources

**Documentation:**
- Expo: https://docs.expo.dev
- React Native: https://reactnative.dev
- Supabase: https://supabase.com/docs
- RevenueCat: https://docs.revenuecat.com

**Community:**
- Expo Discord: https://chat.expo.dev
- React Native Discord: https://discord.gg/reactiflux

**Project Docs:**
- OCR Guide: `OCR_IMPLEMENTATION.md`
- Storage Guide: `HYBRID_STORAGE_GUIDE.md`
- Tax Updates: `TAX_YEAR_UPDATE_GUIDE.md`

---

## ✅ Summary

You should now have:

1. ✅ Development environment set up
2. ✅ API keys configured
3. ✅ App running on iPhone
4. ✅ Core features tested (OCR, classification, offline mode)
5. ✅ Ready for real-world testing

**Cost so far:** $0 (all free tiers!)

**Next milestone:** Replace mock OCR with real library and test with actual Malaysian receipts.

---

**Happy Testing! 🎉**
