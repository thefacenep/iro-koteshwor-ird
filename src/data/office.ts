/* =====================================================================
   Inland Revenue Office Koteshwor — real figures from the office sheets
   "Book1.xlsx" and "Revenue target of each month.xlsx".
   All amounts are in THOUSAND NPR (हजार रुपैयाँ).
   ===================================================================== */

export const MONTH_COLS = [
  { en: "SHRAWAN", np: "श्रावण" },
  { en: "BHADRA", np: "भदौ" },
  { en: "ASWIN", np: "असोज" },
  { en: "KARTIK", np: "कात्तिक" },
  { en: "MANGSIR", np: "मंसिर" },
  { en: "POUSH", np: "पौष" },
  { en: "MAGH", np: "माघ" },
  { en: "FALGUN", np: "फागुन" },
  { en: "CHAITRA", np: "चैत" },
  { en: "BAISAKH", np: "वैशाख" },
  { en: "JESTHA", np: "जेठ" },
  { en: "ASAR", np: "असार" },
] as const;

export const MONTH_SHORT_EN = ["Shra", "Bhad", "Aswi", "Kart", "Mang", "Pous", "Magh", "Falg", "Chai", "Bais", "Jest", "Asar"];

/** Target 2083/084 — "Revenue target of each month.xlsx", row 1 */
export const TARGET_2083: number[] = [
  448554.09, 339045.98, 403546.58, 385971.21, 389928.21, 834701.76,
  407937.1, 392044.73, 694164.81, 486504.43, 481863.93, 857428.16,
];

/** Collection 2082/083 — "Revenue target of each month.xlsx", row 2 */
export const COLLECTION_2082: number[] = [
  438389, 280467, 314019, 368815, 291009, 642298,
  336013, 333433, 592813, 388639, 405077, 529066,
];

/** Book1.xlsx — collected up to Shrawan 2083/084 */
export const CURRENT_SHRAWAN = 552725;
/** Book1.xlsx — previous year's Shrawan collection (basis of 126% YoY) */
export const PREV_SHRAWAN = 438467;

export const TOTAL_TARGET = 6121690.99;
export const TOTAL_COLLECTION_PREV = 4906449;

export const SEED_FILE = "Revenue target of each month.xlsx";

/* ---------------- revenue category data (Book1.xlsx, Shrawan) ---------------- */

export interface RevenueCategoryData {
  id: string;
  name: string;
  nameNepali: string;
  color: string;
  annualTarget: number;
  monthlyTarget: number;
  monthlyCollection: number;
  achievementPercent: number;
  contributionPercent: number;
  previousYearCollection: number;
  growthPercent: number;
  nextMonthTarget: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
}

export const CAT_COLORS = {
  income: "#1e3a8a",
  rent: "#7e22ce",
  interest: "#eab308",
  vat: "#dc143c",
  excise: "#059669",
  other: "#ea580c",
} as const;

/** Exact rows from Book1.xlsx (श्रावण महिना सम्म) — amounts in thousand NPR */
const CAT_ROW = (
  id: keyof typeof CAT_COLORS,
  name: string,
  nameNepali: string,
  annualTarget: number,
  monthlyTarget: number,
  monthlyCollection: number,
  achievementPercent: number,
  contributionPercent: number,
  previousYearCollection: number,
  growthPercent: number,
  extra?: Partial<RevenueCategoryData>
): RevenueCategoryData => ({
  id,
  name,
  nameNepali,
  color: CAT_COLORS[id],
  annualTarget,
  monthlyTarget,
  monthlyCollection,
  achievementPercent,
  contributionPercent,
  previousYearCollection,
  growthPercent,
  nextMonthTarget: 0,
  ...extra,
});

export const SEED_CATEGORIES: RevenueCategoryData[] = [
  CAT_ROW("income", "Income Tax", "आयकर", 2282628, 136409, 144836, 106, 26.2, 93698, 155),
  CAT_ROW("rent", "Rent Income Tax", "बहाल कर", 36057, 2895, 1921, 66, 0.35, 922, 208),
  CAT_ROW("interest", "Interest Tax", "ब्याज कर", 101858, 22289, 9065, 41, 1.64, 11012, 82),
  CAT_ROW("income", "Total Income Tax", "जम्मा आयकर", 2420543, 161593, 155822, 96, 28.2, 105632, 148, {
    isSubtotal: true,
    color: "#33518f",
  }),
  CAT_ROW("vat", "Value Added Tax", "मू.अ.कर", 1766107, 154840, 224102, 145, 40.54, 177602, 126),
  CAT_ROW("excise", "Excise Duty", "अन्तःशुल्क", 1935042, 132121, 170015, 129, 30.76, 155154, 110),
  CAT_ROW("other", "Other Taxes", "अन्य कर", 0, 271, 2786, 1027, 0.5, 78, 3572),
  CAT_ROW("income", "Grand Total", "कुल जम्मा", 6121691, 448825, 552725, 123, 100, 438467, 126, {
    isTotal: true,
    color: "#0b2260",
  }),
];

