import { useMemo } from "react";
import { aggregateByMonth, MONTHS, totals } from "../../data/seed";
import { fmtArba, fmtPct } from "../../lib/format";
import { useApp } from "../../lib/store";
import { CountUp, Reveal } from "../ui";

export function KpiTiles() {
  const { t, lang, records } = useApp();

  const k = useMemo(() => {
    const tot = totals(records);
    const byMonth = aggregateByMonth(records);
    const best = byMonth.reduce((a, b) => (b.collected > a.collected ? b : a), byMonth[0]);
    const achievement = (tot.collected / tot.target) * 100;
    const growth = ((tot.collected - tot.prev) / tot.prev) * 100;
    return { tot, best, achievement, growth };
  }, [records]);

  return (
    <Reveal>
      <div className="grid overflow-hidden rounded-lg border border-line bg-card shadow-sm md:grid-cols-2 xl:grid-cols-[1.35fr_1fr_1fr_1.15fr]">
        {/* primary tile */}
        <div className="relative overflow-hidden bg-navy-dark p-5 text-white sm:p-6">
          <svg className="pointer-events-none absolute -right-6 -top-8 opacity-10" width="180" height="180" viewBox="0 0 64 64" aria-hidden="true">
            <path d="M18 6 L46 24 L30 26 L50 46 L18 52 Z" fill="#ffffff" />
          </svg>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
            <span className="live-dot h-2 w-2 rounded-full bg-[#3ecf9a]" aria-hidden="true" />
            {t("kpi_total_rev")}
          </p>
          <p className="mt-3 font-display text-[2.4rem] leading-none sm:text-[3rem]">
            <CountUp value={k.tot.collected} decimals={1} />
          </p>
          <p className="mt-1 text-sm font-bold text-gold">{lang === "np" ? "अर्ब रुपैयाँ" : "Billion NPR"}</p>
          <p className="mt-3 text-xs font-medium text-white/65">
            {t("kpi_total_rev_sub")} · {t("annual_target")}: {fmtArba(k.tot.target, lang)}
          </p>
        </div>

        {/* achievement */}
        <div className="border-t border-line p-5 sm:p-6 md:border-l md:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-crimson">{t("kpi_achievement")}</p>
          <p className="mt-3 font-display text-[2.2rem] leading-none text-navy-dark">
            <CountUp value={k.achievement} decimals={1} />
            <span className="text-xl">%</span>
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-paper" role="img" aria-label={`${fmtPct(k.achievement, lang)} ${t("of_target")}`}>
            <div className="grow-bar h-full rounded-full bg-gradient-to-r from-crimson to-crimson-dark" style={{ width: `${Math.min(100, k.achievement)}%` }} />
          </div>
          <p className="mt-2 text-xs font-medium text-ink-soft">
            {fmtArba(k.tot.collected, lang)} / {fmtArba(k.tot.target, lang)} {t("of_target")}
          </p>
        </div>

        {/* growth */}
        <div className="border-t border-line p-5 sm:p-6 md:border-l md:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-pine">{t("kpi_growth")}</p>
          <p className="mt-3 flex items-start gap-2 font-display text-[2.2rem] leading-none text-navy-dark">
            <svg width="26" height="26" viewBox="0 0 24 24" className="mt-1 shrink-0" aria-hidden="true">
              <path d="M4 18 L10 11 L14 14.5 L20 7" fill="none" stroke="#0e7c66" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 7h5v5" fill="none" stroke="#0e7c66" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>
              <CountUp value={k.growth} decimals={1} />
              <span className="text-xl">%</span>
            </span>
          </p>
          <p className="mt-4 text-xs font-medium leading-relaxed text-ink-soft">
            {t("kpi_growth_sub")}: {fmtArba(k.tot.prev, lang)}
          </p>
        </div>

        {/* best month */}
        <div className="border-t border-line p-5 sm:p-6 md:border-l md:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-marigold">{t("kpi_top_month")}</p>
          <p className="mt-3 font-display text-[2.2rem] leading-none text-navy-dark">{MONTHS[k.best.month][lang === "np" ? "np" : "en"]}</p>
          <p className="mt-2 text-sm font-bold text-marigold">{fmtArba(k.best.collected, lang)}</p>
          <p className="mt-3 text-xs font-medium text-ink-soft">
            {t("kpi_top_month_sub")} · {fmtPct((k.best.collected / k.best.target) * 100, lang)} {t("achievement").toLowerCase()}
          </p>
        </div>
      </div>
    </Reveal>
  );
}
