export type Lang = "en" | "np";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

export function toNpDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => NP_DIGITS[Number(d)]);
}

/** Number with Indian grouping (12,34,567) used in Nepal */
export function fmtNum(n: number, lang: Lang, decimals = 1): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const fixed = abs.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const out = sign + fixed;
  return lang === "np" ? toNpDigits(out) : out;
}

export function fmtInt(n: number, lang: Lang): string {
  return fmtNum(n, lang, 0);
}

/** NPR billions — the unit used across the portal */
export function fmtArba(n: number, lang: Lang, decimals = 1): string {
  return lang === "np" ? `${fmtNum(n, lang, decimals)} अर्ब` : `${fmtNum(n, lang, decimals)} Bn`;
}

export function fmtPct(n: number, lang: Lang, decimals = 1, signed = false): string {
  const s = (signed && n > 0 ? "+" : "") + fmtNum(n, lang, decimals) + "%";
  return lang === "np" ? s : s;
}

export function fmtFY(fy: string, lang: Lang): string {
  const label = lang === "np" ? `आ.व. ${toNpDigits(fy)}` : `FY ${fy}`;
  return label;
}

export function fmtTime(ts: number, lang: Lang): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const out = `${hh}:${mm}:${ss}`;
  return lang === "np" ? toNpDigits(out) : out;
}

export function fmtDate(ts: number, lang: Lang): string {
  const d = new Date(ts);
  const out = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return lang === "np" ? toNpDigits(out) : out;
}

export function fmtDateTime(ts: number, lang: Lang): string {
  return `${fmtDate(ts, lang)} · ${fmtTime(ts, lang)}`;
}

/** Download helper for CSV / JSON exports */
export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob(["\ufeff" + content], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

export function toCSV(rows: (string | number)[][]): string {
  return rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\n");
}
