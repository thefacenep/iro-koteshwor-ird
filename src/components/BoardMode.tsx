import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { achievementPct, collectedToDate, toCrore, yoyPct } from "../data/office";
import { CURRENT_FY } from "../data/seed";
import { fmtNum, toNpDigits } from "../lib/format";
import { useApp } from "../lib/store";
import { FyCompareChart, GapStackChart, QuarterDonut, TrendLineChart } from "./dashboard/charts";
import { TrendTable } from "./dashboard/TrendTable";
import { Emblem } from "./ui";

function fmtTh(n: number, lang: "en" | "np"): string {
  const out = n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return lang === "np" ? toNpDigits(out) : out;
}

export function BoardMode() {
  const { t, lang, office, setBoardOpen } = useApp();
  const [slide, setSlide] = useState(0);
  const [clock, setClock] = useState(new Date());
  const reduced = useRef(false);

  const SLIDES = 5;

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

  const k = useMemo(
    () => ({
      collected: collectedToDate(office),
      achievement: achievementPct(office),
      yoy: yoyPct(office),
      annualTarget: office.annualTarget,
    }),
    [office]
  );

  const go = useCallback((dir: 1 | -1) => setSlide((s) => (s + dir + SLIDES) % SLIDES), []);

  const clockStr = clock.toLocaleTimeString("en-GB");

  const slideTitle = [
    t("office_name"),
    t("section_trend"),
    t("section_compare"),
    t("section_gap"),
    t("section_table"),
  ][slide];

  return (
    <div
      className="pattern-bg fixed inset-0 z-[70] flex flex-col bg-paper"
      onClick={(e) => go(e.clientX > window.innerWidth / 2 ? 1 : -1)}
      role="region"
      aria-label={t("board_mode")}
    >
      {/* top bar */}
      <div className="flex items-center gap-4 bg-navy-deep px-6 py-3 text-white">
        <Emblem size={44} />
        <div className="mr-auto leading-tight">
          <p className="font-display text-lg sm:text-xl">{t("office_name")}</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
            {t("dept")} · {t("fiscal_year")} {lang === "np" ? toNpDigits(CURRENT_FY) : CURRENT_FY}
            <span className="ml-2 rounded bg-pine px-1.5 py-0.5 text-[10px] font-extrabold tracking-normal text-white">LIVE</span>
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
            <span className="ml-auto hidden rounded-md border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink-soft md:block">
              {t("unit_thousand_note")}
            </span>
          </div>

          {slide === 0 && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-navy-dark p-7 text-white shadow-lg">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/65">{t("kpi_collected_shrawan")}</p>
                <p className="mt-4 font-display text-[3rem] leading-none tabular-nums">{fmtTh(k.collected, lang)}</p>
                <p className="mt-2 text-base font-bold text-gold">{t("thousand_npr")} · ≈ {fmtNum(toCrore(k.collected), lang, 2)} {t("crore_word")}</p>
              </div>
              <div className="rounded-xl border border-line bg-card p-7 shadow-lg">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-crimson">{t("kpi_achievement")}</p>
                <p className="mt-4 font-display text-[3rem] leading-none text-navy-dark">{fmtNum(k.achievement, lang, 0)}%</p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-paper">
                  <div className="grow-bar h-full rounded-full bg-crimson" style={{ width: `${Math.min(100, k.achievement)}%` }} />
                </div>
              </div>
              <div className="rounded-xl border border-line bg-card p-7 shadow-lg">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-pine">{t("kpi_growth")}</p>
                <p className="mt-4 font-display text-[3rem] leading-none text-navy-dark">▲ {fmtNum(k.yoy, lang, 0)}%</p>
                <p className="mt-2 text-sm font-semibold text-ink-soft">{t("kpi_growth_sub")}: {fmtTh(office.prevShrawan, lang)}</p>
              </div>
              <div className="rounded-xl border border-line bg-card p-7 shadow-lg">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-navy">{t("kpi_annual_target")}</p>
                <p className="mt-4 font-display text-[3rem] leading-none tabular-nums text-navy-dark">{fmtTh(k.annualTarget, lang)}</p>
                <p className="mt-2 text-sm font-semibold text-ink-soft">≈ {fmtNum(toCrore(k.annualTarget), lang, 2)} {t("crore_word")} {lang === "np" ? "रुपैयाँ" : "NPR"}</p>
              </div>
            </div>
          )}

          {slide === 1 && <TrendLineChart />}
          {slide === 2 && <FyCompareChart />}
          {slide === 3 && (
            <div className="grid items-stretch gap-6 lg:grid-cols-2">
              <GapStackChart />
              <QuarterDonut />
            </div>
          )}
          {slide === 4 && (
            <div className="rounded-lg border border-line bg-card p-4 shadow-sm">
              <TrendTable compact />
            </div>
          )}
        </div>
      </div>

      {/* bottom bar */}
      <div className="flex shrink-0 items-center gap-4 border-t border-line bg-card px-6 py-3">
        <div className="flex gap-2" role="tablist" aria-label="slides">
          {Array.from({ length: SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setSlide(i); }}
              aria-label={`Slide ${i + 1}`}
              className={`h-3 rounded-full transition-all ${i === slide ? "w-10 bg-crimson" : "w-3 bg-line hover:bg-navy/40"}`}
            />
          ))}
        </div>
        <span className="ml-auto hidden text-xs font-bold text-ink-soft sm:block">{t("board_hint")}</span>
        <span className="rounded bg-navy-dark px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
          {slide + 1} / {SLIDES}
        </span>
      </div>
      {/* auto-advance progress */}
      <div className="h-1 shrink-0 bg-line" aria-hidden="true">
        <div key={slide} className="board-bar h-full bg-crimson" style={{ animationDuration: "9s" }} />
      </div>
    </div>
  );
}
