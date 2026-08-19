import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { generateSeed, type RevenueRecord } from "../data/seed";
import type { Lang } from "./format";
import { translate, type TKey } from "./i18n";
import type { LogEntry } from "./importer";

export type Role = "admin" | "viewer";
export interface User {
  name: string;
  role: Role;
}

const ACCOUNTS: Record<string, { password: string; user: User }> = {
  admin: { password: "admin123", user: { name: "IRD Administrator", role: "admin" } },
  viewer: { password: "viewer123", user: { name: "Public Viewer", role: "viewer" } },
};

export interface Toast {
  id: number;
  text: string;
  kind: "ok" | "warn";
}

interface SyncState {
  online: boolean;
  pending: number;
  syncing: boolean;
  lastSync: number | null;
}

export interface OfficeMeta {
  file: string;
  ts: number;
  rows: number;
}

interface AppStore {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TKey) => string;
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  records: RevenueRecord[];
  addRecords: (recs: RevenueRecord[]) => void;
  officeActive: boolean;
  officeMeta: OfficeMeta | null;
  setOfficeData: (recs: RevenueRecord[], file: string) => void;
  clearOfficeData: () => void;
  logs: LogEntry[];
  addLogs: (l: LogEntry[]) => void;
  sync: SyncState;
  syncNow: () => void;
  fontStep: number;
  setFontStep: (n: number) => void;
  boardOpen: boolean;
  setBoardOpen: (b: boolean) => void;
  toasts: Toast[];
  notify: (text: string, kind?: "ok" | "warn") => void;
  resetDismissed: () => void;
}

