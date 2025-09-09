"use client";

import { useMemo, useState } from "react";
import { api } from "@/trpc/react";
import { useAtom } from "jotai";
import { districtsAtom } from "@/app/components/filter-selector";
import { selectedTimeRangeAtom } from "@/app/components/time-range-selector";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import WidgetCard from "@components/cards/widget-card";
import { Title } from "rizzui";
import { useTranslation } from "@/app/i18n/client";
import { DISTRICT_COLORS } from "../charts/utils";
import { 
  CHART_STYLES, 
  SHARED_METRIC_CONFIG, 
  getDistrictColor, 
  formatChartTitle 
} from "./chart-styles";


// Custom tooltip component for modern styling
const CustomTooltip = ({ active, payload, label, selectedMetric }: any) => {
  const { t } = useTranslation("common");
  
  if (active && payload && payload.length) {
    // Only show entries with a real value (not null/undefined/NA)
    const filteredPayload = payload.filter((entry: any) => entry.value !== null && entry.value !== undefined);
    if (filteredPayload.length === 0) return null;
    // Sort payload by value to rank districts
    const sortedPayload = [...filteredPayload].sort((a, b) => (b.value || 0) - (a.value || 0));
    const maxValue = sortedPayload[0]?.value || 0;
    const minValue = sortedPayload[sortedPayload.length - 1]?.value || 0;
    
    return (
      <div className="bg-gray-0 dark:bg-gray-50 p-3 rounded shadow-lg border border-muted min-w-[180px] text-gray-900 dark:text-gray-700">
        <div className="font-semibold text-gray-900 dark:text-gray-700 mb-1">
          {label}
        </div>
        <div className="space-y-1">
          {sortedPayload.map((entry: any, index: number) => {
            const isHighest = entry.value === maxValue && maxValue > 0;
            const isLowest = entry.value === minValue && minValue > 0 && maxValue !== minValue;
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className={`text-xs ${
                    isHighest ? 'text-green-600 dark:text-green-400 font-semibold' :
                    isLowest ? 'text-red-600 dark:text-red-400 font-semibold' :
                    'text-gray-500 dark:text-gray-400'
                  }`}>
                    {entry.name}
                  </span>
                </div>
                <span className={`text-xs font-medium text-gray-900 dark:text-gray-700 ${
                  isHighest ? 'text-green-600 dark:text-green-400' :
                  isLowest ? 'text-red-600 dark:text-red-400' : ''
                }`}>
                  {entry.value?.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};



interface CatchRadarProps {
  selectedMetrics: string[];
  className?: string;
}

export default function CatchRadar({ 
  selectedMetrics, 
  className = "" 
}: CatchRadarProps) {
  const { t } = useTranslation("common");
  const [selectedDistricts] = useAtom(districtsAtom);
  const [selectedTimeRange] = useAtom(selectedTimeRangeAtom);
  const [hiddenDistricts, setHiddenDistricts] = useState<string[]>([]);
  
  // Memoized month names with translations
  const MONTHS = useMemo(() => [
    t("text-jan") || "Jan", t("text-feb") || "Feb", t("text-mar") || "Mar", t("text-apr") || "Apr", t("text-may") || "May", t("text-jun") || "Jun",
    t("text-jul") || "Jul", t("text-aug") || "Aug", t("text-sep") || "Sep", t("text-oct") || "Oct", t("text-nov") || "Nov", t("text-dec") || "Dec"
  ], [t]);
  
  // Calculate year based on time range
  const currentYear = new Date().getFullYear();
  const year = currentYear;
  
  const { data, isLoading, error } = api.monthlySummary.radarData.useQuery(
    {
      districts: selectedDistricts,
      metrics: selectedMetrics,
      year
    },
    {
      enabled: selectedDistricts.length > 0 && selectedMetrics.length > 0,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    }
  );

  const chartData = useMemo(() => {
    if (!data) return [];

    return MONTHS.map((month, index) => {
      const point: any = { month };
      
      // For each district, get the district-specific value
      selectedDistricts.forEach(district => {
        if (data[index] && district in data[index]) {
          const value = data[index][district];
          // Only include if it's a non-zero value
          if (value > 0) {
            point[district] = Math.round(value * 100) / 100;
          }
          // If value is 0 or undefined, don't set it at all (leave it undefined)
        }
        // If district not in data, leave it undefined
      });
      
      return point;
    });
  }, [data, selectedDistricts, MONTHS]);

  const handleLegendClick = (entry: any) => {
    const district = entry.dataKey;
    setHiddenDistricts(prev => 
      prev.includes(district) 
        ? prev.filter(d => d !== district)
        : [...prev, district]
    );
  };



  if (isLoading) {
    return (
      <WidgetCard title={t("text-loading") || "Loading..."} className={className}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </WidgetCard>
    );
  }

  if (error || !data) {
    return (
      <WidgetCard title={t("text-error") || "Error"} className={className}>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500">{t('text-no-data-available')}</p>
        </div>
      </WidgetCard>
    );
  }

  if (chartData.length === 0) {
    return (
      <WidgetCard title={t("text-no-data") || "No Data"} className={className}>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500">{t("text-no-data-available-for-filters") || "No data available for selected filters"}</p>
        </div>
      </WidgetCard>
    );
  }

  const selectedMetric = selectedMetrics[0];
  const metricConfig = SHARED_METRIC_CONFIG[selectedMetric as keyof typeof SHARED_METRIC_CONFIG];

  return (
    <WidgetCard 
      title={formatChartTitle(selectedMetric, t("text-seasonality") || "Seasonality", t)}
      description={`Year: ${year}`}
      className={className}
    >
      <div className="h-80 md:h-96 lg:h-[28rem] xl:h-[32rem]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={CHART_STYLES.margins}>
            <PolarGrid />
            <PolarAngleAxis dataKey="month" />
            <PolarRadiusAxis />
            <Tooltip 
              content={<CustomTooltip selectedMetric={selectedMetric} />}
              wrapperStyle={CHART_STYLES.tooltip.wrapperStyle}
            />
            <Legend 
              {...CHART_STYLES.legend} 
              onClick={handleLegendClick}
            />
            {selectedDistricts.map((district, idx) => {
              const color = getDistrictColor(district, idx, DISTRICT_COLORS);
              return (
                <Radar
                  key={district}
                  name={district}
                  dataKey={district}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  hide={hiddenDistricts.includes(district)}
                  {...CHART_STYLES.animation}
                />
              );
            })}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
} 