/** the six charted categories (subtotal & grand total excluded) */
export const chartCategories = (cats: RevenueCategoryData[]): RevenueCategoryData[] =>
  cats.filter((c) => !c.isSubtotal && !c.isTotal);

export interface OfficeData {
  /** monthly target, FY 2083/084 (thousand NPR) */
  target: number[];
  /** monthly collection, FY 2082/083 (thousand NPR) */
  collectedPrev: number[];
  /** monthly collection, FY 2083/084 so far (null = not yet reported) */
  collectedCurrent: (number | null)[];
  /** previous year Shrawan collection — YoY basis */
  prevShrawan: number;
  /** annual target override (thousand NPR) */
  annualTarget: number;
  /** per-category breakdown (Book1.xlsx format) */
  categories: RevenueCategoryData[];
  file: string;
  ts: number;
}

export const REAL_OFFICE: OfficeData = {
  target: [...TARGET_2083],
  collectedPrev: [...COLLECTION_2082],
  collectedCurrent: [CURRENT_SHRAWAN, null, null, null, null, null, null, null, null, null, null, null],
  prevShrawan: PREV_SHRAWAN,
  annualTarget: TOTAL_TARGET,
  categories: SEED_CATEGORIES,
  file: SEED_FILE,
  ts: 0, // 0 = seeded from the official sheets
};

/* ---------------- derived helpers ---------------- */

export const sum = (a: (number | null)[]): number => a.reduce<number>((s, v) => s + (v ?? 0), 0);

/** thousand NPR → crore NPR */
export const toCrore = (thousand: number): number => thousand / 10000;

export const collectedToDate = (d: OfficeData): number => sum(d.collectedCurrent);

/** achievement against the Shrawan monthly target — Book1 shows 123% */
export const achievementPct = (d: OfficeData): number =>
  d.target[0] > 0 ? (collectedToDate(d) / d.target[0]) * 100 : 0;

/** year-on-year — 552,725 vs 438,467 = 126% */
export const yoyPct = (d: OfficeData): number =>
  d.prevShrawan > 0 ? (collectedToDate(d) / d.prevShrawan) * 100 : 0;

export interface Quarter {
  label: { en: string; np: string };
  months: { en: string; np: string };
  target: number;
  collectedPrev: number;
}

export function quarters(d: OfficeData): Quarter[] {
  const q = (i: number): Quarter => ({
    label: { en: `Q${i + 1}`, np: `त्रैमास ${["१", "२", "३", "४"][i]}` },
    months: {
      en: `${MONTH_COLS[i * 3].en}–${MONTH_COLS[i * 3 + 2].en}`,
      np: `${MONTH_COLS[i * 3].np}–${MONTH_COLS[i * 3 + 2].np}`,
    },
    target: d.target.slice(i * 3, i * 3 + 3).reduce((s, v) => s + v, 0),
    collectedPrev: d.collectedPrev.slice(i * 3, i * 3 + 3).reduce((s, v) => s + v, 0),
  });
  return [q(0), q(1), q(2), q(3)];
}

/** chart dataset — amounts converted to crore NPR for readable axes */
export function monthlyCrore(d: OfficeData) {
  return MONTH_COLS.map((m, i) => ({
    month: m.en,
    np: m.np,
    short: MONTH_SHORT_EN[i],
    target: +(toCrore(d.target[i] ?? 0)).toFixed(2),
    prev: +(toCrore(d.collectedPrev[i] ?? 0)).toFixed(2),
    current: d.collectedCurrent[i] !== null ? +toCrore(d.collectedCurrent[i] as number).toFixed(2) : null,
    gap: +toCrore(Math.max(0, (d.target[i] ?? 0) - (d.collectedPrev[i] ?? 0))).toFixed(2),
  }));
}
