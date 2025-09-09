import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useAtom } from "jotai";
import { ActionIcon, Popover } from "rizzui";
import WidgetCard from "@components/cards/widget-card";
import SimpleBar from "@ui/simplebar";
import { useTranslation } from "@/app/i18n/client";
import { api } from "@/trpc/react";
import { districtsAtom } from "@/app/components/filter-selector";
import { selectedTimeRangeAtom, TIME_RANGES } from "@/app/components/time-range-selector";
import cn from "@utils/class-names";
import { useTheme } from "next-themes";
import MetricCard from "@components/cards/metric-card";
import { useSession } from "next-auth/react";
import {
  Treemap,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { CHART_STYLES } from "./chart-styles";

// Colors for gear types (consistent set)
const GEAR_COLORS = [
  "#4C51BF", // Indigo
  "#00B4D8", // Bright Cyan
  "#14B8A6", // Teal
  "#FB7185", // Pink
  "#FFB800", // Amber
  "#F97316", // Orange
  "#8B5CF6", // Purple
  "#10B981", // Emerald
  "#D946EF", // Fuchsia
  "#EC4899", // Hot Pink
  "#EF4444", // Red
  "#6366F1", // Blue
];

const formatNumber = (value: number) => {
  if (value >= 1000) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(value);
  }
  return value.toFixed(2);
};

const capitalizeGearType = (gear: string) => {
  return gear
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

interface RpueDataItem {
  gear: string;
  name: string;
  avg_rpue: number;
  total_records: number;
  district_count: number;
  fill?: string;
}

interface VisibilityState {
  [key: string]: { opacity: number };
}

const LoadingState = () => {
  const { t } = useTranslation("common");
  return (
    <MetricCard
      title=""
      metric=""
      rounded="lg"
      chart={
        <div className="h-24 w-24 @[16.25rem]:h-28 @[16.25rem]:w-32 @xs:h-32 @xs:w-36 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-500">{t("text-loading")}</span>
          </div>
        </div>
      }
      chartClassName="flex flex-col w-auto h-auto text-center justify-center"
      className="min-w-[292px] w-full max-w-full flex flex-col items-center justify-center"
    />
  );
};

// Custom treemap tooltip
const TreemapTooltip = ({ active, payload, selectedTimeRange }: any) => {
  const { t } = useTranslation("common");
  
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isValidValue = data.avg_rpue !== undefined && data.avg_rpue !== null;
    
    return (
      <div className="bg-gray-0 dark:bg-gray-50 p-3 rounded shadow-lg border border-muted min-w-[180px] text-gray-900 dark:text-gray-700">
        <div className="font-semibold text-gray-900 dark:text-gray-700 mb-1">{data.gear}</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.fill }}
            />
            <div className={`flex justify-between text-xs`}>
              <span className="text-gray-500 dark:text-gray-400">{t("text-average-rpue") || "Average RPUE"}:</span>
              <span className="font-medium text-gray-900 dark:text-gray-700">
                {isValidValue ? formatNumber(data.avg_rpue) : t("text-na")}
                {isValidValue && ` TZS/fisher/day`}
              </span>
            </div>
          </div>
          <div className={`flex justify-between text-xs`}>
            <span className="text-gray-500 dark:text-gray-400">{t("text-districts") || "Districts"}:</span>
            <span className="font-medium text-gray-900 dark:text-gray-700">{data.district_count}</span>
          </div>
          <div className={`flex justify-between text-xs`}>
            <span className="text-gray-500 dark:text-gray-400">{t("text-records") || "Records"}:</span>
            <span className="font-medium text-gray-900 dark:text-gray-700">{data.total_records}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom treemap content component to handle visibility state and labels
const CustomizedTreemapContent = (props: any) => {
  const { x, y, width, height, name, value, fill, index } = props;
  
  // Only show text if the rectangle is big enough
  const showLabel = width > 50 && height > 25;
  const showValue = width > 70 && height > 35;
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        strokeWidth={2}
        stroke="#ffffff"
        strokeOpacity={0.8}
        rx={6}
        ry={6}
        style={{ filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1))' }}
      />
      {showLabel && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - (showValue ? 8 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.min(width / 14, 20)}
            fontWeight="600"
            fontFamily="'Inter', sans-serif"
            fill="#ffffff"
          >
            {name || 'Unknown Gear'}
          </text>
          {showValue && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={Math.min(width / 6, 20)}
              fontWeight="700"
              fontFamily="'Inter', sans-serif"
              fill="#ffffff"
              fillOpacity={0.95}
            >
              {formatNumber(value)}
            </text>
          )}
        </>
      )}
    </g>
  );
};

