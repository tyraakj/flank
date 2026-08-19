import { z } from "zod";

export const CompetitorPositioningDataSchema = z.object({
  icp: z
    .string()
    .describe(
      "Target Ideal Customer Profile (e.g., 'Mid-Market Engineering Leaders & DevOps Teams', 'Early-Stage Founders').",
    ),
  categoryClaim: z
    .string()
    .describe("How the competitor defines their market category and primary value narrative."),
  differentiators: z
    .array(z.string())
    .default([])
    .describe(
      "Key market differentiators, unique selling propositions, and architectural advantages.",
    ),
  tone: z
    .string()
    .default("Professional & Product-Led")
    .describe(
      "Tone of voice and brand posture (e.g. 'Developer-First / Technical', 'Enterprise / Compliance-Heavy', 'Self-Serve / Accessible').",
    ),
  headlineValueProps: z
    .array(z.string())
    .default([])
    .describe("Verbatim hero headline and primary value proposition statements from the website."),
  sourceUrls: z
    .array(z.string().url())
    .default([])
    .describe("Canonical URLs where positioning claims were extracted."),
  excerpt: z
    .string()
    .describe(
      "Exact verbatim excerpt from the hero, about, or product copy proving the positioning claim.",
    ),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .default(80)
    .describe("Extraction confidence score (0-100)."),
});
export type CompetitorPositioningData = z.infer<typeof CompetitorPositioningDataSchema>;

export const PositioningMapAxisSchema = z.object({
  name: z
    .string()
    .describe(
      "Axis metric name (e.g., 'Price & Monetization Posture', 'Feature Breadth & Platform Scope').",
    ),
  lowLabel: z
    .string()
    .describe("Label at 0 (e.g., 'Self-Serve / Low Cost', 'Point Solution / Specialized')."),
  highLabel: z
    .string()
    .describe("Label at 100 (e.g., 'Enterprise Custom Quote', 'All-in-One Enterprise Platform')."),
  metricKey: z.string().describe("Internal metric identifier used for calculation."),
});
export type PositioningMapAxis = z.infer<typeof PositioningMapAxisSchema>;

export const PositioningMapCoordinateSchema = z.object({
  competitorId: z.string().describe("ID of the competitor or target in database."),
  name: z.string().describe("Product name."),
  isTarget: z
    .boolean()
    .default(false)
    .describe("Whether this entity represents the target product."),
  x: z.number().min(0).max(100).describe("X-axis coordinate from 0 to 100."),
  y: z.number().min(0).max(100).describe("Y-axis coordinate from 0 to 100."),
  clusterId: z.string().optional().describe("ID of the cluster this entity belongs to."),
  clusterName: z.string().optional().describe("Name of the cluster."),
  rationale: z
    .string()
    .describe("Deterministic rationale explaining why this entity was placed at (x, y)."),
});
export type PositioningMapCoordinate = z.infer<typeof PositioningMapCoordinateSchema>;

export const PositioningMapClusterSchema = z.object({
  id: z.string().describe("Unique cluster identifier (e.g. 'cluster-enterprise-suites')."),
  label: z
    .string()
    .describe(
      "Descriptive cluster label (e.g. 'Enterprise All-in-One Suites', 'Self-Serve Developer Point Solutions').",
    ),
  description: z
    .string()
    .describe(
      "Explanation of the common positioning, pricing, and feature posture of entities in this cluster.",
    ),
  entityIds: z
    .array(z.string())
    .describe("List of competitor/target IDs belonging to this cluster."),
  centroid: z.object({
    x: z.number(),
    y: z.number(),
  }),
});
export type PositioningMapCluster = z.infer<typeof PositioningMapClusterSchema>;

export const PositioningMapWhitespaceSchema = z.object({
  id: z.string().describe("Unique whitespace area identifier."),
  quadrant: z
    .string()
    .describe("Quadrant name (e.g. 'High Feature Breadth / Accessible Self-Serve Price')."),
  xRange: z.tuple([z.number(), z.number()]).describe("[minX, maxX] bounds."),
  yRange: z.tuple([z.number(), z.number()]).describe("[minY, maxY] bounds."),
  opportunity: z
    .string()
    .describe("Strategic opportunity description for entering this uncrowded market space."),
  rationale: z
    .string()
    .describe("Evidence-backed rationale based on surrounding competitor cluster absence."),
});
export type PositioningMapWhitespace = z.infer<typeof PositioningMapWhitespaceSchema>;

export const PositioningMapSchema = z.object({
  xAxis: PositioningMapAxisSchema,
  yAxis: PositioningMapAxisSchema,
  coordinates: z.array(PositioningMapCoordinateSchema),
  clusters: z.array(PositioningMapClusterSchema),
  whitespaces: z.array(PositioningMapWhitespaceSchema),
  summary: z
    .string()
    .default("")
    .describe("High-level strategic summary of the competitive landscape and positioning map."),
});
export type PositioningMap = z.infer<typeof PositioningMapSchema>;

export const PositioningStageOutputSchema = z.object({
  targetId: z.string(),
  competitorsEvaluated: z.number(),
  positioningsPersisted: z.number(),
  mapGenerated: z.boolean(),
  clustersCount: z.number(),
  whitespaceCount: z.number(),
  warnings: z.array(z.string()).optional(),
});
export type PositioningStageOutput = z.infer<typeof PositioningStageOutputSchema>;
