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

export interface OfficeHead {
  name: string;
  target: number;
  collected: number;
}

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
  /** optional per-head breakdown (Book1.xlsx format) */
  heads: OfficeHead[];
  file: string;
  ts: number;
}

export const REAL_OFFICE: OfficeData = {
  target: [...TARGET_2083],
  collectedPrev: [...COLLECTION_2082],
  collectedCurrent: [CURRENT_SHRAWAN, null, null, null, null, null, null, null, null, null, null, null],
  prevShrawan: PREV_SHRAWAN,
  annualTarget: TOTAL_TARGET,
  heads: [],
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
