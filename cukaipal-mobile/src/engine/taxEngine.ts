import {
  CategoryConfig,
  CategoryStats,
  DeductibleItem,
  Receipt,
  TaxBracket,
  UserProfile,
} from './types';

// --- CONSTANTS ---

export const CURRENT_YEAR = 2025;

export const YA_YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019];

export const FILING_DEADLINES: { [year: number]: string } = {
  2025: '2026-05-15',
  2024: '2025-05-15',
  2023: '2024-05-15',
  2022: '2023-05-15',
  2021: '2022-05-15',
  2020: '2021-05-15',
  2019: '2020-05-15',
};

export const TAX_BRACKETS: { [key: string]: TaxBracket[] } = {
  post_2023: [
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
  pre_2023: [
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
};

export const DEDUCTIBLES: { [key: string]: DeductibleItem } = {
  lifestyle_books: { id: 'lifestyle_books', label: 'Books / Journals', parent: 'lifestyle' },
  lifestyle_tech: { id: 'lifestyle_tech', label: 'PC / Smartphone / Tablet', parent: 'lifestyle' },
  lifestyle_internet: { id: 'lifestyle_internet', label: 'Internet Bill', parent: 'lifestyle' },
  lifestyle_gym_legacy: { id: 'lifestyle_gym', label: 'Gym / Sports Equip', parent: 'lifestyle' },
  sports_equip: { id: 'sports_equip', label: 'Sports Equipment', parent: 'sports' },
  sports_facility: { id: 'sports_facility', label: 'Facility Rental', parent: 'sports' },
  sports_training: { id: 'sports_training', label: 'Training / Gym', parent: 'sports' },
  sports_extra_legacy: { id: 'sports_extra_legacy', label: 'Extra Sports', parent: 'sports_extra' },
  medical_serious: { id: 'medical_serious', label: 'Serious Disease', parent: 'medical' },
  medical_fertility: { id: 'medical_fertility', label: 'Fertility Treatment', parent: 'medical' },
  medical_vax: { id: 'medical_vax', label: 'Vaccination', parent: 'medical', subLimit: 1000 },
  medical_checkup: { id: 'medical_checkup', label: 'Full Checkup / Mental', parent: 'medical', subLimit: 1000 },
  medical_dental: { id: 'medical_dental', label: 'Dental Exam/Treatment', parent: 'medical', subLimit: 1000 },
  medical_child_dev: { id: 'medical_child_dev', label: 'Child Learning Rehab', parent: 'medical', subLimit: 4000 },
  parents_treatment: { id: 'parents_treatment', label: 'Medical (Parents)', parent: 'medical_parents' },
  education_self: { id: 'education_self', label: 'Education Fees (Self)', parent: 'education_self' },
  prs_annuity: { id: 'prs_annuity', label: 'PRS / Deferred Annuity', parent: 'prs' },
  insurance_ed_med: { id: 'insurance_ed_med', label: 'Education/Medical Insurance', parent: 'insurance_ed_med' },
  socso: { id: 'socso', label: 'SOCSO / EIS', parent: 'socso' },
  child_sspn: { id: 'child_sspn', label: 'SSPN Net Deposit', parent: 'sspn' },
  child_care: { id: 'child_care', label: 'Childcare (Taska)', parent: 'childcare' },
  child_breastfeeding: { id: 'child_breastfeeding', label: 'Breastfeeding Equip', parent: 'breastfeeding' },
  relief_spouse: { id: 'relief_spouse', label: 'Spouse (No Income)', parent: 'spouse' },
  relief_alimony: { id: 'relief_alimony', label: 'Alimony', parent: 'spouse' },
  relief_disabled_self: { id: 'relief_disabled_self', label: 'Disabled Individual', parent: 'disabled_self' },
  relief_disabled_spouse: { id: 'relief_disabled_spouse', label: 'Disabled Spouse', parent: 'disabled_spouse' },
  relief_child_u18: { id: 'relief_child_u18', label: 'Child (<18)', parent: 'child_relief' },
  relief_child_preu: { id: 'relief_child_preu', label: 'Child (18+ Pre-U)', parent: 'child_relief' },
  relief_child_high: { id: 'relief_child_high', label: 'Child (18+ Degree)', parent: 'child_relief' },
  relief_disabled_equip: { id: 'relief_disabled_equip', label: 'Disabled Support Equip', parent: 'disabled_equip' },
  ev_install: { id: 'ev_install', label: 'EV Charger', parent: 'ev' },
  tech_special_item: { id: 'tech_special_item', label: 'Tech (Special Relief)', parent: 'tech_special' },
  tourism: { id: 'tourism', label: 'Domestic Tourism', parent: 'tourism' },
  life_insurance: { id: 'life_insurance', label: 'Life Ins / EPF', parent: 'life_insurance' },
};

// --- PURE FUNCTIONS ---

export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
  }).format(val);
};

