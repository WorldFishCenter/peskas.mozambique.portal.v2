import type { Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

/* eslint-disable @typescript-eslint/consistent-type-definitions */
export type TFishDistributionDistrict = {
  _id: Types.ObjectId;
  district: string;
  date: Date;
  fish_category: string;
  total_catch_kg: number;
  total_value?: number;
  avg_price_per_kg?: number;
};

/**
 * Schema for fish distribution aggregated by district
 */
const fishDistributionDistrictSchema = new Schema<TFishDistributionDistrict>(
  {
    district: { type: String, required: true },
    date: { type: Date, required: true },
    fish_category: { type: String, required: true },
    total_catch_kg: { type: Number, required: true, default: 0 },
    total_value: { type: Number, default: 0 },
    avg_price_per_kg: Number,
  },
  {
    collection: "fish_distribution_district",
  }
);

// Create indexes for efficient querying
fishDistributionDistrictSchema.index({ district: 1, date: -1, fish_category: 1 });

/**
 * Model
 */
export const FishDistributionDistrictModel =
  (mongoose.models.FishDistributionDistrict as mongoose.Model<TFishDistributionDistrict>) ??
  mongoose.model<TFishDistributionDistrict>("FishDistributionDistrict", fishDistributionDistrictSchema); 