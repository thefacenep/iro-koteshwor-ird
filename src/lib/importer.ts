import { CATEGORIES, CURRENT_FY, MONTHS, round1, type CategoryId, type RevenueRecord } from "../data/seed";

export type LogLevel = "success" | "error" | "warning" | "info";

export interface LogEntry {
  id: string;
  ts: number;
  level: LogLevel;
  file: string;
  row?: number;
  msg: { en: string; np: string };
  detail?: string;
}

export interface PreviewRow {
  row: number;
  month: string;
  category: string;
  collected: string;
  status: "success" | "error" | "warning";
  note: { en: string; np: string } | null;
}

export interface ImportResult {
  records: RevenueRecord[];
  logs: LogEntry[];
  preview: PreviewRow[];
  summary: { success: number; errors: number; warnings: number; rows: number };
}

export const TEMPLATE_CSV = `month,category,collected,target
1,Income Tax,41.2,46
1,Value Added Tax,48.5,54
2,Excise Duty,15.8,17
3,Customs Duty,29.4,31
4,Other Taxes,9.6,10`;

const DEFAULT_TARGETS: Record<CategoryId, number> = {
  income: 46,
  vat: 54,
  excise: 17,
  customs: 31,
  other: 10,
};

const NP_DIGITS = "०१२३४५६७८९";

function npToAscii(s: string): string {
  return s.replace(/[०-९]/g, (d) => String(NP_DIGITS.indexOf(d)));
}

function parseMonth(v: unknown): number | null {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const s = npToAscii(String(v)).trim().toLowerCase();
  const num = Number(s);
  if (!Number.isNaN(num) && num >= 1 && num <= 12) return num - 1;
  for (let i = 0; i < MONTHS.length; i++) {
    const m = MONTHS[i];
    if (
      m.en.toLowerCase() === s ||
      m.shortEn.toLowerCase() === s ||
      m.np === String(v).trim() ||
      m.shortNp === String(v).trim()
    )
      return i;
  }
  return null;
}

function parseCategory(v: unknown): CategoryId | null {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const s = String(v).trim().toLowerCase();
  for (const c of CATEGORIES) {
    if (c.id === s || c.en.toLowerCase() === s || c.np === String(v).trim()) return c.id;
    if (c.en.toLowerCase().startsWith(s) && s.length >= 3) return c.id;
  }
  return null;
}

