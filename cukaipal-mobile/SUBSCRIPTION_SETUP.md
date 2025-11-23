# CukaiPal Subscription Setup Guide

This guide explains how to set up and monetize CukaiPal as a subscription-based service.

## 📦 Architecture Overview

The app now uses a **backend-first architecture** with:

1. **User Authentication**: JWT-based auth with email/password
2. **Subscription Management**: RevenueCat for iOS/Android subscriptions
3. **Cloud Sync**: Automatic data synchronization
4. **Backend OCR**: Server-side receipt processing with your Gemini API key
5. **Freemium Model**: 7-day trial, then paid subscription required

## 🔧 Setup Steps

### 1. Backend API Setup

You need to build and deploy the backend API according to the specification in `BACKEND_API_SPEC.md`.

**Quick Start Options**:

#### Option A: Node.js + Express (Recommended)
```bash
# Clone starter template
git clone https://github.com/your-org/cukaipal-backend
cd cukaipal-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials:
# - DATABASE_URL (PostgreSQL)
# - GEMINI_API_KEY
# - JWT_SECRET
# - AWS_S3_BUCKET (for file storage)

# Run migrations
npm run migrate

# Start server
npm run dev
```

#### Option B: Use Backend-as-a-Service

- **Supabase**: Auth + Database + Storage
- **Firebase**: Auth + Firestore + Storage
- **Appwrite**: Open-source BaaS

### 2. RevenueCat Configuration

1. **Create RevenueCat Account**: https://app.revenuecat.com/signup

2. **Create Project**: "CukaiPal"

3. **Add iOS App**:
   - Bundle ID: `com.cukaipal.mobile`
   - Upload App Store Connect API Key

4. **Create Products**:
   ```
   Product ID: cukaipal_monthly
   Name: CukaiPal Monthly
   Price: RM 9.90/month

   Product ID: cukaipal_yearly
   Name: CukaiPal Yearly
   Price: RM 99/year

   Product ID: cukaipal_lifetime
   Name: CukaiPal Lifetime
   Price: RM 299 (non-consumable)
   ```

5. **Create Entitlement**:
   ```
   Entitlement ID: pro
   Attach all 3 products to this entitlement
   ```

6. **Get API Keys**:
   - iOS: RevenueCat Settings → API Keys → iOS
   - Copy to `src/config/api.ts`:
     ```typescript
     export const REVENUECAT_API_KEY = {
       ios: 'your_actual_ios_key_here',
       android: 'your_actual_android_key_here',
     };
     ```

7. **Configure Webhook**:
   - URL: `https://api.cukaipal.com/webhooks/revenuecat`
   - Events: All events
   - This keeps your database in sync with subscription status

### 3. App Store Connect Setup

1. **Create App**: https://appstoreconnect.apple.com
   - Name: CukaiPal
   - Bundle ID: com.cukaipal.mobile
   - Category: Finance

2. **Create In-App Purchases**:
   - Navigate to "Features" → "In-App Purchases"
   - Create 3 subscriptions matching RevenueCat product IDs
   - Add pricing for Malaysia (RM) and other regions

3. **Subscription Groups**:
   - Group Name: "CukaiPal Pro"
   - Add all 3 products
   - Set upgrade/downgrade behavior

4. **App Privacy**:
   - Collects: Email, Name, Financial Data
   - Purpose: App Functionality
   - Linked to User: Yes
   - Used for Tracking: No

### 4. Update API Configuration

Edit `src/config/api.ts`:

```typescript
// Replace with your actual backend URL
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'  // Local testing
  : 'https://api.cukaipal.com/api';  // Production

// Add your RevenueCat keys (from step 2.6)
export const REVENUECAT_API_KEY = {
  ios: 'appl_xxxxxxxxxxxxx',
  android: 'goog_xxxxxxxxxxxxx',
};
```

### 5. Initialize RevenueCat

Add to `App.tsx` (already done):

```typescript
import Purchases from 'react-native-purchases';

useEffect(() => {
  const initRevenueCat = async () => {
    if (Platform.OS === 'ios') {
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY.ios,
      });
    } else {
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY.android,
      });
    }
  };
  initRevenueCat();
}, []);
```

### 6. Build and Test

```bash
# Install dependencies
cd cukaipal-mobile
npm install

# Run on iOS
npx expo run:ios

# Test flow:
# 1. Sign up (creates trial account)
# 2. Use app for 7 days
# 3. Hit paywall on day 8
# 4. Purchase subscription
# 5. Verify full access restored
```

## 💰 Pricing Strategy

### Tier Analysis

| Plan | Price | Target User | Revenue/User/Year |
|------|-------|------------|-------------------|
| Monthly | RM 9.90 | Casual users | RM 118.80 |
| Yearly | RM 99 | Regular users | RM 99.00 |
| Lifetime | RM 299 | Power users | RM 299 (one-time) |

### Revenue Projections

**Assumptions**:
- 10,000 downloads/year
- 30% trial-to-paid conversion
- 60% choose yearly, 30% monthly, 10% lifetime

