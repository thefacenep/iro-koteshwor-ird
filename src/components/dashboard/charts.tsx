import type { ReactNode } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { monthlyCrore, quarters, toCrore, type OfficeData } from "../../data/office";
import { fmtNum, toNpDigits } from "../../lib/format";
import { useApp } from "../../lib/store";

/* thousand-NPR formatting matching the office sheets */
function fmtTh(n: number, lang: "en" | "np", decimals = 0): string {
  const out = n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return lang === "np" ? toNpDigits(out) : out;
}

export function ChartCard({ title, sub, children, className = "" }: { title: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`lift flex h-full flex-col overflow-hidden rounded-lg border border-line bg-card shadow-sm ${className}`}>
      <div className="border-b border-line px-5 pb-3.5 pt-4">
        <h3 className="font-display text-[1.2rem] leading-snug text-navy-dark">{title}</h3>
        {sub && <p className="mt-1 text-[0.8rem] leading-relaxed text-ink-soft">{sub}</p>}
      </div>
      <div className="min-h-0 flex-1 px-2 py-4 sm:px-4">{children}</div>
    </div>
  );
}

const NAVY = "#003893";
const CRIMSON = "#c8102e";
const PINE = "#0e7c66";
const SLATE = "#9db2d4";
const GOLD = "#f4b942";

/* shared tooltip — shows exact thousand-NPR values plus the crore equivalent */
function useCroreTooltip() {
  const { lang } = useApp();
  return ({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number | null; color?: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-md border-2 border-navy-deep bg-white px-3.5 py-2.5 text-xs font-semibold shadow-xl">
        <p className="mb-1.5 font-extrabold uppercase tracking-wide text-navy-dark">{label}</p>
        {payload.filter((p) => p.value !== null && p.value !== undefined).map((p) => (
          <p key={p.name} className="flex items-center gap-2 py-0.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} aria-hidden="true" />
            <span className="text-ink-soft">{p.name}:</span>
            <span className="ml-auto pl-4 tabular-nums text-ink">
              {fmtTh((p.value as number) * 10000, lang)} {lang === "np" ? "हजार" : "th."}
              <span className="text-ink-soft"> · {fmtNum(p.value as number, lang, 1)} {lang === "np" ? "करोड" : "cr."}</span>
            </span>
          </p>
        ))}
      </div>
    );
  };
}

const axisStyle = { fontSize: 11, fontWeight: 700, fill: "#51617f" };

