import type { Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

// Define the indicators as a const array for type safety
export const DISTRICT_INDICATORS = [
  "n_submissions",
  "n_fishers",
  "trip_duration",
  "mean_cpue",
  "mean_rpue",
  "mean_price_kg",
  "estimated_revenue_TZS",
  "estimated_catch_tn",
] as const;

export type TDistrictIndicator = (typeof DISTRICT_INDICATORS)[number];

/* eslint-disable @typescript-eslint/consistent-type-definitions */
export type TDistrictSummary = {
  _id: Types.ObjectId;
  district: string;
  indicator: TDistrictIndicator | string; // Allow string for flexibility with new indicators
  value: number;
  date: Date;
  timestamp?: Date;
  metadata?: {
    period?: string; // e.g., "monthly", "weekly", "daily"
    startDate?: Date;
    endDate?: Date;
  };
};

/**
 * Schema for district summary statistics
 */
const districtSummarySchema = new Schema<TDistrictSummary>(
  {
    district: { type: String, required: true },
    indicator: { type: String, required: true },
    value: { type: Number, required: true },
    date: { type: Date, required: true },
    timestamp: Date,
    metadata: {
      period: String,
      startDate: Date,
      endDate: Date,
    },
  },
  {
    collection: "districts_summaries",
  },
);

// Create compound index for efficient querying
districtSummarySchema.index({ district: 1, indicator: 1 });
districtSummarySchema.index({ timestamp: -1 });

/**
 * Model
 */
export const DistrictSummaryModel =
  (mongoose.models.DistrictSummary as mongoose.Model<TDistrictSummary>) ??
  mongoose.model<TDistrictSummary>("DistrictSummary", districtSummarySchema); 