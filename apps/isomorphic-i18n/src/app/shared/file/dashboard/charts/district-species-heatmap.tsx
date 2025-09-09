"use client";

import React, { useMemo, useState } from "react";
import { api } from "@/trpc/react";
import { useAtom } from "jotai";
import { districtsAtom } from "@/app/components/filter-selector";
import { selectedTimeRangeAtom } from "@/app/components/time-range-selector";
import WidgetCard from "@components/cards/widget-card";
import { useTranslation } from "@/app/i18n/client";
import Table, { HeaderCell } from "@/app/shared/table";
import type { AlignType } from "rc-table/lib/interface";
import { getPaletteColor, getTextColor } from "../utils";

const formatNumber = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(1);
};

interface DistrictSpeciesHeatmapProps {
  className?: string;
}

export default function DistrictSpeciesHeatmap({ 
  className = "" 
}: DistrictSpeciesHeatmapProps) {
  const { t } = useTranslation("common");
  const [selectedDistricts] = useAtom(districtsAtom);
  const [selectedTimeRange] = useAtom(selectedTimeRangeAtom);
  const [sorter, setSorter] = useState<{ columnKey: string; order: 'ascend' | 'descend' | null }>({ columnKey: 'common_name', order: null });
  
  // Convert time range to months
  const months = typeof selectedTimeRange === 'number' ? selectedTimeRange : 12;
  
  const { data, isLoading, error } = api.taxaSummaries.getDistrictTaxaSummaries.useQuery(
    {
      districts: selectedDistricts,
      metrics: ["catch_kg"],
      months,
    },
    {
      enabled: selectedDistricts.length > 0,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    }
  );

  // Transform data into table format
  const { tableData, districtColumns, minMax } = useMemo(() => {
    if (!data) return { tableData: [], districtColumns: [], minMax: {} };
    
    // Create a map of species -> district -> value
    const speciesData: Record<string, Record<string, number>> = {};
    const speciesValueSums: Record<string, number> = {};
    
    data.forEach(item => {
      const typedItem = item as any;
      const value = typedItem["catch_kg"];
      if (value === undefined || value === null || value <= 0) return;
      
      if (!speciesData[typedItem.common_name]) {
        speciesData[typedItem.common_name] = {};
      }
      
      speciesData[typedItem.common_name][typedItem.district] = (speciesData[typedItem.common_name][typedItem.district] || 0) + value;
      speciesValueSums[typedItem.common_name] = (speciesValueSums[typedItem.common_name] || 0) + value;
    });
    
    // Get top 15 species and create table rows
    const topSpecies = Object.entries(speciesValueSums)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([species]) => species);
    
    const tableData = topSpecies.map(species => {
      const row: any = {
        common_name: species,
        total: speciesValueSums[species] || 0,
      };
      
      // Add district values
      selectedDistricts.forEach(district => {
        row[district] = speciesData[species]?.[district] || 0;
      });
      
      return row;
    });
    
    // Calculate min/max for each district column for color scaling
    const minMax: Record<string, { min: number, max: number }> = {};
    selectedDistricts.forEach(district => {
      const values = tableData.map(row => row[district]).filter(v => v > 0);
      minMax[district] = {
        min: values.length ? Math.min(...values) : 0,
        max: values.length ? Math.max(...values) : 1
      };
    });
    
    return { tableData, districtColumns: selectedDistricts, minMax };
  }, [data, selectedDistricts]);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sorter.order) return tableData;
    const { columnKey, order } = sorter;
    return [...tableData].sort((a, b) => {
      let va = a[columnKey];
      let vb = b[columnKey];
      if (va === undefined || va === null) va = '';
      if (vb === undefined || vb === null) vb = '';
      if (typeof va === 'string' && typeof vb === 'string') {
        return order === 'ascend' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return order === 'ascend' ? va - vb : vb - va;
    });
  }, [tableData, sorter]);

  if (isLoading) {
    return (
      <WidgetCard title={t("text-district-species-breakdown") || "District-Species Breakdown"} className={className}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </WidgetCard>
    );
  }

  if (error || !data) {
    return (
      <WidgetCard title={t("text-district-species-breakdown") || "District-Species Breakdown"} className={className}>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">{t('text-no-data-available')}</p>
        </div>
      </WidgetCard>
    );
  }

  if (tableData.length === 0) {
    return (
      <WidgetCard title={t("text-district-species-breakdown") || "District-Species Breakdown"} className={className}>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">{t("text-no-data-available-for-filters")}</p>
        </div>
      </WidgetCard>
    );
  }

  // Define columns for the table
  const columns = [
    {
      title: (
        <HeaderCell
          title={t('text-species') || 'Species'}
          align="left"
          sortable
          ascending={sorter.columnKey === 'common_name' ? sorter.order === 'ascend' : undefined}
        />
      ),
      dataIndex: "common_name",
      key: "common_name",
      align: "left" as AlignType,
      sorter: true,
      sortOrder: sorter.columnKey === 'common_name' ? sorter.order : null,
      onHeaderCell: () => ({
        onClick: () => setSorter(s => ({
          columnKey: 'common_name',
          order: s.columnKey === 'common_name' && s.order === 'ascend' ? 'descend' : 'ascend',
        }))
      }),
      render: (val: string) => (
        <div className="font-bold text-gray-900 truncate" title={val}>
          {val}
        </div>
      )
    },
    {
      title: (
        <HeaderCell
          title={t('text-total') || 'Total'}
          align="center"
          sortable
          ascending={sorter.columnKey === 'total' ? sorter.order === 'ascend' : undefined}
        />
      ),
      dataIndex: "total",
      key: "total",
      align: "center" as AlignType,
      sorter: true,
      sortOrder: sorter.columnKey === 'total' ? sorter.order : null,
      onHeaderCell: () => ({
        onClick: () => setSorter(s => ({
          columnKey: 'total',
          order: s.columnKey === 'total' && s.order === 'ascend' ? 'descend' : 'ascend',
        }))
      }),
      render: (val: number) => {
        const minMaxTotal = { min: Math.min(...tableData.map(row => row.total)), max: Math.max(...tableData.map(row => row.total)) };
        const bg = getPaletteColor(val, minMaxTotal.min, minMaxTotal.max);
        const color = getTextColor(bg);
        return (
          <div style={{ background: bg, color, borderRadius: 4, padding: '0.25em 0.5em', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
            {formatNumber(val)} kg
          </div>
        );
      }
    },
    ...districtColumns.map(district => ({
      title: (
        <HeaderCell
          title={district}
          align="center"
          sortable
          ascending={sorter.columnKey === district ? sorter.order === 'ascend' : undefined}
        />
      ),
      dataIndex: district,
      key: district,
      align: "center" as AlignType,
      sorter: true,
      sortOrder: sorter.columnKey === district ? sorter.order : null,
      onHeaderCell: () => ({
        onClick: () => setSorter(s => ({
          columnKey: district,
          order: s.columnKey === district && s.order === 'ascend' ? 'descend' : 'ascend',
        }))
      }),
      render: (val: number) => {
        if (!val || val <= 0) {
          return (
            <div className="text-gray-400 dark:text-gray-500 text-center">
              -
            </div>
          );
        }
        
        const { min, max } = minMax[district] || { min: 0, max: 1 };
        const bg = getPaletteColor(val, min, max);
        const color = getTextColor(bg);
        
        return (
          <div 
            style={{ 
              background: bg, 
              color, 
              borderRadius: 4, 
              padding: '0.25em 0.5em', 
              textAlign: 'center', 
              fontVariantNumeric: 'tabular-nums',
              fontWeight: '500'
            }}
            title={`${district}: ${formatNumber(val)} kg`}
          >
            {formatNumber(val)}
          </div>
        );
      }
    }))
  ];

  return (
    <WidgetCard 
      title={t("text-district-species-breakdown") || "District-Species Breakdown"}
      description={t("text-district-species-description")}
      className={className}
    >
      <div className="overflow-x-auto">
        {isLoading && <div className="py-4 text-center text-gray-500 dark:text-gray-400">{t("text-loading")}</div>}
        <Table
          columns={columns}
          data={sortedData}
          variant="elegant"
          className="min-w-[600px]"
          rowKey="common_name"
        />
      </div>
    </WidgetCard>
  );
}