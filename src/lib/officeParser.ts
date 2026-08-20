/* =====================================================================
   Sheet parser for the two office Excel formats:
   1. "Revenue target of each month.xlsx" — monthly matrix
        first column = series label (Target 2083/084 / Collection 2082/083)
        month columns  = SHRAWAN … ASAR (+ optional TOTAL)
   2. "Book1.xlsx" — revenue-head summary
        headers like राजस्व शीर्षक · वार्षिक लक्ष्य · महिनाको असुली
   Amounts are THOUSAND NPR. Nepali digits, commas and रू prefixes accepted.
   Parsed values merge straight into the global OfficeData state, so the
   Dashboard and Display Board update instantly.
   ===================================================================== */
import { CAT_COLORS, MONTH_COLS, type OfficeData, type RevenueCategoryData } from "../data/office";
import type { LogEntry, LogLevel } from "./importer";

const NP_DIGITS = "०१२३४५६७८९";
const npToAscii = (s: string) => s.replace(/[०-९]/g, (d) => String(NP_DIGITS.indexOf(d)));

const MONTH_ALIASES: Record<number, string[]> = {
  0: ["shrawan", "srawan", "shravan", "श्रावण", "साउन"],
  1: ["bhadra", "bhada", "bhado", "भदौ", "भदो"],
  2: ["aswin", "ashwin", "ashoj", "asoja", "असोज", "असwin"],
  3: ["kartik", "kartika", "कात्तिक", "कार्तिक"],
  4: ["mangsir", "mangshir", "margsir", "मंसिर", "मङ्सिर"],
  5: ["poush", "pous", "push", "paush", "पौष", "पुष", "पौस"],
  6: ["magh", "magha", "माघ"],
  7: ["falgun", "phalgun", "fagu", "फागुन", "फाल्गुन"],
  8: ["chaitra", "chait", "chaitya", "चैत", "चैत्र"],
  9: ["baisakh", "baishakh", "vaisakh", "वैशाख", "बैशाख"],
  10: ["jestha", "jyestha", "jesto", "जेठ", "जेष्ठ"],
  11: ["asar", "ashar", "ashadh", "असार", "अषाढ"],
};

function matchMonth(raw: string): number | null {
  const s = npToAscii(raw).trim().toLowerCase().replace(/[^a-z\u0900-\u097F]/g, "");
  if (!s) return null;
  for (let m = 0; m < 12; m++) {
    if (MONTH_ALIASES[m].some((a) => a === s || s.startsWith(a) || a.startsWith(s) && s.length >= 3)) return m;
  }
  return null;
}

function parseAmount(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const raw = String(v).trim();
  if (raw === "" || raw === "-" || raw === "—" || raw === "–") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  /* handles "2,282,628", "२,२८२,६२८", "- 0", "रू 552,725" */
  const s = npToAscii(raw).replace(/[,\s\u00A0]/g, "").replace(/(रू|rs\.?|npr|nrs|%)/gi, "").replace(/[—–]/g, "-").trim();
  if (s === "" || s === "-") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n === 0 ? 0 : n; // normalise -0
}

/** percentage cells like "106%", "१०६%", "- 0" → number (0 for blanks/dashes) */
function parsePct(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const raw = String(v).trim();
  if (raw === "" || raw === "-" || raw === "—" || raw === "- 0") return null;
  const n = parseAmount(raw);
  return n === null ? null : n;
}

/** map a sheet head name onto the office category id + colour */
function classifyCategory(name: string): { id: keyof typeof CAT_COLORS | "unknown"; en: string; np: string } {
  const s = npToAscii(name).trim().toLowerCase();
  if (/बहाल|rent/.test(s)) return { id: "rent", en: "Rent Income Tax", np: "बहाल कर" };
  if (/ब्याज|interest/.test(s)) return { id: "interest", en: "Interest Tax", np: "ब्याज कर" };
  if (/मू\.?अ|vat|value added|मूल्य अभिवृद्धि/.test(s)) return { id: "vat", en: "Value Added Tax", np: "मू.अ.कर" };
  if (/अन्तःशुल्क|excise/.test(s)) return { id: "excise", en: "Excise Duty", np: "अन्तःशुल्क" };
  if (/अन्य|other/.test(s)) return { id: "other", en: "Other Taxes", np: "अन्य कर" };
  if (/आयकर|income tax/.test(s)) return { id: "income", en: "Income Tax", np: "आयकर" };
  return { id: "unknown", en: name, np: name };
}

