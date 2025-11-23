import { TaxBracket } from './types';

/**
 * Year-specific tax configurations
 * Each year can have different brackets, limits, and rules
 */

export interface YearTaxConfig {
  year: number;
  filingDeadline: string;
  taxBrackets: TaxBracket[];
  categoryLimits: {
    lifestyle: number;
    sports: number;
    medical: number;
    medicalParents: number;
    educationSelf: number;
    insuranceEdMed: number;
    prs: number;
    sspn: number;
    childcare: number;
    breastfeeding: number;
    disabledEquip: number;
    ev: number;
    socso: number;
    lifeInsurance: number;
    spouse: number;
    disabledSelf: number;
    disabledSpouse: number;
    childU18: number;
    childPreU: number;
    childDegree: number;
    childDisabled: number;
    childDisabledDiploma: number;
  };
  features: {
    hasSportsSeparate: boolean; // Sports separated from lifestyle
    hasDental: boolean; // Dental in medical
    hasChildDev: boolean; // Child development in medical
    hasEvCharging: boolean; // EV charging facility
    medicalSharedPoolLimit: number; // Checkup/vax/dental shared limit
  };
}

/**
 * Tax configuration for each year
 * Add new years here when LHDN announces changes
 */
export const YEAR_CONFIGS: { [year: number]: YearTaxConfig } = {
  // Year Assessment 2025 (Current)
  2025: {
    year: 2025,
    filingDeadline: '2026-05-15',
    taxBrackets: [
      { max: 5000, rate: 0 },
      { max: 20000, rate: 0.01 },
      { max: 35000, rate: 0.03 },
      { max: 50000, rate: 0.06 },
      { max: 70000, rate: 0.11 },
      { max: 100000, rate: 0.19 },
      { max: 400000, rate: 0.25 },
      { max: 600000, rate: 0.26 },
      { max: 2000000, rate: 0.28 },
      { max: Infinity, rate: 0.3 },
    ],
    categoryLimits: {
      lifestyle: 2500,
      sports: 1000,
      medical: 10000,
      medicalParents: 8000,
      educationSelf: 7000,
      insuranceEdMed: 3000,
      prs: 3000,
      sspn: 8000,
      childcare: 3000,
      breastfeeding: 1000,
      disabledEquip: 6000,
      ev: 2500,
      socso: 350,
      lifeInsurance: 7000,
      spouse: 4000,
      disabledSelf: 6000,
      disabledSpouse: 5000,
      childU18: 2000,
      childPreU: 2000,
      childDegree: 8000,
      childDisabled: 6000,
      childDisabledDiploma: 14000,
    },
    features: {
      hasSportsSeparate: true,
      hasDental: true,
      hasChildDev: true,
      hasEvCharging: true,
      medicalSharedPoolLimit: 1000,
    },
  },

  // Year Assessment 2024
  2024: {
    year: 2024,
    filingDeadline: '2025-05-15',
    taxBrackets: [
      { max: 5000, rate: 0 },
      { max: 20000, rate: 0.01 },
      { max: 35000, rate: 0.03 },
      { max: 50000, rate: 0.06 },
      { max: 70000, rate: 0.11 },
      { max: 100000, rate: 0.19 },
      { max: 400000, rate: 0.25 },
      { max: 600000, rate: 0.26 },
      { max: 2000000, rate: 0.28 },
      { max: Infinity, rate: 0.3 },
    ],
    categoryLimits: {
      lifestyle: 2500,
      sports: 1000,
      medical: 10000,
      medicalParents: 8000,
      educationSelf: 7000,
      insuranceEdMed: 3000,
      prs: 3000,
      sspn: 8000,
      childcare: 3000,
      breastfeeding: 1000,
      disabledEquip: 6000,
      ev: 2500,
      socso: 350,
      lifeInsurance: 7000,
      spouse: 4000,
      disabledSelf: 6000,
      disabledSpouse: 5000,
      childU18: 2000,
      childPreU: 2000,
      childDegree: 8000,
      childDisabled: 6000,
      childDisabledDiploma: 14000,
    },
    features: {
      hasSportsSeparate: true,
      hasDental: true,
      hasChildDev: true,
      hasEvCharging: true,
      medicalSharedPoolLimit: 1000,
    },
  },

  // Year Assessment 2023
  2023: {
    year: 2023,
    filingDeadline: '2024-05-15',
    taxBrackets: [
      { max: 5000, rate: 0 },
      { max: 20000, rate: 0.01 },
      { max: 35000, rate: 0.03 },
      { max: 50000, rate: 0.06 },
      { max: 70000, rate: 0.11 },
      { max: 100000, rate: 0.19 },
      { max: 400000, rate: 0.25 },
      { max: 600000, rate: 0.26 },
      { max: 2000000, rate: 0.28 },
      { max: Infinity, rate: 0.3 },
    ],
    categoryLimits: {
      lifestyle: 2500,
      sports: 0, // Not separate in 2023
      medical: 10000, // Increased from 8000 in 2023
      medicalParents: 8000,
      educationSelf: 7000,
      insuranceEdMed: 3000,
      prs: 3000,
      sspn: 8000,
      childcare: 3000,
      breastfeeding: 1000,
      disabledEquip: 6000,
      ev: 2500,
      socso: 350,
      lifeInsurance: 7000,
      spouse: 4000,
      disabledSelf: 6000,
      disabledSpouse: 5000,
      childU18: 2000,
      childPreU: 2000,
      childDegree: 8000,
      childDisabled: 6000,
      childDisabledDiploma: 14000,
    },
    features: {
      hasSportsSeparate: false,
      hasDental: false,
      hasChildDev: true, // Added in 2023
      hasEvCharging: true,
      medicalSharedPoolLimit: 1000,
    },
  },

  // Year Assessment 2022
  2022: {
    year: 2022,
    filingDeadline: '2023-05-15',
    taxBrackets: [
      { max: 5000, rate: 0 },
      { max: 20000, rate: 0.01 },
      { max: 35000, rate: 0.03 },
      { max: 50000, rate: 0.08 },
      { max: 70000, rate: 0.13 },
      { max: 100000, rate: 0.21 },
      { max: 250000, rate: 0.24 },
      { max: 400000, rate: 0.245 },
      { max: 600000, rate: 0.25 },
      { max: 1000000, rate: 0.26 },
      { max: Infinity, rate: 0.28 },
    ],
    categoryLimits: {
      lifestyle: 2500,
      sports: 0,
      medical: 8000,
      medicalParents: 8000,
      educationSelf: 7000,
      insuranceEdMed: 3000,
      prs: 3000,
      sspn: 8000,
      childcare: 3000,
      breastfeeding: 1000,
      disabledEquip: 6000,
      ev: 2500,
      socso: 350,
      lifeInsurance: 7000,
      spouse: 4000,
      disabledSelf: 6000,
      disabledSpouse: 5000,
      childU18: 2000,
      childPreU: 2000,
      childDegree: 8000,
      childDisabled: 6000,
      childDisabledDiploma: 14000,
    },
    features: {
      hasSportsSeparate: false,
      hasDental: false,
      hasChildDev: false,
      hasEvCharging: true,
      medicalSharedPoolLimit: 1000,
    },
  },

  // Year Assessment 2021
  2021: {
    year: 2021,
    filingDeadline: '2022-05-15',
    taxBrackets: [
      { max: 5000, rate: 0 },
      { max: 20000, rate: 0.01 },
      { max: 35000, rate: 0.03 },
      { max: 50000, rate: 0.08 },
      { max: 70000, rate: 0.13 },
      { max: 100000, rate: 0.21 },
      { max: 250000, rate: 0.24 },
      { max: 400000, rate: 0.245 },
      { max: 600000, rate: 0.25 },
      { max: 1000000, rate: 0.26 },
      { max: Infinity, rate: 0.28 },
    ],
    categoryLimits: {
      lifestyle: 2500,
      sports: 500, // Extra sports relief in 2021
      medical: 8000,
      medicalParents: 8000,
      educationSelf: 7000,
      insuranceEdMed: 3000,
      prs: 3000,
      sspn: 8000,
      childcare: 3000,
      breastfeeding: 1000,
      disabledEquip: 6000,
      ev: 0, // Not available before 2022
      socso: 350,
      lifeInsurance: 7000,
      spouse: 4000,
      disabledSelf: 6000,
      disabledSpouse: 5000,
      childU18: 2000,
      childPreU: 2000,
      childDegree: 8000,
      childDisabled: 6000,
      childDisabledDiploma: 14000,
    },
    features: {
      hasSportsSeparate: false,
      hasDental: false,
      hasChildDev: false,
      hasEvCharging: false,
      medicalSharedPoolLimit: 1000,
    },
  },

  // Year Assessment 2020
  2020: {
    year: 2020,
    filingDeadline: '2021-05-15',
    taxBrackets: [
      { max: 5000, rate: 0 },
      { max: 20000, rate: 0.01 },
      { max: 35000, rate: 0.03 },
      { max: 50000, rate: 0.08 },
      { max: 70000, rate: 0.13 },
      { max: 100000, rate: 0.21 },
      { max: 250000, rate: 0.24 },
      { max: 400000, rate: 0.245 },
      { max: 600000, rate: 0.25 },
      { max: 1000000, rate: 0.26 },
      { max: Infinity, rate: 0.28 },
    ],
    categoryLimits: {
      lifestyle: 2500,
      sports: 0,
      medical: 8000,
      medicalParents: 8000,
      educationSelf: 7000,
      insuranceEdMed: 3000,
      prs: 3000,
      sspn: 8000,
      childcare: 3000,
      breastfeeding: 1000,
      disabledEquip: 6000,
      ev: 0,
      socso: 350,
      lifeInsurance: 7000,
      spouse: 4000,
      disabledSelf: 6000,
      disabledSpouse: 5000,
      childU18: 2000,
      childPreU: 2000,
      childDegree: 8000,
      childDisabled: 6000,
      childDisabledDiploma: 14000,
    },
    features: {
      hasSportsSeparate: false,
      hasDental: false,
      hasChildDev: false,
      hasEvCharging: false,
      medicalSharedPoolLimit: 1000,
    },
  },

  // Year Assessment 2019
  2019: {
    year: 2019,
    filingDeadline: '2020-05-15',
    taxBrackets: [
      { max: 5000, rate: 0 },
      { max: 20000, rate: 0.01 },
      { max: 35000, rate: 0.03 },
      { max: 50000, rate: 0.08 },
      { max: 70000, rate: 0.13 },
      { max: 100000, rate: 0.21 },
      { max: 250000, rate: 0.24 },
      { max: 400000, rate: 0.245 },
      { max: 600000, rate: 0.25 },
      { max: 1000000, rate: 0.26 },
      { max: Infinity, rate: 0.28 },
    ],
    categoryLimits: {
      lifestyle: 2500,
      sports: 0,
      medical: 8000,
      medicalParents: 8000,
      educationSelf: 7000,
      insuranceEdMed: 3000,
      prs: 3000,
      sspn: 8000,
      childcare: 3000,
      breastfeeding: 1000,
      disabledEquip: 6000,
      ev: 0,
      socso: 350,
      lifeInsurance: 7000,
      spouse: 4000,
      disabledSelf: 6000,
      disabledSpouse: 5000,
      childU18: 2000,
      childPreU: 2000,
      childDegree: 8000,
      childDisabled: 6000,
      childDisabledDiploma: 14000,
    },
    features: {
      hasSportsSeparate: false,
      hasDental: false,
      hasChildDev: false,
      hasEvCharging: false,
      medicalSharedPoolLimit: 1000,
    },
  },
};

