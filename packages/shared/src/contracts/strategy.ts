import { z } from "zod";

export const OpportunityKindSchema = z.enum(["PRODUCT", "MARKETING", "PRICING", "POSITIONING"]);
export type OpportunityKind = z.infer<typeof OpportunityKindSchema>;

export const OpportunityItemSchema = z.object({
  kind: OpportunityKindSchema.describe(
    "Strategic dimension: PRODUCT (feature/capability gap), PRICING (packaging/pricing move), POSITIONING (messaging/ICP move), or MARKETING (acquisition/wedge).",
  ),
  gap: z
    .string()
    .describe(
      "Concise statement of the competitive gap or market asymmetry observed across competitors.",
    ),
  supportingCompetitorIds: z
    .array(z.string())
    .default([])
    .describe("IDs of competitors that exhibit or validate this pattern."),
  absentCompetitorIds: z
    .array(z.string())
    .default([])
    .describe("IDs of competitors verified to lack this capability or fail in this area."),
  suggestedMove: z
    .string()
    .describe(
      "Specific, high-leverage product, pricing, or positioning move recommended for the target product.",
    ),
  whatToSay: z
    .string()
    .describe(
      "Audience-facing pitch copy or messaging narrative to exploit this edge in sales and marketing.",
    ),
  rationale: z
    .string()
    .describe(
      "Evidence-based strategic reasoning detailing why this move creates a defensible edge.",
    ),
  impact: z
    .number()
    .int()
    .min(1)
    .max(5)
    .default(3)
    .describe(
      "Expected business impact from 1 (minor tactical edge) to 5 (transformational market wedge).",
    ),
  effort: z
    .number()
    .int()
    .min(1)
    .max(5)
    .default(3)
    .describe(
      "Implementation effort from 1 (trivial/copy-only) to 5 (major engineering architectural overhaul).",
    ),
  defensibility: z
    .number()
    .int()
    .min(1)
    .max(5)
    .default(3)
    .describe(
      "How difficult it is for incumbents to copy this move from 1 (easy to replicate) to 5 (high structural moat).",
    ),
  evidenceExcerpts: z
    .array(z.string())
    .default([])
    .describe(
      "Direct verbatim quotes from scraped competitor sources supporting this recommendation.",
    ),
  sourceUrls: z
    .array(z.string().url())
    .default([])
    .describe("URLs from which supporting evidence was gathered."),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .default(80)
    .describe("Confidence score (0-100) based on source strength and evidence depth."),
});
export type OpportunityItem = z.infer<typeof OpportunityItemSchema>;

export const StrategistExtractionSchema = z.object({
  opportunities: z
    .array(OpportunityItemSchema)
    .describe("List of distinct, high-conviction strategic opportunities."),
  strategicSummary: z
    .string()
    .describe(
      "Executive overview of the target's strategic posture relative to the competitive landscape.",
    ),
  primaryWedge: z
    .string()
    .describe("The single highest-leverage initial wedge to capture market share."),
});
export type StrategistExtraction = z.infer<typeof StrategistExtractionSchema>;

export const OpportunityStageOutputSchema = z.object({
  targetId: z.string(),
  candidatesGenerated: z.number(),
  opportunitiesPersisted: z.number(),
  byKind: z.record(OpportunityKindSchema, z.number()),
  topOpportunity: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});
export type OpportunityStageOutput = z.infer<typeof OpportunityStageOutputSchema>;
