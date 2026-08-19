import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aggregateByMonth, CURRENT_FY, MONTHS, totals } from "../data/seed";
import { fmtArba, fmtNum, toNpDigits } from "../lib/format";
import { useApp } from "../lib/store";
import { DonutChart, GroupedBarChart, StackedBarChart, TrendLineChart } from "./dashboard/charts";
import { TrendTable } from "./dashboard/TrendTable";
import { Emblem } from "./ui";

export function BoardMode() {
  const { t, lang, records, setBoardOpen, officeActive } = useApp();
  const [slide, setSlide] = useState(0);
  const [clock, setClock] = useState(new Date());
  const reduced = useRef(false);

  const SLIDES = 6;

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(c);
  }, []);

  useEffect(() => {
    if (reduced.current) return;
    const timer = window.setInterval(() => setSlide((s) => (s + 1) % SLIDES), 9000);
    return () => window.clearInterval(timer);
  }, [slide]);

  const k = useMemo(() => {
    const tot = totals(records);
    const byMonth = aggregateByMonth(records);
    const best = byMonth.reduce((a, b) => (b.collected > a.collected ? b : a), byMonth[0]);
    return { tot, best, achievement: (tot.collected / tot.target) * 100, growth: ((tot.collected - tot.prev) / tot.prev) * 100 };
  }, [records]);

  const go = useCallback((dir: 1 | -1) => setSlide((s) => (s + dir + SLIDES) % SLIDES), []);

  const clockStr = clock.toLocaleTimeString("en-GB");

  const slideTitle = [
    officeActive ? t("office_name") : t("portal"),
    t("section_monthly"),
    t("section_trend"),
    t("section_share"),
    t("section_compare"),
    t("section_table"),
  ][slide];

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-paper pattern-bg"
      onClick={(e) => go(e.clientX > window.innerWidth / 2 ? 1 : -1)}
      role="region"
      aria-label={t("board_mode")}
    >
      {/* top bar */}
      <div className="flex items-center gap-4 bg-navy-deep px-6 py-3 text-white">
        <Emblem size={44} />
        <div className="mr-auto leading-tight">
          <p className="font-display text-lg sm:text-xl">{officeActive ? t("office_name") : t("portal")}</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
            {t("dept")} · {t("fiscal_year")} {lang === "np" ? toNpDigits(CURRENT_FY) : CURRENT_FY}
            {officeActive && <span className="ml-2 rounded bg-pine px-1.5 py-0.5 text-[10px] font-extrabold tracking-normal text-white">LIVE</span>}
          </p>
        </div>
        <span className="hidden rounded-md bg-white/10 px-3 py-1.5 font-mono text-lg font-bold tabular-nums sm:block" aria-label="clock">
          {lang === "np" ? toNpDigits(clockStr) : clockStr}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setBoardOpen(false); }}
          className="touch-target flex items-center gap-2 rounded-md bg-crimson px-4 py-2 text-sm font-bold hover:bg-crimson-dark"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          {t("exit_board")}
        </button>
      </div>
      <div className="dhaka-stripe h-[5px] shrink-0" aria-hidden="true" />

      {/* slide area */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div key={slide} className="rise-num mx-auto flex h-full max-w-[1500px] flex-col justify-center px-6 py-6 sm:px-10">
          <div className="mb-5 flex items-center gap-4">
            <span className="font-display text-[2rem] leading-none text-crimson" aria-hidden="true">
              {String(slide + 1).padStart(2, "0")}
            </span>
            <div>
              <h2 className="font-display text-[1.6rem] leading-tight text-navy-dark sm:text-[2.2rem]">{slideTitle}</h2>
              <div className="mt-1.5 h-[3px] w-16 bg-crimson" aria-hidden="true" />
            </div>
            <span className="ml-auto hidden rounded-md border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink-soft md:block">{t("unit_note")}</span>
          </div>

          {slide === 0 && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-navy-dark p-7 text-white shadow-lg">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/65">{t("kpi_total_rev")}</p>
                <p className="mt-4 font-display text-[3.4rem] leading-none">{fmtNum(k.tot.collected, lang, 0)}</p>
                <p className="mt-2 text-base font-bold text-gold">{lang === "np" ? "अर्ब रुपैयाँ" : "Billion NPR"}</p>
              </div>
              <div className="rounded-xl border border-line bg-card p-7 shadow-lg">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-crimson">{t("kpi_achievement")}</p>
                <p className="mt-4 font-display text-[3.4rem] leading-none text-navy-dark">{fmtNum(k.achievement, lang, 0)}%</p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-paper">
                  <div className="grow-bar h-full rounded-full bg-crimson" style={{ width: `${Math.min(100, k.achievement)}%` }} />
                </div>
              </div>
              <div className="rounded-xl border border-line bg-card p-7 shadow-lg">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-pine">{t("kpi_growth")}</p>
                <p className="mt-4 font-display text-[3.4rem] leading-none text-navy-dark">▲ {fmtNum(k.growth, lang, 0)}%</p>
                <p className="mt-3 text-sm font-semibold text-ink-soft">{t("prev_fy")}: {fmtArba(k.tot.prev, lang, 0)}</p>
              </div>
              <div className="rounded-xl border border-line bg-card p-7 shadow-lg">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-marigold">{t("kpi_top_month")}</p>
                <p className="mt-4 font-display text-[3rem] leading-none text-navy-dark">{MONTHS[k.best.month][lang === "np" ? "np" : "en"]}</p>
                <p className="mt-3 text-base font-bold text-marigold">{fmtArba(k.best.collected, lang)}</p>
              </div>
            </div>
          )}

          {slide === 1 && <div className="rounded-xl border border-line bg-card p-6 shadow-md"><StackedBarChart compact /></div>}
          {slide === 2 && <div className="rounded-xl border border-line bg-card p-6 shadow-md"><TrendLineChart compact /></div>}
          {slide === 3 && <div className="rounded-xl border border-line bg-card p-6 shadow-md"><DonutChart compact /></div>}
          {slide === 4 && <div className="rounded-xl border border-line bg-card p-6 shadow-md"><GroupedBarChart compact /></div>}
          {slide === 5 && <div className="rounded-xl border border-line bg-card p-6 shadow-md"><TrendTable compact /></div>}
        </div>

        {/* touch zones */}
        <button aria-label="previous" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize opacity-0" />
        <button aria-label="next" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute inset-y-0 right-0 w-1/3 cursor-e-resize opacity-0" />
      </div>

      {/* bottom bar */}
      <div className="shrink-0 bg-navy-deep px-6 py-2.5 text-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">{t("board_hint")}</span>
          <div className="ml-auto flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: SLIDES }).map((_, i) => (
              <span key={i} className={`h-2 rounded-full transition-all ${i === slide ? "w-7 bg-crimson" : "w-2 bg-white/30"}`} />
            ))}
          </div>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
          {!reduced.current && <div key={`${slide}-bar`} className="board-bar h-full bg-crimson" style={{ animationDuration: "9s" }} />}
        </div>
      </div>
    </div>
  );
}
