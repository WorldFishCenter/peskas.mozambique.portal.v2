"use client";
import { useAtom } from "jotai";
import { useTranslation } from "@/app/i18n/client";
import CatchMetricsChart from "./catch-metrics";
import FileStats from "@/app/shared/file/dashboard/file-stats";
import GearTreemap from "@/app/shared/file/dashboard/gear-treemap";
import CatchRadarChart from "@/app/shared/file/dashboard/catch-radar";
import DistrictRanking from "@/app/shared/file/dashboard/district-ranking";
import GridMap from "./grid-map";
import { selectedTimeRangeAtom } from "@/app/components/time-range-selector";
import Table, { HeaderCell } from "@/app/shared/table";
import TableFilter from "@/app/shared/controlled-table/table-filter";
import { api } from "@/trpc/react";
import { useState, useMemo } from "react";
import type { AlignType } from "rc-table/lib/interface";
import DistrictSummaryPlot from "./DistrictSummaryPlot";
import DistrictMetricsTable from "./DistrictMetricsTable";
import { getPaletteColor, getTextColor, formatNumber, YLGNBU_8 } from "./utils";


export default function FileDashboard({ lang }: { lang?: string }) {
  const { t } = useTranslation("common");

  // Default district-level dashboard for all users
  return (
    <div className="w-full">
      {/* Dashboard header */}
      {/* <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {t('text-fishing-dashboard')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('text-dashboard-description')}
          </p>
        </div>
      </div> */}
      <FileStats lang={lang} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5 xl:gap-6 w-full mt-4">
        <div className="md:col-span-4 h-64 xs:h-72 sm:h-80 md:h-[400px] lg:h-[500px] xl:h-[700px]">
          <DistrictSummaryPlot />
        </div>
        <div className="md:col-span-8 h-64 xs:h-72 sm:h-80 md:h-[400px] lg:h-[500px] xl:h-[700px] overflow-hidden">
          <GridMap />
        </div>
      </div>
      <div className="mt-4 md:mt-6">
        <DistrictMetricsTable />
      </div>
      {/* <div className="grid grid-cols-12 gap-5 xl:gap-6">
          <div className="col-span-12 md:col-span-9">
            <CatchMetricsChart
              lang={lang}
              selectedMetric={selectedMetric}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              district={undefined} // Show all districts by default
            />
          </div>
          <div className="col-span-12 md:col-span-3">
            <CatchRadarChart 
              lang={lang} 
              district={undefined} // Show all districts by default
            />
          </div>
        </div>
        <GearTreemap 
          lang={lang} 
          district={undefined} // Show all districts by default
        />
        <DistrictRanking 
          lang={lang} 
          district={undefined} // Show all districts by default
        /> */}
    </div>
  );
}