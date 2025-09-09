"use client";

import { useMemo, useState } from "react";
import { api } from "@/trpc/react";
import { useAtom } from "jotai";
import { districtsAtom } from "@/app/components/filter-selector";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import WidgetCard from "@components/cards/widget-card";
import { useTranslation } from "@/app/i18n/client";
import { CHART_STYLES } from "./chart-styles";
import { SPECIES_COLORS, generateSpeciesColor } from "./utils";
import { ActionIcon, Popover } from "rizzui";
import { PiGearSix } from "react-icons/pi";
import cn from "@utils/class-names";

const TAXA_METRICS = [
  { value: "catch_kg", label: "Total Catch (kg)" },
  { value: "total_value", label: "Total Value (TZS)" },
  { value: "n_individuals", label: "Number of Individuals" },
];

const formatNumber = (value: number, metric: string) => {
  if (metric === "total_value") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(metric === "catch_kg" ? 1 : 0);
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, metric }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = ((data.total_value / payload[0].payload.totalSum) * 100).toFixed(1);
    
    return (
      <div className="bg-gray-0 dark:bg-gray-50 p-3 rounded shadow-lg border border-muted min-w-[180px] text-gray-900 dark:text-gray-700">
        <div className="font-semibold text-gray-900 dark:text-gray-700 mb-1">
          {data.common_name}
        </div>
        {data.scientific_name && (
          <div className="text-xs italic text-gray-500 dark:text-gray-400 mb-2">
            {data.scientific_name}
          </div>
        )}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: data.fill }}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Value:
              </span>
            </div>
            <span className="text-xs font-medium text-gray-900 dark:text-gray-700">
              {formatNumber(data.total_value, metric)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Share:
            </span>
            <span className="text-xs font-medium text-gray-900 dark:text-gray-700">
              {percentage}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Districts:
            </span>
            <span className="text-xs font-medium text-gray-900 dark:text-gray-700">
              {data.districts?.length || 0}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom label function for pie slices
const renderCustomLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent, name
}: any) => {
  if (percent < 0.05) return null; // Only show labels for slices > 5%
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="600"
      fontFamily="'Inter', sans-serif"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface SpeciesCompositionPieProps {
  className?: string;
}

export default function SpeciesCompositionPie({ 
  className = "" 
}: SpeciesCompositionPieProps) {
  const { t } = useTranslation("common");
  const [selectedDistricts] = useAtom(districtsAtom);
  const [selectedMetric, setSelectedMetric] = useState("catch_kg");
  const [isMetricSelectorOpen, setIsMetricSelectorOpen] = useState(false);
  const [hiddenSpecies, setHiddenSpecies] = useState<string[]>([]);
  
  const { data, isLoading, error } = api.taxaSummaries.getSpeciesComposition.useQuery(
    {
      districts: selectedDistricts,
      metric: selectedMetric as any,
    },
    {
      enabled: selectedDistricts.length > 0,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    }
  );

  const chartData = useMemo(() => {
    if (!data) return [];
    
    // Filter out hidden species and calculate total for percentage calculations
    const visibleData = data
      .filter(item => !hiddenSpecies.includes(item.common_name))
      .filter(item => item.total_value > 0);
    
    const totalSum = visibleData.reduce((sum, item) => sum + item.total_value, 0);
    
    // Take top 10 species and group the rest as "Others"
    const sortedData = visibleData
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, 10);
    
    const othersSum = visibleData
      .slice(10)
      .reduce((sum, item) => sum + item.total_value, 0);
    
    const result = sortedData.map((item, index) => ({
      ...item,
      fill: SPECIES_COLORS[index % SPECIES_COLORS.length],
      totalSum,
    }));
    
    if (othersSum > 0) {
      result.push({
        common_name: "Others",
        scientific_name: "",
        total_value: othersSum,
        districts: [],
        fill: "#9CA3AF",
        totalSum,
      });
    }
    
    return result;
  }, [data, hiddenSpecies]);

  const handleLegendClick = (entry: any) => {
    const speciesName = entry.value;
    if (speciesName === "Others") return; // Don't allow hiding "Others"
    
    setHiddenSpecies(prev => 
      prev.includes(speciesName) 
        ? prev.filter(s => s !== speciesName)
        : [...prev, speciesName]
    );
  };

  if (isLoading) {
    return (
      <WidgetCard title={t("text-loading") || "Loading..."} className={className}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-full mx-auto"></div>
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

  const currentMetricLabel = TAXA_METRICS.find(m => m.value === selectedMetric)?.label || "Metric";

  return (
    <WidgetCard 
      title={
        <div className="flex items-center justify-between w-full">
          <span>{t("text-species-composition") || "Species Composition"}</span>
          <Popover isOpen={isMetricSelectorOpen} setIsOpen={setIsMetricSelectorOpen} placement="bottom-end">
            <Popover.Trigger>
              <ActionIcon
                variant="outline"
                size="sm"
                className="border-gray-300 hover:border-gray-400"
              >
                <PiGearSix className="h-4 w-4" />
              </ActionIcon>
            </Popover.Trigger>
            <Popover.Content className="w-56 p-2">
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-700 px-2 py-1">Select Metric:</div>
                {TAXA_METRICS.map((metric) => (
                  <button
                    key={metric.value}
                    onClick={() => {
                      setSelectedMetric(metric.value);
                      setIsMetricSelectorOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-2 py-1 text-xs rounded transition-colors",
                      selectedMetric === metric.value
                        ? "bg-blue-50 text-blue-900"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            </Popover.Content>
          </Popover>
        </div>
      }
      description={`Showing ${currentMetricLabel.toLowerCase()} distribution by species for selected districts`}
      className={className}
    >
      <div className="h-96 sm:h-[18rem] md:h-[22rem] lg:h-[26rem] xl:h-[28rem]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={CHART_STYLES.margins}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="total_value"
              {...CHART_STYLES.animation}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill}
                />
              ))}
            </Pie>
            <Tooltip 
              content={<CustomTooltip metric={selectedMetric} />}
              wrapperStyle={CHART_STYLES.tooltip.wrapperStyle}
            />
            <Legend 
              {...CHART_STYLES.legend}
              onClick={handleLegendClick}
              wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
              formatter={(value: string) => (
                <span className={cn(
                  "text-xs",
                  hiddenSpecies.includes(value) ? "line-through text-gray-400" : ""
                )}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
}