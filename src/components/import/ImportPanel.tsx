import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MONTH_COLS } from "../../data/office";
import { downloadFile, fmtDateTime, fmtInt, fmtTime, toCSV, toNpDigits } from "../../lib/format";
import type { LogEntry, LogLevel } from "../../lib/importer";
import { demoBook1Batch, demoMatrixBatch, parseOfficeFile, type OfficeImportResult } from "../../lib/officeParser";
import { useApp } from "../../lib/store";
import { Reveal, SectionHead } from "../ui";

const LEVEL_COLOR: Record<LogLevel, string> = {
  success: "text-[#7fe0bd]",
  error: "text-[#ff9eab]",
  warning: "text-[#f4b942]",
  info: "text-[#9db2d4]",
};

function fmtTh(n: number, lang: "en" | "np", decimals = 0): string {
  const out = n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return lang === "np" ? toNpDigits(out) : out;
}

export function ImportPanel() {
  const { t, lang, logs, addLogs, applyOfficeImport, office, officeModified, resetOffice, sync, syncNow, notify, setBoardOpen } = useApp();
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [lastResult, setLastResult] = useState<OfficeImportResult | null>(null);
  const [lastFile, setLastFile] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LogLevel>("all");
  const logBoxRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  /* autoscroll log to newest entry */
  useEffect(() => {
    const el = logBoxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const streamLogs = useCallback(
    (entries: LogEntry[], onDone: () => void) => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        addLogs(entries);
        onDone();
        return;
      }
      let i = 0;
      const step = () => {
        if (i >= entries.length) { onDone(); return; }
        addLogs(entries.slice(i, i + 2));
        i += 2;
        timerRef.current = window.setTimeout(step, 85);
      };
      step();
    },
    [addLogs]
  );

  const applyResult = useCallback(
    (res: OfficeImportResult, fileName: string) => {
      setLastResult(res);
      setLastFile(fileName);
      streamLogs(res.logs, () => {
        setBusy(false);
        if (Object.keys(res.partial).length > 0 && res.summary.errors === 0) {
          applyOfficeImport(res.partial, fileName);
          notify(`${t("updated_live")} ✓`);
        } else if (Object.keys(res.partial).length > 0) {
          applyOfficeImport(res.partial, fileName);
          notify(`${t("import_done")} — ${fmtInt(res.summary.ok, lang)} ✓ · ${fmtInt(res.summary.errors, lang)} ✗`, "warn");
        } else {
          notify(lang === "np" ? "कुनै मान्य पङ्क्ति भेटिएन" : "No valid rows found in the sheet", "warn");
        }
      });
    },
    [applyOfficeImport, lang, notify, streamLogs, t]
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (busy) return;
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
        notify(lang === "np" ? "अमान्य फाइल — .xlsx, .xls वा .csv मात्र" : "Invalid file — only .xlsx, .xls or .csv", "warn");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        notify(lang === "np" ? "फाइल धेरै ठूलो — ५ MB सम्म मात्र" : "File too large — 5 MB maximum", "warn");
        return;
      }
      setBusy(true);
      try {
        const res = await parseOfficeFile(file);
        applyResult(res, file.name);
      } catch {
        addLogs([{ id: `log-err-${Date.now()}`, ts: Date.now(), level: "error", file: file.name, msg: { en: "Could not read file", np: "फाइल पढ्न सकिएन" } }]);
        setBusy(false);
      }
    },
    [addLogs, applyResult, busy, lang, notify]
  );

  const runDemo = useCallback(
    async (kind: "matrix" | "book1") => {
      if (busy) return;
      setBusy(true);
      const demo = kind === "matrix" ? demoMatrixBatch() : demoBook1Batch();
      const file = new File([toCSV(demo.aoa as (string | number)[][])], demo.name.replace(/\.xlsx$/, ".csv"), { type: "text/csv" });
      try {
        const res = await parseOfficeFile(file);
        applyResult(res, demo.name);
      } catch {
        setBusy(false);
      }
    },
    [applyResult, busy]
  );

  /* ---------- stats derived from logs ---------- */
  const stats = useMemo(() => {
    const sessions = logs.filter((l) => l.level === "info" && l.msg.en === "File parsed successfully").length;
    const success = logs.filter((l) => l.level === "success").length;
    const failed = logs.filter((l) => l.level === "error").length;
    const warnings = logs.filter((l) => l.level === "warning").length;
    return { sessions, success, failed, warnings };
  }, [logs]);

  /* ---------- filtered logs ---------- */
  const filtered = useMemo(() => {
    const from = fromDate ? new Date(fromDate + "T00:00:00").getTime() : -Infinity;
    const to = toDate ? new Date(toDate + "T23:59:59").getTime() : Infinity;
    return logs.filter((l) => l.ts >= from && l.ts <= to && (statusFilter === "all" || l.level === statusFilter));
  }, [logs, fromDate, toDate, statusFilter]);

  /* ---------- exports ---------- */
  const exportData = (kind: "csv" | "json") => {
    if (kind === "json") {
      downloadFile(`koteshwor-revenue-${Date.now()}.json`, JSON.stringify(office, null, 2), "application/json");
    } else {
      const header = ["Series", ...MONTH_COLS.map((m) => m.en), "TOTAL"];
      const row = (label: string, vals: (number | null)[]) => [
        label,
        ...vals.map((v) => (v === null ? "" : v)),
        vals.reduce<number>((s, v) => s + (v ?? 0), 0),
      ];
      const rows: (string | number)[][] = [
        header,
        row("Target of 2083/084", office.target),
        row("Collection of 2082/083", office.collectedPrev),
        row("Collection of 2083/084", office.collectedCurrent),
      ];
      downloadFile(`koteshwor-revenue-${Date.now()}.csv`, toCSV(rows), "text/csv");
    }
    notify(t("export_done"));
  };

  const exportLogs = (kind: "csv" | "json") => {
    const data = filtered.map((l) => ({
      time: new Date(l.ts).toISOString(),
      level: l.level,
      file: l.file,
      row: l.row ?? "",
      message: l.msg[lang],
      detail: l.detail ?? "",
    }));
    if (kind === "json") {
      downloadFile(`koteshwor-import-logs-${Date.now()}.json`, JSON.stringify(data, null, 2), "application/json");
    } else {
      const rows: (string | number)[][] = [["time", "level", "file", "row", "message", "detail"], ...data.map((d) => [d.time, d.level, d.file, d.row, d.message, d.detail])];
      downloadFile(`koteshwor-import-logs-${Date.now()}.csv`, toCSV(rows), "text/csv");
    }
    notify(t("export_done"));
  };

  const success = lastResult && lastResult.summary.ok > 0;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead kicker={t("nav_import")} title={t("import_title")} sub={t("import_sub")} />
        <Reveal delay={120}>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-bold ${sync.pending > 0 ? "border-gold/60 bg-[#fdf3d7] text-[#7a5a00]" : "border-line bg-card text-ink-soft"}`}>
              <span className={`h-2 w-2 rounded-full ${sync.pending > 0 ? "bg-gold" : "live-dot bg-pine"}`} aria-hidden="true" />
              {sync.pending > 0 ? `${fmtInt(sync.pending, lang)} ${t("sync_pending")}` : `${t("last_sync")}: ${sync.lastSync ? fmtDateTime(sync.lastSync, lang) : t("never")}`}
            </span>
            <button
              onClick={syncNow}
              disabled={sync.syncing || sync.pending === 0}
              className="touch-target flex items-center gap-2 rounded-md bg-navy-dark px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-navy disabled:cursor-not-allowed disabled:opacity-45"
            >
              {sync.syncing && (
                <svg className="spin-slow" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M8 1a7 7 0 1 1-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              )}
              {sync.syncing ? t("syncing") : t("sync_now")}
            </button>
          </div>
        </Reveal>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* ---------- left: upload ---------- */}
        <div className="space-y-6 xl:col-span-5">
          <Reveal>
            <div className="lift rounded-lg border border-line bg-card p-6 shadow-sm">
              <label
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) void handleFile(f);
                }}
                className={`group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-all ${
                  dragging ? "scale-[1.01] border-crimson bg-crimson-soft" : "border-line bg-paper hover:border-navy hover:bg-navy/5"
                }`}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }}
                  disabled={busy}
                />
                {busy ? (
                  <>
                    <svg className="spin-slow" width="56" height="56" viewBox="0 0 40 40" aria-hidden="true">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="#d8dfec" strokeWidth="5" />
                      <path d="M20 4a16 16 0 0 1 16 16" fill="none" stroke="#c8102e" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                    <p className="text-sm font-bold text-crimson">{t("processing")}</p>
                  </>
                ) : (
                  <>
                    {/* cloud upload + XLS badge */}
                    <span className={`relative transition-transform duration-300 ${dragging ? "-translate-y-1.5" : "group-hover:-translate-y-1"}`}>
                      <svg width="64" height="56" viewBox="0 0 64 56" aria-hidden="true">
                        <path d="M20 46a12 12 0 0 1-2.2-23.8A16 16 0 0 1 49 18.6 11 11 0 0 1 47 40.5" fill="none" stroke="#003893" strokeWidth="4.4" strokeLinecap="round" />
                        <path d="M32 52V30m0 0l-8 8m8-8l8 8" fill="none" stroke="#c8102e" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="absolute -right-3 -top-1 rounded bg-pine px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white shadow">XLS</span>
                    </span>
                    <div>
                      <p className="font-display text-[1.3rem] leading-snug text-navy-dark">
                        {lang === "np" ? "राजस्व लक्ष्य तथा संकलन तथ्याङ्क अपलोड गर्नुहोस्" : "Upload Revenue Target & Collection Data"}
                      </p>
                      <p className="mt-1.5 text-sm font-medium text-ink-soft">
                        {lang === "np"
                          ? "आफ्नो Excel (.xlsx) फाइल यहाँ तान्नुहोस्, वा क्लिक गरी छान्नुहोस्।"
                          : "Drag and drop your Excel (.xlsx) file here, or click to browse."}
                      </p>
                      <span className="mt-4 inline-block rounded-md bg-crimson px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors group-hover:bg-crimson-dark">
                        {t("browse")}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-ink-soft">{lang === "np" ? ".xlsx, .xls, .csv मान्य · ५ MB सम्म" : "Accepts .xlsx, .xls, .csv · up to 5 MB"}</p>
                  </>
                )}
              </label>

              <div className="mt-5 rounded-md bg-paper p-3.5">
                <p className="text-xs font-extrabold uppercase tracking-wider text-navy">{t("import_formats")}</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">◈ {t("format_matrix")}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">◈ {t("format_heads")}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => void runDemo("matrix")} disabled={busy} className="touch-target rounded-md border-2 border-navy px-4 py-2 text-sm font-bold text-navy transition-colors hover:bg-navy hover:text-white disabled:opacity-50">
                  ▶ {t("load_matrix_demo")}
                </button>
                <button onClick={() => void runDemo("book1")} disabled={busy} className="touch-target rounded-md border-2 border-line px-4 py-2 text-sm font-bold text-ink-soft transition-colors hover:border-crimson hover:text-crimson disabled:opacity-50">
                  ▶ {t("load_book1_demo")}
                </button>
                {officeModified && (
                  <button onClick={() => { resetOffice(); notify(t("national_restored")); }} className="touch-target rounded-md border-2 border-line px-4 py-2 text-sm font-bold text-ink-soft transition-colors hover:border-pine hover:text-pine">
                    ↺ {t("restore_seeded")}
                  </button>
                )}
              </div>
            </div>
          </Reveal>

          {/* success feedback */}
          {success && lastResult && (
            <Reveal>
              <div className="rise-num rounded-lg border-2 border-pine bg-[#e9f6f0] p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="check-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pine text-white shadow-md">
                    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4.5 12.5l5 5L19.5 7" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-[1.25rem] leading-tight text-[#0b4a3c]">{t("upload_success")}</h3>
                    <p className="mt-1 text-sm font-semibold text-[#0b4a3c]/80">
                      {lastFile} · {fmtInt(lastResult.summary.ok, lang)} {t("parsed_rows")} · {t("updated_live")}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] font-bold text-[#0b4a3c] sm:grid-cols-3">
                      <span className="rounded bg-white/70 px-2.5 py-1.5">{t("head_target")}: {fmtTh(lastResult.partial.annualTarget ?? office.annualTarget, lang)}</span>
                      <span className="rounded bg-white/70 px-2.5 py-1.5">{t("collected")}: {fmtTh((lastResult.partial.collectedCurrent?.[0] ?? null) ?? office.collectedCurrent[0] ?? 0, lang)}</span>
                      <span className="rounded bg-white/70 px-2.5 py-1.5">{t("series_target")}: {lastResult.partial.target ? "✓" : "—"}</span>
                    </div>
                    <button onClick={() => setBoardOpen(true)} className="touch-target mt-4 rounded-md bg-navy-dark px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy">
                      ▸ {t("board_mode")}
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* preview */}
          <Reveal delay={80}>
            <div className="rounded-lg border border-line bg-card p-5 shadow-sm">
              <h4 className="flex items-center justify-between gap-2 text-sm font-extrabold text-navy-dark">
                {t("preview_title")}
                {lastFile && <span className="max-w-[55%] truncate rounded bg-paper px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-soft" title={lastFile}>{lastFile}</span>}
              </h4>
              {!lastResult ? (
                <p className="mt-3 rounded-md border border-dashed border-line px-4 py-6 text-center text-xs font-medium text-ink-soft">{t("no_preview")}</p>
              ) : lastResult.preview.kind === "matrix" ? (
                <div className="log-scroll mt-3 overflow-x-auto rounded-md border border-line">
                  <table className="w-full min-w-[560px] text-xs">
                    <thead className="bg-navy-dark text-left text-white">
                      <tr>
                        <th className="px-2.5 py-1.5">{lang === "np" ? "शृङ्खला" : "Series"}</th>
                        {MONTH_COLS.slice(0, 4).map((m) => <th key={m.en} className="px-2 py-1.5 text-right">{lang === "np" ? m.np : m.en}</th>)}
                        <th className="px-2 py-1.5 text-center">…</th>
                        <th className="px-2.5 py-1.5 text-right">{lang === "np" ? "जम्मा" : "TOTAL"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastResult.preview.series.map((s) => (
                        <tr key={s.label} className="border-t border-line">
                          <td className="px-2.5 py-1.5 font-bold text-ink">{s.label}</td>
                          {s.values.slice(0, 4).map((v, i) => <td key={i} className="px-2 py-1.5 text-right tabular-nums">{v === null ? "—" : fmtTh(v, lang, 2)}</td>)}
                          <td className="px-2 py-1.5 text-center text-ink-soft">…</td>
                          <td className="px-2.5 py-1.5 text-right font-extrabold tabular-nums text-navy-dark">{fmtTh(s.total, lang)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="log-scroll mt-3 overflow-x-auto rounded-md border border-line">
                  <table className="w-full min-w-[460px] text-xs">
                    <thead className="bg-navy-dark text-left text-white">
                      <tr>
                        <th className="px-2.5 py-1.5">{t("head_name")}</th>
                        <th className="px-2.5 py-1.5 text-right">{t("head_target")}</th>
                        <th className="px-2.5 py-1.5 text-right">{t("head_collected")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastResult.preview.heads.map((h) => (
                        <tr key={h.name} className="border-t border-line">
                          <td className="px-2.5 py-1.5 font-bold text-ink">{h.name}</td>
                          <td className="px-2.5 py-1.5 text-right tabular-nums">{fmtTh(h.target, lang)}</td>
                          <td className="px-2.5 py-1.5 text-right tabular-nums text-pine">{fmtTh(h.collected, lang)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Reveal>
        </div>

        {/* ---------- right: stats + log ---------- */}
        <div className="space-y-6 xl:col-span-7">
          <Reveal delay={80}>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: t("stat_uploads"), value: stats.sessions, color: "text-navy-dark", bar: "bg-navy" },
                { label: t("stat_success"), value: stats.success, color: "text-pine", bar: "bg-pine" },
                { label: t("stat_failed"), value: stats.failed, color: "text-crimson", bar: "bg-crimson" },
                { label: t("stat_warnings"), value: stats.warnings, color: "text-marigold", bar: "bg-marigold" },
              ].map((s, i) => (
                <div key={i} className="lift relative overflow-hidden rounded-lg border border-line bg-card p-4 shadow-sm">
                  <span className={`absolute inset-x-0 top-0 h-1 ${s.bar}`} aria-hidden="true" />
                  <p className="text-[0.68rem] font-extrabold uppercase tracking-wider text-ink-soft">{s.label}</p>
                  <p className={`mt-1 font-display text-3xl tabular-nums ${s.color}`}>{fmtInt(s.value, lang)}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="overflow-hidden rounded-lg border border-line bg-card shadow-sm">
              <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper px-4 py-3">
                <h3 className="mr-auto flex items-center gap-2 font-display text-[1.15rem] text-navy-dark">
                  <span className="live-dot h-2 w-2 rounded-full bg-pine" aria-hidden="true" />
                  {t("log_title")}
                  <span className="rounded bg-navy-dark px-2 py-0.5 text-[11px] font-bold text-white">{fmtInt(filtered.length, lang)} {t("entries")}</span>
                </h3>
                <label className="flex items-center gap-1.5 text-xs font-bold text-ink-soft">
                  {t("filter_from")}
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded border-2 border-line bg-white px-2 py-1 text-xs font-semibold text-ink focus:border-navy focus:outline-none" />
                </label>
                <label className="flex items-center gap-1.5 text-xs font-bold text-ink-soft">
                  {t("filter_to")}
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded border-2 border-line bg-white px-2 py-1 text-xs font-semibold text-ink focus:border-navy focus:outline-none" />
                </label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | LogLevel)} aria-label={t("filter_status")} className="rounded border-2 border-line bg-white px-2 py-1 text-xs font-bold text-ink focus:border-navy focus:outline-none">
                  <option value="all">{t("all")}</option>
                  <option value="success">{t("success")}</option>
                  <option value="error">{t("error")}</option>
                  <option value="warning">{t("warning")}</option>
                  <option value="info">{t("info")}</option>
                </select>
                {(fromDate || toDate || statusFilter !== "all") && (
                  <button onClick={() => { setFromDate(""); setToDate(""); setStatusFilter("all"); }} className="rounded px-2 py-1 text-xs font-bold text-crimson hover:bg-crimson-soft">
                    ✕ {t("clear_filters")}
                  </button>
                )}
              </div>

              {/* console */}
              <div ref={logBoxRef} className="log-scroll h-[340px] overflow-y-auto bg-navy-deep px-4 py-3 font-mono text-[12.5px] leading-relaxed">
                {filtered.length === 0 && <p className="py-6 text-center text-[#9db2d4]">— {t("log_empty")} —</p>}
                {filtered.map((l) => (
                  <div key={l.id} className="flash-row flex flex-wrap items-baseline gap-x-2 border-b border-white/5 py-[3px]">
                    <span className="text-[#6f86b8]">{fmtTime(l.ts, lang)}</span>
                    <span className={`inline-block w-[74px] font-extrabold uppercase ${LEVEL_COLOR[l.level]}`}>[{l.level}]</span>
                    <span className="text-white/90">
                      {l.row !== undefined && <span className="text-[#6f86b8]">row {fmtInt(l.row, lang)} · </span>}
                      {l.msg[lang]}
                      {l.detail && <span className="text-[#9db2d4]"> — {l.detail}</span>}
                    </span>
                  </div>
                ))}
                {busy && (
                  <span className="text-[#7fe0bd]">
                    ▍<span className="log-cursor">_</span>
                  </span>
                )}
              </div>

              {/* exports */}
              <div className="flex flex-wrap items-center gap-2 border-t border-line bg-paper px-4 py-3">
                <span className="mr-1 text-[11px] font-extrabold uppercase tracking-wider text-ink-soft">CSV / JSON</span>
                <button onClick={() => exportData("csv")} className="touch-target rounded-md border-2 border-crimson px-3 py-1.5 text-xs font-bold text-crimson hover:bg-crimson hover:text-white">⬇ {t("export_data_csv")}</button>
                <button onClick={() => exportData("json")} className="touch-target rounded-md border-2 border-crimson px-3 py-1.5 text-xs font-bold text-crimson hover:bg-crimson hover:text-white">⬇ {t("export_data_json")}</button>
                <span className="mx-1 hidden h-4 w-px bg-line sm:block" aria-hidden="true" />
                <button onClick={() => exportLogs("csv")} className="touch-target rounded-md border-2 border-navy px-3 py-1.5 text-xs font-bold text-navy hover:bg-navy hover:text-white">⬇ {t("export_logs_csv")}</button>
                <button onClick={() => exportLogs("json")} className="touch-target rounded-md border-2 border-navy px-3 py-1.5 text-xs font-bold text-navy hover:bg-navy hover:text-white">⬇ {t("export_logs_json")}</button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
