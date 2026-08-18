import { z } from "zod";

export const CompetitorTypeSchema = z.enum(["DIRECT", "INDIRECT", "SUBSTITUTE"]);
export type CompetitorType = z.infer<typeof CompetitorTypeSchema>;

export const VerificationResultSchema = z.object({
  canonicalDomain: z
    .string()
    .describe("The verified, canonical, registrable domain of the product (e.g. 'stripe.com')."),
  productName: z.string().describe("The clean official name of the verified product/service."),
  isRealProduct: z
    .boolean()
    .describe(
      "True if this is a genuine, active software product/service. False if it is a blog, review directory, aggregator, consultant, parked domain, or inactive site.",
    ),
  type: CompetitorTypeSchema.optional()
    .nullable()
    .describe(
      "Competitor relationship to the target: DIRECT (same ICP & core feature set), INDIRECT (same ICP or adjacent problem), or SUBSTITUTE (different approach solving the same core JTBD). Required if isRealProduct is true.",
    ),
  rationale: z
    .string()
    .describe(
      "Detailed justification explaining why this product is or is not a competitor, citing specific capabilities and market overlap.",
    ),
  duplicateOf: z
    .string()
    .nullable()
    .optional()
    .describe(
      "If this domain is an alias, rebrand, or subsidiary of another competitor in the set, specify its canonical domain here.",
    ),
  sourceNotes: z
    .string()
    .describe("Confidence notes or observations about the homepage content quality."),
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

export const VerifierStageOutputSchema = z.object({
  targetId: z.string(),
  candidatesEvaluated: z.number(),
  competitorsVerified: z.number(),
  candidatesRejected: z.number(),
  competitorsDirect: z.number(),
  competitorsIndirect: z.number(),
  competitorsSubstitute: z.number(),
  warnings: z.array(z.string()).optional(),
});
export type VerifierStageOutput = z.infer<typeof VerifierStageOutputSchema>;
