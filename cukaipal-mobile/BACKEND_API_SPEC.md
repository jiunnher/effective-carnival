# CukaiPal Backend API Specification

This document specifies the backend API required to support the CukaiPal subscription-based mobile app.

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Auth Endpoints](#auth-endpoints)
  - [User Endpoints](#user-endpoints)
  - [Receipt Endpoints](#receipt-endpoints)
  - [Sync Endpoints](#sync-endpoints)
  - [Subscription Endpoints](#subscription-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Implementation Notes](#implementation-notes)

## Overview

**Base URL**: `https://api.cukaipal.com/api`

**Authentication**: JWT Bearer tokens

**Content-Type**: `application/json` (except file uploads)

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {token}
```

Tokens expire after 24 hours. Use the refresh token to obtain a new access token.

## Endpoints

### Auth Endpoints

#### POST /auth/register
Create a new user account with 7-day free trial.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "displayName": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": "usr_123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "subscriptionStatus": "trial",
    "subscriptionPlan": null,
    "trialEndsAt": "2025-12-01T00:00:00Z",
    "createdAt": "2025-11-23T00:00:00Z"
  },
  "token": "eyJhbGc...",
  "refreshToken": "refresh_token_here"
}
```

**Errors**:
- `400`: Invalid email or password format
- `409`: Email already exists

---

#### POST /auth/login
Authenticate existing user.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "usr_123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "subscriptionStatus": "active",
    "subscriptionPlan": "yearly",
    "trialEndsAt": null,
    "createdAt": "2025-11-23T00:00:00Z"
  },
  "token": "eyJhbGc...",
  "refreshToken": "refresh_token_here"
}
```

**Errors**:
- `401`: Invalid credentials
- `404`: User not found

---

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body**:
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response** (200 OK):
```json
{
  "token": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

**Errors**:
- `401`: Invalid or expired refresh token

---

#### POST /auth/logout
Invalidate current tokens.

**Headers**: `Authorization: Bearer {token}`

**Response** (204 No Content)

---

#### POST /auth/forgot-password
Request password reset email.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset email sent"
}
```

---

#### POST /auth/reset-password
Reset password using token from email.

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "password": "new_password"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset successful"
}
```

---

### User Endpoints

#### GET /user/profile
Get current user profile.

**Headers**: `Authorization: Bearer {token}`

**Response** (200 OK):
```json
{
  "id": "usr_123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "subscriptionStatus": "active",
  "subscriptionPlan": "yearly",
  "trialEndsAt": null,
  "createdAt": "2025-11-23T00:00:00Z",
  "updatedAt": "2025-11-24T00:00:00Z"
}
```

---

#### PUT /user/profile
Update user profile.

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "displayName": "Jane Doe"
}
```

**Response** (200 OK):
```json
{
  "id": "usr_123",
  "email": "user@example.com",
  "displayName": "Jane Doe",
  ...
}
```

---

#### DELETE /user/delete
Delete user account and all data.

**Headers**: `Authorization: Bearer {token}`

**Response** (204 No Content)

---

### Receipt Endpoints

#### POST /receipts/upload
Upload receipt image for storage.

**Headers**:
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Form Data**:
- `file`: Image file (JPEG, PNG)

**Response** (200 OK):
```json
{
  "imageUrl": "https://cdn.cukaipal.com/receipts/usr_123/receipt_abc.jpg",
  "fileSize": 245678,
  "mimeType": "image/jpeg"
}
```

**Errors**:
- `400`: Invalid file format
- `413`: File too large (max 10MB)
- `402`: Subscription required

---

#### POST /receipts/ocr
Process receipt image with AI OCR.

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "imageUrl": "https://cdn.cukaipal.com/receipts/usr_123/receipt_abc.jpg",
  "year": 2025,
  "subcategories": [
    "lifestyle_books (Books / Journals)",
    "lifestyle_tech (PC / Smartphone / Tablet)",
    "medical_checkup (Full Checkup / Mental)"
  ]
}
```

**Response** (200 OK):
```json
{
  "amount": 150.00,
  "date": "2025-11-15",
  "description": "Apple MacBook Air 13-inch",
  "subCategory": "lifestyle_tech",
  "reason": "Purchase of personal computer for non-business use, eligible under Lifestyle relief category",
  "confidence": 0.95
}
```

**Response for ineligible receipt**:
```json
{
  "amount": 50.00,
  "date": "2025-11-15",
  "description": "Restaurant dinner",
  "subCategory": "ineligible",
  "reason": "Food and beverage expenses are not eligible for tax relief under LHDN guidelines",
  "confidence": 0.98
}
```

**Errors**:
- `400`: Invalid image URL or parameters
- `402`: Subscription required or quota exceeded
- `429`: Rate limit exceeded (10 requests/minute)

---

#### GET /receipts
List all receipts for authenticated user.

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `year` (optional): Filter by year
- `status` (optional): Filter by status (pending, verified, analyzing, review)
- `limit` (optional, default: 100): Number of results
- `offset` (optional, default: 0): Pagination offset

**Response** (200 OK):
```json
{
  "receipts": [
    {
      "id": "rct_123",
      "userId": "usr_123",
      "status": "verified",
      "amount": 150.00,
      "description": "Apple MacBook Air 13-inch",
      "category": "lifestyle",
      "subCategory": "lifestyle_tech",
      "date": "2025-11-15",
      "fileUri": "https://cdn.cukaipal.com/receipts/usr_123/receipt_abc.jpg",
      "createdAt": "2025-11-16T00:00:00Z",
      "updatedAt": "2025-11-16T00:00:00Z"
    }
  ],
  "total": 45,
  "limit": 100,
  "offset": 0
}
```

---

#### POST /receipts
Create a new receipt.

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "id": "rct_123",
  "status": "verified",
  "amount": 150.00,
  "description": "Apple MacBook Air 13-inch",
  "category": "lifestyle",
  "subCategory": "lifestyle_tech",
  "date": "2025-11-15",
  "fileUri": "https://cdn.cukaipal.com/receipts/usr_123/receipt_abc.jpg"
}
```

**Response** (201 Created):
```json
{
  "id": "rct_123",
  "userId": "usr_123",
  ...
}
```

---

#### PUT /receipts/:id
Update existing receipt.

**Headers**: `Authorization: Bearer {token}`

**Request Body**: Same as POST /receipts

**Response** (200 OK): Updated receipt object

---

#### DELETE /receipts/:id
Delete receipt.

**Headers**: `Authorization: Bearer {token}`

**Response** (204 No Content)

---

### Sync Endpoints

#### POST /sync/pull
Pull changes from server since last sync.

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "lastSync": "2025-11-23T10:00:00Z"
}
```

**Response** (200 OK):
```json
{
  "receipts": [...],
  "incomeMap": {
    "2025": {
      "gross": 80000,
      "dividends": 5000,
      "other": 2000
    }
  },
  "userProfile": {
    "displayName": "John Doe",
    "status": "married",
    "spouseWorking": false,
    "selfDisabled": false,
    "kidsUnder18": 2,
    ...
  },
  "serverTimestamp": "2025-11-23T12:00:00Z"
}
```

---

#### POST /sync/push
Push local changes to server.

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "receipts": [...],
  "incomeMap": {...},
  "userProfile": {...}
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "synced": {
    "receipts": 45,
    "incomeMap": true,
    "userProfile": true
  },
  "serverTimestamp": "2025-11-23T12:00:00Z"
}
```

---

### Subscription Endpoints

#### GET /subscription/status
Get current subscription status.

**Headers**: `Authorization: Bearer {token}`

**Response** (200 OK):
```json
{
  "status": "active",
  "plan": "yearly",
  "startDate": "2025-11-01T00:00:00Z",
  "renewalDate": "2026-11-01T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "features": {
    "maxReceipts": -1,
    "cloudSync": true,
    "ocrLimit": -1,
    "prioritySupport": true
  }
}
```

**Status values**:
- `trial`: In 7-day trial period
- `active`: Active paid subscription
- `expired`: Subscription expired
- `cancelled`: Cancelled but still active until period end
- `none`: No subscription

---

#### GET /subscription/plans
Get available subscription plans and pricing.

**Response** (200 OK):
```json
{
  "plans": [
    {
      "id": "cukaipal_monthly",
      "name": "Monthly",
      "price": 9.90,
      "currency": "MYR",
      "interval": "month",
      "features": [...]
    },
    {
      "id": "cukaipal_yearly",
      "name": "Yearly",
      "price": 99.00,
      "currency": "MYR",
      "interval": "year",
      "features": [...]
    },
    {
      "id": "cukaipal_lifetime",
      "name": "Lifetime",
      "price": 299.00,
      "currency": "MYR",
      "interval": "lifetime",
      "features": [...]
    }
  ]
}
```

---

#### POST /subscription/checkout
Create subscription checkout session (for web payments).

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "planId": "cukaipal_yearly"
}
```

