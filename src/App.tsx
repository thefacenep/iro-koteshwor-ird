import { useCallback, useState } from "react";
import { BoardMode } from "./components/BoardMode";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ImportPanel } from "./components/import/ImportPanel";
import { Masthead, type Tab } from "./components/Masthead";
import { CountUp, ToastStack } from "./components/ui";
import { collectedToDate, toCrore } from "./data/office";
import { fmtDateTime, fmtNum } from "./lib/format";
import { AppProvider, useApp } from "./lib/store";

/* ================= main title band ================= */
function TitleBand() {
  const { t, lang, office } = useApp();
  const collected = collectedToDate(office);

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-navy to-navy-dark text-white">
      {/* ambient pennant watermark */}
      <svg
        className="pointer-events-none absolute -right-8 top-1/2 -translate-y-1/2 opacity-[0.07]"
        width="260"
        height="260"
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <path d="M18 6 L46 24 L30 26 L50 46 L18 52 Z" fill="#ffffff" />
      </svg>

      <div className="relative mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-8 gap-y-4 px-4 py-8 sm:px-6">
        <div className="min-w-0">
          <h2 className="font-display text-[2.05rem] leading-tight sm:text-[2.6rem]">{t("dashboard_title")}</h2>
          <p className="mt-2 text-lg font-medium opacity-90">
            {lang === "np" ? "Revenue Collection Dashboard" : "राजस्व संकलन ड्यासबोर्ड"}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-5">
          <span className="flex items-center gap-2 rounded-full border border-[#3ecf9a]/40 bg-[#3ecf9a]/10 px-3.5 py-1.5 text-xs font-extrabold tracking-wide text-[#7fe0bd]">
            <span className="live-dot h-2 w-2 rounded-full bg-[#3ecf9a]" aria-hidden="true" />
            {t("office_name")}
          </span>
          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/55">{t("kpi_collected_shrawan")}</p>
            <p className="font-display text-[1.9rem] leading-tight tabular-nums text-gold">
              <CountUp value={collected} decimals={0} grouping="en-US" />
            </p>
            <p className="text-[11px] font-bold text-white/60">
              {t("thousand_npr")} · ≈ {fmtNum(toCrore(collected), lang, 2)} {t("crore_word")}
              {office.ts > 0 ? ` · ${t("data_updated")}: ${fmtDateTime(office.ts, lang)}` : ""}
            </p>
          </div>
        </div>
      </div>
      <div className="h-[3px] bg-gradient-to-r from-crimson via-gold to-navy" aria-hidden="true" />
    </section>
  );
}

function Shell() {
  const { boardOpen, resetDismissed } = useApp();
  const [tab, setTabState] = useState<Tab>("dashboard");

  const setTab = useCallback(
    (next: Tab) => {
      setTabState(next);
      resetDismissed();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    },
    [resetDismissed]
  );

  return (
    <div className="pattern-bg flex min-h-screen flex-col">
      <Masthead tab={tab} setTab={setTab} />
      {tab === "dashboard" && <TitleBand />}
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {tab === "dashboard" ? <Dashboard /> : <ImportPanel />}
      </main>
      {/* Footer intentionally hidden — interface focused on dashboard content */}
      {boardOpen && <BoardMode />}
      <ToastStack />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
