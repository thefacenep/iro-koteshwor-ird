import { useMemo } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { aggregateByMonth, CATEGORIES, categoryTotals, round1, totals, type CategoryId } from "../../data/seed";
import { fmtArba, fmtNum } from "../../lib/format";
import { useApp } from "../../lib/store";

const tick = { fontSize: 12, fill: "#51618a", fontFamily: "Mukta" } as const;
const GRID = "#e3e8f3";

function catLabel(id: CategoryId, lang: "en" | "np", short = false) {
  const c = CATEGORIES.find((x) => x.id === id)!;
  return lang === "np" ? (short ? c.shortNp : c.np) : short ? c.shortEn : c.en;
}

function LegendChips() {
  const { lang } = useApp();
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {CATEGORIES.map((c) => (
        <span key={c.id} className="flex items-center gap-1.5 text-xs font-bold text-ink">
          <span className="h-3 w-3 rounded-[3px]" style={{ background: c.color }} aria-hidden="true" />
          {lang === "np" ? c.np : c.en}
        </span>
      ))}
    </div>
  );
}

function ChartTip({ active, payload, label, lang, unit }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string; lang: "en" | "np"; unit: string }) {
  if (!active || !payload?.length) return null;
  const sum = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="min-w-[190px] rounded-md border border-line bg-white px-3.5 py-2.5 shadow-xl">
      <p className="mb-1.5 text-sm font-extrabold text-navy-dark">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center justify-between gap-4 text-[13px] font-semibold text-ink">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="tabular-nums">{fmtNum(p.value, lang)} {unit}</span>
        </p>
      ))}
      {payload.length > 1 && (
        <p className="mt-1.5 flex items-center justify-between gap-4 border-t border-line pt-1.5 text-[13px] font-extrabold text-crimson">
          <span>{lang === "np" ? "जम्मा" : "Total"}</span>
          <span className="tabular-nums">{fmtNum(sum, lang)} {unit}</span>
        </p>
      )}
    </div>
  );
}

/* ============ 1. Stacked bar — monthly collection by category ============ */
const SHORT_NP = ["श्रा", "भदौ", "असो", "कात्", "मंसि", "पुष", "माघ", "फागु", "चैत", "वैशा", "जेठ", "असार"];
const SHORT_EN = ["Shra", "Bha", "Asho", "Kart", "Mang", "Pous", "Magh", "Fagu", "Chai", "Bais", "Jest", "Asad"];