export const validateDate = (dateStr: string, year: number): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  if (d.getFullYear() !== year) return false;
  return true;
};

export const getYearConfig = (year: number, profile: UserProfile): CategoryConfig[] => {
  const configs: CategoryConfig[] = [];

  // Spouse / Alimony
  if (profile.status === 'married' && (!profile.spouseWorking || profile.alimony)) {
    configs.push({
      id: 'spouse',
      title: 'Spouse / Alimony',
      limit: 4000,
      color: 'bg-indigo-600',
      icon: '❤️',
      items: [DEDUCTIBLES.relief_spouse, DEDUCTIBLES.relief_alimony],
      advice: 'Automatic relief for non-working spouse.',
      details:
        'Deduction for spouse living together in the basis year who has no source of income/total income. Also applicable for alimony payments to a former wife (subject to formal agreement/court order). Total deduction for both spouse and alimony is restricted to RM4,000.',
      isAutomatic: true,
    });
  }

  // Disabled Individual
  if (profile.selfDisabled) {
    configs.push({
      id: 'disabled_self',
      title: 'Disabled Individual',
      limit: 6000,
      color: 'bg-purple-600',
      icon: '♿',
      items: [DEDUCTIBLES.relief_disabled_self],
      advice: 'Automatic relief for OKU card holder.',
      details:
        'Further deduction of RM6,000 for an individual who is certified in writing by the Department of Social Welfare (JKM) as a disabled person.',
      isAutomatic: true,
    });
  }

  // Disabled Spouse
  if (profile.status === 'married' && profile.spouseDisabled) {
    configs.push({
      id: 'disabled_spouse',
      title: 'Disabled Spouse',
      limit: 5000,
      color: 'bg-purple-500',
      icon: '♿',
      items: [DEDUCTIBLES.relief_disabled_spouse],
      advice: 'Automatic additional relief.',
      details:
        'Additional deduction of RM5,000 is allowed if the spouse is a disabled person (OKU).',
      isAutomatic: true,
    });
  }

  // Child Relief
  let childLimit = 0;
  if (profile.kidsUnder18 > 0) childLimit += profile.kidsUnder18 * 2000;
  if (profile.kidsPreU > 0) childLimit += profile.kidsPreU * 2000;
  if (profile.kidsDegree > 0) childLimit += profile.kidsDegree * 8000;
  if (profile.kidsDisabled > 0) childLimit += profile.kidsDisabled * 6000;
  if (profile.kidsDisabledDiploma > 0) childLimit += profile.kidsDisabledDiploma * 14000;

  if (childLimit > 0) {
    configs.push({
      id: 'child_relief',
      title: 'Child Relief',
      limit: childLimit,
      color: 'bg-indigo-400',
      icon: '👶',
      items: [DEDUCTIBLES.relief_child_u18],
      advice: 'Calculated automatically based on children profile.',
      details:
        'RM2,000 per unmarried child under 18 years old. RM2,000 for unmarried child 18+ in full-time education (A-Level, Matriculation, Preparatory). RM8,000 for unmarried child 18+ pursuing a degree (or higher) at a recognized higher learning institution. RM6,000 for a disabled child (additional RM8,000 if 18+ and in higher education).',
      isAutomatic: true,
    });
  }

  // Lifestyle
  const lsItems = [
    DEDUCTIBLES.lifestyle_books,
    DEDUCTIBLES.lifestyle_tech,
    DEDUCTIBLES.lifestyle_internet,
  ];
  if (year < 2024) lsItems.push(DEDUCTIBLES.lifestyle_gym_legacy);
  configs.push({
    id: 'lifestyle',
    title: 'Lifestyle',
    limit: 2500,
    color: 'bg-blue-500',
    icon: '📱',
    items: lsItems,
    advice: 'Books, Personal Computer, Smartphone, Tablet, Internet.',
    details:
      'Includes purchase of books, journals, magazines, printed newspapers and other similar publications (excluding banned publications). Purchase of personal computer, smartphone or tablet (for non-business use). Payment of monthly bill for internet subscription (under own name).' +
      (year < 2024 ? ' Includes gym memberships.' : ''),
  });

  // Sports
  if (year >= 2024) {
    configs.push({
      id: 'sports',
      title: 'Sports Equipment & Gym',
      limit: 1000,
      color: 'bg-orange-500',
      icon: '⚽',
      items: [DEDUCTIBLES.sports_equip, DEDUCTIBLES.sports_facility, DEDUCTIBLES.sports_training],
      advice: 'Purchase of equipment, rental, fees.',
      details:
        'Purchase of sports equipment for sports activity defined under the Sports Development Act 1997. Rental or entrance fees to any sports facility. Registration fees for any sports competition where the organizer is approved and licensed by the Commissioner of Sports. Fees for sports training conducted by a registered coach/club.',
    });
  } else if (year >= 2021) {
    configs.push({
      id: 'sports_extra',
      title: 'Additional Sports Relief',
      limit: 500,
      color: 'bg-orange-500',
      icon: '⚽',
      items: [DEDUCTIBLES.sports_extra_legacy],
      advice: 'Extra relief for sports activity.',
      details:
        'Additional relief specific to sports equipment and activities purchased in the basis year.',
    });
  }

  // Medical (Self, Spouse & Child)
  const medLimit = year >= 2023 ? 10000 : 8000;
  const medItems = [
    DEDUCTIBLES.medical_serious,
    DEDUCTIBLES.medical_fertility,
    DEDUCTIBLES.medical_vax,
    DEDUCTIBLES.medical_checkup,
  ];
  if (year >= 2024) medItems.push(DEDUCTIBLES.medical_dental);
  if (year >= 2023) medItems.push(DEDUCTIBLES.medical_child_dev);
  const medSharedPool = {
    limit: 1000,
    items: ['medical_checkup', 'medical_vax', 'medical_dental'],
  };
  configs.push({
    id: 'medical',
    title: 'Medical (Self, Spouse & Child)',
    limit: medLimit,
    color: 'bg-pink-500',
    icon: '🏥',
    items: medItems,
    sharedPools: [medSharedPool],
    advice: 'Serious diseases. RM1,000 sub-limit for checkup/vaccination.',
    details:
      'Treatment of serious diseases (AIDS, Parkinson's, Cancer, Renal Failure, Leukemia, Heart Attack, Pulmonary Hypertension, Chronic Liver Disease, Fulminant Viral Hepatitis, Head Trauma with Deficit, Brain Tumor, Major Burns, Major Organ Transplant, Major Amputation of Limbs). Fertility treatment (IUI/IVF). Vaccination expenses (up to RM1,000). Complete medical examination, mental health check-up, and COVID-19 detection tests (up to RM1,000). Child development assessment/training (up to RM4,000 from 2023).',
  });

  // Medical (Parents)
  configs.push({
    id: 'medical_parents',
    title: 'Medical (Parents)',
    limit: 8000,
    color: 'bg-red-500',
    icon: '👵',
    items: [DEDUCTIBLES.parents_treatment],
    advice: 'Treatment, special needs or carer expenses.',
    details:
      'Medical treatment, special needs, and carer expenses for parents. Parents must reside in Malaysia. Treatment must be provided by a medical practitioner registered with the MMC.',
  });

  // Education Fees (Self)
  configs.push({
    id: 'education_self',
    title: 'Education Fees (Self)',
    limit: 7000,
    color: 'bg-indigo-500',
    icon: '🎓',
    items: [DEDUCTIBLES.education_self],
    advice: 'Masters/PhD (Any), Degree (Selected). Upskilling limit RM2k.',
    details:
      'Fees for a course of study at a recognized institution in Malaysia. Masters or Doctorate (any field). Degree or below (Law, Accounting, Islamic Finance, Technical, Vocational, Industrial, Scientific or Technology). Upskilling or self-enhancement courses (restricted to RM2,000).',
  });

  // Education/Medical Insurance
  configs.push({
    id: 'insurance_ed_med',
    title: 'Education/Medical Ins.',
    limit: 3000,
    color: 'bg-teal-500',
    icon: '🛡️',
    items: [DEDUCTIBLES.insurance_ed_med],
    advice: 'Education or Medical insurance premiums.',
    details:
      'Insurance premiums paid for education or medical benefits for self, spouse or child. The total deduction is restricted to RM3,000.',
  });

  // PRS / Annuity
  configs.push({
    id: 'prs',
    title: 'PRS / Annuity',
    limit: 3000,
    color: 'bg-yellow-600',
    icon: '📈',
    items: [DEDUCTIBLES.prs_annuity],
    advice: 'Private Retirement Scheme or Deferred Annuity.',
    details:
      'Contribution to a Private Retirement Scheme (PRS) approved by the Securities Commission or payment of deferred annuity premium. Restricted to RM3,000.',
  });

  // SSPN Savings
  configs.push({
    id: 'sspn',
    title: 'SSPN Savings',
    limit: 8000,
    color: 'bg-yellow-500',
    icon: '🎓',
    items: [DEDUCTIBLES.child_sspn],
    advice: 'Net deposit only.',
    details:
      'Net deposit (Total Deposit - Total Withdrawal) in the basis year into the Skim Simpanan Pendidikan Nasional (SSPN) for a child.',
  });

  // Childcare Fees
  if (childLimit > 0 || profile.kidsDisabled > 0) {
    configs.push({
      id: 'childcare',
      title: 'Childcare Fees',
      limit: 3000,
      color: 'bg-teal-500',
      icon: '🧸',
      items: [DEDUCTIBLES.child_care],
      advice: 'Registered childcare centres only.',
      details:
        'Fees paid to childcare centres (Taska) registered with the Department of Social Welfare or Kindergartens (Tadika) registered with the Ministry of Education for a child aged 6 years and below.',
    });
  }

  // Breastfeeding Equipment
  configs.push({
    id: 'breastfeeding',
    title: 'Breastfeeding Equipment',
    limit: 1000,
    color: 'bg-rose-400',
    icon: '🍼',
    items: [DEDUCTIBLES.child_breastfeeding],
    advice: 'Allowed once every 2 years.',
    details:
      'Purchase of breastfeeding equipment for own use for a child aged 2 years and below. Allowed once in every 2 years.',
  });

  // Disabled Support Equipment
  if (
    profile.selfDisabled ||
    (profile.status === 'married' && profile.spouseDisabled) ||
    profile.kidsDisabled > 0
  ) {
    configs.push({
      id: 'disabled_equip',
      title: 'Disabled Support Equip.',
      limit: 6000,
      color: 'bg-purple-700',
      icon: '♿',
      items: [DEDUCTIBLES.relief_disabled_equip],
      advice: 'Basic supporting equipment.',
      details:
        'Purchase of basic supporting equipment for self, spouse, child or parent who is a disabled person. Restricted to RM6,000.',
    });
  }

  // EV Charging Facility
  if (year >= 2022) {
    configs.push({
      id: 'ev',
      title: 'EV Charging Facility',
      limit: 2500,
      color: 'bg-emerald-500',
      icon: '⚡',
      items: [DEDUCTIBLES.ev_install],
      advice: 'Installation, purchase, or subscription fees.',
      details:
        'Expenses relating to cost of installation, rental, purchase including hire-purchase equipment or subscription for use of EV charging facility.',
    });
  }

  // SOCSO / EIS
  configs.push({
    id: 'socso',
    title: 'SOCSO / EIS',
    limit: 350,
    color: 'bg-blue-600',
    icon: '💼',
    items: [DEDUCTIBLES.socso],
    advice: 'Employee contributions only.',
    details:
      'Contribution to the Social Security Organization (SOCSO) and Employment Insurance System (EIS). Restricted to RM350.',
  });

  // Life Insurance / EPF
  configs.push({
    id: 'life_insurance',
    title: 'Life Insurance / EPF',
    limit: 7000,
    color: 'bg-teal-600',
    icon: '🛡️',
    items: [DEDUCTIBLES.life_insurance],
    advice: 'EPF (Self) + Life Insurance.',
    details:
      'Restricted to RM4,000 for EPF contributions (or approved schemes) and RM3,000 for Life Insurance premiums. For public servants under pension scheme, the limit is RM7,000 for Life Insurance.',
  });

  return configs;
};

