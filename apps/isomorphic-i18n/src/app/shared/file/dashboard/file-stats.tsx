"use client";

import { Text, Button } from "rizzui";
import cn from "@utils/class-names";
import { useScrollableSlider } from "@hooks/use-scrollable-slider";
import { PiCaretLeftBold, PiCaretRightBold } from "react-icons/pi";
import { useTranslation } from "@/app/i18n/client";
import { api } from "@/trpc/react";
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

type FileStatsType = {
  className?: string;
  lang?: string;
};

const METRIC_CONFIG = {
  n_submissions: {
    titleKey: 'metric-n_submissions-title',
    unitKey: 'metric-n_submissions-unit',
    descKey: 'metric-n_submissions-desc',
    color: '#F28F3B',
    currentColor: '#75ABBC',
  },
  // n_fishers: {
  //   titleKey: 'metric-n_fishers-title',
  //   unitKey: 'metric-n_fishers-unit',
  //   descKey: 'metric-n_fishers-desc',
  //   color: '#F28F3B',
  //   currentColor: '#75ABBC',
  // },
  trip_duration: {
    titleKey: 'metric-trip_duration-title',
    unitKey: 'metric-trip_duration-unit',
    descKey: 'metric-trip_duration-desc',
    color: '#F28F3B',
    currentColor: '#75ABBC',
  },
  mean_cpue: {
    titleKey: 'metric-mean_cpue-title',
    unitKey: 'metric-mean_cpue-unit',
    descKey: 'metric-mean_cpue-desc',
    color: '#F28F3B',
    currentColor: '#75ABBC',
  },
  mean_rpue: {
    titleKey: 'metric-mean_rpue-title',
    unitKey: 'metric-mean_rpue-unit',
    descKey: 'metric-mean_rpue-desc',
    color: '#F28F3B',
    currentColor: '#75ABBC',
  },
  mean_price_kg: {
    titleKey: 'metric-mean_price_kg-title',
    unitKey: 'metric-mean_price_kg-unit',
    descKey: 'metric-mean_price_kg-desc',
    color: '#F28F3B',
    currentColor: '#75ABBC',
  },
  estimated_catch_tn: {
    titleKey: 'metric-estimated_catch_tn-title',
    unitKey: 'metric-estimated_catch_tn-unit',
    descKey: 'metric-estimated_catch_tn-desc',
    color: '#F28F3B',
    currentColor: '#75ABBC',
  },
  estimated_revenue_TZS: {
    titleKey: 'metric-estimated_revenue_TZS-title',
    unitKey: 'metric-estimated_revenue_TZS-unit',
    descKey: 'metric-estimated_revenue_TZS-desc',
    color: '#F28F3B',
    currentColor: '#75ABBC',
  },
};

