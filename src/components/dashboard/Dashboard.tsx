import { useMemo } from "react";
import { fmtDateTime } from "../../lib/format";
import { useApp } from "../../lib/store";
import { Reveal, SectionHead } from "../ui";
import { KpiTiles } from "./KpiTiles";
import { ChartCard, DonutChart, GroupedBarChart, StackedBarChart, TrendLineChart } from "./charts";
import { TrendTable } from "./TrendTable";

export function Dashboard() {
  const { t, lang, records } = useApp();

  const updated = useMemo(() => {
    const imported = records.filter((r) => r.importedAt).map((r) => r.importedAt as number);
    return imported.length ? Math.max(...imported) : Date.now();
  }, [records]);

  return (
    <div className="space-y-10">
      {/* intro band */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead kicker={t("section_overview")} title={t("portal")} sub={t("tagline")} />
        <Reveal delay={120}>
          <p className="flex items-center gap-2 rounded-md border border-line bg-card px-3.5 py-2 text-xs font-bold text-ink-soft shadow-sm">
            <span className="live-dot h-2 w-2 rounded-full bg-pine" aria-hidden="true" />
            {t("data_updated")}: {fmtDateTime(updated, lang)}
            <span className="mx-1 h-3 w-px bg-line" aria-hidden="true" />
            {t("unit_note")}
          </p>
        </Reveal>
      </div>

      <KpiTiles />

      {/* stacked + donut */}
      <div className="grid gap-6 xl:grid-cols-12">
        <Reveal className="xl:col-span-7">
          <ChartCard title={t("section_monthly")} sub={t("section_monthly_sub")}>
            <StackedBarChart />
          </ChartCard>
        </Reveal>
        <Reveal delay={100} className="xl:col-span-5">
          <ChartCard title={t("section_share")} sub={t("section_share_sub")} className="h-full">
            <DonutChart />
          </ChartCard>
        </Reveal>
      </div>

      {/* trend line */}
      <Reveal>
        <ChartCard title={t("section_trend")} sub={t("section_trend_sub")}>
          <TrendLineChart />
        </ChartCard>
      </Reveal>

      {/* grouped + table */}
      <div className="grid gap-6 xl:grid-cols-12">
        <Reveal className="xl:col-span-5">
          <ChartCard title={t("section_compare")} sub={t("section_compare_sub")} className="h-full">
            <GroupedBarChart />
          </ChartCard>
        </Reveal>
        <Reveal delay={100} className="xl:col-span-7">
          <ChartCard title={t("section_table")} sub={t("section_table_sub")} className="h-full">
            <TrendTable />
          </ChartCard>
        </Reveal>
      </div>
    </div>
  );
}
