import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, CURRENT_FY, MONTHS, totals } from "../../data/seed";
import { downloadFile, fmtArba, fmtDateTime, fmtInt, fmtTime, toCSV } from "../../lib/format";
import {
  demoOfficeBatch,
  OFFICE_TEMPLATE_CSV,
  parseOfficeFile,
  type ImportResult,
  type LogEntry,
  type LogLevel,
  type PreviewRow,
} from "../../lib/importer";
import { useApp } from "../../lib/store";
import { Reveal, SectionHead } from "../ui";

const LEVEL_COLOR: Record<LogLevel, string> = {
  success: "text-[#7fe0bd]",
  error: "text-[#ff9eab]",
  warning: "text-[#f4b942]",
  info: "text-[#9db2d4]",
};

export function ImportPanel() {
  const { t, lang, records, logs, addLogs, setOfficeData, clearOfficeData, officeActive, officeMeta, sync, syncNow, notify, setBoardOpen } = useApp();
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
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
        if (i >= entries.length) {
          onDone();
          return;
        }
        addLogs(entries.slice(i, i + 2));
        i += 2;
        timerRef.current = window.setTimeout(step, 70);
      };
      step();
    },
    [addLogs]
  );

  const applyResult = useCallback(
    (res: ImportResult, fileName: string) => {
      setPreview(res.preview);
      setLastFile(fileName);
      streamLogs(res.logs, () => {
        setBusy(false);
        if (res.records.length) {
          /* route straight into global state → dashboard + display board refresh instantly */
          setOfficeData(res.records, fileName);
          notify(`${t("upload_success_title")} — ${fmtInt(res.records.length, lang)} ${t("routed_rows")} ✓`);
        } else {
          notify(lang === "np" ? "कुनै मान्य पङ्क्ति भेटिएन — लग हेर्नुहोस्" : "No valid rows found — check the log below", "warn");
        }
      });
    },
    [lang, notify, setOfficeData, streamLogs, t]
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
        addLogs([
          { id: `log-err-${Date.now()}`, ts: Date.now(), level: "error", file: file.name, msg: { en: "Could not read file", np: "फाइल पढ्न सकिएन" } },
        ]);
        setBusy(false);
        notify(lang === "np" ? "फाइल पढ्न सकिएन" : "Could not read file", "warn");
      }
    },
    [addLogs, applyResult, busy, lang, notify]
  );

  const runDemo = useCallback(() => {
    if (busy) return;
    setBusy(true);
    const res = demoOfficeBatch();
    applyResult(res, "koteshwor_target_collection_2082-83.xlsx");
  }, [applyResult, busy]);

  /* ---------- office totals for the success card ---------- */
  const officeTotals = useMemo(() => (officeActive ? totals(records) : null), [officeActive, records]);

  /* ---------- stats derived from logs ---------- */
  const stats = useMemo(() => {
    const sessions = logs.filter((l) => l.level === "info" && l.detail?.includes("rows found")).length;
    const success = logs.filter((l) => l.level === "success").length;
    const failed = logs.filter((l) => l.level === "error" && l.row !== undefined).length;
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
      downloadFile(`ird-import-logs-${Date.now()}.json`, JSON.stringify(data, null, 2), "application/json");
    } else {
      const rows: (string | number)[][] = [["time", "level", "file", "row", "message", "detail"], ...data.map((d) => [d.time, d.level, d.file, d.row, d.message, d.detail])];
      downloadFile(`ird-import-logs-${Date.now()}.csv`, toCSV(rows), "text/csv");
    }
    notify(t("export_done"));
  };

  const exportData = (kind: "csv" | "json") => {
    const rows: (string | number)[][] = [
      ["fy", "month", "month_name", "category", "collected_bn", "target_bn", "prev_collected_bn", "source"],
      ...records.map((r) => [r.fy, r.month + 1, MONTHS[r.month].en, r.category, r.collected, r.target, r.prevCollected, r.source]),
    ];
    if (kind === "json") {
      downloadFile(`ird-revenue-${CURRENT_FY.replace("/", "-")}.json`, JSON.stringify(records, null, 2), "application/json");
    } else {
      downloadFile(`ird-revenue-${CURRENT_FY.replace("/", "-")}.csv`, toCSV(rows), "text/csv");
    }
    notify(t("export_done"));
  };

  return (
    <div className="space-y-10">
      {/* header row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead kicker={t("office_kicker")} title={t("office_name")} sub={t("import_sub")} />
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
        {/* ---------- left: upload + success ---------- */}
        <div className="space-y-6 xl:col-span-5">
          <Reveal>
            <div className="lift rounded-lg border border-line bg-card p-6 shadow-sm">
              {/* ===== drag & drop Excel upload zone ===== */}
              <label
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) void handleFile(f);
                }}
                className={`group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-all duration-200 ${
                  dragging ? "scale-[1.015] border-crimson bg-crimson-soft shadow-lg" : "border-navy/30 bg-white hover:border-crimson hover:bg-crimson-soft/40"
                }`}
              >
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }}
                  disabled={busy}
                  aria-label={t("upload_main_title")}
                />

                {busy ? (
                  <>
                    <svg className="spin-slow" width="52" height="52" viewBox="0 0 40 40" aria-hidden="true">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="#d8dfec" strokeWidth="5" />
                      <path d="M20 4a16 16 0 0 1 16 16" fill="none" stroke="#c8102e" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                    <p className="text-base font-bold text-crimson">{t("processing")}</p>
                  </>
                ) : (
                  <>
                    {/* cloud upload + excel mark */}
                    <span className="relative">
                      <svg width="76" height="62" viewBox="0 0 76 62" aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-y-1">
                        <path d="M20 50a14 14 0 0 1-2.2-27.8A18 18 0 0 1 53 18.6 13 13 0 0 1 58 44" fill="none" stroke="#003893" strokeWidth="4.5" strokeLinecap="round" />
                        <path d="M38 56V30m0 0l-9 9m9-9l9 9" fill="none" stroke="#c8102e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="absolute -bottom-1 -right-3 flex h-8 w-8 items-center justify-center rounded-md bg-pine font-display text-[0.72rem] font-bold text-white shadow-md">
                        XLS
                      </span>
                    </span>
                    <span>
                      <span className="block font-display text-[1.3rem] leading-snug text-navy-dark">{t("upload_main_title")}</span>
                      <span className="mt-1.5 block max-w-sm text-sm font-medium leading-relaxed text-ink-soft">{t("upload_main_sub")}</span>
                    </span>
                    <span className="mt-1 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-crimson to-crimson-dark px-7 py-2.5 text-base font-bold text-white shadow-md transition-all duration-200 group-hover:shadow-lg group-hover:brightness-110">
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M2 11v2.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V11M8 1.5v8M8 1.5L4.8 4.7M8 1.5l3.2 3.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t("browse_files")}
                    </span>
                    <span className="text-xs font-medium text-ink-soft">
                      {t("upload_excel_note")} · ≤ 5 MB
                    </span>
                  </>
                )}
              </label>

              {/* expected columns + actions */}
              <div className="mt-4 rounded-md bg-paper p-3.5">
                <p className="text-xs font-extrabold uppercase tracking-wider text-navy">{t("expected_cols")}</p>
                <p className="mt-1 font-mono text-[12px] font-semibold text-ink">month · target · collected · category (optional)</p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">{t("office_cols_note")}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => { downloadFile("koteshwor-template.csv", OFFICE_TEMPLATE_CSV, "text/csv"); notify(t("export_done")); }} className="touch-target rounded-md border-2 border-navy px-4 py-2 text-sm font-bold text-navy transition-colors hover:bg-navy hover:text-white">
                  ⬇ {t("template_download")}
                </button>
                <button onClick={runDemo} disabled={busy} className="touch-target rounded-md border-2 border-line px-4 py-2 text-sm font-bold text-ink-soft transition-colors hover:border-crimson hover:text-crimson disabled:opacity-50">
                  ▶ {t("office_demo")}
                </button>
              </div>
            </div>
          </Reveal>

          {/* ===== success card — live office dataset ===== */}
          {officeActive && officeMeta && officeTotals && (
            <Reveal>
              <div className="overflow-hidden rounded-lg border-2 border-pine/50 bg-card shadow-md">
                <div className="flex items-center gap-4 bg-pine px-5 py-4 text-white">
                  <span className="check-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/20">
                    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4.5 12.5l5 5L19.5 7" fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-display text-xl leading-tight">{t("upload_success_title")}</p>
                    <p className="text-sm font-semibold text-white/85">{t("upload_success_msg")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
                  <div className="bg-card p-3.5">
                    <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-ink-soft">{t("rows")}</p>
                    <p className="mt-1 font-display text-2xl tabular-nums text-navy-dark">{fmtInt(officeMeta.rows, lang)}</p>
                  </div>
                  <div className="bg-card p-3.5">
                    <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-ink-soft">{t("target")}</p>
                    <p className="mt-1 font-display text-2xl tabular-nums text-navy-dark">{fmtArba(officeTotals.target, lang)}</p>
                  </div>
                  <div className="bg-card p-3.5">
                    <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-ink-soft">{t("collected")}</p>
                    <p className="mt-1 font-display text-2xl tabular-nums text-pine">{fmtArba(officeTotals.collected, lang)}</p>
                  </div>
                  <div className="bg-card p-3.5">
                    <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-ink-soft">{t("uploaded_at")}</p>
                    <p className="mt-1 text-sm font-bold leading-snug text-ink">{fmtDateTime(officeMeta.ts, lang)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 border-t border-line bg-paper px-5 py-3.5">
                  <p className="mr-auto max-w-full truncate font-mono text-[11px] font-semibold text-ink-soft" title={officeMeta.file}>
                    {t("uploaded_file")}: {officeMeta.file}
                  </p>
                  <button onClick={() => setBoardOpen(true)} className="touch-target flex items-center gap-2 rounded-md bg-crimson px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-crimson-dark">
                    <svg width="15" height="15" viewBox="0 0 20 20" aria-hidden="true">
                      <rect x="2" y="3" width="16" height="11" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M7 17h6M10 14v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    {t("open_board")}
                  </button>
                  <button
                    onClick={() => { clearOfficeData(); setPreview(null); setLastFile(null); notify(t("national_restored")); }}
                    className="touch-target rounded-md border-2 border-line px-4 py-2 text-sm font-bold text-ink-soft transition-colors hover:border-navy hover:text-navy"
                  >
                    ↺ {t("restore_national")}
                  </button>
                </div>
              </div>
            </Reveal>
          )}

          {/* ===== row preview ===== */}
          <Reveal delay={80}>
            <div className="rounded-lg border border-line bg-card p-6 shadow-sm">
              <h4 className="flex items-center justify-between text-sm font-extrabold text-navy-dark">
                {t("preview_title")}
                {lastFile && <span className="max-w-[55%] truncate rounded bg-paper px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-soft" title={lastFile}>{lastFile}</span>}
              </h4>
              {!preview ? (
                <p className="mt-3 rounded-md border border-dashed border-line px-4 py-6 text-center text-xs font-medium text-ink-soft">{t("no_preview")}</p>
              ) : (
                <div className="mt-2 max-h-64 overflow-auto rounded-md border border-line">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-navy-dark text-left text-white">
                      <tr>
                        <th className="px-2.5 py-1.5">#</th>
                        <th className="px-2.5 py-1.5">{t("month_word")}</th>
                        <th className="px-2.5 py-1.5">Category</th>
                        <th className="px-2.5 py-1.5 text-right">{t("collected")}</th>
                        <th className="px-2.5 py-1.5">{t("th_status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((p) => (
                        <tr key={p.row} className={`border-t border-line ${p.status === "error" ? "bg-crimson-soft" : p.status === "warning" ? "bg-[#fdf3d7]" : ""}`}>
                          <td className="px-2.5 py-1.5 font-mono text-ink-soft">{p.row}</td>
                          <td className="px-2.5 py-1.5 font-bold text-ink">{p.month}</td>
                          <td className="px-2.5 py-1.5">{CATEGORIES.find((c) => c.id === p.category)?.[lang === "np" ? "np" : "en"] ?? p.category}</td>
                          <td className="px-2.5 py-1.5 text-right tabular-nums">{p.collected}</td>
                          <td className="px-2.5 py-1.5">
                            <span className={`font-extrabold ${p.status === "error" ? "text-crimson" : p.status === "warning" ? "text-marigold" : "text-pine"}`}>
                              {p.status === "error" ? "✗" : p.status === "warning" ? "!" : "✓"}{" "}
                              {p.note ? p.note[lang] : p.status === "success" ? t("success") : ""}
                            </span>
                          </td>
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
                <button onClick={() => exportLogs("csv")} className="touch-target rounded-md border-2 border-navy px-3 py-1.5 text-xs font-bold text-navy hover:bg-navy hover:text-white">⬇ {t("export_logs_csv")}</button>
                <button onClick={() => exportLogs("json")} className="touch-target rounded-md border-2 border-navy px-3 py-1.5 text-xs font-bold text-navy hover:bg-navy hover:text-white">⬇ {t("export_logs_json")}</button>
                <span className="mx-1 hidden h-4 w-px bg-line sm:block" aria-hidden="true" />
                <button onClick={() => exportData("csv")} className="touch-target rounded-md border-2 border-crimson px-3 py-1.5 text-xs font-bold text-crimson hover:bg-crimson hover:text-white">⬇ {t("export_data_csv")}</button>
                <button onClick={() => exportData("json")} className="touch-target rounded-md border-2 border-crimson px-3 py-1.5 text-xs font-bold text-crimson hover:bg-crimson hover:text-white">⬇ {t("export_data_json")}</button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
