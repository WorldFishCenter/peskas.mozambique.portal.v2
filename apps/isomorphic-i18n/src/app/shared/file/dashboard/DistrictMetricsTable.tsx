import { useAtom } from "jotai";
import { useTranslation } from "@/app/i18n/client";
import Table, { HeaderCell } from "@/app/shared/table";
import { selectedTimeRangeAtom } from "@/app/components/time-range-selector";
import { api } from "@/trpc/react";
import { useState, useMemo } from "react";
import type { AlignType } from "rc-table/lib/interface";
import { getPaletteColor, getTextColor, formatNumber, formatDashboardNumber } from "./utils";

function DistrictMetricsTable({ lang = 'en' }: { lang?: string }) {
  const [range] = useAtom(selectedTimeRangeAtom);
  const [sorter, setSorter] = useState<{ columnKey: string; order: 'ascend' | 'descend' | null }>({ columnKey: 'district', order: null });
  const { start, end } = useMemo(() => {
    if (range === "all") return { start: "1900-01-01", end: new Date().toISOString() };
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - Number(range));
    return { start: start.toISOString(), end: end.toISOString() };
  }, [range]);
  const { data = [], isLoading } = api.districtSummary.getDistrictsSummaryByDateRange.useQuery({ startDate: start, endDate: end });
  const metricKeys = [
    "n_submissions",
    "n_fishers",
    "trip_duration",
    "mean_cpue",
    "mean_rpue",
    "mean_price_kg",
    "estimated_revenue_TZS",
    "estimated_catch_tn"
  ];
  // Compute min/max for each metric for palette
  const minMax: Record<string, { min: number, max: number }> = {};
  for (const key of metricKeys) {
    const vals = data.map((row: any) => row[key]).filter((v: any) => v !== null && !isNaN(v));
    minMax[key] = {
      min: vals.length ? Math.min(...vals) : 0,
      max: vals.length ? Math.max(...vals) : 1
    };
  }
  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sorter.order) return data;
    const { columnKey, order } = sorter;
    return [...data].sort((a, b) => {
      let va = a[columnKey];
      let vb = b[columnKey];
      if (va === undefined || va === null) va = '';
      if (vb === undefined || vb === null) vb = '';
      if (typeof va === 'string' && typeof vb === 'string') {
        return order === 'ascend' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return order === 'ascend' ? va - vb : vb - va;
    });
  }, [data, sorter]);

  const { t } = useTranslation("common");
  
  // Define units for each metric
  const metricUnits: Record<string, string> = {
    n_submissions: t('text-unit-submissions'),
    n_fishers: t('text-unit-fishers'),
    trip_duration: t('text-unit-hours'),
    mean_cpue: t('text-unit-kg-fisher-hour'),
    mean_rpue: t('text-unit-tzs-fisher-hour'),
    mean_price_kg: t('text-unit-tzs-kg')
  };

  const columns = [
    {
      title: (
        <HeaderCell
          title={t('text-district')}
          align="center"
          sortable
          ascending={sorter.columnKey === 'district' ? sorter.order === 'ascend' : undefined}
        />
      ),
      dataIndex: "district",
      key: "district",
      align: "center" as AlignType,
      sorter: true,
      sortOrder: sorter.columnKey === 'district' ? sorter.order : null,
      onHeaderCell: () => ({
        onClick: () => setSorter(s => ({
          columnKey: 'district',
          order: s.columnKey === 'district' && s.order === 'ascend' ? 'descend' : 'ascend',
        }))
      }),
      render: (val: string) => <div className="text-center font-bold text-gray-900">{val}</div>
    },
    ...metricKeys.map(key => ({
      title: (
        <HeaderCell
          title={
            <div className="text-center">
              <div>{t(`metric-${key}-title`)}</div>
              {metricUnits[key] && (
                <div className="text-xs text-gray-500 font-normal">
                  ({metricUnits[key]})
                </div>
              )}
            </div>
          }
          align="center"
          sortable
          ascending={sorter.columnKey === key ? sorter.order === 'ascend' : undefined}
        />
      ),
      dataIndex: key,
      key,
      align: "center" as AlignType,
      sorter: true,
      sortOrder: sorter.columnKey === key ? sorter.order : null,
      onHeaderCell: () => ({
        onClick: () => setSorter(s => ({
          columnKey: key,
          order: s.columnKey === key && s.order === 'ascend' ? 'descend' : 'ascend',
        }))
      }),
      render: (val: number | null) => {
        const { min, max } = minMax[key];
        const bg = getPaletteColor(val, min, max);
        const color = getTextColor(bg);
        return (
          <div style={{ background: bg, color, borderRadius: 4, padding: '0.25em 0.5em', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
            {formatDashboardNumber(val, key, lang)}
          </div>
        );
      }
    }))
  ];
  return (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <span className="font-semibold text-gray-700">District Metrics</span>
        {/* Time range selector moved to header */}
      </div>
      <div className="overflow-x-auto">
        {isLoading && <div className="py-4 text-center text-gray-500">Loading...</div>}
        <Table
          columns={columns}
          data={sortedData}
          variant="elegant"
          className="min-w-[600px]"
          rowKey="district"
        />
      </div>
    </div>
  );
}

export default DistrictMetricsTable; 