/**
 * Get tax configuration for a specific year
 * Falls back to most recent year if requested year not found
 */
export const getYearTaxConfig = (year: number): YearTaxConfig => {
  if (YEAR_CONFIGS[year]) {
    return YEAR_CONFIGS[year];
  }

  // Fallback to most recent year if requested year not configured
  const years = Object.keys(YEAR_CONFIGS)
    .map(Number)
    .sort((a, b) => b - a);

  const fallbackYear = year > years[0] ? years[0] : years[years.length - 1];

  console.warn(
    `Tax config for year ${year} not found. Using ${fallbackYear} config as fallback.`
  );

  return YEAR_CONFIGS[fallbackYear];
};

/**
 * Get list of all supported tax years
 */
export const getSupportedYears = (): number[] => {
  return Object.keys(YEAR_CONFIGS)
    .map(Number)
    .sort((a, b) => b - a);
};

/**
 * Get filing deadline for a year
 */
export const getFilingDeadline = (year: number): string => {
  return getYearTaxConfig(year).filingDeadline;
};

/**
 * Get tax brackets for a year
 */
export const getTaxBrackets = (year: number): TaxBracket[] => {
  return getYearTaxConfig(year).taxBrackets;
};

/**
 * Get category limits for a year
 */
export const getCategoryLimits = (year: number) => {
  return getYearTaxConfig(year).categoryLimits;
};

