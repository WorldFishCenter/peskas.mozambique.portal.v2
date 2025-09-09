import type { Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

/* eslint-disable @typescript-eslint/consistent-type-definitions */
export type TMonthlyStats = {
  _id: Types.ObjectId;
  landing_site: string;
  date: Date;
  tot_submissions: number;
  tot_fishers: number;
  tot_catches: number;
  tot_kg: number;
};

/**
 * Schema
 */
const monthlyStatsSchema = new Schema<TMonthlyStats>(
  {
    landing_site: String,
    date: String,
    tot_submissions: Number,
    tot_fishers: Number,
    tot_catches: Number,
    tot_kg: Number,
  },
  {
    collection: "monthly_stats",
  },
);

/**
 * Model
 */
export const MonthlyStatsModel =
  (mongoose.models.MonthlyStats as mongoose.Model<TMonthlyStats>) ??
  mongoose.model<TMonthlyStats>("MonthlyStats", monthlyStatsSchema);
