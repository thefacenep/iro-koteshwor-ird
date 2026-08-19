import { useCallback, useState } from "react";
import { BoardMode } from "./components/BoardMode";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ImportPanel } from "./components/import/ImportPanel";
import { Masthead, type Tab } from "./components/Masthead";
import { ToastStack } from "./components/ui";
import { AppProvider, useApp } from "./lib/store";

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
