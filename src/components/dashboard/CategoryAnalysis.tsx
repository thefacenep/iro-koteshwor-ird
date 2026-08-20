import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartCategories, type RevenueCategoryData } from "../../data/office";
import { fmtInt, fmtNum, fmtPct, toNpDigits } from "../../lib/format";
import { useApp } from "../../lib/store";
import { Reveal } from "../ui";
import { ChartCard } from "./charts";

const axisStyle = { fontSize: 11, fontWeight: 700, fill: "#51617f" };
const fmt = (n: number, lang: "en" | "np") => (lang === "np" ? toNpDigits(n.toLocaleString("en-US")) : n.toLocaleString("en-US"));
const kTick = (v: number, lang: "en" | "np") => {
  const s = v >= 1000 ? `${Math.round(v / 1000)}k` : String(v);
  return lang === "np" ? toNpDigits(s) : s;
};
const achColor = (pct: number) => (pct > 100 ? "#0e7c66" : pct >= 80 ? "#e8a020" : "#c8102e");

/* shared tooltip shell */
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-navy-deep/95 px-3.5 py-2.5 text-xs font-semibold text-white shadow-xl">{children}</div>
  );
}

/* donut with hover-synced legend */
function CollectionDonut({ data }: { data: RevenueCategoryData[] }) {
  const { t, lang, office } = useApp();
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((s, c) => s + c.monthlyCollection, 0);
  const pie = data.map((c) => ({
    name: lang === "np" ? c.nameNepali : c.name,
    value: c.monthlyCollection,
    pct: c.contributionPercent,
    color: c.color,
  }));

  return (
    <div className="flex flex-col items-center gap-3 md:flex-row">
      <div className="relative h-[230px] w-full max-w-[280px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pie}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="92%"
              paddingAngle={2.5}
              strokeWidth={2}
              stroke="#ffffff"
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              {pie.map((p, i) => (
                <Cell
                  key={i}
                  fill={p.color}
                  fillOpacity={active === null || active === i ? 1 : 0.28}
                  style={{ transition: "fill-opacity 0.25s ease", cursor: "pointer" }}
                />
              ))}
            </Pie>
            <Tooltip
              cursor={{ fill: "rgba(11,34,96,0.06)" }}
              content={({ active: a, payload }) =>
                a && payload && payload[0] ? (
                  <Tip>
                    <p style={{ color: (payload[0].payload as { color: string }).color }} className="font-extrabold">
                      {(payload[0].payload as { name: string }).name}
                    </p>
                    <p className="mt-1 tabular-nums">
                      {fmt((payload[0].payload as { value: number }).value, lang)} {t("thousand_npr")}
                    </p>
                    <p className="text-white/65">{fmtPct((payload[0].payload as { pct: number }).pct, lang, 2)} {t("share")}</p>
                  </Tip>
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink-soft">{t("total_collection")}</p>
          <p className="font-display text-[1.55rem] leading-none tabular-nums text-navy-dark">{fmtInt(office.categories.find((c) => c.isTotal)?.monthlyCollection ?? total, lang)}</p>
          <p className="text-[10px] font-bold text-ink-soft">{t("thousand_npr")}</p>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-1" role="list">
        {pie.map((p, i) => (
          <li
            key={i}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className={`flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-[7px] transition-all ${
              active === i ? "bg-navy/5 shadow-sm" : ""
            } ${active !== null && active !== i ? "opacity-40" : ""}`}
          >
            <span className="h-3 w-3 shrink-0 rounded-[3px]" style={{ background: p.color }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink">{p.name}</span>
            <span className="text-[13px] font-bold tabular-nums text-navy-dark">{fmt(p.value, lang)}</span>
            <span className="w-[52px] text-right text-[12px] font-extrabold tabular-nums" style={{ color: p.color }}>
              {fmtPct(p.pct, lang, 2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* minimum-width bar shape so tiny values stay visible on a shared scale */
function MinBar(props: Record<string, unknown>) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const w = Math.max(Number(props.width ?? 0), 3);
  const h = Number(props.height ?? 0);
  const fill = String(props.fill ?? "#1e3a8a");
  return <rect x={x} y={y} width={w} height={h} fill={fill} rx={2} />;
}

function TargetActualChart({ data }: { data: RevenueCategoryData[] }) {
  const { t, lang } = useApp();
  const rows = data.map((c) => ({
    name: lang === "np" ? c.nameNepali : c.name,
    target: c.monthlyTarget,
    collected: c.monthlyCollection,
    achievement: c.achievementPercent,
    color: achColor(c.achievementPercent),
  }));
  const max = Math.max(...rows.map((r) => Math.max(r.target, r.collected))) * 1.18;

  return (
    <div>
      <div className="h-[290px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 54, left: 4, bottom: 0 }} barGap={3}>
            <CartesianGrid horizontal={false} stroke="#e3e9f4" />
            <XAxis type="number" domain={[0, max]} tick={axisStyle} tickFormatter={(v: string | number) => kTick(Number(v), lang)} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={92} tick={{ ...axisStyle, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(11,34,96,0.05)" }}
              content={({ active, payload }) =>
                active && payload && payload.length ? (
                  <Tip>
                    <p className="font-extrabold">{String(payload[0].payload.name)}</p>
                    <p className="mt-1 text-white/75">
                      {t("target")}: <span className="tabular-nums text-white">{fmt(Number(payload[0].payload.target), lang)}</span>
                    </p>
                    <p className="text-white/75">
                      {t("collected")}: <span className="tabular-nums text-white">{fmt(Number(payload[0].payload.collected), lang)}</span>
                    </p>
                    <p style={{ color: achColor(Number(payload[0].payload.achievement)) }} className="mt-0.5 font-extrabold">
                      {fmtPct(Number(payload[0].payload.achievement), lang, 0)} {t("achievement")}
                    </p>
                  </Tip>
                ) : null
              }
            />
            <Bar dataKey="target" fill="#1e3a8a" fillOpacity={0.16} stroke="#1e3a8a" strokeOpacity={0.55} radius={[2, 2, 2, 2]} shape={<MinBar />} name={t("target")} />
            <Bar dataKey="collected" radius={[2, 2, 2, 2]} shape={<MinBar />} name={t("collected")}>
              {rows.map((r, i) => (
                <Cell key={i} fill={r.color} />
              ))}
              <LabelList
                dataKey="achievement"
                position="right"
                formatter={(v: string | number) => fmtPct(Number(v), lang, 0)}
                style={{ fontSize: 11, fontWeight: 800, fill: "#33415c" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-[2px] border border-navy/60 bg-navy/15" /> {t("target")}</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-[2px] bg-pine" /> {t("success")} &gt;100%</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-[2px] bg-marigold" /> 80–100%</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-[2px] bg-crimson" /> &lt;80%</span>
      </div>
    </div>
  );
}

function GrowthCompareChart({ data, compact = false }: { data: RevenueCategoryData[]; compact?: boolean }) {
  const { t, lang } = useApp();
  const rows = data.map((c) => ({
    name: lang === "np" ? c.nameNepali : c.name,
    prev: c.previousYearCollection,
    curr: c.monthlyCollection,
    growth: c.growthPercent,
  }));

  return (
    <div className={compact ? "h-full min-h-[300px]" : "h-[300px]"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 26, right: 8, left: 4, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="#e3e9f4" />
          <XAxis dataKey="name" tick={{ ...axisStyle, fontSize: compact ? 10 : 11 }} interval={0} angle={compact ? -18 : 0} height={compact ? 44 : 30} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} tickFormatter={(v) => kTick(Number(v), lang)} axisLine={false} tickLine={false} width={44} />
          <Tooltip
            cursor={{ fill: "rgba(11,34,96,0.05)" }}
            content={({ active, payload }) =>
              active && payload && payload.length ? (
                <Tip>
                  <p className="font-extrabold">{String(payload[0].payload.name)}</p>
                  <p className="mt-1 text-white/75">
                    2082/83: <span className="tabular-nums text-white">{fmt(Number(payload[0].payload.prev), lang)}</span>
                  </p>
                  <p className="text-white/75">
                    2083/84: <span className="tabular-nums text-white">{fmt(Number(payload[0].payload.curr), lang)}</span>
                  </p>
                  <p className={`mt-0.5 font-extrabold ${Number(payload[0].payload.growth) < 100 ? "text-[#ff9eab]" : "text-[#7fe0bd]"}`}>
                    {Number(payload[0].payload.growth) < 100 ? "▼" : "▲"} {fmtPct(Number(payload[0].payload.growth), lang, 0)}
                    {Number(payload[0].payload.growth) < 100 ? ` · ${t("growth_decrease")}` : ""}
                  </p>
                </Tip>
              ) : null
            }
          />
          <Bar dataKey="prev" fill="#8fa3cc" radius={[3, 3, 0, 0]} name="2082/083" />
          <Bar dataKey="curr" fill="#dc143c" radius={[3, 3, 0, 0]} name="2083/084">
            <LabelList
              dataKey="growth"
              position="top"
              formatter={(v: string | number) => `${Number(v) < 100 ? "▼" : "▲"}${fmtPct(Number(v), lang, 0)}`}
              style={{ fontSize: compact ? 9 : 11, fontWeight: 800 }}
              fill="#33415c"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* performance table — exact Book1 rows with achievement pills & growth arrows */
function CategoryTable({ rows }: { rows: RevenueCategoryData[] }) {
  const { t, lang } = useApp();
  const catName = (c: RevenueCategoryData) => {
    if (c.isTotal) return t("cat_grand_total");
    if (c.isSubtotal) return t("cat_subtotal_income");
    return lang === "np" ? c.nameNepali : c.name;
  };
  const pill = (pct: number) =>
    pct > 100
      ? "bg-[#e5f5ef] text-[#0b5d4a] border-pine/40"
      : pct >= 80
        ? "bg-[#fdf3d7] text-[#7a5a00] border-gold/50"
        : "bg-crimson-soft text-crimson-dark border-crimson/40";

  return (
    <div className="log-scroll max-h-[430px] overflow-auto">
      <table className="w-full min-w-[860px] text-[13px]">
        <thead className="sticky top-0 z-10">
          <tr className="bg-navy-dark text-left text-white">
            <th className="px-3.5 py-2.5 font-extrabold">{t("th_revenue_head")}</th>
            {([
              ["th_annual_target", "right"],
              ["th_monthly_target", "right"],
              ["th_monthly_collection", "right"],
              ["th_achievement", "right"],
              ["th_contribution", "left"],
              ["th_prev_collection", "right"],
              ["th_growth_pct", "right"],
            ] as const).map(([k, align]) => (
              <th key={k} className={`px-3.5 py-2.5 font-extrabold ${align === "right" ? "text-right" : ""}`}>
                {t(k)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <tr
              key={i}
              className={`border-t border-line transition-colors hover:bg-navy/5 ${
                c.isTotal ? "bg-navy-dark text-white hover:bg-navy-dark" : c.isSubtotal ? "bg-[#eef1f9] font-bold" : ""
              }`}
            >
              <td className="px-3.5 py-2.5">
                <span className="flex items-center gap-2.5">
                  <span className="h-3 w-3 shrink-0 rounded-[3px]" style={{ background: c.color }} aria-hidden="true" />
                  <span className={`font-bold ${c.isTotal ? "text-white" : "text-ink"}`}>{catName(c)}</span>
                </span>
              </td>
              <td className="px-3.5 py-2.5 text-right tabular-nums">{fmt(c.annualTarget, lang)}</td>
              <td className="px-3.5 py-2.5 text-right tabular-nums">{fmt(c.monthlyTarget, lang)}</td>
              <td className={`px-3.5 py-2.5 text-right font-extrabold tabular-nums ${c.isTotal ? "text-gold" : "text-navy-dark"}`}>{fmt(c.monthlyCollection, lang)}</td>
              <td className="px-3.5 py-2.5 text-right">
                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[12px] font-extrabold tabular-nums ${c.isTotal ? "border-gold/60 bg-gold/20 text-gold" : pill(c.achievementPercent)}`}>
                  {fmtPct(c.achievementPercent, lang, 0)}
                </span>
              </td>
              <td className="px-3.5 py-2.5">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-16 overflow-hidden rounded-full bg-paper">
                    <span className="grow-bar block h-full rounded-full" style={{ width: `${Math.min(100, c.contributionPercent)}%`, background: c.color }} />
                  </span>
                  <span className="tabular-nums font-bold">{fmtNum(c.contributionPercent, lang, 2)}%</span>
                </span>
              </td>
              <td className="px-3.5 py-2.5 text-right tabular-nums">{fmt(c.previousYearCollection, lang)}</td>
              <td className={`px-3.5 py-2.5 text-right font-extrabold tabular-nums ${c.growthPercent < 100 ? "text-crimson" : c.isTotal ? "text-[#7fe0bd]" : "text-pine"}`}>
                {c.growthPercent < 100 ? "▼" : "▲"} {fmtPct(c.growthPercent, lang, 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================= section ================= */
export function CategoryAnalysis() {
  const { t, lang, office } = useApp();
  const mains = useMemo(() => chartCategories(office.categories), [office.categories]);

  return (
    <>
      {/* donut + target vs actual */}
      <div className="grid gap-6 xl:grid-cols-12">
        <Reveal className="xl:col-span-5">
          <ChartCard
            title={t("chart_collection_share")}
            sub={`${t("total_collection")}: ${fmtInt(office.categories.find((c) => c.isTotal)?.monthlyCollection ?? mains.reduce((s, c) => s + c.monthlyCollection, 0), lang)} ${t("thousand_npr")}`}
          >
            <CollectionDonut data={mains} />
          </ChartCard>
        </Reveal>
        <Reveal delay={100} className="xl:col-span-7">
          <ChartCard title={t("chart_target_actual")} sub={t("chart_target_actual_sub")} className="h-full">
            <TargetActualChart data={mains} />
          </ChartCard>
        </Reveal>
      </div>

      {/* growth comparison */}
      <Reveal>
        <ChartCard title={t("chart_growth_yoy")} sub={t("chart_growth_yoy_sub")}>
          <GrowthCompareChart data={mains} />
        </ChartCard>
      </Reveal>

      {/* performance table */}
      <Reveal>
        <ChartCard title={t("table_category_title")} sub={`${t("analysis_kicker")} · ${t("unit_thousand_note")}`}>
          <CategoryTable rows={office.categories} />
        </ChartCard>
      </Reveal>
    </>
  );
}

export { CollectionDonut, GrowthCompareChart };
