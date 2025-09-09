// Shared chart styling configuration for consistency across the dashboard

export const CHART_STYLES = {
  // Grid styling
  grid: {
    strokeDasharray: "3 3",
    stroke: "#e5e7eb",
    strokeOpacity: 0.7,
    className: "dark:stroke-gray-700"
  },

  // Axis styling - responsive font sizes
  axis: {
    tick: {
      fontSize: 10, // Smaller for mobile
      fill: "#64748b",
      className: "sm:text-xs md:text-sm" // Responsive text sizing via CSS
    },
    axisLine: {
      stroke: '#cbd5e1',
      strokeWidth: 1,
      className: 'dark:stroke-gray-700'
    },
    tickLine: {
      stroke: '#cbd5e1',
      className: 'dark:stroke-gray-700'
    }
  },

  // Tooltip styling
  tooltip: {
    wrapperStyle: { background: 'transparent' },
    contentStyle: {
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      padding: '16px',
      minWidth: '200px'
    },
    darkContentStyle: {
      backgroundColor: '#1f2937',
      border: '1px solid #374151',
      color: '#f9fafb'
    }
  },

  // Legend styling
  legend: {
    wrapperStyle: { paddingTop: '10px' },
    iconType: "circle" as const,
    iconSize: 8
  },

  // Animation settings
  animation: {
    isAnimationActive: true,
    animationDuration: 1000,
    animationEasing: "ease-out" as const
  },

  // Chart margins - responsive
  margins: {
    top: 15,
    right: 20,
    left: 15,
    bottom: 15
  },
  
  // Mobile-specific margins
  mobileMargins: {
    top: 10,
    right: 10,
    left: 10,
    bottom: 10
  },

  // Area chart specific styles
  area: {
    fillOpacity: 0.6,
    strokeWidth: 2
  },

  // Line chart specific styles
  line: {
    strokeWidth: 2,
    dot: { r: 4 },
    activeDot: { r: 6 }
  },

  // Bar chart specific styles
  bar: {
    radius: [0, 4, 4, 0],
    isAnimationActive: true,
    animationDuration: 1000,
    animationEasing: "ease-out" as const
  }
};

// Shared color palette for districts
export const DISTRICT_COLOR_PALETTE = [
  "#167288", "#8cdaec", "#b45248", "#d48c84", "#a89a49", 
  "#d6cfa2", "#3cb464", "#9bddb1", "#643c6a", "#836394", "#90a4ae"
];

// Shared metric configuration
export const SHARED_METRIC_CONFIG = {
  mean_effort: {
    labelKey: "text-metrics-effort",
    color: "#F28F3B",
    unit: "fishers/km²/day"
  },
  mean_cpue: {
    labelKey: "text-metrics-catch-rate",
    color: "#75ABBC",
    unit: "kg/fisher/day"
  },
  mean_rpue: {
    labelKey: "text-metrics-fisher-revenue", 
    color: "#4A90E2",
    unit: "MZN/fisher/day"
  },
  mean_price_kg: {
    labelKey: "metric-mean_price_kg-title",
    color: "#9B59B6", 
    unit: "MZN/kg"
  },
  total_catch_kg: {
    labelKey: "text-total-catch",
    color: "#E74C3C",
    unit: "kg"
  },
  total_value: {
    labelKey: "text-total-value",
    color: "#27AE60",
    unit: "MZN"
  },
  n_trips: {
    labelKey: "text-number-of-trips",
    color: "#F39C12",
    unit: "trips"
  },
  n_fishers: {
    labelKey: "text-number-of-fishers",
    color: "#3498DB",
    unit: "fishers"
  },
  estimated_catch_tn: {
    labelKey: "metric-estimated_catch_tn-title",
    color: "#8E44AD",
    unit: "tonnes"
  },
  estimated_revenue_TZS: {
    labelKey: "metric-estimated_revenue_TZS-title",
    color: "#27AE60",
    unit: "MZN"
  }
};

// Utility function to get district color consistently
export const getDistrictColor = (districtName: string, index: number, districtColors: Record<string, string>) => {
  return districtColors[districtName] || DISTRICT_COLOR_PALETTE[index % DISTRICT_COLOR_PALETTE.length];
};

// Utility function to format chart titles
export const formatChartTitle = (metricKey: string, chartType: string, t?: (key: string) => string) => {
  const metricConfig = SHARED_METRIC_CONFIG[metricKey as keyof typeof SHARED_METRIC_CONFIG];
  const metricLabel = t && metricConfig?.labelKey ? t(metricConfig.labelKey) : metricConfig?.labelKey || "Metric";
  return `${metricLabel} ${chartType}`;
}; 