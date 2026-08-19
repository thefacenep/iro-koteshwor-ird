import { useMemo } from "react";
import { fmtDateTime } from "../../lib/format";
import { useApp } from "../../lib/store";
import { Reveal, SectionHead } from "../ui";
import { KpiTiles } from "./KpiTiles";
import { ChartCard, DonutChart, GroupedBarChart, StackedBarChart, TrendLineChart } from "./charts";
import { TrendTable } from "./TrendTable";

export function Dashboard() {
  const { t, lang, records, officeActive, officeMeta, clearOfficeData, notify } = useApp();

  const updated = useMemo(() => {
    const imported = records.filter((r) => r.importedAt).map((r) => r.importedAt as number);
    return imported.length ? Math.max(...imported) : Date.now();
  }, [records]);

  return (
    <div className="space-y-10">
      {/* live office dataset banner (Koteshwor upload) */}
      {officeActive && officeMeta && (
        <Reveal>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border-2 border-pine/50 bg-[#e9f6f0] px-5 py-3.5 shadow-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4.5 12.5l5 5L19.5 7" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="font-display text-[1.05rem] leading-tight text-[#0b4a3c]">{t("office_data_active")}</p>
              <p className="truncate text-xs font-semibold text-[#0b4a3c]/70">
                {t("office_data_sub")} · {officeMeta.file} · {fmtDateTime(officeMeta.ts, lang)}
              </p>
            </div>
            <button
              onClick={() => { clearOfficeData(); notify(t("national_restored")); }}
              className="touch-target ml-auto rounded-md border-2 border-pine/60 px-4 py-1.5 text-xs font-bold text-[#0b4a3c] transition-colors hover:bg-pine hover:text-white"
            >
              ↺ {t("restore_national")}
            </button>
          </div>
        </Reveal>
      )}

      {/* intro band */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead
          kicker={t("section_overview")}
          title={officeActive ? t("office_name") : t("portal")}
          sub={officeActive ? undefined : t("tagline")}
        />
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
