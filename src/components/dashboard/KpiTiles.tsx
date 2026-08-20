import { achievementPct, collectedToDate, toCrore, yoyPct } from "../../data/office";
import { fmtNum, toNpDigits } from "../../lib/format";
import { useApp } from "../../lib/store";
import { CountUp, Reveal } from "../ui";

/** figures in thousand NPR, formatted exactly as in the office sheets (552,725 / 6,121,691) */
function fmtTh(n: number, lang: "en" | "np", decimals = 0): string {
  const out = n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return lang === "np" ? toNpDigits(out) : out;
}

export function KpiTiles() {
  const { t, lang, office } = useApp();

  const collected = collectedToDate(office);
  const achievement = achievementPct(office);
  const yoy = yoyPct(office);

  return (
    <Reveal>
      <div className="grid overflow-hidden rounded-lg border border-line bg-card shadow-sm md:grid-cols-2 xl:grid-cols-[1.35fr_1fr_1fr_1.15fr]">
        {/* primary — collected to date */}
        <div className="relative overflow-hidden bg-navy-dark p-5 text-white sm:p-6">
          <svg className="pointer-events-none absolute -right-6 -top-8 opacity-10" width="180" height="180" viewBox="0 0 64 64" aria-hidden="true">
            <path d="M18 6 L46 24 L30 26 L50 46 L18 52 Z" fill="#ffffff" />
          </svg>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
            <span className="live-dot h-2 w-2 rounded-full bg-[#3ecf9a]" aria-hidden="true" />
            {t("kpi_collected_shrawan")}
          </p>
          <p className="mt-3 font-display text-[2.4rem] leading-none tabular-nums sm:text-[3rem]">
            <CountUp value={collected} decimals={0} grouping="en-US" />
          </p>
          <p className="mt-1 text-sm font-bold text-gold">{t("thousand_npr")}</p>
          <p className="mt-3 text-xs font-medium text-white/65">
            ≈ {fmtNum(toCrore(collected), lang, 2)} {t("crore_word")} {lang === "np" ? "रुपैयाँ" : "NPR"} · {lang === "np" ? "श्रावण २०८३/०८४" : "Shrawan 2083/084"}
          </p>
        </div>

        {/* achievement — 123% */}
        <div className="border-t border-line p-5 sm:p-6 md:border-l md:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-crimson">{t("kpi_achievement")}</p>
          <p className="mt-3 font-display text-[2.2rem] leading-none text-navy-dark">
            <CountUp value={achievement} decimals={0} />
            <span className="text-xl">%</span>
          </p>
          <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-paper" role="img" aria-label={`${Math.round(achievement)}% ${t("of_target")}`}>
            <div className="grow-bar h-full rounded-full bg-gradient-to-r from-crimson to-crimson-dark" style={{ width: `${Math.min(100, achievement)}%` }} />
            {achievement > 100 && <span className="absolute right-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white" aria-hidden="true" />}
          </div>
          <p className="mt-2 text-xs font-medium text-ink-soft">
            {t("kpi_achievement_sub")} · {fmtTh(office.target[0] ?? 0, lang, 2)}
          </p>
        </div>

        {/* YoY growth — 126% */}
        <div className="border-t border-line p-5 sm:p-6 md:border-l md:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-pine">{t("kpi_growth")}</p>
          <p className="mt-3 flex items-start gap-2 font-display text-[2.2rem] leading-none text-navy-dark">
            <svg width="26" height="26" viewBox="0 0 24 24" className="mt-1 shrink-0" aria-hidden="true">
              <path d="M4 18 L10 11 L14 14.5 L20 7" fill="none" stroke="#0e7c66" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 7h5v5" fill="none" stroke="#0e7c66" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <CountUp value={yoy} decimals={0} />
            <span className="text-xl">%</span>
          </p>
          <p className="mt-4 text-xs font-medium text-ink-soft">
            {t("kpi_growth_sub")}: {fmtTh(office.prevShrawan, lang)}
          </p>
        </div>

        {/* annual target — 6,121,691 */}
        <div className="border-t border-line bg-paper/60 p-5 sm:p-6 md:border-l md:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-navy">{t("kpi_annual_target")}</p>
          <p className="mt-3 font-display text-[2.2rem] leading-none tabular-nums text-navy-dark">
            <CountUp value={office.annualTarget} decimals={0} grouping="en-US" />
          </p>
          <p className="mt-1 text-sm font-bold text-navy/70">{t("thousand_npr")}</p>
          <p className="mt-3 text-xs font-medium text-ink-soft">
            ≈ {fmtNum(toCrore(office.annualTarget), lang, 2)} {t("crore_word")} {lang === "np" ? "रुपैयाँ" : "NPR"}
          </p>
        </div>
      </div>
    </Reveal>
  );
}