export const calculateProgressiveTax = (chargeableIncome: number, year: number): number => {
  if (chargeableIncome <= 5000) return 0;
  const brackets = year >= 2023 ? TAX_BRACKETS['post_2023'] : TAX_BRACKETS['pre_2023'];
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

export const computeCategoryData = (
  categoryConfig: CategoryConfig,
  receipts: Receipt[]
): CategoryStats => {
  if (categoryConfig.isAutomatic) {
    return {
      claimable: categoryConfig.limit,
      remaining: 0,
      percent: 100,
      totalSpent: categoryConfig.limit,
      isAutomatic: true,
    };
  }

  const itemTotals: { [itemId: string]: number } = {};
  receipts.forEach((r) => {
    if (r.category === categoryConfig.id && r.status === 'verified') {
      const amt = parseFloat(r.amount.toString()) || 0;
      const safeAmt = Math.max(0, amt);
      itemTotals[r.subCategory] = (itemTotals[r.subCategory] || 0) + safeAmt;
    }
  });

  let validClaim = 0;
  let totalSpent = 0;
  const sharedPoolUsage = (categoryConfig.sharedPools || []).map((pool) => ({
    ...pool,
    used: 0,
  }));

  categoryConfig.items.forEach((item) => {
    let amount = itemTotals[item.id] || 0;
    totalSpent += amount;
    if (item.subLimit) amount = Math.min(amount, item.subLimit);
    const poolIndex = sharedPoolUsage.findIndex((p) => p.items.includes(item.id));
    if (poolIndex >= 0) {
      sharedPoolUsage[poolIndex].used += amount;
    } else {
      validClaim += amount;
    }
  });

  sharedPoolUsage.forEach((pool) => {
    validClaim += Math.min(pool.used, pool.limit);
  });

  const finalClaimable = Math.min(validClaim, categoryConfig.limit);
  return {
    claimable: finalClaimable,
    remaining: categoryConfig.limit - finalClaimable,
    percent: Math.min((finalClaimable / categoryConfig.limit) * 100, 100),
    totalSpent,
  };
};

export const suggestCategory = (
  description: string
): { parent: string; sub: string } | null => {
  const desc = description.toLowerCase();
  const patterns: { [key: string]: RegExp } = {
    medical_checkup: /clinic|hospital|doctor|checkup|medical/i,
    lifestyle_books: /book|kinokuniya|mph|popular/i,
    lifestyle_internet: /unifi|maxis|digi|celcom|time|internet/i,
    lifestyle_tech: /apple|samsung|phone|laptop|computer|ipad/i,
    sports_equip: /decathlon|sport|gym|fitness|adidas|nike/i,
  };
  for (const [key, pattern] of Object.entries(patterns)) {
    if (pattern.test(desc)) {
      for (const k in DEDUCTIBLES) {
        if (DEDUCTIBLES[k].id === key) {
          return { parent: DEDUCTIBLES[k].parent, sub: key };
        }
      }
    }
  }
  return null;
};
