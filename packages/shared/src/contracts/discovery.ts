import { z } from "zod";

export const DiscoveryAngleEnum = z.enum([
  "category",
  "alternative",
  "versus",
  "review-listing",
  "competitor-list",
  "adjacent-job",
]);
export type DiscoveryAngle = z.infer<typeof DiscoveryAngleEnum>;

export const DiscoveryStrategySchema = z.object({
  angle: DiscoveryAngleEnum.describe("The strategic angle for this search query."),
  query: z.string().min(3).describe("The exact search query to submit to the search engine."),
  rationale: z
    .string()
    .describe("Why this search query is expected to yield viable direct or indirect competitors."),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(10)
    .describe("Maximum number of search results to harvest for this query."),
});
export type DiscoveryStrategy = z.infer<typeof DiscoveryStrategySchema>;

export const DiscoveryPlanSchema = z.object({
  strategies: z
    .array(DiscoveryStrategySchema)
    .min(3)
    .max(10)
    .describe("Set of targeted discovery search strategies spanning multiple angles."),
  summary: z.string().describe("Summary of the overall discovery search angle plan."),
});
export type DiscoveryPlan = z.infer<typeof DiscoveryPlanSchema>;

export const CandidateHarvestSchema = z.object({
  discoveredUrl: z.string().url(),
  displayedDomain: z.string(),
  nameHint: z.string(),
  query: z.string(),
  angle: DiscoveryAngleEnum,
  firstPassRelevance: z.number().min(0).max(100),
  sourceResultExcerpt: z.string(),
});
export type CandidateHarvest = z.infer<typeof CandidateHarvestSchema>;

export const DiscoveryStageOutputSchema = z.object({
  targetId: z.string(),
  strategiesExecuted: z.number(),
  candidatesHarvested: z.number(),
  uniqueDomains: z.number(),
  warnings: z.array(z.string()).optional(),
});
export type DiscoveryStageOutput = z.infer<typeof DiscoveryStageOutputSchema>;