const FALLBACK_COLORS = ["#0e7490", "#b45309", "#4d7c0f", "#9d174d", "#57534e", "#3730a3"];

export interface SeriesPreview {
  label: string;
  values: (number | null)[];
  total: number;
}

export interface OfficeImportResult {
  partial: Partial<OfficeData>;
  logs: LogEntry[];
  preview: { kind: "matrix" | "categories"; series: SeriesPreview[]; categories: RevenueCategoryData[] };
  summary: { rows: number; ok: number; errors: number; warnings: number };
}

function classifySeries(label: string): "target" | "prev" | "current" | null {
  const s = npToAscii(label).toLowerCase();
  const isCollection = /collection|assuli|asuli|संकलन|असुली|assul/.test(s);
  const isTarget = /target|लक्ष्य/.test(s);
  if (isTarget && !isCollection) return "target";
  if (/2082|गत|previous/.test(s)) return "prev";
  if (/2083|हाल|current/.test(s) && isCollection) return "current";
  if (isCollection) return "prev";
  return null;
}

export async function parseOfficeFile(file: File): Promise<OfficeImportResult> {
  const XLSX = await import("xlsx");
  const logs: LogEntry[] = [];
  const now = Date.now();
  let seq = 0;
  const pushLog = (level: LogLevel, msg: { en: string; np: string }, row?: number, detail?: string) => {
    logs.push({ id: `xlog-${now}-${seq++}`, ts: now + seq, level, file: file.name, row, msg, detail });
  };

  const empty: OfficeImportResult = {
    partial: {},
    logs,
    preview: { kind: "matrix", series: [], categories: [] },
    summary: { rows: 0, ok: 0, errors: 0, warnings: 0 },
  };

  let aoa: unknown[][];
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null }) as unknown[][];
  } catch {
    pushLog("error", { en: "Could not read file", np: "फाइल पढ्न सकिएन" });
    return empty;
  }

  if (aoa.length < 2) {
    pushLog("error", { en: "Could not read file", np: "फाइल पढ्न सकिएन" }, undefined, "empty sheet");
    return empty;
  }

  /* ---------- 1) monthly matrix format ---------- */
  let headerRow = -1;
  let colByMonth: Record<number, number> = {};
  for (let r = 0; r < Math.min(6, aoa.length); r++) {
    const found: Record<number, number> = {};
    (aoa[r] ?? []).forEach((cell, c) => {
      if (cell === null || cell === undefined) return;
      const m = matchMonth(String(cell));
      if (m !== null && found[m] === undefined) found[m] = c;
    });
    if (Object.keys(found).length >= 6) {
      headerRow = r;
      colByMonth = found;
      break;
    }
  }

  if (headerRow >= 0) {
    pushLog(
      "info",
      { en: "File parsed successfully", np: "फाइल सफलतापूर्वक पढियो" },
      undefined,
      `monthly matrix · ${Object.keys(colByMonth).length} month columns`
    );
    const partial: Partial<OfficeData> = {};
    const series: SeriesPreview[] = [];
    let ok = 0;
    let errors = 0;

    for (let r = headerRow + 1; r < aoa.length; r++) {
      const row = aoa[r] ?? [];
      const label = String(row[0] ?? "").trim();
      if (!label) continue;
      const kind = classifySeries(label);
      if (!kind) {
        pushLog("warning", { en: "Row skipped — unrecognised series label", np: "पङ्क्ति छोडियो — अपरिचित शीर्षक" }, r + 1, `label="${label}"`);
        continue;
      }
      const values: (number | null)[] = Array(12).fill(null);
      let bad = 0;
      Object.entries(colByMonth).forEach(([mIdx, cIdx]) => {
        const v = parseAmount(row[cIdx]);
        if (v === null && row[cIdx] !== null && row[cIdx] !== undefined && String(row[cIdx]).trim() !== "") {
          bad++;
          errors++;
          pushLog("error", { en: "Amount must be a number", np: "रकम अङ्कमा हुनुपर्छ" }, r + 1, `${MONTH_COLS[Number(mIdx)].en}="${row[cIdx]}"`);
        }
        values[Number(mIdx)] = v;
      });
      if (bad > 0) { continue; }
      const total = values.reduce<number>((s, v) => s + (v ?? 0), 0);
      series.push({ label, values, total });
      ok++;
      if (kind === "target") partial.target = values.map((v) => (v === null ? 0 : Math.round(v * 100) / 100));
      if (kind === "prev") {
        partial.collectedPrev = values.map((v) => v ?? 0);
        if (values[0] !== null) partial.prevShrawan = values[0];
      }
      if (kind === "current") partial.collectedCurrent = values;
      pushLog("success", { en: "Row accepted", np: "पङ्क्ति स्वीकृत" }, r + 1, `${label} — 12 months, total ${Math.round(total).toLocaleString("en-US")}`);
    }

    if (partial.target) partial.annualTarget = Math.round(partial.target.reduce((s, v) => s + v, 0) * 100) / 100;

    pushLog(
      "info",
      { en: "Import session finished", np: "आयात सत्र समाप्त भयो" },
      undefined,
      `${ok} series ok · ${errors} failed cells`
    );
    return { partial, logs, preview: { kind: "matrix", series, categories: [] }, summary: { rows: series.length + errors, ok, errors, warnings: 0 } };
  }

  /* ---------- 1b) column-based monthly trend
     headers: Month | Target of 2083/084 | Collection of 2083/084 |
              Collection of 2082/083 | Expected Revenue Growth % ---------- */
  for (let r = 0; r < Math.min(6, aoa.length); r++) {
    const cells = (aoa[r] ?? []).map((c) => npToAscii(String(c ?? "")).toLowerCase().trim());
    const monthCol = cells.findIndex((c) => /^(month|महिना)$/.test(c));
    const targetCol = cells.findIndex((c) => /target of 20\d\d|लक्ष्य/.test(c) && !/growth/.test(c));
    const currCol = cells.findIndex((c) => /collection of 2083|collection of (current|this)|हालको|चालु/.test(c));
    const prevCol = cells.findIndex((c) => /collection of 2082|collection of (previous|prev|last)|गत (आ\.?व|वर्ष)/.test(c));
    if (monthCol >= 0 && (targetCol >= 0 || currCol >= 0 || prevCol >= 0)) {
      pushLog(
        "info",
        { en: "File parsed successfully", np: "फाइल सफलतापूर्वक पढियो" },
        undefined,
        "monthly trend · column format"
      );
      const target: (number | null)[] = Array(12).fill(null);
      const curr: (number | null)[] = Array(12).fill(null);
      const prev: (number | null)[] = Array(12).fill(null);
      let ok = 0;
      let errors = 0;
      const series: SeriesPreview[] = [];

      for (let i = r + 1; i < aoa.length; i++) {
        const row = aoa[i] ?? [];
        const mName = String(row[monthCol] ?? "").trim();
        if (!mName) continue;
        const m = matchMonth(mName);
        if (m === null) {
          errors++;
          pushLog("error", { en: "Invalid month (use 1–12 or BS month name)", np: "अमान्य महिना (१–१२ वा नेपाली महिना नाम प्रयोग गर्नुहोस्)" }, i + 1, `month="${mName}"`);
          continue;
        }
        const readInto = (col: number, arr: (number | null)[]) => {
          if (col < 0) return;
          const cell = row[col];
          if (cell === null || cell === undefined || String(cell).trim() === "") return;
          const v = parseAmount(cell);
          if (v === null) {
            errors++;
            pushLog("error", { en: "Amount must be a number", np: "रकम अङ्कमा हुनुपर्छ" }, i + 1, `${MONTH_COLS[m].en}="${cell}"`);
            return;
          }
          arr[m] = v;
        };
        readInto(targetCol, target);
        readInto(currCol, curr);
        readInto(prevCol, prev);
        ok++;
        pushLog("success", { en: "Row accepted", np: "पङ्क्ति स्वीकृत" }, i + 1, MONTH_COLS[m].en);
      }

      const partial: Partial<OfficeData> = {};
      if (target.some((v) => v !== null)) {
        partial.target = target.map((v) => (v === null ? 0 : Math.round(v * 100) / 100));
        partial.annualTarget = Math.round(target.reduce<number>((s, v) => s + (v ?? 0), 0) * 100) / 100;
        series.push({ label: "Target of 2083/084", values: target, total: target.reduce<number>((s, v) => s + (v ?? 0), 0) });
      }
      if (curr.some((v) => v !== null)) {
        partial.collectedCurrent = curr;
        series.push({ label: "Collection of 2083/084", values: curr, total: curr.reduce<number>((s, v) => s + (v ?? 0), 0) });
      }
      if (prev.some((v) => v !== null)) {
        partial.collectedPrev = prev.map((v) => v ?? 0);
        if (prev[0] !== null) partial.prevShrawan = prev[0];
        series.push({ label: "Collection of 2082/083", values: prev, total: prev.reduce<number>((s, v) => s + (v ?? 0), 0) });
      }

      pushLog(
        "info",
        { en: "Import session finished", np: "आयात सत्र समाप्त भयो" },
        undefined,
        `${ok} months ok · ${errors} failed cells`
      );
      return { partial, logs, preview: { kind: "matrix", series, categories: [] }, summary: { rows: ok + errors, ok, errors, warnings: 0 } };
    }
  }

  /* ---------- 2) Book1 category format
     headers: राजस्व शीर्षक | वार्षिक लक्ष्य | महिनाको लक्ष्य | महिनाको असुली |
              महिनाको असुली % | गत आ.व.को महिनासम्मको असुली | चालु आ.व.मा वृद्धि ---------- */
  let headRow = -1;
  let headCol = 0;
  let annualCol = -1;
  let monthTCol = -1;
  let collCol = -1;
  let achCol = -1;
  let prevCol = -1;
  let growthCol = -1;
  let nextCol = -1;
  for (let r = 0; r < Math.min(6, aoa.length); r++) {
    const cells = (aoa[r] ?? []).map((c) => npToAscii(String(c ?? "")).toLowerCase());
    const annualIdx = cells.findIndex((c) => /वार्षिक लक्ष्य|annual target/.test(c));
    const achIdx = cells.findIndex((c) => /(असुली|collection)\s*%/.test(c));
    const monthTIdx = cells.findIndex((c) => /महिनाको लक्ष्य|monthly target/.test(c));
    const collIdx = cells.findIndex((c) => c !== cells[achIdx] && /महिनाको असुली|monthly collection|असुली/.test(c) && !/%/.test(c));
    const prevIdx = cells.findIndex((c) => /गत आ\.?व|गत वर्ष|previous year/.test(c));
    const growthIdx = cells.findIndex((c) => /वृद्धि|growth/.test(c) && !/expected/.test(c));
    const nextIdx = cells.findIndex((c) => /अर्को महिना|next month/.test(c));
    const hasHeaderNames = cells.some((c) => /राजस्व शीर्षक|revenue head|शीर्षक/.test(c));
    if ((annualIdx >= 0 && collIdx >= 0) || (hasHeaderNames && (annualIdx >= 0 || collIdx >= 0))) {
      headRow = r;
      annualCol = annualIdx;
      monthTCol = monthTIdx;
      collCol = collIdx;
      achCol = achIdx;
      prevCol = prevIdx;
      growthCol = growthIdx;
      nextCol = nextIdx;
      headCol = cells.findIndex((c) => /राजस्व शीर्षक|revenue head|शीर्षक|head|particular/.test(c));
      if (headCol === -1) headCol = 0;
      break;
    }
  }

  if (headRow >= 0) {
    pushLog(
      "info",
      { en: "File parsed successfully", np: "फाइल सफलतापूर्वक पढियो" },
      undefined,
      "revenue category summary (Book1 format)"
    );
    const categories: RevenueCategoryData[] = [];
    let ok = 0;
    let errors = 0;
    let unknownSeq = 0;
    let grandTotal: { annual: number; mT: number; mC: number; prev: number } | null = null;

    for (let r = headRow + 1; r < aoa.length; r++) {
      const row = aoa[r] ?? [];
      const name = String(row[headCol] ?? "").trim();
      if (!name) continue;
      const norm = npToAscii(name).toLowerCase();
      const annual = parseAmount(row[annualCol]) ?? 0;
      const mT = parseAmount(row[monthTCol]);
      const mC = parseAmount(row[collCol]);
      const prev = prevCol >= 0 ? parseAmount(row[prevCol]) ?? 0 : 0;
      const sheetAch = achCol >= 0 ? parsePct(row[achCol]) : null;
      const sheetGrowth = growthCol >= 0 ? parsePct(row[growthCol]) : null;
      const nextT = nextCol >= 0 ? parseAmount(row[nextCol]) ?? 0 : 0;

      const isTotal = /कुल जम्मा|grand total|^कुल|जम्मा \(grand/.test(norm);
      const isSubtotal = !isTotal && /^जम्मा|total (income|tax)|योग/.test(norm) && /जम्मा|total|योग/.test(norm);

      if (mT === null || mC === null) {
        errors++;
        pushLog("error", { en: "Missing required value", np: "आवश्यक मान छैन" }, r + 1, `head="${name}" — need महिनाको लक्ष्य & महिनाको असुली`);
        continue;
      }

      if (isTotal) {
        grandTotal = { annual, mT, mC, prev };
        pushLog(
          "success",
          { en: "Grand total row captured", np: "कुल जम्मा पङ्क्ति लिइयो" },
          r + 1,
          `collection=${mC.toLocaleString("en-US")} · target=${mT.toLocaleString("en-US")} · prev=${prev.toLocaleString("en-US")}`
        );
        continue;
      }

      const cls = classifyCategory(name);
      const id = cls.id === "unknown" ? `cat-${++unknownSeq}` : cls.id;
      const color = cls.id === "unknown" ? FALLBACK_COLORS[(unknownSeq - 1) % FALLBACK_COLORS.length] : CAT_COLORS[cls.id as keyof typeof CAT_COLORS];
      const achievement = sheetAch !== null ? Math.round(sheetAch) : mT > 0 ? Math.round((mC / mT) * 100) : 0;
      const growth = sheetGrowth !== null ? Math.round(sheetGrowth) : prev > 0 ? Math.round((mC / prev) * 100) : 0;

      categories.push({
        id,
        name: cls.id === "unknown" ? name : cls.en,
        nameNepali: cls.id === "unknown" ? name : cls.np,
        color,
        annualTarget: annual,
        monthlyTarget: mT,
        monthlyCollection: mC,
        achievementPercent: achievement,
        contributionPercent: 0, // filled after the total is known
        previousYearCollection: prev,
        growthPercent: growth,
        nextMonthTarget: nextT,
        ...(isSubtotal ? { isSubtotal: true } : {}),
      });
      ok++;
      pushLog(
        "success",
        { en: "Row accepted", np: "पङ्क्ति स्वीकृत" },
        r + 1,
        `${name} — collected ${mC.toLocaleString("en-US")} / target ${mT.toLocaleString("en-US")} (${achievement}%)`
      );
    }

    /* योगदान % = category collection ÷ total collection (auto-calculated) */
    const mains = categories.filter((c) => !c.isSubtotal);
    const totalColl = grandTotal ? grandTotal.mC : mains.reduce((s, c) => s + c.monthlyCollection, 0);
    const totalPrev = grandTotal ? grandTotal.prev : mains.reduce((s, c) => s + c.previousYearCollection, 0);
    const totalMT = grandTotal ? grandTotal.mT : mains.reduce((s, c) => s + c.monthlyTarget, 0);
    const totalAnnual = grandTotal ? grandTotal.annual : mains.reduce((s, c) => s + c.annualTarget, 0);
    categories.forEach((c) => {
      c.contributionPercent = totalColl > 0 ? Math.round((c.monthlyCollection / totalColl) * 100 * 100) / 100 : 0;
    });

    if (!grandTotal && totalColl > 0) {
      categories.push({
        id: "income",
        name: "Grand Total",
        nameNepali: "कुल जम्मा",
        color: "#0b2260",
        annualTarget: Math.round(totalAnnual * 100) / 100,
        monthlyTarget: totalMT,
        monthlyCollection: totalColl,
        achievementPercent: totalMT > 0 ? Math.round((totalColl / totalMT) * 100) : 0,
        contributionPercent: 100,
        previousYearCollection: totalPrev,
        growthPercent: totalPrev > 0 ? Math.round((totalColl / totalPrev) * 100) : 0,
        nextMonthTarget: 0,
        isTotal: true,
      });
    } else if (grandTotal) {
      categories.push({
        id: "income",
        name: "Grand Total",
        nameNepali: "कुल जम्मा",
        color: "#0b2260",
        annualTarget: grandTotal.annual,
        monthlyTarget: grandTotal.mT,
        monthlyCollection: grandTotal.mC,
        achievementPercent: grandTotal.mT > 0 ? Math.round((grandTotal.mC / grandTotal.mT) * 100) : 0,
        contributionPercent: 100,
        previousYearCollection: grandTotal.prev,
        growthPercent: grandTotal.prev > 0 ? Math.round((grandTotal.mC / grandTotal.prev) * 100) : 0,
        nextMonthTarget: 0,
        isTotal: true,
      });
    }

    const partial: Partial<OfficeData> = { categories };
    const annual = grandTotal ? grandTotal.annual : totalAnnual;
    if (annual > 0) partial.annualTarget = Math.round(annual * 100) / 100;
    if (totalColl > 0) {
      partial.collectedCurrent = [totalColl, null, null, null, null, null, null, null, null, null, null, null];
    }
    if (totalPrev > 0) partial.prevShrawan = totalPrev;

    pushLog(
      "info",
      { en: "Import session finished", np: "आयात सत्र समाप्त भयो" },
      undefined,
      `${ok} categories ok · ${errors} failed · total collection ${Math.round(totalColl).toLocaleString("en-US")}`
    );
    return {
      partial,
      logs,
      preview: { kind: "categories", series: [], categories },
      summary: { rows: ok + errors, ok, errors, warnings: 0 },
    };
  }

  pushLog(
    "error",
    { en: "Sheet format not recognised — need month columns or राजस्व शीर्षक / वार्षिक लक्ष्य / महिनाको असुली headers", np: "सिट ढाँचा चिनिएन — महिना स्तम्भ वा राजस्व शीर्षक / वार्षिक लक्ष्य / महिनाको असुली हेडर चाहिन्छ" },
    1
  );
  return { ...empty, summary: { rows: 0, ok: 0, errors: 1, warnings: 0 } };
}

