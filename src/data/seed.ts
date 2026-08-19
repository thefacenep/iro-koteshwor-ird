export type CategoryId = "income" | "vat" | "excise" | "customs" | "other";

export interface Category {
  id: CategoryId;
  en: string;
  np: string;
  shortEn: string;
  shortNp: string;
  color: string;
}

export interface MonthDef {
  en: string;
  np: string;
  shortEn: string;
  shortNp: string;
}

export interface RevenueRecord {
  id: string;
  fy: string; // "2081/82"
  month: number; // 0 = Shrawan .. 11 = Ashadh
  category: CategoryId;
  collected: number; // NPR billions (arba)
  target: number;
  prevCollected: number;
  source: "seed" | "import";
  importedAt?: number;
}

export const CURRENT_FY = "2081/82";
export const PREV_FY = "2080/81";

export const CATEGORIES: Category[] = [
  { id: "income", en: "Income Tax", np: "आय कर", shortEn: "Income", shortNp: "आय", color: "#c8102e" },
  { id: "vat", en: "Value Added Tax", np: "मूल्य अभिवृद्धि कर", shortEn: "VAT", shortNp: "मू.अ.कर", color: "#003893" },
  { id: "excise", en: "Excise Duty", np: "अन्तःशुल्क", shortEn: "Excise", shortNp: "अन्तःशुल्क", color: "#e07a00" },
  { id: "customs", en: "Customs Duty", np: "भन्सार महसुल", shortEn: "Customs", shortNp: "भन्सार", color: "#0e7c66" },
  { id: "other", en: "Other Taxes", np: "अन्य करहरू", shortEn: "Others", shortNp: "अन्य", color: "#5a6b8c" },
];

export const MONTHS: MonthDef[] = [
  { en: "Shrawan", np: "श्रावण", shortEn: "Shra", shortNp: "श्रा" },
  { en: "Bhada", np: "भदौ", shortEn: "Bha", shortNp: "भदौ" },
  { en: "Ashoj", np: "असोज", shortEn: "Asho", shortNp: "असो" },
  { en: "Kartik", np: "कात्तिक", shortEn: "Kart", shortNp: "कात्" },
  { en: "Mangsir", np: "मंसिर", shortEn: "Mang", shortNp: "मंसि" },
  { en: "Poush", np: "पुष", shortEn: "Pous", shortNp: "पुष" },
  { en: "Magh", np: "माघ", shortEn: "Magh", shortNp: "माघ" },
  { en: "Fagun", np: "फागुन", shortEn: "Fagu", shortNp: "फागु" },
  { en: "Chaitra", np: "चैत", shortEn: "Chai", shortNp: "चैत" },
  { en: "Baisakh", np: "वैशाख", shortEn: "Bais", shortNp: "वैशा" },
  { en: "Jestha", np: "जेठ", shortEn: "Jest", shortNp: "जेठ" },
  { en: "Ashadh", np: "असार", shortEn: "Asad", shortNp: "असार" },
];

/** Deterministic pseudo-random so every load renders the same official figures */
function noise(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Seasonal collection pattern — Ashadh (year-end) spikes, as in real Nepal revenue cycles */
const SEASONAL = [0.82, 0.88, 0.95, 0.9, 0.97, 1.0, 1.04, 1.02, 1.18, 1.12, 1.24, 1.52];

/** Monthly target per category in NPR billions */
const TARGETS: Record<CategoryId, number> = {
  income: 46,
  vat: 54,
  excise: 17,
  customs: 31,
  other: 10,
};

export const MONTHLY_TARGET_TOTAL = CATEGORIES.reduce((s, c) => s + TARGETS[c.id], 0); // 158

export const CATEGORY_LABEL_KEYS: Record<CategoryId, { en: string; np: string }> = {
  income: { en: "Income Tax", np: "आय कर" },
  vat: { en: "Value Added Tax", np: "मूल्य अभिवृद्धि कर" },
  excise: { en: "Excise Duty", np: "अन्तःशुल्क" },
  customs: { en: "Customs Duty", np: "भन्सार महसुल" },
  other: { en: "Other Taxes", np: "अन्य करहरू" },
};

export function generateSeed(): RevenueRecord[] {
  const records: RevenueRecord[] = [];
  let i = 0;
  for (const cat of CATEGORIES) {
    const base = TARGETS[cat.id];
    for (let m = 0; m < 12; m++) {
      const n1 = noise(i++);
      const n2 = noise(i++);
      // previous FY collected (~15% lower than current)
      const prev = base * SEASONAL[m] * (0.78 + 0.1 * n1);
      // current FY collected tracks target with seasonal push
      const collected = base * SEASONAL[m] * (0.9 + 0.16 * n2);
      const target = base;
      records.push({
        id: `seed-${cat.id}-${m}`,
        fy: CURRENT_FY,
        month: m,
        category: cat.id,
        collected: round1(collected),
        target: round1(target),
        prevCollected: round1(prev),
        source: "seed",
      });
    }
  }
  return records;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/* ---------------- aggregation helpers ---------------- */

export interface MonthAgg {
  month: number;
  target: number;
  collected: number;
  prev: number;
  byCategory: Record<CategoryId, number>;
  byCategoryPrev: Record<CategoryId, number>;
}

export function aggregateByMonth(records: RevenueRecord[]): MonthAgg[] {
  return MONTHS.map((_, m) => {
    const rows = records.filter((r) => r.month === m);
    const byCategory = { income: 0, vat: 0, excise: 0, customs: 0, other: 0 } as Record<CategoryId, number>;
    const byCategoryPrev = { income: 0, vat: 0, excise: 0, customs: 0, other: 0 } as Record<CategoryId, number>;
    let target = 0;
    let collected = 0;
    let prev = 0;
    for (const r of rows) {
      byCategory[r.category] += r.collected;
      byCategoryPrev[r.category] += r.prevCollected;
      target += r.target;
      collected += r.collected;
      prev += r.prevCollected;
    }
    return { month: m, target: round1(target), collected: round1(collected), prev: round1(prev), byCategory, byCategoryPrev };
  });
}

export function totals(records: RevenueRecord[]) {
  let target = 0;
  let collected = 0;
  let prev = 0;
  for (const r of records) {
    target += r.target;
    collected += r.collected;
    prev += r.prevCollected;
  }
  return { target: round1(target), collected: round1(collected), prev: round1(prev) };
}

export function categoryTotals(records: RevenueRecord[]) {
  return CATEGORIES.map((c) => {
    const rows = records.filter((r) => r.category === c.id);
    const collected = round1(rows.reduce((s, r) => s + r.collected, 0));
    const target = round1(rows.reduce((s, r) => s + r.target, 0));
    const prev = round1(rows.reduce((s, r) => s + r.prevCollected, 0));
    return { category: c, collected, target, prev };
  });
}
