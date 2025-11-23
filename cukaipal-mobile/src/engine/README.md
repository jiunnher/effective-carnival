# CukaiPal Tax Engine

Pure TypeScript tax calculation engine for Malaysian income tax (LHDN rules).

## Architecture

The tax engine is designed with **clean architecture** principles:

- **Pure functions**: No side effects, testable calculations
- **No external dependencies**: Engine doesn't depend on React Native or UI
- **Year-based configuration**: Easy to update for new tax years
- **Type-safe**: Full TypeScript coverage

## Files

### `types.ts`
TypeScript interfaces and types for all tax-related data structures.

### `yearConfigs.ts` ⭐ **NEW**
Centralized configuration for all year-specific tax rules:
- Tax brackets per year
- Category limits per year
- Feature flags per year (which reliefs are available)

**This is where you update when new tax years are announced.**

### `taxEngine.ts`
Core tax calculation logic:
- `getYearConfig()`: Returns available relief categories for a specific year
- `calculateProgressiveTax()`: Calculates income tax based on progressive brackets
- `computeCategoryData()`: Calculates claimable amounts from receipts

### `TAX_YEAR_UPDATE_GUIDE.md`
Step-by-step guide for updating the app when LHDN announces new tax rules.

## How to Update for New Tax Years

**Quick Start:**

1. Open `yearConfigs.ts`
2. Copy the most recent year's config (e.g., 2025)
3. Paste it as a new year (e.g., 2026)
4. Update the limits that changed
5. Update feature flags if new reliefs added
6. Done! ✅

**Example:**

```typescript
// In yearConfigs.ts
export const YEAR_CONFIGS: { [year: number]: YearTaxConfig } = {
  // Add new year
  2026: {
    year: 2026,
    filingDeadline: '2027-05-15',
    taxBrackets: [ /* copy from 2025 or update if changed */ ],
    categoryLimits: {
      lifestyle: 3000,    // Changed from 2500
      sports: 1000,
      medical: 12000,     // Changed from 10000
      // ... rest same as 2025
    },
    features: {
      hasSportsSeparate: true,
      hasDental: true,
      hasChildDev: true,
      hasEvCharging: true,
      medicalSharedPoolLimit: 1500,  // Changed from 1000
    },
  },

  // Keep all previous years (2025, 2024, etc.)
  2025: { /* existing config */ },
  2024: { /* existing config */ },
  // ...
};
```

**That's it!** The tax engine will automatically use the new limits for 2026 calculations.

## Benefits of This Architecture

### ✅ Before (Old Way)
```typescript
// Scattered conditional logic
const medLimit = year >= 2023 ? 10000 : 8000;
if (year >= 2024) {
  // add dental
}
if (year >= 2023) {
  // add child dev
}
```

**Problems:**
- Conditional logic scattered throughout code
- Hard to see all limits for a specific year
- Easy to miss updates
- Difficult to test specific years

### ✅ After (New Way)
```typescript
// Centralized configuration
const limits = getCategoryLimits(year);
const features = getYearFeatures(year);

// Use them
limit: limits.medical,
if (features.hasDental) { /* add dental */ }
```

**Benefits:**
- All year-specific data in one place (`yearConfigs.ts`)
- Easy to see complete picture for each year
- Easy to add new years (copy & modify)
- Easy to test (mock specific year configs)
- Maintainable long-term

## Usage Examples

### Getting tax brackets for a year
```typescript
import { getTaxBrackets, calculateProgressiveTax } from './taxEngine';

const brackets = getTaxBrackets(2024);
const tax = calculateProgressiveTax(100000, 2024);
```

### Getting category configs for a year
```typescript
import { getYearConfig } from './taxEngine';

const profile = {
  status: 'married',
  spouseWorking: false,
  kidsUnder18: 2,
  // ... other fields
};

const categories = getYearConfig(2024, profile);
// Returns all available relief categories for 2024
```

### Getting category limits
```typescript
import { getCategoryLimits } from './yearConfigs';

const limits = getCategoryLimits(2024);
console.log(limits.medical);     // 10000
console.log(limits.lifestyle);   // 2500
```

### Checking year features
```typescript
import { getYearFeatures } from './yearConfigs';

const features = getYearFeatures(2024);
console.log(features.hasDental);          // true
console.log(features.hasSportsSeparate);  // true
console.log(features.hasEvCharging);      // true
```

## Testing

The tax engine is pure functions, making it easy to test:

```typescript
import { calculateProgressiveTax, getYearConfig } from './taxEngine';

describe('Tax Calculations', () => {
  test('2024 tax calculation', () => {
    const tax = calculateProgressiveTax(100000, 2024);
    expect(tax).toBe(/* expected amount */);
  });

  test('Medical limit increased in 2023', () => {
    const limits2022 = getCategoryLimits(2022);
    const limits2023 = getCategoryLimits(2023);

    expect(limits2022.medical).toBe(8000);
    expect(limits2023.medical).toBe(10000);
  });

  test('Dental added in 2024', () => {
    const features2023 = getYearFeatures(2023);
    const features2024 = getYearFeatures(2024);

    expect(features2023.hasDental).toBe(false);
    expect(features2024.hasDental).toBe(true);
  });
});
```

## Backward Compatibility

**Important:** The engine maintains historical accuracy.

Users can still view/file taxes for previous years (2023, 2024, etc.), and the calculations will use the correct rules for that specific year.

```typescript
// Different years = different calculations
calculateProgressiveTax(100000, 2022); // Uses 2022 brackets
calculateProgressiveTax(100000, 2024); // Uses 2024 brackets
```

## Year Configuration Template

Use this template when adding a new year:

```typescript
2026: {
  year: 2026,
  filingDeadline: '2027-05-15',
  taxBrackets: [
    { max: 5000, rate: 0 },
    { max: 20000, rate: 0.01 },
    // ... complete bracket structure
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
```

## Resources

- **LHDN Official Site:** https://www.hasil.gov.my
- **Tax Relief Guide:** https://www.hasil.gov.my/media/y0rpr0ub/tax_relief_ya_2024.pdf
- **Update Guide:** See `TAX_YEAR_UPDATE_GUIDE.md`

---

**Last Updated:** January 2025
**Current Supported Years:** 2019-2025
**Next Update:** Add 2026 config when Budget 2026 is announced (Nov 2025)
