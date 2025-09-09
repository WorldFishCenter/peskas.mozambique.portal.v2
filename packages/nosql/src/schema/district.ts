import mongoose, { Schema, Types } from "mongoose";

export type TDistrict = {
  _id: Types.ObjectId;
  district: string;
  region: string; // e.g., "Unguja" or "Pemba"
  lat?: number;
  lng?: number;
};

/**
 * Schema for Mozambique/Pemba districts
 */
const districtSchema = new Schema<TDistrict>(
  {
    district: { type: String, required: true },
    region: { type: String, required: true },
    lat: Number,
    lng: Number,
  },
  {
    collection: "districts",
  },
);

// Create index for faster queries
districtSchema.index({ district: 1 });
districtSchema.index({ region: 1 });

/**
 * Model
 */
export const DistrictModel =
  (mongoose.models.District as mongoose.Model<TDistrict>) ??
  mongoose.model<TDistrict>("District", districtSchema); 