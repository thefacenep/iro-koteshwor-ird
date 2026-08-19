import { useState, type FormEvent } from "react";
import { CURRENT_FY } from "../data/seed";
import { fmtDateTime, fmtInt } from "../lib/format";
import { useApp } from "../lib/store";
import { Emblem } from "./ui";

/* ================= Login modal ================= */
export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login, t, lang, notify } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  if (!open) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      notify(lang === "np" ? "साइन इन सफल भयो" : "Signed in successfully");
      onClose();
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-navy-deep/70 p-4 backdrop-blur-[2px]" onClick={onClose} role="dialog" aria-modal="true" aria-label={t("login_title")}>
      <div className="rise-num w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="dhaka-stripe h-2" aria-hidden="true" />
        <div className="border-b border-line bg-paper px-6 py-4">
          <div className="flex items-center gap-3">
            <Emblem size={40} />
            <div>
              <h3 className="font-display text-xl text-navy-dark">{t("login_title")}</h3>
              <p className="text-xs font-medium text-ink-soft">{t("login_sub")}</p>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="px-6 py-5">
          <label className="mb-1 block text-sm font-bold text-ink">{t("username")}</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="mb-4 w-full rounded-md border-2 border-line bg-white px-3 py-2.5 text-base text-ink focus:border-navy focus:outline-none"
          />
          <label className="mb-1 block text-sm font-bold text-ink">{t("password")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-md border-2 border-line bg-white px-3 py-2.5 text-base text-ink focus:border-navy focus:outline-none"
          />
          {error && (
            <p className="mt-3 rounded-md border border-crimson/30 bg-crimson-soft px-3 py-2 text-sm font-semibold text-crimson-dark" role="alert">
              {t("login_error")}
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <button type="submit" className="touch-target flex-1 rounded-md bg-crimson px-4 py-2.5 text-base font-bold text-white transition-colors hover:bg-crimson-dark">
              {t("sign_in")}
            </button>
            <button type="button" onClick={onClose} className="touch-target rounded-md border-2 border-line px-4 py-2.5 text-base font-bold text-ink-soft hover:border-navy hover:text-navy">
              {t("cancel")}
            </button>
          </div>
          <div className="mt-5 rounded-md bg-paper p-3 text-xs leading-relaxed text-ink-soft">
            <p className="mb-1 font-bold uppercase tracking-wider text-navy">{t("demo_accounts")}</p>
            <p>
              <span className="font-mono font-bold text-ink">admin / admin123</span> — {t("role_admin")}
            </p>
            <p>
              <span className="font-mono font-bold text-ink">viewer / viewer123</span> — {t("role_viewer")}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= Masthead ================= */
export type Tab = "dashboard" | "import";

export function Masthead({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const { t, lang, setLang, user, logout, sync, fontStep, setFontStep, setBoardOpen } = useApp();
  const [loginOpen, setLoginOpen] = useState(false);

  const tabBtn = (id: Tab, label: string, locked: boolean) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      aria-current={tab === id ? "page" : undefined}
      className={`touch-target relative flex items-center gap-2 px-4 py-3 text-[0.95rem] font-bold transition-colors sm:px-6 ${
        tab === id ? "bg-navy-deep/25 text-white" : "text-white/85 hover:bg-navy-deep/15 hover:text-white"
      }`}
    >
      {locked && (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="3" y="7" width="10" height="7" rx="1.4" fill="currentColor" />
          <path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )}
      {label}
      {tab === id && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white" aria-hidden="true" />}
    </button>
  );

  return (
    <header className="relative z-40">
      {/* utility strip */}
      <div className="bg-navy-deep text-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 text-xs font-semibold sm:px-6">
          <span className="mr-auto tracking-wide text-white/90">
            {t("govtNp")} · {t("govtEn")} — {t("ministry")}
          </span>

          {/* sync status */}
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${sync.online ? "bg-pine/20 text-[#7fe0bd]" : "bg-gold/20 text-gold"}`}
            title={sync.lastSync ? `${t("last_sync")}: ${fmtDateTime(sync.lastSync, lang)}` : undefined}
          >
            <span className={`live-dot h-2 w-2 rounded-full ${sync.online ? "bg-[#3ecf9a]" : "bg-gold"}`} />
            {sync.online ? t("sync_online") : t("sync_offline")}
            {sync.pending > 0 && <span className="rounded bg-gold px-1.5 font-mono text-[10px] font-bold text-navy-deep">{fmtInt(sync.pending, lang)} {t("sync_pending")}</span>}
          </span>

          {/* text size */}
          <span className="flex items-center gap-1" aria-label={t("font_size")}>
            <span className="mr-0.5 hidden text-white/60 sm:inline">{t("font_size")}</span>
            <button onClick={() => setFontStep(fontStep - 1)} className="touch-target rounded px-2 py-1 font-bold hover:bg-white/15" aria-label="A−">A−</button>
            <button onClick={() => setFontStep(fontStep + 1)} className="touch-target rounded px-2 py-1 font-bold hover:bg-white/15" aria-label="A+">A+</button>
          </span>

          {/* language */}
          <span className="flex overflow-hidden rounded-md border border-white/25" role="group" aria-label={t("language_label")}>
            <button onClick={() => setLang("np")} className={`touch-target px-3 py-1 font-bold ${lang === "np" ? "bg-crimson text-white" : "text-white/85 hover:bg-white/15"}`}>
              नेपाली
            </button>
            <button onClick={() => setLang("en")} className={`touch-target px-3 py-1 font-bold ${lang === "en" ? "bg-crimson text-white" : "text-white/85 hover:bg-white/15"}`}>
              English
            </button>
          </span>

          {/* auth */}
          {user ? (
            <span className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 text-white/90 md:flex">
                <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="8" cy="5" r="3" fill="currentColor" />
                  <path d="M2 15c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="currentColor" />
                </svg>
                {user.name} · {user.role === "admin" ? t("role_admin") : t("role_viewer")}
              </span>
              <button onClick={logout} className="touch-target rounded border border-white/30 px-3 py-1 font-bold text-white hover:bg-white/15">
                {t("logout")}
              </button>
            </span>
          ) : (
            <button onClick={() => setLoginOpen(true)} className="touch-target rounded bg-crimson px-3.5 py-1 font-bold text-white hover:bg-crimson-dark">
              {t("login")}
            </button>
          )}
        </div>
      </div>

      {/* masthead identity */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
          <Emblem size={62} />
          <div className="min-w-0">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-crimson">{t("ministry")}</p>
            <p className="text-sm font-bold text-navy">{t("dept")}</p>
            <h1 className="font-display text-[1.5rem] leading-tight text-navy-dark sm:text-[2rem]">{t("portal")}</h1>
          </div>
          <p className="ml-auto hidden max-w-[240px] text-right text-xs font-medium leading-snug text-ink-soft lg:block">
            {t("tagline")}
          </p>
        </div>
        <div className="dhaka-stripe h-[5px]" aria-hidden="true" />
      </div>

      {/* nav + board */}
      <div className="bg-crimson text-white shadow-md">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center px-2 sm:px-4">
          <nav className="flex flex-1 flex-wrap items-center" aria-label="Main">
            {tabBtn("dashboard", t("nav_dashboard"), false)}
            {tabBtn("import", t("nav_import"), user?.role !== "admin")}
          </nav>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="hidden rounded bg-navy-deep/30 px-2.5 py-1 text-xs font-bold sm:inline">
              {t("fiscal_year")}: {lang === "np" ? fmtInt(2081, lang) + "/८२" : "2081/82"}
            </span>
            <button
              onClick={() => setBoardOpen(true)}
              className="touch-target flex items-center gap-2 rounded-md bg-navy-dark px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-navy-deep"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="2" y="3" width="16" height="11" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M7 17h6M10 14v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              {t("board_mode")}
            </button>
          </div>
        </div>
      </div>

      {/* notices ticker */}
      <div className="overflow-hidden border-b-2 border-navy-dark bg-navy text-white" aria-label="Notices">
        <div className="flex items-center">
          <span className="z-10 flex shrink-0 items-center gap-2 bg-crimson px-3 py-2 text-xs font-extrabold uppercase tracking-wider sm:px-4">
            <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 6v4h3l5 3V3L5 6H2z" fill="currentColor" />
              <path d="M12 5.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            {lang === "np" ? "सूचना" : "Notice"}
          </span>
          <div className="ticker-track py-2 pl-6 text-sm font-semibold text-white/95">
            {[0, 1].map((dup) => (
              <span key={dup} className="flex items-center" aria-hidden={dup === 1}>
                {(["notice1", "notice2", "notice3", "notice4"] as const).map((k, i) => (
                  <span key={k} className="flex items-center">
                    <span className="px-5">{t(k)}</span>
                    <span className="text-gold" aria-hidden="true">✦</span>
                    {i === 3 && dup === 0 && <span className="w-5" />}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* offline banner */}
      {!sync.online && (
        <div className="border-b border-gold/50 bg-[#fdf3d7] px-4 py-2.5 text-center text-sm font-bold text-[#7a5a00]">
          ⚠ {t("offline_banner")}
        </div>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}
