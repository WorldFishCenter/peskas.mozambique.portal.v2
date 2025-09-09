import { Session } from "next-auth";

export type MetricKey = "mean_cpue" | "mean_price_kg" | "mean_rpue" | "mean_effort" | "mean_cpua" | "mean_rpua" | "estimated_catch_tn" | "estimated_revenue_TZS";

// Type for metrics supported by radar API
export type RadarMetricKey = "mean_effort" | "mean_cpue" | "mean_cpua" | "mean_rpue" | "mean_rpua" | "estimated_revenue_TZS";

export interface ChartDataPoint {
  date: number;
  average?: number;
  [key: string]: number | undefined;
}

export interface ApiDataPoint {
  date: string;
  landing_site: string;
  mean_effort: number;
  mean_cpue: number;
  mean_rpue: number;
  mean_price_kg: number;
  mean_cpua: number;
  mean_rpua: number;
  estimated_catch_tn: number;
  estimated_revenue_TZS: number;
  total_catch_kg: number;
  total_value: number;
  n_trips: number;
  n_fishers: number;
}

export interface MetricOption {
  value: MetricKey;
  label: string;
  unit: string;
  category: "catch" | "revenue";
}

export interface VisibilityState {
  [key: string]: {
    opacity: number;
  };
}

export interface ChartProps {
  className?: string;
  chartData: ChartDataPoint[];
  selectedMetric: MetricKey;
  selectedMetricOption: MetricOption | undefined;
  bmu?: string;
  siteColors: Record<string, string>;
  visibilityState: VisibilityState;
  isCiaUser: boolean;
  isTablet: boolean;
  handleLegendClick: (site: string) => void;
}

export type TickProps = {
  x?: number;
  y?: number;
  payload?: {
    value: number;
  };
};

export const METRIC_OPTIONS: MetricOption[] = [
  {
    value: "mean_cpue",
    label: "Catch Rate",
    unit: "kg/fisher/day",
    category: "catch",
  },
  {
    value: "mean_price_kg",
    label: "Price per KG",
    unit: "KES/kg",
    category: "revenue",
  },
  {
    value: "mean_rpue",
    label: "Fisher Revenue",
    unit: "KES/fisher/day",
    category: "revenue",
  },
  {
    value: "estimated_catch_tn",
    label: "Estimated Catch",
    unit: "tonnes",
    category: "catch",
  },
  {
    value: "estimated_revenue_TZS",
    label: "Estimated Revenue",
    unit: "TZS",
    category: "revenue",
  },
];

export const isCiaUser = (session?: Session | null): boolean => {
  if (!session?.user?.groups) return false;
  return session.user.groups.some((group: any) => group.name === 'CIA');
}; 