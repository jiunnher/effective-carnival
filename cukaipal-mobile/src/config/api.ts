/**
 * API Configuration
 *
 * IMPORTANT: Replace these with your actual backend URLs
 */

// Development
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'  // Local development
  : 'https://api.cukaipal.com/api';  // Production

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // User
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    DELETE_ACCOUNT: '/user/delete',
  },

  // Receipts
  RECEIPTS: {
    LIST: '/receipts',
    GET: (id: string) => `/receipts/${id}`,
    CREATE: '/receipts',
    UPDATE: (id: string) => `/receipts/${id}`,
    DELETE: (id: string) => `/receipts/${id}`,
    OCR: '/receipts/ocr',
    UPLOAD_IMAGE: '/receipts/upload',
  },

  // Data Sync
  SYNC: {
    PULL: '/sync/pull',
    PUSH: '/sync/push',
    FULL_SYNC: '/sync/full',
  },

  // Subscription
  SUBSCRIPTION: {
    STATUS: '/subscription/status',
    PLANS: '/subscription/plans',
    CREATE_CHECKOUT: '/subscription/checkout',
    CANCEL: '/subscription/cancel',
    RESTORE: '/subscription/restore',
  },
};

// RevenueCat Configuration
export const REVENUECAT_API_KEY = {
  ios: 'your_ios_api_key_here',
  android: 'your_android_api_key_here',
};

// Subscription Product IDs
export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: 'cukaipal_monthly',
  YEARLY: 'cukaipal_yearly',
};

// Feature flags
export const FEATURES = {
  CLOUD_SYNC: true,
  OCR_BACKEND: true,
  OFFLINE_MODE: true,
};
