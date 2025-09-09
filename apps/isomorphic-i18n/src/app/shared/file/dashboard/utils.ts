// Utility functions for dashboard visualizations

// YlGnBu-8 palette
export const YLGNBU_8 = [
  "#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb",
  "#41b6c4", "#1d91c0", "#225ea8", "#253494"
];

export function getPaletteColor(value: number | null, min: number, max: number) {
  if (value === null || isNaN(value)) return YLGNBU_8[0];
  if (max === min) return YLGNBU_8[YLGNBU_8.length - 1];
  const idx = Math.floor(((value - min) / (max - min)) * (YLGNBU_8.length - 1));
  return YLGNBU_8[idx];
}

// Utility to determine if text should be white or black based on background color
export function getTextColor(bgColor: string) {
  // Convert hex to RGB
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#222' : '#fff';
}

export function formatNumber(val: number | null) {
  if (val === null || isNaN(val)) return "-";
  return Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatDashboardNumber(value: any, metric?: string, lang: string = 'en') {
  if (value === null || value === undefined || isNaN(value)) return '-';
  if (metric === 'estimated_revenue_TZS') {
    const millions = value / 1_000_000;
    return millions.toLocaleString(lang, { maximumFractionDigits: 1, minimumFractionDigits: 0 }) + 'M';
  }
  if (Math.abs(value) >= 1_000_000) {
    return new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(value);
  }
  return Number(value).toLocaleString(lang, { maximumFractionDigits: 1, minimumFractionDigits: 0 });
}

export function getAggregatedDistrictValue(row: any, metricKey: string) {
  // If the row has an array of values for the metric, aggregate accordingly
  const values = Array.isArray(row[metricKey]) ? row[metricKey] : [row[metricKey]];
  const valid = values.filter((v: number) => v !== null && v !== undefined && !isNaN(v));
  if (["n_submissions", "estimated_catch_tn", "estimated_revenue_TZS"].includes(metricKey)) {
    return valid.length ? valid.reduce((a: number, b: number) => a + b, 0) : null;
  }
  return valid.length ? valid.reduce((a: number, b: number) => a + b, 0) / valid.length : null;
} 