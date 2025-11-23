# Tax Year Update Guide

This guide explains how to update CukaiPal for new Malaysian tax years when LHDN announces rule changes.

## Annual Update Checklist

When LHDN announces tax changes (typically in October/November budget):

- [ ] Update `CURRENT_YEAR` constant
- [ ] Add new year to `YA_YEARS` array
- [ ] Add filing deadline for new year
- [ ] Review and update tax brackets if changed
- [ ] Update category limits (medical, lifestyle, etc.)
- [ ] Add any new relief categories
- [ ] Remove/deprecate discontinued reliefs
- [ ] Update category descriptions if rules changed
- [ ] Test calculations with sample data
- [ ] Update user-facing documentation

## Step-by-Step: Updating for 2026

### 1. Monitor LHDN Announcements

**When:** October-November (Budget announcement)
**Where:**
- https://www.hasil.gov.my
- Budget 2026 announcement
- LHDN circulars

**What to look for:**
- Changes to tax brackets/rates
- New relief categories
- Changes to relief limits
- Discontinued/sunset reliefs
- New qualifying expenses

### 2. Update Core Constants

**File:** `src/engine/taxEngine.ts`

```typescript
// Line 12: Update current year
export const CURRENT_YEAR = 2026;

// Line 14: Add new year to supported years
export const YA_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020];

// Line 16: Add filing deadline
export const FILING_DEADLINES: { [year: number]: string } = {
  2026: '2027-05-15', // Typically April 30 or May 15
  2025: '2026-05-15',
  // ... keep historical years
};
```

### 3. Update Tax Brackets

**If tax brackets change (major change):**

```typescript
// Line 26: Add new bracket set
export const TAX_BRACKETS: { [key: string]: TaxBracket[] } = {
  post_2026: [ // New bracket structure
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
  post_2023: [ /* keep for historical data */ ],
  pre_2023: [ /* keep for historical data */ ],
};

// Line 413: Update tax calculation function
export const calculateProgressiveTax = (chargeableIncome: number, year: number): number => {
  if (chargeableIncome <= 5000) return 0;

  let brackets;
  if (year >= 2026) {
    brackets = TAX_BRACKETS['post_2026'];
  } else if (year >= 2023) {
    brackets = TAX_BRACKETS['post_2023'];
  } else {
    brackets = TAX_BRACKETS['pre_2023'];
  }

  let tax = 0;
  let previousMax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    if (chargeableIncome > previousMax) {
      const taxableInThisBracket = Math.min(chargeableIncome, b.max) - previousMax;
      tax += taxableInThisBracket * b.rate;
      previousMax = b.max;
    } else {
      break;
    }
  }
  return tax;
};
```

### 4. Update Category Limits

**Common changes to watch for:**

```typescript
// Example 1: Medical limit increased from RM10k to RM12k in 2026
const medLimit = year >= 2026 ? 12000 : year >= 2023 ? 10000 : 8000;

// Example 2: Lifestyle limit increased from RM2.5k to RM3k
configs.push({
  id: 'lifestyle',
  title: 'Lifestyle',
  limit: year >= 2026 ? 3000 : 2500, // Conditional limit
  // ... rest
});

// Example 3: SSPN limit change
configs.push({
  id: 'sspn',
  title: 'SSPN Savings',
  limit: year >= 2026 ? 10000 : 8000,
  // ... rest
});
```

### 5. Add New Relief Categories

**Example: New "Green Technology" relief introduced in 2026:**

```typescript
// Step A: Add to DEDUCTIBLES (line 54)
export const DEDUCTIBLES: { [key: string]: DeductibleItem } = {
  // ... existing items

  // New for 2026
  green_solar: {
    id: 'green_solar',
    label: 'Solar Panel System',
    parent: 'green_tech'
  },
  green_battery: {
    id: 'green_battery',
    label: 'Home Battery Storage',
    parent: 'green_tech',
    subLimit: 3000
  },
  green_insulation: {
    id: 'green_insulation',
    label: 'Energy-Efficient Insulation',
    parent: 'green_tech'
  },
};

// Step B: Add to getYearConfig() function (around line 380)
// Green Technology (2026+)
if (year >= 2026) {
  configs.push({
    id: 'green_tech',
    title: 'Green Technology',
    limit: 5000,
    color: 'bg-green-600',
    icon: '🌱',
    items: [
      DEDUCTIBLES.green_solar,
      DEDUCTIBLES.green_battery,
      DEDUCTIBLES.green_insulation
    ],
    advice: 'Solar panels, battery storage, energy efficiency improvements.',
    details:
      'Purchase and installation of renewable energy systems for residential use. ' +
      'Includes solar PV systems, home battery storage (up to RM3,000), and ' +
      'energy-efficient insulation materials. Must be installed at principal residence.',
  });
}
```