/* =============== 1. trend line: target vs collection vs current =============== */
export function TrendLineChart({ data }: { data?: ReturnType<typeof monthlyCrore> }) {
  const { t, lang } = useApp();
  const office = useApp().office;
  const rows = data ?? monthlyCrore(office);
  const CroreTooltip = useCroreTooltip();
  return (
    <div className="h-[320px] w-full sm:h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 12, right: 14, left: 2, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dfe5f0" vertical={false} />
          <XAxis dataKey={lang === "np" ? "np" : "short"} tick={axisStyle} tickLine={false} axisLine={{ stroke: "#c6cfdf" }} interval={0} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => (lang === "np" ? toNpDigits(String(v)) : String(v))} />
          <Tooltip content={<CroreTooltip />} cursor={{ stroke: NAVY, strokeDasharray: "4 4" }} />
          <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 8 }} />
          <Line type="monotone" dataKey="target" name={t("series_target")} stroke={NAVY} strokeWidth={3.2} dot={{ r: 3.5, fill: NAVY, strokeWidth: 0 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="prev" name={t("series_prev")} stroke={CRIMSON} strokeWidth={2.4} strokeDasharray="7 5" dot={{ r: 3, fill: CRIMSON, strokeWidth: 0 }} activeDot={{ r: 5.5 }} />
          <Line type="monotone" dataKey="current" name={t("series_current")} stroke={PINE} strokeWidth={0} dot={{ r: 7, fill: PINE, stroke: "#ffffff", strokeWidth: 2.5 }} activeDot={{ r: 9 }} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =============== 2. grouped bars: target vs previous collection =============== */
export function FyCompareChart({ data }: { data?: ReturnType<typeof monthlyCrore> }) {
  const { t, lang } = useApp();
  const office = useApp().office;
  const rows = data ?? monthlyCrore(office);
  const CroreTooltip = useCroreTooltip();
  return (
    <div className="h-[300px] w-full sm:h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 12, right: 14, left: 2, bottom: 4 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dfe5f0" vertical={false} />
          <XAxis dataKey={lang === "np" ? "np" : "short"} tick={axisStyle} tickLine={false} axisLine={{ stroke: "#c6cfdf" }} interval={0} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => (lang === "np" ? toNpDigits(String(v)) : String(v))} />
          <Tooltip content={<CroreTooltip />} cursor={{ fill: "rgba(0,56,147,0.06)" }} />
          <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 8 }} />
          <Bar dataKey="target" name={t("series_target")} fill={NAVY} radius={[3, 3, 0, 0]} maxBarSize={16} />
          <Bar dataKey="prev" name={t("series_prev")} fill={CRIMSON} radius={[3, 3, 0, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =============== 3. stacked: last year's collection + gap to target =============== */
export function GapStackChart({ data }: { data?: ReturnType<typeof monthlyCrore> }) {
  const { t, lang } = useApp();
  const office = useApp().office;
  const rows = data ?? monthlyCrore(office);
  const CroreTooltip = useCroreTooltip();
  return (
    <div className="h-[300px] w-full sm:h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 12, right: 14, left: 2, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dfe5f0" vertical={false} />
          <XAxis dataKey={lang === "np" ? "np" : "short"} tick={axisStyle} tickLine={false} axisLine={{ stroke: "#c6cfdf" }} interval={0} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => (lang === "np" ? toNpDigits(String(v)) : String(v))} />
          <Tooltip content={<CroreTooltip />} cursor={{ fill: "rgba(0,56,147,0.06)" }} />
          <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 8 }} />
          <Bar dataKey="prev" name={t("series_prev")} stackId="gap" fill={CRIMSON} maxBarSize={26} />
          <Bar dataKey="gap" name={t("gap_needed")} stackId="gap" fill={SLATE} radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =============== 4. quarterly share of the annual target =============== */
const Q_COLORS = [CRIMSON, NAVY, PINE, "#c9821a"];

export function QuarterDonut({ officeData }: { officeData?: OfficeData }) {
  const { t, lang } = useApp();
  const office = officeData ?? useApp().office;
  const qs = quarters(office);
  const total = qs.reduce((s, q) => s + q.target, 0);
  const data = qs.map((q, i) => ({
    name: `${lang === "np" ? q.label.np : q.label.en} · ${lang === "np" ? q.months.np : q.months.en}`,
    short: lang === "np" ? q.label.np : q.label.en,
    value: +toCrore(q.target).toFixed(2),
    color: Q_COLORS[i],
  }));
  return (
    <div className="flex h-[300px] w-full flex-col items-center gap-2 sm:h-[340px] lg:flex-row lg:gap-6">
      <div className="relative h-[210px] w-[210px] shrink-0 sm:h-[240px] sm:w-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="90%" paddingAngle={2.5} strokeWidth={2} stroke="#ffffff">
              {data.map((d) => (
                <Cell key={d.short} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${fmtNum(value, lang, 1)} ${lang === "np" ? "करोड" : "crore"} · ${fmtNum((value / toCrore(total)) * 100, lang, 1)}%`, name]}
              contentStyle={{ borderRadius: 8, border: "2px solid #071a4d", fontSize: 12, fontWeight: 600 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="font-display text-[1.55rem] leading-none text-navy-dark">{fmtNum(toCrore(total), lang, 1)}</p>
          <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-soft">{lang === "np" ? "करोड · वार्षिक लक्ष्य" : "crore · annual target"}</p>
        </div>
      </div>
      <ul className="grid w-full min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
        {data.map((d) => (
          <li key={d.short} className="flex items-center gap-2.5 rounded-md border border-line bg-paper px-3 py-2">
            <span className="h-3.5 w-3.5 shrink-0 rounded-sm" style={{ background: d.color }} aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate text-xs font-extrabold text-navy-dark">{d.name}</span>
              <span className="block text-[11px] font-semibold text-ink-soft">
                {fmtNum(d.value, lang, 1)} {lang === "np" ? "करोड" : "crore"} · {fmtNum((d.value / toCrore(total)) * 100, lang, 1)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
      <span className="sr-only">{t("section_quarter")}</span>
    </div>
  );
}

export { GOLD };
