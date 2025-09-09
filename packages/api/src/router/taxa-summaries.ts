import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TaxaSummaryDistrictModel, TAXA_METRICS } from "@repo/nosql/schema/taxa-summary-district";
import getDb from "@repo/nosql";
import { TRPCError } from "@trpc/server";

const taxaMetricSchema = z.enum([
  "catch_kg",
  "mean_length", 
  "price_kg",
  "n_individuals",
  "total_value"
]);

export const taxaSummariesRouter = createTRPCRouter({
  getDistrictTaxaSummaries: publicProcedure
    .input(
      z.object({
        districts: z.array(z.string()).optional(),
        species: z.array(z.string()).optional(),
        metrics: z.array(taxaMetricSchema).optional(),
        months: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        await getDb(); // Ensure DB connection is established
        
        // Build match query
        const matchQuery: any = {
          value: { $ne: null, $exists: true } // Only get records with actual values
        };
        
        if (input.districts && input.districts.length > 0) {
          matchQuery.district = { $in: input.districts };
        }
        if (input.species && input.species.length > 0) {
          matchQuery.common_name = { $in: input.species };
        }
        if (input.metrics && input.metrics.length > 0) {
          matchQuery.metric = { $in: input.metrics };
        }
        
        // Note: Time filtering not yet implemented for taxa summaries due to data structure limitations
        // The months parameter is accepted for API compatibility but not currently applied
        if (input.months && typeof input.months === 'number') {
          console.log(`Time filtering requested for ${input.months} months, but not yet implemented for taxa summaries`);
          // TODO: Implement time filtering once appropriate data source is identified
        }

        // Get raw records first
        const records = await TaxaSummaryDistrictModel.find(matchQuery)
          .select('district common_name scientific_name metric value')
          .sort({ district: 1, common_name: 1, metric: 1 })
          .exec();

        // Group by district and species to create pivot table structure
        const grouped = records.reduce((acc: any, record: any) => {
          const key = `${record.district}|${record.common_name}`;
          
          if (!acc[key]) {
            acc[key] = {
              district: record.district,
              common_name: record.common_name,
              scientific_name: record.scientific_name,
            };
          }
          
          // Add metric as property, but only if value exists and is not null
          if (record.value !== null && record.value !== undefined) {
            acc[key][record.metric] = record.value;
          }
          
          return acc;
        }, {});

        return Object.values(grouped);
      } catch (error) {
        console.error("Error fetching taxa summaries:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch taxa summaries',
          cause: error,
        });
      }
    }),

  getSpeciesComposition: publicProcedure
    .input(
      z.object({
        districts: z.array(z.string()).optional(),
        metric: taxaMetricSchema.default("catch_kg"),
        months: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        await getDb();
        
        // Build match query - only get records with actual values for the specific metric
        const matchQuery: any = {
          metric: input.metric,
          value: { $ne: null, $exists: true, $gt: 0 } // Only positive values
        };
        
        if (input.districts && input.districts.length > 0) {
          matchQuery.district = { $in: input.districts };
        }
        
        // Note: Time filtering not yet implemented for taxa summaries due to data structure limitations
        // The months parameter is accepted for API compatibility but not currently applied
        if (input.months && typeof input.months === 'number') {
          console.log(`Time filtering requested for ${input.months} months, but not yet implemented for taxa summaries`);
          // TODO: Implement time filtering once appropriate data source is identified
        }

        // Aggregate species composition
        const composition = await TaxaSummaryDistrictModel.aggregate([
          {
            $match: matchQuery
          },
          {
            $group: {
              _id: "$common_name",
              total_value: { $sum: "$value" },
              scientific_name: { $first: "$scientific_name" },
              districts: {
                $addToSet: {
                  district: "$district",
                  value: "$value"
                }
              }
            }
          },
          {
            $match: {
              total_value: { $gt: 0 } // Only include species with positive total values
            }
          },
          {
            $project: {
              _id: 0,
              common_name: "$_id",
              scientific_name: 1,
              total_value: 1,
              districts: 1
            }
          },
          {
            $sort: { total_value: -1 }
          }
        ]).exec();

        return composition;
      } catch (error) {
        console.error("Error fetching species composition:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch species composition',
          cause: error,
        });
      }
    }),

  getDistrictSpeciesBreakdown: publicProcedure
    .input(
      z.object({
        district: z.string(),
        metric: taxaMetricSchema.default("catch_kg"),
      })
    )
    .query(async ({ input }) => {
      try {
        await getDb();
        
        // Get all species for a specific district
        const breakdown = await TaxaSummaryDistrictModel.aggregate([
          {
            $match: {
              district: input.district,
              metric: input.metric
            }
          },
          {
            $project: {
              _id: 0,
              common_name: 1,
              scientific_name: 1,
              value: 1
            }
          },
          {
            $sort: { value: -1 }
          }
        ]).exec();

        return breakdown;
      } catch (error) {
        console.error("Error fetching district species breakdown:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch district species breakdown',
          cause: error,
        });
      }
    }),

  getAllSpecies: publicProcedure
    .query(async () => {
      try {
        await getDb();
        
        // Get unique species list
        const species = await TaxaSummaryDistrictModel.aggregate([
          {
            $group: {
              _id: "$common_name",
              scientific_name: { $first: "$scientific_name" }
            }
          },
          {
            $project: {
              _id: 0,
              common_name: "$_id",
              scientific_name: 1
            }
          },
          {
            $sort: { common_name: 1 }
          }
        ]).exec();

        return species;
      } catch (error) {
        console.error("Error fetching all species:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch all species',
          cause: error,
        });
      }
    }),
});