**Annual Revenue**:
```
Trial conversions: 10,000 × 30% = 3,000 users

Monthly subscribers: 3,000 × 30% × RM 118.80 = RM 106,920
Yearly subscribers: 3,000 × 60% × RM 99 = RM 178,200
Lifetime subscribers: 3,000 × 10% × RM 299 = RM 89,700

Total: RM 374,820/year
```

## 🔐 Security Checklist

- [ ] Backend API uses HTTPS only
- [ ] JWT secrets are strong and rotated
- [ ] Database credentials in environment variables
- [ ] File uploads scanned for malware
- [ ] Rate limiting on all endpoints
- [ ] RevenueCat webhook signature verification
- [ ] User passwords hashed with bcrypt (12+ rounds)
- [ ] API keys never committed to git

## 📊 Analytics Setup

### Recommended Tools

1. **Mixpanel**: User behavior tracking
   ```typescript
   mixpanel.track('Receipt Scanned', {
     category: 'lifestyle',
     amount: 150,
     ocrConfidence: 0.95,
   });
   ```

2. **Sentry**: Error tracking
   ```typescript
   Sentry.captureException(error);
   ```

3. **RevenueCat Charts**: Subscription metrics (built-in)

### Key Metrics to Track

- **Acquisition**:
  - App downloads
  - Sign-ups
  - Traffic sources

- **Activation**:
  - Trial starts
  - First receipt scanned
  - First OCR scan

- **Revenue**:
  - Trial-to-paid conversion
  - MRR (Monthly Recurring Revenue)
  - Churn rate
  - LTV (Lifetime Value)

- **Retention**:
  - DAU/MAU
  - Session length
  - Features used

- **Referral**:
  - Share rate
  - App Store reviews

## 🎯 Marketing Strategy

### App Store Optimization (ASO)

**Keywords**:
- cukai
- tax malaysia
- lhdn
- e-filing
- tax relief
- tax calculator malaysia
- cukai pendapatan

**Screenshots**:
1. Dashboard with tax calculations
2. Receipt scanning with OCR
3. Tax relief categories
4. Export features
5. Cloud sync across devices

**Description**:
```
CukaiPal - Your Malaysian Tax Relief Assistant

Track your tax reliefs effortlessly and maximize your refund.
Perfect for LHDN e-filing preparation.

✅ AI-powered receipt scanning
✅ Automatic tax calculations
✅ 20+ LHDN relief categories
✅ Export to PDF & CSV
✅ Cloud sync

Start your 7-day free trial today!
```

### Launch Channels

1. **Social Media**:
   - Facebook ads targeting Malaysian taxpayers
   - LinkedIn for professionals
   - Twitter/X for tech-savvy users

2. **Content Marketing**:
   - Blog: "How to maximize your tax refund"
   - YouTube tutorials
   - Tax season guides

3. **Partnerships**:
   - Accounting firms
   - Financial advisors
   - HR departments

4. **PR**:
   - Press release for launch
   - Reach out to tech/finance bloggers
   - Podcast interviews

## 🚀 Post-Launch

### Month 1-3: Acquisition Focus
- Run ads (RM 5,000 budget)
- Content marketing
- App Store optimization
- Collect feedback

### Month 4-6: Optimization
- Improve onboarding flow
- Add most-requested features
- Reduce churn with better UX
- A/B test pricing

### Month 7-12: Scale
- Expand to Singapore/Thailand markets
- Add premium features (tax planning, accountant connect)
- Launch referral program
- Corporate plans for businesses

## 📝 Legal Requirements

- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Data Protection compliance (PDPA Malaysia)
- [ ] Payment processor agreement (RevenueCat/Stripe)
- [ ] App Store compliance
- [ ] Tax registration for business income

## 🆘 Support

### Customer Support Channels

1. **In-App**: Support button in settings
2. **Email**: support@cukaipal.com
3. **FAQ/Knowledge Base**: help.cukaipal.com
4. **Live Chat**: For paid users (Intercom/Crisp)

### Common Issues

- **OCR not working**: Check backend API status
- **Sync failing**: Verify network connection
- **Subscription not active**: Use "Restore Purchases"
- **Login issues**: Password reset flow

## 🔄 Continuous Improvement

### Feature Roadmap

**Q1 2026**:
- [ ] Tax planning insights
- [ ] Multi-year comparisons
- [ ] Receipt categorization improvements

**Q2 2026**:
- [ ] LHDN e-filing integration
- [ ] Family sharing (5 users)
- [ ] Accountant collaboration

**Q3 2026**:
- [ ] Singapore market launch
- [ ] Corporate plans
- [ ] Advanced analytics

**Q4 2026**:
- [ ] AI tax advisor chatbot
- [ ] Investment tracking
- [ ] Crypto tax calculations

---

## 🎉 You're Ready!

Your CukaiPal subscription service is now ready to launch. Remember to:

1. ✅ Deploy backend API
2. ✅ Configure RevenueCat
3. ✅ Set up App Store Connect
4. ✅ Test entire flow
5. ✅ Submit to App Store

**Good luck with your launch! 🚀**

For questions or support, contact the development team.
