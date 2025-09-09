import { z } from "zod";

import { GearSummaryModel } from "@repo/nosql/schema/gear-summary";
import { GearSummaryDistrictModel } from "@repo/nosql/schema/gear-summary-district";
import { createTRPCRouter, publicProcedure } from "../trpc";
import getDb from "@repo/nosql";
import { TRPCError } from "@trpc/server";

export const gearRouter = createTRPCRouter({
  summaries: publicProcedure
    .input(z.object({ bmus: z.string().array() }))
    .query(({ input }) => {
      return GearSummaryModel
        .find({ 
          BMU: { $in: input.bmus }
        })
        .select({
          _id: 0,
          BMU: 1,
          gear: 1,
          mean_trip_catch: 1,
          mean_effort: 1,
          mean_cpue: 1,
          mean_cpua: 1,
          mean_rpue: 1, 
          mean_rpua: 1   
        })
        .exec();
    }),

  cpueByGear: publicProcedure
    .input(z.object({ 
      districts: z.string().array(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        await getDb();
        
        // Prepare match stage with district and date filtering
        const matchStage: any = {
          district: { $in: input.districts },
          indicator: "cpue",
          value: { $ne: null, $exists: true }
        };
        
        if (input.startDate || input.endDate) {
          matchStage.date = {};
          if (input.startDate) {
            matchStage.date.$gte = new Date(input.startDate);
          }
          if (input.endDate) {
            matchStage.date.$lte = new Date(input.endDate);
          }
        }
        
        return await GearSummaryDistrictModel.aggregate([
          {
            $match: matchStage,
          },
          {
            $group: {
              _id: "$gear",
              avg_cpue: { $avg: "$value" },
              total_records: { $sum: 1 },
              districts: { $addToSet: "$district" },
            },
          },
          {
            $project: {
              _id: 0,
              gear: "$_id",
              avg_cpue: { $round: ["$avg_cpue", 2] },
              total_records: 1,
              district_count: { $size: "$districts" },
            },
          },
          {
            $sort: { avg_cpue: -1 },
          },
        ]).exec();
      } catch (error) {
        console.error('Error in CPUE by gear query:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch CPUE by gear data',
          cause: error,
        });
      }
    }),

  rpueByGear: publicProcedure
    .input(z.object({ 
      districts: z.string().array(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        await getDb();
        
        // Prepare match stage with district and date filtering
        const matchStage: any = {
          district: { $in: input.districts },
          indicator: "rpue",
          value: { $ne: null, $exists: true }
        };
        
        if (input.startDate || input.endDate) {
          matchStage.date = {};
          if (input.startDate) {
            matchStage.date.$gte = new Date(input.startDate);
          }
          if (input.endDate) {
            matchStage.date.$lte = new Date(input.endDate);
          }
        }
        
        return await GearSummaryDistrictModel.aggregate([
          {
            $match: matchStage,
          },
          {
            $group: {
              _id: "$gear",
              avg_rpue: { $avg: "$value" },
              total_records: { $sum: 1 },
              districts: { $addToSet: "$district" },
            },
          },
          {
            $project: {
              _id: 0,
              gear: "$_id",
              avg_rpue: { $round: ["$avg_rpue", 2] },
              total_records: 1,
              district_count: { $size: "$districts" },
            },
          },
          {
            $sort: { avg_rpue: -1 },
          },
        ]).exec();
      } catch (error) {
        console.error('Error in RPUE by gear query:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch RPUE by gear data',
          cause: error,
        });
      }
    }),
});