### 6. Modify Existing Categories

**Example: Dental added to medical in 2024, expanded in 2026:**

```typescript
// Line 238: Add conditional items
const medItems = [
  DEDUCTIBLES.medical_serious,
  DEDUCTIBLES.medical_fertility,
  DEDUCTIBLES.medical_vax,
  DEDUCTIBLES.medical_checkup,
];

if (year >= 2024) {
  medItems.push(DEDUCTIBLES.medical_dental);
}

if (year >= 2026) {
  medItems.push(DEDUCTIBLES.medical_orthodontics); // New in 2026
}

if (year >= 2023) {
  medItems.push(DEDUCTIBLES.medical_child_dev);
}

// Update shared pools if sub-limits change
const medSharedPool = year >= 2026
  ? { limit: 1500, items: ['medical_checkup', 'medical_vax', 'medical_dental'] }
  : { limit: 1000, items: ['medical_checkup', 'medical_vax', 'medical_dental'] };
```

### 7. Remove Sunset Provisions

**Example: Special COVID-19 relief discontinued after 2025:**

```typescript
// Remove or make conditional
if (year <= 2025) {
  configs.push({
    id: 'covid_special',
    title: 'COVID-19 Special Relief',
    limit: 1000,
    // ... only for 2021-2025
  });
}
```

### 8. Update Descriptions

**Update details to reflect current law:**

```typescript
configs.push({
  id: 'lifestyle',
  // ... other props
  details:
    'Includes purchase of books, journals, magazines, printed newspapers and other similar publications. ' +
    'Purchase of personal computer, smartphone or tablet. ' +
    'Payment of monthly bill for internet subscription.' +
    (year < 2024 ? ' Includes gym memberships.' : '') +
    (year >= 2026 ? ' Now includes smartwatch for health tracking (up to RM500).' : ''),
});
```

## Testing Your Changes

### 1. Unit Tests (Recommended)

Create test cases for each year:

```typescript
// Create: src/engine/__tests__/taxEngine.test.ts
import { calculateProgressiveTax, getYearConfig } from '../taxEngine';

describe('Tax Calculations', () => {
  test('2026 tax brackets', () => {
    const income = 100000;
    const tax = calculateProgressiveTax(income, 2026);
    expect(tax).toBe(/* expected amount */);
  });

  test('2026 medical limit is 12000', () => {
    const profile = { /* ... */ };
    const config = getYearConfig(2026, profile);
    const medical = config.find(c => c.id === 'medical');
    expect(medical?.limit).toBe(12000);
  });

  test('Green tech only available from 2026', () => {
    const profile = { /* ... */ };
    const config2025 = getYearConfig(2025, profile);
    const config2026 = getYearConfig(2026, profile);

    expect(config2025.find(c => c.id === 'green_tech')).toBeUndefined();
    expect(config2026.find(c => c.id === 'green_tech')).toBeDefined();
  });
});
```

### 2. Manual Testing

Test with real scenarios:

```typescript
// Test profile
const testProfile = {
  displayName: 'Test User',
  status: 'married',
  spouseWorking: false,
  selfDisabled: false,
  spouseDisabled: false,
  kidsUnder18: 2,
  kidsPreU: 0,
  kidsDegree: 1,
  kidsDisabled: 0,
  kidsDisabledDiploma: 0,
  zakat: 0,
  donations: 0,
};

// Test in different years
const config2024 = getYearConfig(2024, testProfile);
const config2025 = getYearConfig(2025, testProfile);
const config2026 = getYearConfig(2026, testProfile);

// Verify category counts and limits
console.log('2024 categories:', config2024.length);
console.log('2025 categories:', config2025.length);
console.log('2026 categories:', config2026.length);

// Test tax calculation
const testIncome = 120000;
console.log('2024 tax:', calculateProgressiveTax(testIncome, 2024));
console.log('2025 tax:', calculateProgressiveTax(testIncome, 2025));
console.log('2026 tax:', calculateProgressiveTax(testIncome, 2026));
```

### 3. Edge Cases to Test

- [ ] Year boundaries (Dec 31 → Jan 1)
- [ ] Maximum relief limits
- [ ] Shared pool calculations
- [ ] Zero income
- [ ] Very high income (>RM2M)
- [ ] All marital status combinations
- [ ] Disabled individual scenarios
- [ ] Multiple children scenarios

## Release Process

