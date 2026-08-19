import { z } from "zod";

export const FeatureSupportStatusSchema = z.enum(["YES", "PARTIAL", "NO", "UNKNOWN"]);
export type FeatureSupportStatus = z.infer<typeof FeatureSupportStatusSchema>;

export const FeatureShippingStateSchema = z.enum(["shipped", "announced", "unknown"]);
export type FeatureShippingState = z.infer<typeof FeatureShippingStateSchema>;

export const FeatureTaxonomyNodeSchema = z.object({
  name: z
    .string()
    .describe("Canonical standardized feature name (e.g. 'Single Sign-On (SSO)', 'Audit Logs')."),
  slug: z
    .string()
    .describe(
      "URL-safe unique kebab-case slug identifier (e.g. 'single-sign-on-sso', 'audit-logs').",
    ),
  category: z
    .string()
    .default("General")
    .describe(
      "Functional category (e.g. 'Security & Access', 'Analytics & Reporting', 'Integrations & API', 'Core Workflow', 'Collaboration').",
    ),
  description: z
    .string()
    .optional()
    .describe("Clear, concise description of what this capability does."),
  aliases: z
    .array(z.string())
    .default([])
    .describe("Common synonyms, vendor-specific branding, or acronyms for this feature."),
  parentSlug: z
    .string()
    .optional()
    .describe("Optional parent feature category or module slug for hierarchy."),
});
export type FeatureTaxonomyNode = z.infer<typeof FeatureTaxonomyNodeSchema>;

export const ExtractedFeatureItemSchema = z.object({
  verbatimLabel: z
    .string()
    .describe(
      "Exact verbatim feature title or name as displayed in the competitor's page, table, or docs.",
    ),
  canonicalName: z
    .string()
    .describe(
      "Normalized canonical feature name matching standard SaaS taxonomy (e.g. 'Single Sign-On (SSO)').",
    ),
  category: z
    .string()
    .default("General")
    .describe(
      "Standard category (e.g. 'Security', 'Integrations', 'Analytics', 'Workflow', 'Developer Tools').",
    ),
  support: FeatureSupportStatusSchema.describe(
    "Support status: YES (supported), PARTIAL (limited/add-on/tier-restricted), NO (explicitly not supported/lacking), or UNKNOWN (unclear).",
  ),
  shippingState: FeatureShippingStateSchema.default("shipped").describe(
    "Whether the feature is actively 'shipped', merely 'announced' (roadmap/beta/coming soon), or 'unknown'.",
  ),
  detail: z
    .string()
    .describe(
      "Specific factual notes, tier constraints, or scope limits regarding how the competitor supports this feature.",
    ),
  sourceUrl: z.string().url().describe("The URL where this feature claim was sourced from."),
  excerpt: z
    .string()
    .describe("Exact verbatim excerpt from the page copy or table proving this feature claim."),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .default(80)
    .describe("Extraction confidence score (0-100)."),
});
export type ExtractedFeatureItem = z.infer<typeof ExtractedFeatureItemSchema>;

export const CompetitorFeatureExtractionSchema = z.object({
  features: z
    .array(ExtractedFeatureItemSchema)
    .describe("List of extracted feature claims for this competitor."),
  summary: z
    .string()
    .default("")
    .describe("Brief overview of the competitor's primary functional strength and feature focus."),
  keyStrengths: z
    .array(z.string())
    .default([])
    .describe("Notable standout capabilities or unique features."),
  notableGaps: z
    .array(z.string())
    .default([])
    .describe("Explicitly absent or restricted capabilities mentioned in docs/checklists."),
});
export type CompetitorFeatureExtraction = z.infer<typeof CompetitorFeatureExtractionSchema>;

export const FeatureStageOutputSchema = z.object({
  targetId: z.string(),
  competitorsEvaluated: z.number(),
  featurePagesFound: z.number(),
  featurePagesRead: z.number(),
  taxonomyNodesCount: z.number(),
  claimsExtracted: z.number(),
  supportYesCount: z.number(),
  supportPartialCount: z.number(),
  supportNoCount: z.number(),
  supportUnknownCount: z.number(),
  warnings: z.array(z.string()).optional(),
});
export type FeatureStageOutput = z.infer<typeof FeatureStageOutputSchema>;
