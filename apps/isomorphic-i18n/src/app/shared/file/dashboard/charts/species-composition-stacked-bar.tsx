"use client";

import { useMemo, useState } from "react";
import { api } from "@/trpc/react";
import { useAtom } from "jotai";
import { districtsAtom } from "@/app/components/filter-selector";
import { selectedTimeRangeAtom } from "@/app/components/time-range-selector";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import WidgetCard from "@components/cards/widget-card";
import { useTranslation } from "@/app/i18n/client";
import { Button } from "@ui/button";
import { CHART_STYLES } from "./chart-styles";
import { SPECIES_COLORS, generateSpeciesColor } from "./utils";
import { PiPercent, PiHashStraight } from "react-icons/pi";

const formatNumber = (value: number, metric: string) => {
  if (metric === "percentage") {
    return `${value.toFixed(1)}%`;
  }
  
  if (metric === "total_value") {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(1);
  }
  
  // For catch data (now in tonnes), format with 1 decimal place
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(1);
};

// Custom tooltip matching reference style
function SpeciesCompositionTooltip({ active, payload, label, selectedMetric }: any) {
  const { t } = useTranslation("common");
  
  if (!active || !payload || !payload.length) return null;
  
  const validPayload = payload.filter((item: any) => 
    typeof item.value === 'number' && item.value > 0
  );
  
  if (validPayload.length === 0) return null;
  
  const totalValue = validPayload.reduce((sum: number, item: any) => sum + item.value, 0);
  
  return (
    <div className="bg-gray-0 dark:bg-gray-50 p-3 rounded shadow-lg border border-muted min-w-[200px] text-gray-900 dark:text-gray-700">
      <div className="font-semibold text-gray-900 dark:text-gray-700 mb-2">{label}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {t('text-total')}: {formatNumber(totalValue, selectedMetric)}
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {validPayload
          .sort((a: any, b: any) => b.value - a.value)
          .map((entry: any, index: number) => {
            const percentage = ((entry.value / totalValue) * 100).toFixed(1);
            return (
              <div key={`tooltip-${entry.name}-${index}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
                    {entry.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-700">
                    {formatNumber(entry.value, selectedMetric)}
                  </span>
                  <span className="text-xs text-gray-400">({percentage}%)</span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

interface SpeciesCompositionStackedBarProps {
  className?: string;
}

export default function SpeciesCompositionStackedBar({ 
  className 
}: SpeciesCompositionStackedBarProps) {
  const { t } = useTranslation("common");
  const [selectedDistricts] = useAtom(districtsAtom);
  const [selectedTimeRange] = useAtom(selectedTimeRangeAtom);
  const [displayMode, setDisplayMode] = useState<"absolute" | "relative">("relative");
  const [hiddenSpecies, setHiddenSpecies] = useState<string[]>([]);
  
  // Convert time range to months
  const months = typeof selectedTimeRange === 'number' ? selectedTimeRange : 12;
  
  const { data, isLoading, error } = api.taxaSummaries.getSpeciesComposition.useQuery(
    {
      districts: selectedDistricts,
      metric: "catch_kg",
      months,
    },
    {
      enabled: selectedDistricts.length > 0,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    }
  );

  // Prepare chart data with absolute or relative values
  const { chartData, topSpecies } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], topSpecies: [] };
    
    // Get top 10 species (not affected by hiddenSpecies for consistent "Others" calculation)
    const allSpecies = data.sort((a, b) => b.total_value - a.total_value);
    const top10Species = allSpecies.slice(0, 10).map(item => item.common_name);
    const otherSpecies = allSpecies.slice(10);
    
    // Create chart data structure
    const chartData = selectedDistricts.map(district => {
      const districtData: any = { 
        name: district,
      };
      
      // Add top 10 species values (convert kg to tonnes)
      top10Species.forEach(speciesName => {
        const speciesInfo = allSpecies.find(s => s.common_name === speciesName);
        if (speciesInfo && speciesInfo.districts) {
          const districtInfo = speciesInfo.districts.find((d: any) => d.district === district);
          districtData[speciesName] = (districtInfo?.value || 0) / 1000; // Convert kg to tonnes
        } else {
          districtData[speciesName] = 0;
        }
      });
      
      // Calculate "Others" category - sum of all remaining species (convert kg to tonnes)
      let othersValue = 0;
      otherSpecies.forEach(speciesInfo => {
        if (speciesInfo.districts) {
          const districtInfo = speciesInfo.districts.find((d: any) => d.district === district);
          othersValue += districtInfo?.value || 0;
        }
      });
      districtData[t('text-others')] = othersValue / 1000; // Convert kg to tonnes
      
      // Convert to percentages if in relative mode
      if (displayMode === "relative") {
        const totalValue = [...top10Species, t('text-others')].reduce((sum, species) => sum + (districtData[species] || 0), 0);
        if (totalValue > 0) {
          [...top10Species, t('text-others')].forEach(speciesName => {
            districtData[speciesName] = ((districtData[speciesName] || 0) / totalValue) * 100;
          });
        }
      }
      
      return districtData;
    });
    
    // Filter out districts with no data
    const nonEmptyChartData = chartData.filter(districtData => {
      const totalValue = [...top10Species, t('text-others')].reduce((sum, species) => sum + (districtData[species] || 0), 0);
      return totalValue > 0;
    });
    
    // Include "Others" in the species list for rendering
    const speciesWithOthers = [...top10Species, t('text-others')];
    
    return { chartData: nonEmptyChartData, topSpecies: speciesWithOthers };
  }, [data, selectedDistricts, displayMode, t]);

  const handleLegendClick = (entry: any) => {
    const speciesName = entry.dataKey || entry.value;
    // Don't allow hiding "Others" category
    if (speciesName === t('text-others')) return;
    
    setHiddenSpecies(prev => 
      prev.includes(speciesName) 
        ? prev.filter(s => s !== speciesName)
        : [...prev, speciesName]
    );
  };

  if (isLoading) {
    return (
      <WidgetCard 
        title={t("text-species-composition") || "Species Composition"} 
        className={className}
      >
        <div className="h-96 lg:h-[600px] flex items-center justify-center animate-pulse">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </WidgetCard>
    );
  }

  if (error || !data) {
    return (
      <WidgetCard 
        title={t("text-species-composition") || "Species Composition"} 
        className={className}
      >
        <div className="h-96 lg:h-[600px] flex flex-col items-center justify-center">
          <p className="text-gray-500">{t('text-no-data-available')}</p>
        </div>
      </WidgetCard>
    );
  }

  if (chartData.length === 0) {
    return (
      <WidgetCard 
        title={t("text-species-composition") || "Species Composition"} 
        className={className}
      >
        <div className="h-96 lg:h-[600px] flex flex-col items-center justify-center">
          <p className="text-gray-500">{t('text-no-data-for-districts')}</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title={
        <div className="flex flex-row items-center justify-between w-full">
          <span className="font-semibold text-gray-900 dark:text-gray-700">
            {t("text-species-composition") || "Species Composition"}
          </span>
          <div className="min-w-fit">
            <Button
              variant={displayMode === "relative" ? "primary" : "outline"}
              size="sm"
              onClick={() => setDisplayMode(displayMode === "absolute" ? "relative" : "absolute")}
              className="text-xs border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5"
            >
              {displayMode === "relative" ? (
                <>
                  <PiHashStraight className="h-3.5 w-3.5" />
                  <span>{t('text-show-values')}</span>
                </>
              ) : (
                <>
                  <PiPercent className="h-3.5 w-3.5" />
                  <span>{t('text-show-percent')}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      }
      className={`border border-muted bg-gray-0 p-5 dark:bg-gray-50 rounded-lg${className ? ` ${className}` : ''}`}
    >
      <div className="h-80 md:h-96 lg:h-[28rem] xl:h-[32rem] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            layout="vertical" 
            margin={{ top: 10, right: 20, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" strokeOpacity={0.7} className="dark:stroke-gray-700" />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "#64748b" }}
              domain={displayMode === "relative" ? [0, 100] : [0, (dataMax: number) => Math.ceil(dataMax * 10) / 10]}
              tickFormatter={displayMode === "relative" ? (value: number) => `${Math.round(value)}%` : (value: number) => value.toFixed(1)}
              label={{
                value: displayMode === "absolute" ? t('text-catch-tonnes') : t('text-percentage'),
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
              tickFormatter={(value) => value.length > 15 ? `${value.slice(0, 15)}...` : value}
              axisLine={{ stroke: '#cbd5e1', strokeWidth: 1, className: 'dark:stroke-gray-700' }}
              tickLine={{ stroke: '#cbd5e1', className: 'dark:stroke-gray-700' }}
            />
            <Tooltip content={<SpeciesCompositionTooltip selectedMetric={displayMode === "absolute" ? "catch_tonnes" : "percentage"} />} wrapperStyle={{ background: 'transparent' }} />
            <Legend 
              {...CHART_STYLES.legend}
              onClick={handleLegendClick}
            />
            {topSpecies.map((species, index) => {
              // For horizontal stacked bars, only the rightmost bar should have rounded right corners
              const isRightmostBar = index === topSpecies.length - 1;
              // Use gray color for "Others" category, regular colors for species
              const fillColor = species === t('text-others') 
                ? "#9CA3AF" 
                : SPECIES_COLORS[index % SPECIES_COLORS.length];
              
              return (
                <Bar
                  key={`bar-${species}-${index}`}
                  dataKey={species}
                  stackId="species"
                  fill={fillColor}
                  name={species}
                  hide={hiddenSpecies.includes(species)}
                  radius={isRightmostBar ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
}