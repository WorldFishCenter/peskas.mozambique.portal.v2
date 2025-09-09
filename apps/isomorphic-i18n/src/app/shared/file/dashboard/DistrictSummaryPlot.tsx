"use client";
import WidgetCard from "@components/cards/widget-card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { useTranslation } from "@/app/i18n/client";
import { api } from "@/trpc/react";
import { useMemo, useRef, useState } from "react";
import { useAtom } from 'jotai';
import { selectedTimeRangeAtom } from '@/app/components/time-range-selector';
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@ui/select";
import { DISTRICT_COLORS } from "./charts/utils";
import { formatDashboardNumber, getAggregatedDistrictValue } from "./utils";

// Fallback colors for any districts not in the predefined mapping
const FALLBACK_COLORS = [
  "#167288", "#8cdaec", "#b45248", "#d48c84", "#a89a49", "#d6cfa2", "#3cb464", "#9bddb1", "#643c6a", "#836394", "#90a4ae"
];

// List of metrics to show in tooltip
const METRICS = [
  { key: "mean_cpue", labelKey: "metric-mean_cpue-title", unitKey: "metric-mean_cpue-unit", descKey: "metric-mean_cpue-desc" },
  { key: "mean_rpue", labelKey: "metric-mean_rpue-title", unitKey: "metric-mean_rpue-unit", descKey: "metric-mean_rpue-desc" },
  { key: "n_fishers", labelKey: "metric-n_fishers-title", unitKey: "metric-n_fishers-unit", descKey: "metric-n_fishers-desc" },
  { key: "n_submissions", labelKey: "metric-n_submissions-title", unitKey: "metric-n_submissions-unit", descKey: "metric-n_submissions-desc" },
  { key: "trip_duration", labelKey: "metric-trip_duration-title", unitKey: "metric-trip_duration-unit", descKey: "metric-trip_duration-desc" },
  { key: "mean_price_kg", labelKey: "metric-mean_price_kg-title", unitKey: "metric-mean_price_kg-unit", descKey: "metric-mean_price_kg-desc" },
  { key: "estimated_revenue_TZS", labelKey: "metric-estimated_revenue_TZS-title", unitKey: "metric-estimated_revenue_TZS-unit", descKey: "metric-estimated_revenue_TZS-desc" },
  { key: "estimated_catch_tn", labelKey: "metric-estimated_catch_tn-title", unitKey: "metric-estimated_catch_tn-unit", descKey: "metric-estimated_catch_tn-desc" },
];

