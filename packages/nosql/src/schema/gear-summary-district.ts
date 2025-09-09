import type { Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

// Define gear types based on the data
export const GEAR_TYPES = [
  "Beach Seine",
  "Gill Net",
  "Hand line",
  "Long line",
  "Spear gun",
  "Trap",
  "Other"
] as const;

export type TGearType = (typeof GEAR_TYPES)[number] | string;

// Define indicators for gear summaries
export const GEAR_INDICATORS = [
  "n_submissions",
  "cpue",
  "rpue",
  "mean_effort",
  "total_catch_kg"
] as const;

export type TGearIndicator = (typeof GEAR_INDICATORS)[number] | string;

/* eslint-disable @typescript-eslint/consistent-type-definitions */
export type TGearSummaryDistrict = {
  _id: Types.ObjectId;
  district: string;
  gear: TGearType;
  indicator: TGearIndicator;
  value: number;
  timestamp?: Date;
};

/**
 * Schema for gear summary statistics by district
 */
const gearSummaryDistrictSchema = new Schema<TGearSummaryDistrict>(
  {
    district: { type: String, required: true },
    gear: { type: String, required: true },
    indicator: { type: String, required: true },
    value: { type: Number, required: true },
    timestamp: Date,
  },
  {
    collection: "gear_summaries",
  },
);

// Create compound index for efficient querying
gearSummaryDistrictSchema.index({ district: 1, gear: 1, indicator: 1 });
gearSummaryDistrictSchema.index({ timestamp: -1 });

/**
 * Model
 */
export const GearSummaryDistrictModel =
  (mongoose.models.GearSummaryDistrict as mongoose.Model<TGearSummaryDistrict>) ??
  mongoose.model<TGearSummaryDistrict>("GearSummaryDistrict", gearSummaryDistrictSchema); 