/** Demo of "Revenue target of each month.xlsx" — column format with the exact official figures */
export function demoMatrixBatch(): { aoa: unknown[][]; name: string } {
  return {
    name: "Revenue target of each month.xlsx",
    aoa: [
      ["Month", "Target of 2083/084", "Collection of 2083/084", "Collection of 2082/083", "Expected Revenue Growth %"],
      ["SHRAWAN", 448554.09, 552725, 438389, "126%"],
      ["BHADRA", 339045.98, "", 280467, ""],
      ["ASWIN", 403546.58, "", 314019, ""],
      ["KARTIK", 385971.21, "", 368815, ""],
      ["MANGSIR", 389928.21, "", 291009, ""],
      ["POUSH", 834701.76, "", 642298, ""],
      ["MAGH", 407937.1, "", 336013, ""],
      ["FALGUN", 392044.73, "", 333433, ""],
      ["CHAITRA", 694164.81, "", 592813, ""],
      ["BAISAKH", 486504.43, "", 388639, ""],
      ["JESTHA", 481863.93, "", 405077, ""],
      ["ASAR", 857428.16, "", 529066, ""],
    ],
  };
}

/** Demo of "Book1.xlsx" — exact category rows, Nepali digits & "- 0" included to prove parsing */
export function demoBook1Batch(): { aoa: unknown[][]; name: string } {
  return {
    name: "Book1.xlsx",
    aoa: [
      ["राजस्व शीर्षक", "वार्षिक लक्ष्य", "महिनाको लक्ष्य", "महिनाको असुली", "महिनाको असुली %", "गत आ.व.को महिनासम्मको असुली", "चालु आ.व.मा वृद्धि"],
      ["आयकर", "2,282,628", "136,409", "१४४,८३६", "106%", "93,698", "155%"],
      ["बहाल कर", "36,057", "2,895", "1,921", "66%", "९२२", "208%"],
      ["ब्याज कर", "101,858", "22,289", "9,065", "41%", "11,012", "82%"],
      ["जम्मा आयकर", "2,420,543", "161,593", "155,822", "96%", "105,632", "148%"],
      ["मू.अ.कर", "1,766,107", "154,840", "224,102", "145%", "177,602", "126%"],
      ["अन्तःशुल्क", "1,935,042", "132,121", "170,015", "129%", "155,154", "110%"],
      ["अन्य कर", "- 0", "271", "2,786", "1,027%", "78", "3,572%"],
      ["कुल जम्मा", "6,121,691", "448,825", "552,725", "123%", "438,467", "126%"],
    ],
  };
}