function DistrictTooltip({ active, payload, allData, selectedMetric, lang }: any) {
  const { t } = useTranslation("common");
  if (!active || !payload || !payload.length) return null;
  const { name } = payload[0].payload;
  const districtData = allData.find((d: any) => d.district === name);
  if (!districtData) return null;
  return (
    <div className="bg-gray-0 dark:bg-gray-50 p-3 rounded shadow-lg border border-muted min-w-[180px] text-gray-900 dark:text-gray-700">
      <div className="font-semibold text-gray-900 dark:text-gray-700 mb-1">{name}</div>
      <div className="space-y-1">
        {METRICS.map(m => (
          <div key={m.key} className={`flex justify-between text-xs${m.key === selectedMetric ? ' font-bold' : ''}`}>
            <span className="text-gray-500 dark:text-gray-400">{t(m.labelKey)}:</span>
            <span className="font-medium text-gray-900 dark:text-gray-700">
              {districtData[m.key] !== null && districtData[m.key] !== undefined && !isNaN(districtData[m.key])
                ? formatDashboardNumber(districtData[m.key], m.key, lang)
                : "-"}
              {t(m.unitKey) ? ` ${t(m.unitKey)}` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DistrictSummaryPlot({ className, lang: propLang }: { className?: string, lang?: string }) {
  const lang = propLang || 'en';
  const { t } = useTranslation("common");
  const [range] = useAtom(selectedTimeRangeAtom);
  const { start, end } = useMemo(() => {
    if (range === "all") return { start: "1900-01-01", end: new Date().toISOString() };
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - Number(range));
    return { start: start.toISOString(), end: end.toISOString() };
  }, [range]);
  const [selectedMetric, setSelectedMetric] = useState("mean_cpue");
  const metricConfig = METRICS.find(m => m.key === selectedMetric) || METRICS[0];
  // Fetch summary for all districts (using the same API as DistrictMetricsTable)
  const { data = [], isLoading, error } = api.districtSummary.getDistrictsSummaryByDateRange.useQuery({ startDate: start, endDate: end });

  // Prepare and sort chart data by selected metric
  const chartData = useMemo(() => {
    const mapped = data
      .map((row: any) => ({
        name: row.district,
        value: getAggregatedDistrictValue(row, selectedMetric),
        ...row,
      }));
    
    const filtered = mapped.filter((d: any) => d.value !== null && !isNaN(d.value));
    
    return filtered
      .sort((a: any, b: any) => b.value - a.value)
      .map((d: any, idx: number) => ({ ...d, rank: idx + 1 }));
  }, [data, selectedMetric]);

  if (isLoading) {
    return (
      <WidgetCard title={t("text-district-summary") || "District Summary"} className={`h-full flex flex-col${className ? ` ${className}` : ''}` }>
        <div className="h-80 flex items-center justify-center animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </WidgetCard>
    );
  }

  if (error || !data) {
    return (
      <WidgetCard title={t("text-district-summary") || "District Summary"} className={`h-full flex flex-col${className ? ` ${className}` : ''}` }>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500">{t('text-no-data-available')}</p>
        </div>
      </WidgetCard>
    );
  }

  if (chartData.length === 0) {
    return (
      <WidgetCard title={t("text-district-summary") || "District Summary"} className={`h-full flex flex-col${className ? ` ${className}` : ''}` }>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500">No data available for districts</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title={
        <div className="flex flex-row items-center gap-3">
          <span className="font-semibold text-gray-900 dark:text-gray-700">
            {t("text-district-summary")}
          </span>
          <div className="min-w-fit">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-full max-w-[180px] sm:max-w-[240px] md:max-w-[300px]">
                <SelectValue>{t(METRICS.find(m => m.key === selectedMetric)?.labelKey || "")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {METRICS.map(m => (
                  <SelectItem key={m.key} value={m.key}>{t(m.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      }
      className={`border border-muted bg-gray-0 p-5 dark:bg-gray-50 rounded-lg h-full flex flex-col${className ? ` ${className}` : ''}`}
    >
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" strokeOpacity={0.7} className="dark:stroke-gray-700" />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickFormatter={(value) => formatDashboardNumber(value, selectedMetric, lang)}
              label={{
                value: `${t(metricConfig.labelKey)}${t(metricConfig.unitKey) ? ` (${t(metricConfig.unitKey)})` : ''} ${['n_submissions', 'estimated_catch_tn', 'estimated_revenue_TZS'].includes(selectedMetric) ? '(Aggregated)' : '(Average)'}`,
                position: 'insideBottom',
                offset: -5,
                style: { fontSize: 13, fill: '#64748b', fontWeight: 500, textAnchor: 'middle' }
              }}
              axisLine={{ stroke: '#cbd5e1', strokeWidth: 1, className: 'dark:stroke-gray-700' }}
              tickLine={{ stroke: '#cbd5e1', className: 'dark:stroke-gray-700' }}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 12, fill: "#64748b" }}
              width={120}
              tickFormatter={(name: string, idx: number) => {
                const d = chartData[idx];
                return d ? `${d.rank}. ${name}` : name;
              }}
              axisLine={{ stroke: '#cbd5e1', strokeWidth: 1, className: 'dark:stroke-gray-700' }}
              tickLine={{ stroke: '#cbd5e1', className: 'dark:stroke-gray-700' }}
            />
            <Tooltip content={<DistrictTooltip allData={data} selectedMetric={selectedMetric} lang={lang} />} wrapperStyle={{ background: 'transparent' }} />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]} 
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => {
                const districtName = entry.name;
                const color = DISTRICT_COLORS[districtName] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
              {/* Show value at end of bar */}
              <LabelList dataKey="value" position="right" formatter={(value: number) => formatDashboardNumber(value, selectedMetric, lang)} style={{ fontSize: 12, fill: '#222', filter: 'invert(1) brightness(2)'}} className="dark:fill-white" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
} 