import type { Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

/* eslint-disable @typescript-eslint/consistent-type-definitions */
export type TMapDistribution = {
  _id: Types.ObjectId;
  landing_site: string;
  lat: number;
  lon: number;
};

/**
 * Schema
 */
const mapDistributionSchema = new Schema<TMapDistribution>(
  {
    landing_site: String,
    lat: Number,
    lon: Number,
  },
  {
    collection: "map_distribution",
  },
);

/**
 * Model
 */
export const MapDistributionModel =
  (mongoose.models.MapDistribution as mongoose.Model<TMapDistribution>) ??
  mongoose.model<TMapDistribution>("MapDistribution", mapDistributionSchema);
