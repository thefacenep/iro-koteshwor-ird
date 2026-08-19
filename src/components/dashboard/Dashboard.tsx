import { fmtDateTime } from "../../lib/format";
import { useApp } from "../../lib/store";
import { Reveal, SectionHead } from "../ui";
import { KpiTiles } from "./KpiTiles";
import { ChartCard, FyCompareChart, GapStackChart, QuarterDonut, TrendLineChart } from "./charts";
import { TrendTable, TrendTableNote } from "./TrendTable";

export function Dashboard() {
  const { t, lang, office, officeModified, resetOffice, notify, setBoardOpen } = useApp();

  return (
    <div className="space-y-10">
      {/* live office dataset banner */}
      <Reveal>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border-2 border-pine/50 bg-[#e9f6f0] px-5 py-3.5 shadow-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4.5 12.5l5 5L19.5 7" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="font-display text-[1.05rem] leading-tight text-[#0b4a3c]">{t("office_live_data")} — {t("office_name")}</p>
            <p className="truncate text-xs font-semibold text-[#0b4a3c]/70">
              {office.file}{office.ts > 0 ? ` · ${fmtDateTime(office.ts, lang)}` : lang === "np" ? " · आधिकारिक सिड तथ्याङ्क" : " · official seeded figures"}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              onClick={() => setBoardOpen(true)}
              className="touch-target rounded-md bg-navy-dark px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-navy"
            >
              ▸ {t("board_mode")}
            </button>
            {officeModified && (
              <button
                onClick={() => { resetOffice(); notify(t("national_restored")); }}
                className="touch-target rounded-md border-2 border-pine/60 px-4 py-1.5 text-xs font-bold text-[#0b4a3c] transition-colors hover:bg-pine hover:text-white"
              >
                ↺ {t("restore_seeded")}
              </button>
            )}
          </div>
        </div>
      </Reveal>

      <KpiTiles />

      {/* trend line + quarterly donut */}
      <div className="grid gap-6 xl:grid-cols-12">
        <Reveal className="xl:col-span-7">
          <ChartCard title={t("section_trend")} sub={t("section_trend_sub")}>
            <TrendLineChart />
          </ChartCard>
        </Reveal>
        <Reveal delay={100} className="xl:col-span-5">
          <ChartCard title={t("section_quarter")} sub={t("section_quarter_sub")} className="h-full">
            <QuarterDonut />
          </ChartCard>
        </Reveal>
      </div>

      {/* grouped comparison + stacked gap */}
      <div className="grid gap-6 xl:grid-cols-12">
        <Reveal className="xl:col-span-6">
          <ChartCard title={t("section_compare")} sub={t("section_compare_sub")} className="h-full">
            <FyCompareChart />
          </ChartCard>
        </Reveal>
        <Reveal delay={100} className="xl:col-span-6">
          <ChartCard title={t("section_gap")} sub={t("section_gap_sub")} className="h-full">
            <GapStackChart />
          </ChartCard>
        </Reveal>
      </div>

      {/* exact monthly matrix */}
      <Reveal>
        <ChartCard title={t("section_table")} sub={t("section_table_sub")}>
          <div className="px-2 pb-2">
            <TrendTable />
            <TrendTableNote />
          </div>
        </ChartCard>
      </Reveal>
    </div>
  );
}