**Response** (200 OK):
```json
{
  "checkoutUrl": "https://checkout.cukaipal.com/session_123",
  "sessionId": "session_123"
}
```

---

#### POST /subscription/cancel
Cancel subscription (remains active until period end).

**Headers**: `Authorization: Bearer {token}`

**Response** (200 OK):
```json
{
  "status": "cancelled",
  "activeUntil": "2026-11-01T00:00:00Z"
}
```

---

#### POST /subscription/restore
Restore subscription from app store purchase.

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "platform": "ios",
  "receiptData": "base64_encoded_receipt"
}
```

**Response** (200 OK):
```json
{
  "status": "active",
  "plan": "yearly",
  "renewalDate": "2026-11-01T00:00:00Z"
}
```

---

## Data Models

### User
```typescript
{
  id: string;
  email: string;
  displayName: string;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'cancelled' | 'none';
  subscriptionPlan?: 'monthly' | 'yearly' | 'lifetime';
  trialEndsAt?: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
}
```

### Receipt
```typescript
{
  id: string;
  userId: string;
  status: 'pending' | 'analyzing' | 'review' | 'verified';
  amount: number;
  description: string;
  category: string;
  subCategory: string;
  date: string; // YYYY-MM-DD
  fileUri?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Income Map
```typescript
{
  [year: number]: {
    gross: number;
    dividends: number;
    other: number;
  }
}
```

### User Profile
```typescript
{
  displayName: string;
  status: 'single' | 'married';
  spouseWorking: boolean;
  spouseDisabled: boolean;
  selfDisabled: boolean;
  kidsUnder18: number;
  kidsPreU: number;
  kidsDegree: number;
  kidsDisabled: number;
  kidsDisabledDiploma: number;
  zakat: number;
  donations: number;
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {}
  }
}
```

### Standard Error Codes

- `INVALID_CREDENTIALS`: Authentication failed
- `TOKEN_EXPIRED`: JWT token expired
- `SUBSCRIPTION_REQUIRED`: Feature requires active subscription
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_INPUT`: Validation error
- `NOT_FOUND`: Resource not found
- `SERVER_ERROR`: Internal server error

---

## Rate Limiting

- **OCR Endpoint**: 10 requests/minute per user
- **Auth Endpoints**: 5 requests/minute per IP
- **General APIs**: 100 requests/minute per user

Rate limit headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1638360000
```

---

## Implementation Notes

### Technology Recommendations

**Backend Stack**:
- Node.js + Express or NestJS
- PostgreSQL (primary database)
- Redis (caching, rate limiting, sessions)
- AWS S3 or Cloudflare R2 (file storage)
- Gemini API (OCR processing)

**Infrastructure**:
- Vercel, Railway, or AWS (hosting)
- Cloudflare (CDN)
- Sentry (error tracking)
- LogRocket (user session replay)

### Security Considerations

1. **Password Hashing**: Use bcrypt with salt rounds >= 12
2. **JWT Secrets**: Use strong, rotating secrets
3. **File Upload**: Scan for malware, enforce size limits
4. **Rate Limiting**: Implement per-user and per-IP limits
5. **Input Validation**: Sanitize all inputs
6. **CORS**: Whitelist mobile app origins only

### Subscription Integration

**RevenueCat** (Recommended):
- Handles iOS and Android subscriptions
- Webhook to update user subscription status
- Endpoint: `POST /webhooks/revenuecat`

**Alternative**: Stripe
- Web-based checkout for direct sales
- Webhook: `POST /webhooks/stripe`

### OCR Implementation

```javascript
// Example Gemini API integration
const processReceipt = async (imageUrl, subcategories) => {
  const prompt = `
    You are a strict LHDN tax auditor. Analyze this receipt image.

    Extract:
    - Amount (number)
    - Date (YYYY-MM-DD)
    - Description (string)
    - Match to one of these categories: ${subcategories.join(', ')}
    - If not eligible, use "ineligible"
    - Provide reason for your decision

    Return JSON: { amount, date, description, subCategory, reason }
  `;

  const response = await geminiAPI.generateContent({
    model: 'gemini-2.5-flash-preview',
    contents: [
      { type: 'text', text: prompt },
      { type: 'image', url: imageUrl }
    ],
    generationConfig: { responseMimeType: 'application/json' }
  });

  return JSON.parse(response.text);
};
```

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  subscription_status VARCHAR(20) DEFAULT 'none',
  subscription_plan VARCHAR(20),
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Receipts table
CREATE TABLE receipts (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  amount DECIMAL(10, 2),
  description TEXT,
  category VARCHAR(50),
  sub_category VARCHAR(50),
  date DATE,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User data table (for incomeMap and userProfile)
CREATE TABLE user_data (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  income_map JSONB DEFAULT '{}',
  profile JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_date ON receipts(date);
CREATE INDEX idx_receipts_status ON receipts(status);
```

---

## Testing

### Sample cURL Commands

```bash
# Register
curl -X POST https://api.cukaipal.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User"
  }'

# Login
curl -X POST https://api.cukaipal.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get profile
curl -X GET https://api.cukaipal.com/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Upload receipt
curl -X POST https://api.cukaipal.com/api/receipts/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@receipt.jpg"

# Process with OCR
curl -X POST https://api.cukaipal.com/api/receipts/ocr \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://cdn.cukaipal.com/receipts/usr_123/receipt.jpg",
    "year": 2025,
    "subcategories": ["lifestyle_tech (PC / Smartphone / Tablet)"]
  }'
```

---

## Revenue Model

### Pricing Strategy

**Monthly**: RM 9.90/month
- ~3 cups of coffee
- Entry point for casual users

**Yearly**: RM 99/year (17% savings)
- Most popular
- Better value proposition
- Higher customer lifetime value

**Lifetime**: RM 299 one-time
- Premium option
- No recurring revenue but higher upfront
- Appeals to long-term users

### Free Trial

- 7 days full access
- No credit card required initially
- Convert to paid after trial
- Gentle reminders at day 5, 6, 7

---

## Next Steps

1. **Backend Development**: Implement API using this spec
2. **Database Setup**: Create PostgreSQL schema
3. **File Storage**: Set up S3/R2 bucket
4. **Gemini API**: Integrate OCR processing
5. **RevenueCat**: Configure subscription products
6. **Testing**: Create test suite for all endpoints
7. **Documentation**: API docs with Swagger/OpenAPI
8. **Deployment**: Deploy to production
9. **Monitoring**: Set up logging and alerts

---

**Questions?** Contact the development team for clarifications or adjustments to this specification.