export default function RpueGearTreemap({
  className,
  lang,
}: {
  className?: string;
  lang?: string;
}) {
  const { theme } = useTheme();
  // Removed rpueData state - using transformedData directly instead
  const [loading, setLoading] = useState(true);
  const [processingError, setProcessingError] = useState<string | null>(null);
  
  // Use simple translation pattern like other components
  const { t } = useTranslation("common");
  
  const [districts] = useAtom(districtsAtom);
  const [selectedTimeRange] = useAtom(selectedTimeRangeAtom);
  const [visibilityState, setVisibilityState] = useState<VisibilityState>({});
  
  // Calculate date range based on selected time range (same logic as catch-time-series)
  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate: Date;
    
    if (selectedTimeRange === "all") {
      return { startDate: undefined, endDate: undefined };
    }
    
    const months = typeof selectedTimeRange === "number" ? selectedTimeRange : 3;
    startDate = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
    
    return {
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    };
  }, [selectedTimeRange]);
  
  // Add refs to track initialization states
  const dataProcessed = useRef<boolean>(false);
  const previousDistricts = useRef<string[]>(districts || []);
  const previousTimeRange = useRef<string | number>(selectedTimeRange);
  
  // Memoize the query parameters to prevent unnecessary refetches
  const queryParams = useMemo(() => ({
    districts: districts || [],
    ...getDateRange()
  }), [districts, getDateRange]);
  
  // Use the same query pattern as catch-time-series
  const { data: rawData = [], isLoading, error } = api.gear.rpueByGear.useQuery(
    queryParams,
    {
      enabled: queryParams.districts.length > 0,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    }
  );

  // Reset data processing flag when query parameters change
  useEffect(() => {
    dataProcessed.current = false;
  }, [queryParams]);

  // Transform data for treemap (same pattern as other components)
  const transformedData = useMemo(() => {
    if (!rawData) return [];
    
    return rawData.map((item: any, index: number) => ({
      gear: capitalizeGearType(item.gear.replace(/_/g, " ")),
      name: capitalizeGearType(item.gear.replace(/_/g, " ")), // Add name field for treemap
      avg_rpue: Number(item.avg_rpue.toFixed(2)),
      total_records: item.total_records,
      district_count: item.district_count,
      fill: GEAR_COLORS[index % GEAR_COLORS.length]
    }));
  }, [rawData]);

  // Initialize visibility state when data changes
  useEffect(() => {
    if (transformedData.length > 0) {
      setVisibilityState(prevState => {
        // Only update if we don't have visibility state for all gears
        const currentGears = Object.keys(prevState);
        const dataGears = transformedData.map(item => item.gear);
        const needsUpdate = dataGears.some(gear => !currentGears.includes(gear));
        
        if (needsUpdate || currentGears.length === 0) {
          return transformedData.reduce<VisibilityState>(
            (acc: VisibilityState, item: RpueDataItem) => ({
              ...acc,
              [item.gear]: prevState[item.gear] || { opacity: 1 },
            }),
            {}
          );
        }
        return prevState;
      });
    }
  }, [transformedData]);

  const getTimeRangeLabel = () => {
    const timeRangeOption = TIME_RANGES.find(option => 
      option.value === selectedTimeRange
    );
    return timeRangeOption ? timeRangeOption.label : "Last 3 months";
  };

  // Use the same loading/error pattern as catch-time-series
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

  if (error || processingError || !rawData) {
    return (
      <WidgetCard title={t("text-error") || "Error"} className={className}>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500">{t('text-no-data-available')}</p>
        </div>
      </WidgetCard>
    );
  }

  if (transformedData.length === 0) {
    return (
      <WidgetCard title={t("text-no-data") || "No Data"} className={className}>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500">{t("text-no-data-available-for-filters") || "No data available for selected filters"}</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title={
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between w-full gap-3">
          <div className="w-full sm:w-auto">
          </div>
          <div className="hidden sm:block text-base font-medium text-gray-800 mx-auto">
            <div className="text-center">
              {t("text-rpue-by-gear") || "RPUE by Gear Type"}
            </div>
            <div className="text-xs text-gray-500 text-center mt-1">
              {t("text-rpue-treemap-description") || 
                `Average RPUE (Revenue Per Unit Effort) by gear type for selected districts. Time range: ${getTimeRangeLabel()}`}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="text-xs text-gray-500 text-center sm:text-right">
              {t("text-districts") || "Districts"}: {districts?.length || 0}
            </div>
          </div>
        </div>
      }
      className={cn("h-full", className)}
    >
      {/* Mobile-only title - shows on small screens */}
      <div className="sm:hidden text-center mb-4">
        <div className="text-base font-medium text-gray-800">
          {t("text-rpue-by-gear") || "RPUE by Gear Type"}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {t("text-rpue-treemap-description") || 
            `Average RPUE by gear type for selected districts. Time range: ${getTimeRangeLabel()}`}
        </div>
      </div>
      
      <SimpleBar>
        <div className="w-full h-[600px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={transformedData.filter((item: RpueDataItem) => (visibilityState[item.gear]?.opacity || 1) > 0.2)}
              dataKey="avg_rpue"
              aspectRatio={1.6}
              stroke="#ffffff"
              nameKey="name"
              {...CHART_STYLES.animation}
              content={
                <CustomizedTreemapContent />
              }
            >
              {transformedData.map((entry: RpueDataItem, index: number) => (
                <Cell 
                  key={`cell-${index}`} 
                  name={entry.name}
                  fill={entry.fill}
                />
              ))}
              <Tooltip 
                content={(props) => <TreemapTooltip {...props} selectedTimeRange={selectedTimeRange} />} 
                wrapperStyle={{ outline: 'none' }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </SimpleBar>
    </WidgetCard>
  );
} 