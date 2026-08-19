import { useCallback, useState } from "react";
import { BoardMode } from "./components/BoardMode";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ImportPanel } from "./components/import/ImportPanel";
import { Masthead, type Tab } from "./components/Masthead";
import { Emblem, ToastStack } from "./components/ui";
import { CURRENT_FY } from "./data/seed";
import { fmtDate, toNpDigits } from "./lib/format";
import { AppProvider, useApp } from "./lib/store";

function Footer() {
  const { t, lang } = useApp();
  return (
    <footer className="mt-16 bg-navy-deep text-white">
      <div className="dhaka-stripe h-[5px]" aria-hidden="true" />
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Emblem size={44} />
            <div>
              <p className="font-display text-lg">{t("portal")}</p>
              <p className="text-xs font-bold text-white/60">{t("dept")}</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-[13px] leading-relaxed text-white/70">{t("footer_about")}</p>
        </div>
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-gold">{t("footer_helpline")}</h4>
          <p className="mt-3 font-display text-3xl tabular-nums">११४१</p>
          <p className="mt-1 text-xs font-semibold text-white/60">{lang === "np" ? "करदाता सेवा — शुल्क रहित" : "Taxpayer service — toll free"}</p>
          <p className="mt-4 text-[13px] font-semibold text-white/80">ird@ird.gov.np</p>
        </div>
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-gold">{t("footer_rights")}</h4>
          <ul className="mt-3 space-y-2 text-[13px] font-semibold text-white/80">
            <li>{t("fiscal_year")}: {lang === "np" ? toNpDigits(CURRENT_FY) : CURRENT_FY}</li>
            <li>{t("data_updated")}: {fmtDate(Date.now(), lang)}</li>
            <li>{t("footer_lang")}</li>
            <li className="flex items-center gap-2 text-white/60">
              <span className="live-dot h-2 w-2 rounded-full bg-pine" aria-hidden="true" />
              {lang === "np" ? "प्रणाली सुचारु — अफलाइन समर्थित" : "System operational — offline capable"}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs font-semibold text-white/50">
        © {toNpDigits("2082")} {t("govtNp")} · {t("govtEn")} — {t("secure_note")}
      </div>
    </footer>
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
    <div className="pattern-bg min-h-screen">
      <Masthead tab={tab} setTab={setTab} />
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
        {tab === "dashboard" ? <Dashboard /> : <ImportPanel />}
      </main>
      <Footer />
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
