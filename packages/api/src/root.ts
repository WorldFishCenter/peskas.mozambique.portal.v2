import {
  pingRouter,
  aggregatedCatchRouter,
  mapDistributionRouter,
  gearRouter,
  monthlyStatsRouter,
  userRouter,
  fishDistributionRouter,
  individualDataRouter,
  districtSummaryRouter,
  gridSummaryRouter,
  monthlySummaryRouter,
  taxaSummariesRouter
} from "./router";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  ping: pingRouter,
  aggregatedCatch: aggregatedCatchRouter,
  gear: gearRouter,
  mapDistribution: mapDistributionRouter,
  monthlyStats: monthlyStatsRouter,
  user: userRouter,
  fishDistribution: fishDistributionRouter,
  individualData: individualDataRouter,
  districtSummary: districtSummaryRouter,
  gridSummary: gridSummaryRouter,
  monthlySummary: monthlySummaryRouter,
  taxaSummaries: taxaSummariesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
