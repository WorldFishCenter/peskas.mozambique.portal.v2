import type { Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

// Define metrics for taxa summaries
export const TAXA_METRICS = [
  "catch_kg",
  "mean_length",
  "price_kg",
  "n_individuals",
  "total_value"
] as const;

export type TTaxaMetric = (typeof TAXA_METRICS)[number] | string;

/* eslint-disable @typescript-eslint/consistent-type-definitions */
export type TTaxaSummaryDistrict = {
  _id: Types.ObjectId;
  district: string;
  common_name: string;
  metric: TTaxaMetric;
  value?: number; // Optional as some values might be null
  scientific_name?: string; // Optional field for scientific names
  timestamp?: Date;
};

/**
 * Schema for taxa/species summary statistics by district
 */
const taxaSummaryDistrictSchema = new Schema<TTaxaSummaryDistrict>(
  {
    district: { type: String, required: true },
    common_name: { type: String, required: true },
    metric: { type: String, required: true },
    value: { type: Number, required: false }, // Not required as it can be null
    scientific_name: String,
    timestamp: Date,
  },
  {
    collection: "taxa_summaries",
  },
);

// Create compound index for efficient querying
taxaSummaryDistrictSchema.index({ district: 1, common_name: 1, metric: 1 });
taxaSummaryDistrictSchema.index({ common_name: 1 });
taxaSummaryDistrictSchema.index({ timestamp: -1 });

/**
 * Model
 */
export const TaxaSummaryDistrictModel =
  (mongoose.models.TaxaSummaryDistrict as mongoose.Model<TTaxaSummaryDistrict>) ??
  mongoose.model<TTaxaSummaryDistrict>("TaxaSummaryDistrict", taxaSummaryDistrictSchema); 