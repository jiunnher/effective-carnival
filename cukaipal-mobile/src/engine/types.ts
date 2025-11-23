// --- TYPE DEFINITIONS ---

export type ReceiptStatus = 'pending' | 'analyzing' | 'review' | 'verified';

export type MaritalStatus = 'single' | 'married';

export interface Receipt {
  id: string;
  status: ReceiptStatus;
  amount: number;
  description: string;
  category: string;
  subCategory: string;
  date: string; // YYYY-MM-DD format
  fileUri?: string; // File URI for React Native (instead of base64 fileData)
}

export interface UserProfile {
  displayName: string;
  status: MaritalStatus;
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
  alimony?: boolean;
}

export interface YearIncome {
  gross: number;
  dividends: number;
  other: number;
}

export interface DeductibleItem {
  id: string;
  label: string;
  parent: string;
  subLimit?: number;
}

export interface SharedPool {
  limit: number;
  items: string[];
  used?: number;
}

export interface CategoryConfig {
  id: string;
  title: string;
  limit: number;
  color: string;
  icon: string;
  items: DeductibleItem[];
  sharedPools?: SharedPool[];
  advice: string;
  details?: string;
  isAutomatic?: boolean;
}

export interface CategoryStats {
  claimable: number;
  remaining: number;
  percent: number;
  totalSpent: number;
  isAutomatic?: boolean;
}

export interface TaxBracket {
  max: number;
  rate: number;
}

export interface TaxStats {
  totalClaimable: number;
  catStats: { [categoryId: string]: CategoryStats };
}