function MetricBarCard({ 
  metric,
  config, 
  data,
  lang 
}: { 
  metric: string;
  config: any;
  data: any;
  lang?: string;
}) {
  const { t } = useTranslation(lang!, 'common');
  
  if (!data || !data.data || data.data.length === 0) {
    return null;
  }

  // Take last 3 months of data
  const last3Months = data.data.slice(-3);

  // Use the months from the API if available, otherwise fallback to last3Months
  const allMonths = (data.months && data.months.slice(-3)) || last3Months.map((item: any) => item.month);

  // Get all available regions from the data dynamically
  const availableRegions = new Set<string>();
  last3Months.forEach((item: any) => {
    Object.keys(item).forEach(key => {
      if (key !== 'month') {
        availableRegions.add(key);
      }
    });
  });
  const regionsList = Array.from(availableRegions);

  // Build chartData for all months, filling missing values with null
  const chartData = allMonths.map((month: string) => {
    const item = last3Months.find((d: any) => d.month === month) || {};
    const result: any = { month };
    
    // Add all regions dynamically
    regionsList.forEach(region => {
      result[region] = item[region] ?? null;
    });
    
    return result;
  });

  // Robust custom label component
  const BarValueLabel = (region: string) => {
    const Label = (props: any) => {
      const { index, x, y, width, fill } = props;
      const value = chartData[index]?.[region];
      const display = (value === null || value === undefined || isNaN(value)) ? '-' : Math.round(value).toLocaleString();
      const centerX = x + (width ? width / 2 : 0);
      return (
        <text x={centerX} y={y - 4} fill={fill} textAnchor="middle" fontSize={11} fontWeight={600}>{display}</text>
      );
    };
    Label.displayName = `BarValueLabel_${region}`;
    return Label;
  };

  // Helper to format values with commas or compact notation for large numbers
  const formatValue = (value: any) => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    // Special case: Estimated Revenue (MZN) always in millions
    if (metric === 'estimated_revenue_TZS') {
      const millions = value / 1_000_000;
      return millions.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 0 }) + 'M';
    }
    if (Math.abs(value) >= 1_000_000) {
      // Use compact notation for millions and above, max 1 decimal
      return new Intl.NumberFormat(lang || 'en', { notation: 'compact', maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(value);
    }
    // For regular numbers, show at most 1 decimal
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 0 });
  };

  // Get individual region values for current month
  const lastDataPoint = last3Months[last3Months.length - 1];
  
  // Define colors for Mozambique districts/regions
  const getRegionColor = (region: string, index: number) => {
    // Use specific colors for known Mozambique districts
    const mozambiqueColors: Record<string, string> = {
      'Palma': '#167288',      // Semi dark teal
      'Mocimboa': '#b45248',   // Semi dark red
      'Cabo Delgado': '#F28F3B', // Orange for province level
    };
    
    return mozambiqueColors[region] || ['#F28F3B', '#75ABBC', '#4CAF50', '#FF5722', '#9C27B0', '#00BCD4'][index % 6];
  };

  // Use built-in LabelList with formatter and theme-consistent color
  return (
    <div className="border border-muted bg-gray-0 p-4 sm:p-6 dark:bg-gray-50 rounded-xl min-w-[180px] max-w-full sm:min-w-[260px] sm:max-w-[320px] flex flex-col overflow-visible">
      <div className="mb-2" style={{ minHeight: 48 }}>
        {/* 1st row: Metric name (unit) */}
        <Text className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-700">
          {t(config.titleKey)}{t(config.unitKey) ? ` (${t(config.unitKey)})` : ''}
        </Text>
        {/* 2nd row: Metric description */}
        <Text className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t(config.descKey)}</Text>
      </div>
      <div className="flex items-baseline gap-3 mb-2">
        <div className="flex gap-2 text-sm sm:text-base flex-wrap">
          {regionsList.map((region, index) => {
            const value = lastDataPoint?.[region];
            const color = getRegionColor(region, index);
            return (
              <span key={region} className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{background: color}}></span>
                <span className="text-gray-700 dark:text-gray-700">{region}: {formatValue(value)}</span>
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex-1 flex items-end">
        <div className="w-full h-32 sm:h-30"> {/* Increased height */}
          <ResponsiveContainer width="99%" height="100%">
            <BarChart 
              data={chartData}
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
              barCategoryGap={0}
            >
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                className="dark:fill-gray-300"
              />
              {regionsList.map((region, index) => {
                const color = getRegionColor(region, index);
                return (
                  <Bar key={region} dataKey={region} fill={color} radius={[2, 2, 0, 0]} barSize={18} minPointSize={6}>
                    <LabelList
                      dataKey={region}
                      position="top"
                      formatter={formatValue}
                      fill={color}
                      style={{ fontSize: 11, fontWeight: 600 }}
                    />
                  </Bar>
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function FileStatGrid({ className, lang }: { className?: string; lang?: string }) {
  const { t } = useTranslation(lang!, 'common');
  
  // Fetch monthly region summary data for last 3 months
  const { data: monthlyData, isLoading, error } = api.districtSummary.getMonthlyRegionSummary.useQuery(
    { months: 3 },
    {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    }
  );
  console.log('DEBUG monthlyData', JSON.stringify(monthlyData, null, 2));

  if (isLoading) {
    return (
      <>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="min-w-[240px] max-w-[280px] animate-pulse">
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          </div>
        ))}
      </>
    );
  }

  if (error || !monthlyData) {
    return (
      <div className="min-w-[240px] col-span-full">
        <div className="flex flex-col items-center justify-center h-32 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <Text className="text-gray-500 dark:text-gray-400">{t('text-no-data-available')}</Text>
        </div>
      </div>
    );
  }

  // Only show the metrics that have data
  const metricsToShow = Object.entries(METRIC_CONFIG).filter(([metric]) => 
    monthlyData[metric] && monthlyData[metric].data && monthlyData[metric].data.length > 0
  );

  return (
    <>
      {metricsToShow.map(([metric, config]) => (
        <MetricBarCard
          key={metric}
          metric={metric}
          config={config}
          data={monthlyData[metric]}
          lang={lang}
        />
      ))}
    </>
  );
}

export default function FileStats({ className, lang }: FileStatsType) {
  const {
    sliderEl,
    sliderPrevBtn,
    sliderNextBtn,
    scrollToTheRight,
    scrollToTheLeft,
  } = useScrollableSlider();

  return (
    <div
      className={cn(
        'relative flex w-auto items-center overflow-hidden',
        className
      )}
    >
      <Button
        title="Prev"
        variant="text"
        ref={sliderPrevBtn}
        onClick={() => scrollToTheLeft()}
        className="!absolute -left-1 top-0 z-10 !h-full w-12 !justify-start rounded-none bg-gradient-to-r from-gray-0 via-gray-0/70 to-transparent px-0 ps-1 text-gray-500 hover:text-gray-900 3xl:hidden dark:from-gray-50 dark:via-gray-50/70"
      >
        <PiCaretLeftBold className="h-5 w-5" />
      </Button>
      <div className="w-full overflow-hidden">
        <div
          ref={sliderEl}
          className="custom-scrollbar-x grid grid-flow-col gap-4 overflow-x-auto scroll-smooth"
        >
          <FileStatGrid className={className} lang={lang} />
        </div>
      </div>
      <Button
        title="Next"
        variant="text"
        ref={sliderNextBtn}
        onClick={() => scrollToTheRight()}
        className="!absolute right-0 top-0 z-10 !h-full w-12 !justify-end rounded-none bg-gradient-to-l from-gray-0 via-gray-0/70 to-transparent px-0 text-gray-500 hover:text-gray-900 3xl:hidden dark:from-gray-50 dark:via-gray-50/70"
      >
        <PiCaretRightBold className="h-5 w-5" />
      </Button>
    </div>
  );
}