### 1. Code Changes
```bash
# Make your changes to taxEngine.ts
git add src/engine/taxEngine.ts
git commit -m "Update tax rules for YA 2026"
```

### 2. Update App Version
```json
// package.json or app.json
{
  "version": "1.1.0", // Bump minor version for tax year update
  "expo": {
    "version": "1.1.0",
    "ios": {
      "buildNumber": "2" // Increment build number
    }
  }
}
```

### 3. Release Notes Template
```markdown
## Version 1.1.0 - Tax Year 2026 Update

### Tax Rule Changes (YA 2026)
- Updated tax brackets (if changed)
- Medical relief limit increased to RM12,000 (was RM10,000)
- New: Green Technology relief (RM5,000 limit)
- Lifestyle relief increased to RM3,000 (was RM2,500)
- Discontinued: COVID-19 special relief

### How This Affects You
- Higher relief limits mean more tax savings
- New categories allow you to claim more expenses
- Historical data (2023-2025) still uses old rules correctly

### Action Required
- Review your 2026 expenses in new categories
- Upload receipts for green technology purchases
- Update your annual income for 2026
```

### 4. Notify Users

**In-app notification:**
```typescript
// Show to users on first open after update
{
  title: "2026 Tax Rules Updated! 🎉",
  message: "We've updated CukaiPal with the latest LHDN rules for YA 2026. " +
           "Medical relief is now RM12,000, and new green technology relief is available!",
  action: "Learn More"
}
```

## Common Tax Rule Changes

### Historical Patterns

Based on past LHDN changes, expect:

1. **Every 2-3 years:**
   - Relief limit adjustments (usually increases)
   - New relief categories (technology, green energy, etc.)

2. **Major budget changes:**
   - Tax bracket restructuring
   - Targeted reliefs (e.g., COVID-19, economic stimulus)

3. **Rare changes:**
   - Personal relief amounts
   - Spouse/child relief structure

### 2023-2024 Changes (Reference)

- Medical: RM8,000 → RM10,000 (2023)
- Sports separated from Lifestyle: New RM1,000 category (2024)
- Dental added to medical (2024)
- Child development assessment limit: RM4,000 (2023)

## Helpful Resources

### Official Sources
- **LHDN Portal:** https://www.hasil.gov.my
- **Tax Relief Guide:** https://www.hasil.gov.my/media/y0rpr0ub/tax_relief_ya_2024.pdf
- **Budget Announcement:** Ministry of Finance website

### Community Resources
- LHDN Facebook: Updates and clarifications
- Tax forums: lowyat.net, malaysianfinancialadvisor.com
- Accounting firms: PWC, Deloitte, KPMG publish annual guides

## Backward Compatibility

**IMPORTANT:** Always maintain historical accuracy!

```typescript
// ✅ CORRECT: Different rules for different years
const medLimit = year >= 2026 ? 12000 : year >= 2023 ? 10000 : 8000;

// ❌ WRONG: Breaks historical data
const medLimit = 12000; // Don't do this!
```

**Why:** Users may still be filing/reviewing past years (2023, 2024, 2025). The app must calculate correctly for each specific year.

## Quick Reference: Update Locations

| What Changed | File | Line(s) | Search For |
|-------------|------|---------|-----------|
| Current year | taxEngine.ts | 12 | `CURRENT_YEAR` |
| Supported years | taxEngine.ts | 14 | `YA_YEARS` |
| Filing deadlines | taxEngine.ts | 16-24 | `FILING_DEADLINES` |
| Tax brackets | taxEngine.ts | 26-52 | `TAX_BRACKETS` |
| Relief items | taxEngine.ts | 54-89 | `DEDUCTIBLES` |
| Category config | taxEngine.ts | 109-410 | `getYearConfig` |
| Tax calculation | taxEngine.ts | 413-429 | `calculateProgressiveTax` |

## Automation Opportunities

Consider building tools to help with updates:

### 1. Tax Rule Diff Tool
```bash
# Script to compare year configs
npm run tax-diff 2025 2026
# Shows added/removed/changed categories
```

### 2. Validation Script
```typescript
// Validates all years have required categories
// Checks for limit increases (never decreases)
// Ensures tax brackets are progressive
```

### 3. Change Log Generator
```typescript
// Automatically generates user-facing changelog
// from code changes
```

## Support Plan

After releasing tax year update:

1. **Week 1:** Monitor for bug reports
2. **Month 1:** Check calculation accuracy with test cases
3. **Tax Season:** Provide support for users filing taxes
4. **Post-season:** Review and document any issues for next year

---

**Last Updated:** January 2025
**Current Tax Year:** 2025
**Next Expected Update:** November 2025 (Budget 2026)
