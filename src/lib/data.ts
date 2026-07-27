import rawData from '../../electronics.json';
import { CleanRecord, ORDINAL_LEVELS, RawRecord } from './types';

const RELEVANT_KEYS = [
  'purchaseAmount',
  'avgSpendPerPurchase',
  'purchaseFrequency',
  'brandAffinity',
  'age',
  'incomeLevelLabel',
  'gender',
  'productPrefLabel',
  'season',
  'month',
  'year',
] as const;

interface Stage {
  id: string;
  purchaseAmount: number | null;
  avgSpendPerPurchase: number | null;
  purchaseFrequency: number | null;
  brandAffinity: number | null;
  age: number | null;
  incomeLevelLabel: string | null;
  gender: string | null;
  productPrefLabel: string | null;
  season: string | null;
  month: number | null;
  year: number | null;
  willPurchase: number;
}

function toNum(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === '' || s === 'Hidden') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function toStr(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === '' || s === 'Hidden') return null;
  return s;
}

function mean(arr: (number | null)[]): number {
  const vals = arr.filter((v): v is number => v !== null);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function mode(arr: (string | null)[]): string {
  const counts = new Map<string, number>();
  arr.forEach((v) => {
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  });
  let best = '';
  let bestCount = -1;
  counts.forEach((c, k) => {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  });
  return best;
}

/** Mirrors the notebook's preprocessing pipeline: filter to Electronics,
 * coerce types, drop rows with 3+ missing relevant fields, impute the rest. */
export function cleanElectronics(): CleanRecord[] {
  const raw = rawData as unknown as RawRecord[];
  const electronics = raw.filter((r) => r.Product_Category === 'Electronics');

  const staged: Stage[] = electronics.map((r, i) => ({
    id: r.Transaction_ID || `row-${i}`,
    purchaseAmount: toNum(r.Purchase_Amount),
    avgSpendPerPurchase: toNum(r.Average_Spending_Per_Purchase),
    purchaseFrequency: toNum(r.Purchase_Frequency_Per_Month),
    brandAffinity: toNum(r.Brand_Affinity_Score),
    age: toNum(r.Age),
    incomeLevelLabel: toStr(r.Income_Level),
    gender: toStr(r.Gender),
    productPrefLabel: toStr(r.Product_Category_Preferences),
    season: toStr(r.Season),
    month: toNum(r.Month),
    year: toNum(r.Year),
    willPurchase: r.Will_Purchase_Next_Month ?? 0,
  }));

  const filtered = staged.filter((s) => {
    const missing = RELEVANT_KEYS.reduce((acc, k) => acc + (s[k] === null ? 1 : 0), 0);
    return missing <= 2;
  });

  const meanPurchaseAmount = mean(filtered.map((s) => s.purchaseAmount));
  const meanAvgSpend = mean(filtered.map((s) => s.avgSpendPerPurchase));
  const meanFreq = mean(filtered.map((s) => s.purchaseFrequency));
  const meanBrand = mean(filtered.map((s) => s.brandAffinity));
  const meanAge = mean(filtered.map((s) => s.age));
  const meanMonth = mean(filtered.map((s) => s.month));
  const meanYear = mean(filtered.map((s) => s.year));

  const modeIncome = mode(filtered.map((s) => s.incomeLevelLabel)) || 'Medium';
  const modeGender = mode(filtered.map((s) => s.gender)) || 'Other';
  const modePref = mode(filtered.map((s) => s.productPrefLabel)) || 'Medium';
  const modeSeason = mode(filtered.map((s) => s.season)) || 'Summer';

  return filtered.map((s) => {
    const incomeLabel = s.incomeLevelLabel ?? modeIncome;
    const prefLabel = s.productPrefLabel ?? modePref;
    const avgSpendPerPurchase = Math.round(s.avgSpendPerPurchase ?? meanAvgSpend);
    const purchaseFrequency = Math.max(1, Math.round(s.purchaseFrequency ?? meanFreq));
    const incomeIdx = ORDINAL_LEVELS.indexOf(incomeLabel);
    const prefIdx = ORDINAL_LEVELS.indexOf(prefLabel);

    return {
      id: s.id,
      purchaseAmount: Math.round(s.purchaseAmount ?? meanPurchaseAmount),
      avgSpendPerPurchase,
      purchaseFrequency,
      brandAffinity: Math.round(s.brandAffinity ?? meanBrand),
      age: Math.round(s.age ?? meanAge),
      incomeLevel: incomeIdx >= 0 ? incomeIdx : 1,
      incomeLevelLabel: incomeIdx >= 0 ? incomeLabel : 'Medium',
      gender: s.gender ?? modeGender,
      productPref: prefIdx >= 0 ? prefIdx : 1,
      productPrefLabel: prefIdx >= 0 ? prefLabel : 'Medium',
      season: s.season ?? modeSeason,
      month: Math.min(12, Math.max(1, Math.round(s.month ?? meanMonth))),
      year: Math.round(s.year ?? meanYear),
      willPurchase: s.willPurchase,
      avgSpendPerMonth: avgSpendPerPurchase * purchaseFrequency,
      cluster: 0,
    };
  });
}

export function getRawElectronicsCount(): number {
  const raw = rawData as unknown as RawRecord[];
  return raw.filter((r) => r.Product_Category === 'Electronics').length;
}

export function mean1(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function std1(arr: number[]): number {
  const m = mean1(arr);
  return Math.sqrt(mean1(arr.map((x) => (x - m) ** 2)));
}

export function pearson(x: number[], y: number[]): number {
  const mx = mean1(x);
  const my = mean1(y);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < x.length; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

export const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'];
export const GENDERS = ['Male', 'Female', 'Other'];