const Ctx = createContext<AppStore | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — stay in-memory */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => load<Lang>("np-rev-lang", "en"));
  const [user, setUser] = useState<User | null>(() => load<User | null>("np-rev-user", null));
  const [imported, setImported] = useState<RevenueRecord[]>(() => load<RevenueRecord[]>("np-rev-imports-v2", []));
  const [logs, setLogs] = useState<LogEntry[]>(() => load<LogEntry[]>("np-rev-logs-v2", []));
  const [fontStep, setFontStepState] = useState<number>(() => load<number>("np-rev-font", 0));
  const [boardOpen, setBoardOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sync, setSync] = useState<SyncState>(() => ({
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    pending: load<number>("np-rev-pending", 0),
    syncing: false,
    lastSync: load<number | null>("np-rev-lastsync", null),
  }));
  const toastId = useRef(0);

  /* ---- office dataset: Inland Revenue Office Koteshwor ---- */
  const [officeRecords, setOfficeRecordsState] = useState<RevenueRecord[]>(() => load<RevenueRecord[]>("np-rev-office-v1", []));
  const [officeMeta, setOfficeMetaState] = useState<OfficeMeta | null>(() => load<OfficeMeta | null>("np-rev-office-meta-v1", null));

  const nationalRecords = useMemo(() => [...generateSeed(), ...imported], [imported]);
  const officeActive = officeRecords.length > 0;
  /* the records every dashboard / chart / display board consumes —
     office data takes over immediately after a successful upload */
  const records = useMemo(
    () => (officeActive ? officeRecords : nationalRecords),
    [officeActive, officeRecords, nationalRecords]
  );

  const setOfficeData = useCallback((recs: RevenueRecord[], file: string) => {
    setOfficeRecordsState(recs);
    const meta: OfficeMeta = { file, ts: Date.now(), rows: recs.length };
    setOfficeMetaState(meta);
    save("np-rev-office-v1", recs);
    save("np-rev-office-meta-v1", meta);
  }, []);

  const clearOfficeData = useCallback(() => {
    setOfficeRecordsState([]);
    setOfficeMetaState(null);
    save("np-rev-office-v1", []);
    save("np-rev-office-meta-v1", null);
  }, []);

  /* language */
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    save("np-rev-lang", l);
    document.documentElement.lang = l === "np" ? "ne" : "en";
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === "np" ? "ne" : "en";
  }, [lang]);

  const t = useCallback((k: TKey) => translate(k, lang), [lang]);

  /* font scale for accessibility & boards */
  const setFontStep = useCallback((n: number) => {
    const clamped = Math.max(0, Math.min(2, n));
    setFontStepState(clamped);
    save("np-rev-font", clamped);
  }, []);
  useEffect(() => {
    const scales = [100, 112.5, 125];
    document.documentElement.style.fontSize = `${scales[fontStep]}%`;
  }, [fontStep]);

  /* auth */
  const login = useCallback((username: string, password: string) => {
    const acc = ACCOUNTS[username.trim().toLowerCase()];
    if (acc && acc.password === password) {
      setUser(acc.user);
      save("np-rev-user", acc.user);
      return true;
    }
    return false;
  }, []);
  const logout = useCallback(() => {
    setUser(null);
    save("np-rev-user", null);
  }, []);

  /* toasts */
  const notify = useCallback((text: string, kind: "ok" | "warn" = "ok") => {
    const id = ++toastId.current;
    setToasts((ts) => [...ts, { id, text, kind }]);
    window.setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3800);
  }, []);

  /* data + offline sync */
  const addRecords = useCallback(
    (recs: RevenueRecord[]) => {
      if (!recs.length) return;
      setImported((prev) => {
        const next = [...prev, ...recs];
        save("np-rev-imports-v2", next);
        return next;
      });
      setSync((s) => {
        const pending = s.pending + recs.length;
        save("np-rev-pending", pending);
        if (!s.online) notify(t("saved_offline"), "warn");
        return { ...s, pending };
      });
    },
    [notify, t]
  );

  const addLogs = useCallback((entries: LogEntry[]) => {
    if (!entries.length) return;
    setLogs((prev) => {
      const next = [...prev, ...entries].slice(-400);
      save("np-rev-logs-v2", next);
      return next;
    });
  }, []);

  const syncNow = useCallback(() => {
    setSync((s) => ({ ...s, syncing: true }));
    window.setTimeout(() => {
      const now = Date.now();
      setSync({ online: navigator.onLine, pending: 0, syncing: false, lastSync: now });
      save("np-rev-pending", 0);
      save("np-rev-lastsync", now);
      addLogs([
        {
          id: `log-sync-${now}`,
          ts: now,
          level: "success",
          file: "—",
          msg: { en: "Records synchronised with central server", np: "तथ्याङ्क केन्द्रीय सर्भरसँग सिंक भयो" },
        },
      ]);
      notify(t("sync_done"));
    }, 900);
  }, [addLogs, notify, t]);

  /* online / offline listeners + auto-sync */
  useEffect(() => {
    const on = () => setSync((s) => ({ ...s, online: true }));
    const off = () => setSync((s) => ({ ...s, online: false }));
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (sync.online && sync.pending > 0 && !sync.syncing) {
      const timer = window.setTimeout(() => syncNow(), 1200);
      return () => window.clearTimeout(timer);
    }
  }, [sync.online, sync.pending, sync.syncing, syncNow]);

  /* lock body scroll in board mode */
  useEffect(() => {
    document.body.style.overflow = boardOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [boardOpen]);

  const resetDismissed = useCallback(() => {
    /* re-trigger reveal animations when returning to dashboard */
    document.querySelectorAll(".reveal.in").forEach((el) => el.classList.remove("in"));
  }, []);

  const value: AppStore = {
    lang,
    setLang,
    t,
    user,
    login,
    logout,
    records,
    addRecords,
    officeActive,
    officeMeta,
    setOfficeData,
    clearOfficeData,
    logs,
    addLogs,
    sync,
    syncNow,
    fontStep,
    setFontStep,
    boardOpen,
    setBoardOpen,
    toasts,
    notify,
    resetDismissed,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppStore {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}
