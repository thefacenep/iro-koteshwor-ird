import { useMemo } from "react";
import { aggregateByMonth, MONTHS, round1 } from "../../data/seed";
import { fmtArba, fmtNum, fmtPct } from "../../lib/format";
import { useApp } from "../../lib/store";
import { Pill } from "../ui";

export function TrendTable({ compact = false }: { compact?: boolean }) {
  const { lang, records, t } = useApp();
  const rows = useMemo(() => aggregateByMonth(records), [records]);
  const maxCollected = Math.max(...rows.map((r) => r.collected));
  const tot = useMemo(() => {
    const target = round1(rows.reduce((s, r) => s + r.target, 0));
    const collected = round1(rows.reduce((s, r) => s + r.collected, 0));
    const prev = round1(rows.reduce((s, r) => s + r.prev, 0));
    return { target, collected, prev, ach: (collected / target) * 100, growth: ((collected - prev) / prev) * 100 };
  }, [rows]);

  return (
    <div className="overflow-x-auto">
      <table className={`w-full min-w-[620px] border-collapse text-sm ${compact ? "text-base" : ""}`}>
        <thead>
          <tr className="border-b-2 border-navy-dark text-left text-xs font-extrabold uppercase tracking-wider text-navy-dark">
            <th className="py-2.5 pr-3">{t("th_month")}</th>
            <th className="py-2.5 pr-3 text-right">{t("th_target")}</th>
            <th className="py-2.5 pr-3 text-right">{t("th_collected")}</th>
            <th className="py-2.5 pr-3 text-right">{t("th_achieved")}</th>
            <th className="py-2.5 pr-3 text-right">{t("th_growth")}</th>
            <th className="w-[26%] py-2.5">{t("th_status")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const ach = (r.collected / r.target) * 100;
            const growth = ((r.collected - r.prev) / r.prev) * 100;
            const tone = ach >= 98 ? "ok" : ach >= 88 ? "warn" : "bad";
            return (
              <tr key={r.month} className={`border-b border-line transition-colors hover:bg-crimson-soft/50 ${i % 2 ? "bg-paper/60" : ""}`}>
                <td className="py-2.5 pr-3 font-bold text-ink">{MONTHS[r.month][lang === "np" ? "np" : "en"]}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-ink-soft">{fmtNum(r.target, lang)}</td>
                <td className="py-2.5 pr-3 text-right font-bold tabular-nums text-ink">{fmtNum(r.collected, lang)}</td>
                <td className="py-2.5 pr-3 text-right">
                  <Pill tone={tone}>{fmtNum(ach, lang)}%</Pill>
                </td>
                <td className={`py-2.5 pr-3 text-right font-bold tabular-nums ${growth >= 0 ? "text-pine" : "text-crimson"}`}>
                  {growth >= 0 ? "▲" : "▼"} {fmtNum(Math.abs(growth), lang)}%
                </td>
                <td className="py-2.5">
                  <div className="h-2.5 overflow-hidden rounded-full bg-paper">
                    <div
                      className="grow-bar h-full rounded-full"
                      style={{ width: `${(r.collected / maxCollected) * 100}%`, background: tone === "ok" ? "#0e7c66" : tone === "warn" ? "#e07a00" : "#c8102e", animationDelay: `${i * 60}ms` }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-navy-dark bg-navy-dark text-white">
            <td className="py-3 pr-3 font-display">{t("total")}</td>
            <td className="py-3 pr-3 text-right font-bold tabular-nums">{fmtNum(tot.target, lang)}</td>
            <td className="py-3 pr-3 text-right font-bold tabular-nums text-gold">{fmtNum(tot.collected, lang)}</td>
            <td className="py-3 pr-3 text-right font-bold tabular-nums">{fmtNum(tot.ach, lang)}%</td>
            <td className="py-3 pr-3 text-right font-bold tabular-nums text-[#7fe0bd]">▲ {fmtNum(tot.growth, lang)}%</td>
            <td className="py-3 text-xs font-semibold text-white/70">{fmtArba(tot.collected, lang)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
