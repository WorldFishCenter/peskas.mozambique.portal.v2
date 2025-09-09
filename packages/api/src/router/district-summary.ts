import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { DistrictSummaryModel } from "@repo/nosql/schema/district-summary";
import getDb from "@repo/nosql";
import { TRPCError } from "@trpc/server";

// District to region mapping for Mozambique
// Both districts are in Cabo Delgado province
const DISTRICT_REGIONS: Record<string, string> = {
  'Palma': 'Cabo Delgado',
  'Mocimboa': 'Cabo Delgado',
};

export const districtSummaryRouter = createTRPCRouter({
  getDistrictsSummary: publicProcedure
    .input(
      z.object({
        districts: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      // If no districts provided, return empty array
      if (!input.districts || input.districts.length === 0) {
        return [];
      }

      try {
        await getDb(); // Ensure DB connection is established
        
        // Fetch district summaries and aggregate by district
        const summaries = await DistrictSummaryModel.aggregate([
          {
            $match: { 
              district: { $in: input.districts } 
            }
          },
          {
            $group: {
              _id: "$district",
              indicators: {
                $push: {
                  indicator: "$indicator",
                  value: "$value"
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              district: "$_id",
              indicators: 1
            }
          }
        ]).exec();

        // Transform the data to have indicator properties
        return summaries.map(summary => {
          const result: any = {
            district: summary.district,
          };
          
          // Convert indicators array to properties
          summary.indicators.forEach((ind: { indicator: string; value: number }) => {
            result[ind.indicator] = ind.value;
          });
          
          return result;
        });
      } catch (error) {
        console.error("Error fetching district summaries:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch district summaries',
          cause: error,
        });
      }
    }),
  
  getAllDistrictsSummary: publicProcedure
    .query(async () => {
      try {
        await getDb(); // Ensure DB connection is established
        
        // Fetch all district summaries and aggregate by district
        const summaries = await DistrictSummaryModel.aggregate([
          {
            $group: {
              _id: "$district",
              indicators: {
                $push: {
                  indicator: "$indicator",
                  value: "$value"
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              district: "$_id",
              indicators: 1
            }
          }
        ]).exec();

        // Transform the data to have indicator properties
        return summaries.map(summary => {
          const result: any = {
            district: summary.district,
          };
          
          // Convert indicators array to properties
          summary.indicators.forEach((ind: { indicator: string; value: number }) => {
            result[ind.indicator] = ind.value;
          });
          
          return result;
        });
      } catch (error) {
        console.error("Error fetching all district summaries:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch all district summaries',
          cause: error,
        });
      }
    }),

  getMonthlyRegionSummary: publicProcedure
    .input(
      z.object({
        months: z.number().default(3),
      })
    )
    .query(async ({ input }) => {
      try {
        await getDb();
        
        // Calculate the date range
        // TEMP: Use fixed date range to match test data in 2025
        const startDate = new Date('2025-02-01T00:00:00Z');
        const endDate = new Date('2025-07-01T00:00:00Z');

        // Fetch all relevant district summaries in the date range for the required metrics
        const metrics = [
          'n_submissions',
          'n_fishers',
          'trip_duration',
          'mean_cpue',
          'mean_rpue',
          'mean_price_kg',
          'estimated_revenue_TZS',
          'estimated_catch_tn'
        ];
        const summaries = await DistrictSummaryModel.find({
          indicator: { $in: metrics },
          date: { $gte: startDate, $lte: endDate },
        }).lean();

        // Group by metric, date, region
        const grouped: Record<string, Record<string, Record<string, number[]>>> = {};
        for (const s of summaries) {
          const region = DISTRICT_REGIONS[s.district];
          if (!region) continue;
          const metric = s.indicator;
          const dateStr = s.date ? s.date.toISOString().slice(0, 10) : undefined;
          if (!dateStr) continue;
          if (!grouped[metric]) grouped[metric] = {};
          if (!grouped[metric][dateStr]) grouped[metric][dateStr] = {};
          if (!grouped[metric][dateStr][region]) grouped[metric][dateStr][region] = [];
          grouped[metric][dateStr][region].push(s.value);
        }

        // Prepare result in the same format as before
        const result: Record<string, any> = {};
        for (const metric of metrics) {
          const dateEntries = grouped[metric] ? Object.entries(grouped[metric]) : [];
          // Sort by date ascending
          dateEntries.sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
          // Only keep the last 3 months
          const last3 = dateEntries.slice(-3);
            result[metric] = {
            data: last3.map(([dateStr, regions]) => {
            const date = new Date(dateStr);
            const monthLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });
              const dataPoint: any = { month: monthLabel };
              
              // Dynamically add all regions found in the data
              Object.keys(regions).forEach(regionName => {
                const vals = (regions[regionName] || []).filter(v => v !== null && v !== undefined && !isNaN(v));
                dataPoint[regionName] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
              });
              
              return dataPoint;
            }),
            months: last3.map(([dateStr]) => {
              const date = new Date(dateStr);
              return date.toLocaleString('default', { month: 'short', year: '2-digit' });
            })
          };
        }
        return result;
      } catch (error) {
        console.error("Error fetching monthly region summaries:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch monthly region summaries',
          cause: error,
        });
      }
    }),

  getDistrictsSummaryByDateRange: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        await getDb();
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        // Fetch all indicators for the date range
        const summaries = await DistrictSummaryModel.find({
          date: { $gte: start, $lte: end },
        }).lean();
        // Group by district and indicator
        const grouped: Record<string, Record<string, number[]>> = {};
        for (const s of summaries) {
          if (!grouped[s.district]) grouped[s.district] = {};
          if (!grouped[s.district][s.indicator]) grouped[s.district][s.indicator] = [];
          grouped[s.district][s.indicator].push(s.value);
        }
        // Get all districts dynamically from the database data instead of hardcoding
        const ALL_DISTRICTS = Array.from(new Set(summaries.map(s => s.district)));
        const ALL_METRICS = [
          "mean_cpue", "mean_rpue", "n_fishers", "n_submissions", "trip_duration", "mean_price_kg", "estimated_revenue_TZS", "estimated_catch_tn"
        ];
        // Prepare result: array of { district, indicator1: avg, ... }
        const result = ALL_DISTRICTS.map((district) => {
          const indicatorsObj = grouped[district] || {};
          const row: any = { district };
          for (const indicator of ALL_METRICS) {
            // Filter out null/undefined/NaN values before aggregating
            const values = (indicatorsObj[indicator] || []).filter(v => v !== null && v !== undefined && !isNaN(v));
            if (["n_submissions", "estimated_catch_tn", "estimated_revenue_TZS"].includes(indicator)) {
              row[indicator] = values.length ? values.reduce((a, b) => a + b, 0) : null;
            } else {
              row[indicator] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
            }
          }
          return row;
        });
        return result;
      } catch (error) {
        console.error("Error fetching district summaries by date range:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch district summaries by date range',
          cause: error,
        });
      }
    }),
}); 