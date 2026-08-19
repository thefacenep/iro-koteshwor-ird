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
import { MONTH_COLS, type OfficeData, type OfficeHead } from "../data/office";
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
  if (v === null || v === undefined || String(v).trim() === "" || String(v).trim() === "-") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = npToAscii(String(v)).replace(/[,\s]/g, "").replace(/(रू|rs\.?|npr|nrs)/gi, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export interface SeriesPreview {
  label: string;
  values: (number | null)[];
  total: number;
}

export interface OfficeImportResult {
  partial: Partial<OfficeData>;
  logs: LogEntry[];
  preview: { kind: "matrix" | "heads"; series: SeriesPreview[]; heads: OfficeHead[] };
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
    preview: { kind: "matrix", series: [], heads: [] },
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
    return { partial, logs, preview: { kind: "matrix", series, heads: [] }, summary: { rows: series.length + errors, ok, errors, warnings: 0 } };
  }

  /* ---------- 2) Book1 revenue-head format ---------- */
  let headRow = -1;
  let headCol = 0;
  let targetCol = -1;
  let collCol = -1;
  for (let r = 0; r < Math.min(6, aoa.length); r++) {
    const cells = (aoa[r] ?? []).map((c) => npToAscii(String(c ?? "")).toLowerCase());
    const tIdx = cells.findIndex((c) => /वार्षिक लक्ष्य|annual target|लक्ष्य/.test(c));
    const cIdx = cells.findIndex((c) => /असुली|collection|संकलन|श्रावण/.test(c));
    if (tIdx >= 0 && cIdx >= 0) {
      headRow = r;
      targetCol = tIdx;
      collCol = cIdx;
      headCol = cells.findIndex((c) => /राजस्व शीर्षक|revenue head|शीर्षक|head|particular/.test(c));
      if (headCol === -1) headCol = Math.min(tIdx, cIdx) === 0 ? 0 : 0;
      break;
    }
  }

  if (headRow >= 0) {
    pushLog(
      "info",
      { en: "File parsed successfully", np: "फाइल सफलतापूर्वक पढियो" },
      undefined,
      "revenue-head summary (Book1 format)"
    );
    const heads: OfficeHead[] = [];
    let ok = 0;
    let errors = 0;
    let totalTargetRow: number | null = null;
    let totalCollRow: number | null = null;

    for (let r = headRow + 1; r < aoa.length; r++) {
      const row = aoa[r] ?? [];
      const name = String(row[headCol] ?? "").trim();
      if (!name) continue;
      const target = parseAmount(row[targetCol]);
      const collected = parseAmount(row[collCol]);
      const isTotal = /जम्मा|grand total|total|योग/.test(npToAscii(name).toLowerCase());
      if (target === null || collected === null) {
        errors++;
        pushLog("error", { en: "Missing required value", np: "आवश्यक मान छैन" }, r + 1, `head="${name}"`);
        continue;
      }
      if (isTotal) {
        totalTargetRow = target;
        totalCollRow = collected;
        pushLog("success", { en: "Total row captured", np: "जम्मा पङ्क्ति लिइयो" }, r + 1, `target=${target.toLocaleString("en-US")} · collected=${collected.toLocaleString("en-US")}`);
        continue;
      }
      heads.push({ name, target, collected });
      ok++;
      pushLog("success", { en: "Row accepted", np: "पङ्क्ति स्वीकृत" }, r + 1, `${name} = ${collected.toLocaleString("en-US")} / ${target.toLocaleString("en-US")}`);
    }

    const partial: Partial<OfficeData> = { heads };
    const sumT = heads.reduce((s, h) => s + h.target, 0);
    const sumC = heads.reduce((s, h) => s + h.collected, 0);
    partial.annualTarget = totalTargetRow ?? (sumT > 0 ? Math.round(sumT * 100) / 100 : undefined);
    if (sumC > 0 || totalCollRow !== null) {
      partial.collectedCurrent = [totalCollRow ?? sumC, null, null, null, null, null, null, null, null, null, null, null];
    }
    if (partial.annualTarget === undefined) delete partial.annualTarget;

    pushLog(
      "info",
      { en: "Import session finished", np: "आयात सत्र समाप्त भयो" },
      undefined,
      `${ok} heads ok · ${errors} failed`
    );
    return {
      partial,
      logs,
      preview: { kind: "heads", series: [], heads },
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

/** Demo of the monthly matrix format (exact official figures) */
export function demoMatrixBatch(): { aoa: unknown[][]; name: string } {
  return {
    name: "Revenue target of each month.xlsx",
    aoa: [
      ["Series", "SHRAWAN", "BHADRA", "ASWIN", "KARTIK", "MANGSIR", "POUSH", "MAGH", "FALGUN", "CHAITRA", "BAISAKH", "JESTHA", "ASAR", "TOTAL"],
      ["Target of 2083/084", 448554.09, 339045.98, 403546.58, 385971.21, 389928.21, 834701.76, 407937.1, 392044.73, 694164.81, 486504.43, 481863.93, 857428.16, 6121690.99],
      ["Collection of 2082/083", 438389, 280467, 314019, 368815, 291009, 642298, 336013, 333433, 592813, 388639, 405077, 529066, 4906449],
    ],
  };
}

/** Demo of the Book1 revenue-head format (illustrative heads summing to the official totals) */
export function demoBook1Batch(): { aoa: unknown[][]; name: string } {
  return {
    name: "Book1.xlsx",
    aoa: [
      ["राजस्व शीर्षक", "वार्षिक लक्ष्य", "महिनाको असुली (श्रावण सम्म)"],
      ["Income Tax", 2450000, 243500],
      ["Value Added Tax", 1980000, 187200],
      ["Excise Duty", 520000, 41800],
      ["Registration Fee", 350000, 32900],
      ["Fines & Penalties", 210000, 18650],
      ["Other Revenue", 611690.99, 28675],
      ["जम्मा (Grand Total)", 6121690.99, 552725],
    ],
  };
}
