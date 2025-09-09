import { useAtom } from 'jotai';
import { useState, useEffect } from 'react';
import { PiCaretDownBold } from 'react-icons/pi';
import cn from '@utils/class-names';
import { METRIC_OPTIONS, MetricOption, MetricKey } from '@/app/shared/file/dashboard/charts/types';
import { selectedMetricAtom, selectedRevenueMetricAtom } from '@/app/components/filter-selector';
import { useTranslation } from '@/app/i18n/client';
import { usePathname } from 'next/navigation';

export default function MetricSelectorDropdown() {
  const { t } = useTranslation('common');
  const [selectedMetric, setSelectedMetric] = useAtom(selectedMetricAtom);
  const [selectedRevenueMetric, setSelectedRevenueMetric] = useAtom(selectedRevenueMetricAtom);
  const [isMetricOpen, setIsMetricOpen] = useState(false);
  const pathname = usePathname();

  // Check if we're on the catch page or revenue page
  const isCatchPage = pathname?.includes('/catch');
  const isRevenuePage = pathname?.includes('/revenue');

  // Define catch-specific metrics
  const CATCH_METRIC_OPTIONS: MetricOption[] = [
    {
      value: "mean_cpue",
      label: "Catch Rate",
      unit: "kg/fisher/day",
      category: "catch",
    },
    {
      value: "estimated_catch_tn",
      label: "Estimated Catch",
      unit: "tonnes",
      category: "catch",
    },
  ];

  // Define revenue-specific metrics
  const REVENUE_METRIC_OPTIONS: MetricOption[] = [
    {
      value: "mean_rpue",
      label: "Fisher Revenue",
      unit: "MZN/fisher/day",
      category: "revenue",
    },
    {
      value: "estimated_revenue_TZS",
      label: "Estimated Revenue",
      unit: "MZN",
      category: "revenue",
    },
  ];

  // Use page-specific metrics based on current page
  const availableMetrics = isCatchPage ? CATCH_METRIC_OPTIONS : 
                          isRevenuePage ? REVENUE_METRIC_OPTIONS : 
                          METRIC_OPTIONS;

  // Only show the relevant category based on the current page
  const groupedMetrics = isCatchPage ? {
    catch: availableMetrics.filter((m) => m.category === 'catch'),
    revenue: []
  } : isRevenuePage ? {
    catch: [],
    revenue: availableMetrics.filter((m) => m.category === 'revenue')
  } : {
    catch: availableMetrics.filter((m) => m.category === 'catch'),
    revenue: availableMetrics.filter((m) => m.category === 'revenue'),
  };

  // Use the appropriate metric based on the current page
  const currentMetric = isRevenuePage ? selectedRevenueMetric : selectedMetric;
  const setCurrentMetric = isRevenuePage ? setSelectedRevenueMetric : setSelectedMetric;
  
  const selectedMetricOption = availableMetrics.find((m) => m.value === currentMetric);

  const getDisplayLabel = (option: any) => {
    switch (option.value) {
      case 'mean_effort': return t('text-metrics-effort');
      case 'mean_cpue': return t('text-metrics-catch-rate');
      case 'mean_cpua': return t('text-metrics-catch-density');
      case 'mean_rpue': return t('text-metrics-fisher-revenue');
      case 'mean_rpua': return t('text-metrics-area-revenue');
      case 'estimated_catch_tn': return t('metric-estimated_catch_tn-title');
      default: return option.label;
    }
  };

  const getUnitDisplay = (unit: string) => {
    return unit;
  };

  // If on catch page and selected metric is not available, default to mean_cpue
  useEffect(() => {
    if (isCatchPage && selectedMetric && !availableMetrics.find(m => m.value === selectedMetric)) {
      setSelectedMetric('mean_cpue' as MetricKey);
    }
  }, [isCatchPage, selectedMetric, availableMetrics, setSelectedMetric]);

  // If on revenue page and selected metric is not available, default to estimated_revenue_TZS
  useEffect(() => {
    if (isRevenuePage && selectedRevenueMetric && !availableMetrics.find(m => m.value === selectedRevenueMetric)) {
      setSelectedRevenueMetric('estimated_revenue_TZS' as MetricKey);
    }
  }, [isRevenuePage, selectedRevenueMetric, availableMetrics, setSelectedRevenueMetric]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsMetricOpen(!isMetricOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border border-muted bg-gray-0 dark:bg-gray-50 text-gray-900 dark:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-100/80 focus:ring-2 focus:ring-blue-200',
          isMetricOpen && 'ring-2 ring-blue-200'
        )}
      >
        <span className="truncate">
          {selectedMetricOption ? getDisplayLabel(selectedMetricOption) : t('text-metrics-catch')}
        </span>
        <PiCaretDownBold className={cn('h-3 w-3 transition-transform flex-shrink-0', isMetricOpen && 'rotate-180')} />
      </button>
      {isMetricOpen && (
        <>
          <div className="fixed inset-0 z-[1000]" onClick={() => setIsMetricOpen(false)} />
          <div className="absolute left-1/2 sm:left-auto sm:right-0 top-full mt-1 w-80 sm:w-64 -translate-x-1/2 sm:translate-x-0 bg-gray-0 dark:bg-gray-50 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-[1001] max-h-96 overflow-y-auto">
                        <div className="p-2">
              {/* Catch Metrics - only show if on catch page or if there are catch metrics */}
              {groupedMetrics.catch.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 px-2 py-1 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-200">{t('text-metrics-catch')}</span>
                  </div>
                  <div className="space-y-0.5">
                    {groupedMetrics.catch.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setCurrentMetric(option.value as MetricKey);
                          setIsMetricOpen(false);
                        }}
                        className={cn(
                          'w-full px-2 py-1.5 text-left text-sm rounded transition-colors',
                          'flex flex-col items-start gap-0.5',
                          currentMetric === option.value
                            ? 'bg-blue-50 dark:bg-blue-800 text-blue-900 dark:text-blue-200'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                      >
                        <span className="font-medium">{getDisplayLabel(option)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getUnitDisplay(option.unit)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Revenue Metrics - only show if on revenue page or if there are revenue metrics */}
              {groupedMetrics.revenue.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 py-1 mb-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-200">{t('text-metrics-revenue')}</span>
                  </div>
                  <div className="space-y-0.5">
                    {groupedMetrics.revenue.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setCurrentMetric(option.value as MetricKey);
                          setIsMetricOpen(false);
                        }}
                        className={cn(
                          'w-full px-2 py-1.5 text-left text-sm rounded transition-colors',
                          'flex flex-col items-start gap-0.5',
                          currentMetric === option.value
                            ? 'bg-amber-50 dark:bg-amber-800 text-amber-900 dark:text-amber-200'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                      >
                        <span className="font-medium">{getDisplayLabel(option)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getUnitDisplay(option.unit)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 