/**
 * Get features available for a year
 */
export const getYearFeatures = (year: number) => {
  return getYearTaxConfig(year).features;
};

/**
 * Template for adding new year (copy this when LHDN announces new rules)
 */
export const YEAR_TEMPLATE: YearTaxConfig = {
  year: 2026, // Update this
  filingDeadline: '2027-05-15', // Update this
  taxBrackets: [
    // Copy from previous year or update if changed
    { max: 5000, rate: 0 },
    { max: 20000, rate: 0.01 },
    { max: 35000, rate: 0.03 },
    { max: 50000, rate: 0.06 },
    { max: 70000, rate: 0.11 },
    { max: 100000, rate: 0.19 },
    { max: 400000, rate: 0.25 },
    { max: 600000, rate: 0.26 },
    { max: 2000000, rate: 0.28 },
    { max: Infinity, rate: 0.3 },
  ],
  categoryLimits: {
    // Update limits that changed
    lifestyle: 2500,
    sports: 1000,
    medical: 10000,
    medicalParents: 8000,
    educationSelf: 7000,
    insuranceEdMed: 3000,
    prs: 3000,
    sspn: 8000,
    childcare: 3000,
    breastfeeding: 1000,
    disabledEquip: 6000,
    ev: 2500,
    socso: 350,
    lifeInsurance: 7000,
    spouse: 4000,
    disabledSelf: 6000,
    disabledSpouse: 5000,
    childU18: 2000,
    childPreU: 2000,
    childDegree: 8000,
    childDisabled: 6000,
    childDisabledDiploma: 14000,
  },
  features: {
    // Update features that changed
    hasSportsSeparate: true,
    hasDental: true,
    hasChildDev: true,
    hasEvCharging: true,
    medicalSharedPoolLimit: 1000,
  },
};