export function StackedBarChart({ compact = false }: { compact?: boolean }) {
  const { lang, records } = useApp();
  const data = useMemo(
    () =>
      aggregateByMonth(records).map((m, i) => ({
        name: lang === "np" ? SHORT_NP[i] : SHORT_EN[i],
        ...m.byCategory,
      })),
    [records, lang]
  );
  return (
    <div>
      <ResponsiveContainer width="100%" height={compact ? 380 : 320}>
        <BarChart data={data} margin={{ top: 6, right: 8, left: -8, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="name" tick={tick} axisLine={{ stroke: GRID }} tickLine={false} interval={0} angle={compact ? 0 : 0} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={46} tickFormatter={(v: number) => fmtNum(v, lang, 0)} />
          <Tooltip
            cursor={{ fill: "rgba(11,34,96,0.06)" }}
            content={<ChartTip lang={lang} unit={lang === "np" ? "अर्ब" : "Bn"} />}
          />
          {CATEGORIES.map((c, i) => (
            <Bar
              key={c.id}
              dataKey={c.id}
              name={catLabel(c.id, lang, true)}
              stackId="rev"
              fill={c.color}
              radius={i === CATEGORIES.length - 1 ? [3, 3, 0, 0] : 0}
              isAnimationActive={!compact}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <LegendChips />
    </div>
  );
}

/* ============ 2. Line — collection vs target ============ */
export function TrendLineChart({ compact = false }: { compact?: boolean }) {
  const { lang, records, t } = useApp();
  const data = useMemo(
    () =>
      aggregateByMonth(records).map((m, i) => ({
        name: lang === "np" ? ["श्रा","भदौ","असो","कात्","मंसि","पुष","माघ","फागु","चैत","वैशा","जेठ","असार"][i] : ["Shra","Bha","Asho","Kart","Mang","Pous","Magh","Fagu","Chai","Bais","Jest","Asad"][i],
        collected: m.collected,
        target: m.target,
      })),
    [records, lang]
  );
  const avg = useMemo(() => round1(data.reduce((s, d) => s + d.collected, 0) / 12), [data]);
  return (
    <div>
      <ResponsiveContainer width="100%" height={compact ? 380 : 300}>
        <ComposedChart data={data} margin={{ top: 8, right: 10, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8102e" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#c8102e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="name" tick={tick} axisLine={{ stroke: GRID }} tickLine={false} interval={0} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={46} tickFormatter={(v: number) => fmtNum(v, lang, 0)} domain={[0, "dataMax + 30"]} />
          <Tooltip cursor={{ stroke: "#0b2260", strokeDasharray: "4 4" }} content={<ChartTip lang={lang} unit={lang === "np" ? "अर्ब" : "Bn"} />} />
          <Area type="monotone" dataKey="collected" name={t("collected")} stroke="#c8102e" strokeWidth={3} fill="url(#revFill)" dot={{ r: 4, fill: "#c8102e", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} isAnimationActive={!compact} />
          <Line type="monotone" dataKey="target" name={t("target")} stroke="#003893" strokeWidth={2.4} strokeDasharray="7 5" dot={false} isAnimationActive={!compact} />
          <Legend content={<DualLegend avg={avg} />} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function DualLegend({ avg }: { avg: number }) {
  const { lang, t } = useApp();
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-bold text-ink">
      <span className="flex items-center gap-2">
        <span className="h-[3px] w-6 rounded bg-crimson" aria-hidden="true" />
        {t("collected")}
      </span>
      <span className="flex items-center gap-2">
        <svg width="26" height="4" aria-hidden="true"><line x1="0" y1="2" x2="26" y2="2" stroke="#003893" strokeWidth="2.5" strokeDasharray="6 4" /></svg>
        {t("target")}
      </span>
      <span className="ml-auto rounded bg-paper px-2 py-0.5 text-ink-soft">
        {lang === "np" ? "औसत" : "Monthly avg"}: {fmtNum(avg, lang)} {lang === "np" ? "अर्ब" : "Bn"}
      </span>
    </div>
  );
}

/* ============ 3. Donut — share by tax head ============ */
export function DonutChart({ compact = false }: { compact?: boolean }) {
  const { lang, records, t } = useApp();
  const data = useMemo(() => categoryTotals(records), [records]);
  const tot = totals(records).collected;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-2">
      <div className="relative h-[240px] w-[240px] shrink-0 sm:h-[260px] sm:w-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTip lang={lang} unit={lang === "np" ? "अर्ब" : "Bn"} />} />
            <Pie
              data={data.map((d) => ({ name: lang === "np" ? d.category.np : d.category.en, value: d.collected, color: d.category.color }))}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
              isAnimationActive={!compact}
            >
              {data.map((d) => (
                <Cell key={d.category.id} fill={d.category.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-soft">{t("total")}</span>
          <span className="font-display text-[1.6rem] leading-tight text-navy-dark">{fmtNum(tot, lang, 0)}</span>
          <span className="text-xs font-bold text-crimson">{lang === "np" ? "अर्ब" : "Bn NPR"}</span>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {data.map((d) => {
          const pct = (d.collected / tot) * 100;
          return (
            <li key={d.category.id} className="group flex items-center gap-3">
              <span className="h-3.5 w-3.5 shrink-0 rounded-[3px]" style={{ background: d.category.color }} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[0.82rem] font-bold text-ink">{lang === "np" ? d.category.np : d.category.en}</span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-ink-soft">{fmtNum(d.collected, lang)} {lang === "np" ? "अर्ब" : "Bn"}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper">
                  <div className="grow-bar h-full rounded-full transition-all group-hover:brightness-110" style={{ width: `${pct}%`, background: d.category.color }} />
                </div>
              </div>
              <span className="w-12 shrink-0 text-right text-sm font-extrabold tabular-nums" style={{ color: d.category.color }}>
                {fmtNum(pct, lang)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ============ 4. Grouped bars — FY comparison ============ */
export function GroupedBarChart({ compact = false }: { compact?: boolean }) {
  const { lang, records, t } = useApp();
  const data = useMemo(
    () =>
      categoryTotals(records).map((d) => ({
        name: lang === "np" ? d.category.shortNp : d.category.shortEn,
        prev: d.prev,
        curr: d.collected,
      })),
    [records, lang]
  );
  return (
    <div>
      <ResponsiveContainer width="100%" height={compact ? 380 : 300}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 18, left: 6, bottom: 0 }} barGap={4} barCategoryGap="26%">
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={tick} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtNum(v, lang, 0)} />
          <YAxis type="category" dataKey="name" tick={{ ...tick, fontSize: compact ? 14 : 12, fontWeight: 700, fill: "#1b2a4a" }} axisLine={false} tickLine={false} width={compact ? 90 : 78} />
          <Tooltip cursor={{ fill: "rgba(11,34,96,0.06)" }} content={<ChartTip lang={lang} unit={lang === "np" ? "अर्ब" : "Bn"} />} />
          <Bar dataKey="prev" name={t("prev_fy")} fill="#9db2d4" radius={[0, 3, 3, 0]} barSize={compact ? 16 : 12} isAnimationActive={!compact} />
          <Bar dataKey="curr" name={t("current_fy")} fill="#c8102e" radius={[0, 3, 3, 0]} barSize={compact ? 16 : 12} isAnimationActive={!compact} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-bold text-ink">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-[3px] bg-[#9db2d4]" aria-hidden="true" />{t("prev_fy")}</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-[3px] bg-crimson" aria-hidden="true" />{t("current_fy")}</span>
      </div>
    </div>
  );
}

/* shared card wrapper */
export function ChartCard({ title, sub, children, className = "" }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`lift rounded-lg border border-line bg-card p-5 shadow-sm sm:p-6 ${className}`}>
      <h3 className="font-display text-[1.25rem] leading-snug text-navy-dark">{title}</h3>
      {sub && <p className="mt-1 text-[0.85rem] leading-relaxed text-ink-soft">{sub}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export { fmtArba };