function parseAmount(v: unknown): number | null {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = npToAscii(String(v)).replace(/,/g, "").replace(/(रू|rs\.?|npr)/gi, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function findCol(headers: string[], patterns: RegExp[]): number {
  return headers.findIndex((h) => patterns.some((p) => p.test(npToAscii(h).toLowerCase().trim())));
}

/** Core validation pipeline — used by both file upload and the demo batch */
export function validateRows(aoa: unknown[][], fileName: string, existing: RevenueRecord[]): ImportResult {
  const records: RevenueRecord[] = [];
  const logs: LogEntry[] = [];
  const preview: PreviewRow[] = [];
  let success = 0;
  let errors = 0;
  let warnings = 0;
  const now = Date.now();
  let seq = 0;

  const pushLog = (level: LogLevel, msg: { en: string; np: string }, row?: number, detail?: string) => {
    logs.push({ id: `log-${now}-${seq++}`, ts: now + seq, level, file: fileName, row, msg, detail });
  };

  if (aoa.length < 2) {
    pushLog("error", { en: "Could not read file", np: "फाइल पढ्न सकिएन" }, undefined, "empty sheet");
    return { records, logs, preview, summary: { success, errors: 1, warnings, rows: 0 } };
  }

  const headers = aoa[0].map((h) => String(h ?? ""));
  const cMonth = findCol(headers, [/month/, /mahina/, /महिना/]);
  const cCat = findCol(headers, [/category/, /head/, /shirshak/, /शीर्षक/]);
  const cColl = findCol(headers, [/collect/, /revenue/, /amount/, /sankalan/, /संकलन/]);
  const cTarget = findCol(headers, [/target/, /laksya/, /लक्ष्य/]);
  const cPrev = findCol(headers, [/prev/, /previous/, /गत/]);
  const cFy = findCol(headers, [/fy/, /fiscal/, /^year/, /आ\.?व\./]);

  if (cMonth === -1 || cCat === -1 || cColl === -1) {
    pushLog(
      "error",
      { en: "Missing required columns", np: "आवश्यक स्तम्भ छैनन्" },
      1,
      "need: month, category, collected"
    );
    return { records, logs, preview, summary: { success, errors: 1, warnings, rows: 0 } };
  }

  pushLog("info", { en: "File parsed successfully", np: "फाइल सफलतापूर्वक पढियो" }, undefined, `${aoa.length - 1} rows found`);

  for (let i = 1; i < aoa.length; i++) {
    const r = aoa[i];
    if (!r || r.every((c) => c === null || c === undefined || String(c).trim() === "")) continue;
    const rowNo = i + 1;
    const month = parseMonth(r[cMonth]);
    const category = parseCategory(r[cCat]);
    const collected = parseAmount(r[cColl]);
    const targetRaw = cTarget === -1 ? null : parseAmount(r[cTarget]);
    const prevRaw = cPrev === -1 ? null : parseAmount(r[cPrev]);
    const fyRaw = cFy === -1 ? null : String(r[cFy] ?? "").trim();

    let status: PreviewRow["status"] = "success";
    let note: PreviewRow["note"] = null;

    const msgMap = {
      missing: { en: "Missing required value", np: "आवश्यक मान छैन" },
      category: { en: "Unknown tax category", np: "अज्ञात कर शीर्षक" },
      month: { en: "Invalid month (use 1–12 or BS month name)", np: "अमान्य महिना (१–१२ वा नेपाली महिना नाम प्रयोग गर्नुहोस्)" },
      numeric: { en: "Amount must be a number", np: "रकम अङ्कमा हुनुपर्छ" },
      negative: { en: "Amount cannot be negative", np: "रकम ऋणात्मक हुन सक्दैन" },
    } as const;
    type ErrKey = keyof typeof msgMap;
    let errKey: ErrKey | null = null;
    let errDetail = "";

    if (month === null) { errKey = "month"; errDetail = `month="${r[cMonth]}"`; }
    else if (category === null) { errKey = "category"; errDetail = `category="${r[cCat]}"`; }
    else if (collected === null) { errKey = "numeric"; errDetail = `collected="${r[cColl]}"`; }
    else if (collected < 0) { errKey = "negative"; errDetail = `collected=${collected}`; }

    if (errKey) {
      status = "error";
      note = msgMap[errKey];
      pushLog("error", msgMap[errKey], rowNo, errDetail);
    }

    if (status === "error") {
      errors++;
      preview.push({
        row: rowNo,
        month: String(r[cMonth] ?? "—"),
        category: String(r[cCat] ?? "—"),
        collected: String(r[cColl] ?? "—"),
        status,
        note,
      });
      continue;
    }

    const cat = category as CategoryId;
    const mon = month as number;
    const target = targetRaw !== null && targetRaw > 0 ? round1(targetRaw) : DEFAULT_TARGETS[cat];
    const prev = prevRaw !== null ? round1(prevRaw) : round1((collected as number) / 1.15);
    const fy = fyRaw && /^\d{2,4}[/\-]\d{2}$/.test(npToAscii(fyRaw))
      ? npToAscii(fyRaw).replace("-", "/")
      : CURRENT_FY;

    const isDup = existing.some((e) => e.fy === fy && e.month === mon && e.category === cat);
    if (isDup) {
      status = "warning";
      note = { en: "Possible duplicate — accepted with flag", np: "सम्भावित नक्कल — चिन्हसहित स्वीकृत" };
      warnings++;
      pushLog("warning", note as { en: string; np: string }, rowNo, `${MONTHS[mon].en} / ${cat}`);
    } else if ((collected as number) > 3 * target) {
      status = "warning";
      note = { en: "Value unusually high — accepted with warning", np: "असामान्य उच्च मान — चेतावनीसहित स्वीकृत" };
      warnings++;
      pushLog("warning", note as { en: string; np: string }, rowNo, `collected=${collected}`);
    } else {
      success++;
      pushLog("success", { en: "Row accepted", np: "पङ्क्ति स्वीकृत" }, rowNo, `${MONTHS[mon].en} / ${cat} = ${round1(collected as number)}`);
    }

    records.push({
      id: `imp-${now}-${rowNo}`,
      fy,
      month: mon,
      category: cat,
      collected: round1(collected as number),
      target,
      prevCollected: prev,
      source: "import",
      importedAt: now,
    });

    preview.push({
      row: rowNo,
      month: MONTHS[mon].en,
      category: cat,
      collected: String(round1(collected as number)),
      status,
      note,
    });
  }

  pushLog(
    "info",
    { en: "Import session finished", np: "आयात सत्र समाप्त भयो" },
    undefined,
    `${success} ok · ${errors} failed · ${warnings} warnings`
  );

  return { records, logs, preview, summary: { success, errors, warnings, rows: aoa.length - 1 } };
}

/** Parse an uploaded .xlsx / .xls / .csv file */
export async function parseFile(file: File, existing: RevenueRecord[]): Promise<ImportResult> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
  return validateRows(aoa as unknown[][], file.name, existing);
}

/** Simulated batch containing deliberate problems so the error log can be demonstrated */
export function demoBatch(existing: RevenueRecord[]): ImportResult {
  const aoa: unknown[][] = [
    ["month", "category", "collected", "target"],
    ["श्रावण", "आय कर", "४३.५", "४६"],
    ["Bhada", "Value Added Tax", "51.2", "54"],
    ["Ashoj", "Excise Duty", "16.4", "17"],
    ["Kartik", "Customs Duty", "30.1", "31"],
    ["Mangsir", "Other Taxes", "10.4", "10"],
    ["Poush", "Income Tax", "47.8", "46"],
    ["Magh", "Road Construction Tax", "12.0", "12"],
    ["13", "VAT", "44.0", "54"],
    ["Fagun", "Excise Duty", "N/A", "17"],
    ["Chaitra", "Customs Duty", "-5.0", "31"],
    ["Baisakh", "Income Tax", "152.0", "46"],
    ["Jestha", "Value Added Tax", "60.3", "54"],
  ];
  return validateRows(aoa, "demo_batch_2082-02-14.xlsx", existing);
}
