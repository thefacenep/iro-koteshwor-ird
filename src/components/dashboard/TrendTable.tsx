import { MONTH_COLS, TOTAL_COLLECTION_PREV, TOTAL_TARGET, sum, type OfficeData } from "../../data/office";
import { toNpDigits } from "../../lib/format";
import { useApp } from "../../lib/store";

function fmtTh(n: number, lang: "en" | "np", decimals = 0): string {
  const out = n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return lang === "np" ? toNpDigits(out) : out;
}

/**
 * Horizontal monthly matrix — exact figures from
 * "Revenue target of each month.xlsx" plus Book1's current Shrawan collection.
 * Columns: SHRAWAN … ASAR + TOTAL (scrollable on small screens).
 */
export function TrendTable({ officeData, compact = false }: { officeData?: OfficeData; compact?: boolean }) {
  const { lang, office } = useApp();
  const d = officeData ?? office;

  const currentTotal = sum(d.collectedCurrent);

  const th = "px-3 py-2.5 text-right font-extrabold uppercase tracking-wide";
  const td = `px-3 ${compact ? "py-2" : "py-2.5"} text-right tabular-nums font-semibold`;

  return (
    <div className="log-scroll overflow-x-auto">
      <table className={`w-full min-w-[980px] border-collapse text-[13px] ${compact ? "text-[12px]" : ""}`}>
        <thead>
          <tr className="bg-navy-dark text-white">
            <th className="sticky left-0 z-10 bg-navy-dark px-3 py-2.5 text-left font-extrabold uppercase tracking-wide">
              {lang === "np" ? "विवरण" : "Particulars"}
            </th>
            {MONTH_COLS.map((m) => (
              <th key={m.en} className={`${th} whitespace-nowrap`}>{lang === "np" ? m.np : m.en}</th>
            ))}
            <th className={`${th} sticky right-0 z-10 whitespace-nowrap bg-crimson`}>
              {lang === "np" ? "जम्मा" : "TOTAL"}
            </th>
          </tr>
        </thead>
        <tbody>
          {/* row 1 — target 2083/084 */}
          <tr className="border-t border-line bg-paper/70 transition-colors hover:bg-navy/5">
            <td className="sticky left-0 z-10 border-r border-line bg-paper px-3 py-2.5 font-extrabold text-navy-dark">
              {lang === "np" ? "लक्ष्य २०८३/०८४" : "Target 2083/084"}
            </td>
            {d.target.map((v, i) => (
              <td key={i} className={`${td} text-navy-dark`}>{fmtTh(v, lang, 2)}</td>
            ))}
            <td className={`${td} sticky right-0 z-10 border-l-2 border-crimson/40 bg-[#fdeef1] font-extrabold text-crimson-dark`}>
              {fmtTh(d.annualTarget || TOTAL_TARGET, lang, 2)}
            </td>
          </tr>
          {/* row 2 — collection 2082/083 */}
          <tr className="border-t border-line transition-colors hover:bg-navy/5">
            <td className="sticky left-0 z-10 border-r border-line bg-card px-3 py-2.5 font-extrabold text-navy-dark">
              {lang === "np" ? "संकलन २०८२/०८३" : "Collection 2082/083"}
            </td>
            {d.collectedPrev.map((v, i) => (
              <td key={i} className={`${td} text-ink`}>{fmtTh(v, lang)}</td>
            ))}
            <td className={`${td} sticky right-0 z-10 border-l-2 border-crimson/40 bg-card font-extrabold text-navy-dark`}>
              {fmtTh(sum(d.collectedPrev) || TOTAL_COLLECTION_PREV, lang)}
            </td>
          </tr>
          {/* row 3 — current FY so far (Book1: Shrawan 552,725) */}
          <tr className="border-t-2 border-pine/40 bg-[#e9f6f0]/60 transition-colors hover:bg-[#e9f6f0]">
            <td className="sticky left-0 z-10 border-r border-line bg-[#e9f6f0] px-3 py-2.5 font-extrabold text-[#0b4a3c]">
              {lang === "np" ? "संकलन २०८३/०८४ (हाल)" : "Collection 2083/084 (to date)"}
            </td>
            {d.collectedCurrent.map((v, i) =>
              v === null ? (
                <td key={i} className={`${td} text-ink-soft/60`}>—</td>
              ) : (
                <td key={i} className={`${td} rounded-sm font-extrabold text-[#0b4a3c]`}>{fmtTh(v, lang)}</td>
              )
            )}
            <td className={`${td} sticky right-0 z-10 border-l-2 border-pine/50 bg-[#e9f6f0] font-extrabold text-[#0b4a3c]`}>
              {fmtTh(currentTotal, lang)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function TrendTableNote() {
  const { t } = useApp();
  return <p className="mt-3 px-1 text-[11px] font-semibold text-ink-soft">◈ {t("table_note")}</p>;
}
