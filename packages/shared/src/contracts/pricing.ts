import { z } from "zod";

export const PlanBandSchema = z.enum(["FREE", "GROWTH", "ENTERPRISE", "CUSTOM"]);
export type PlanBand = z.infer<typeof PlanBandSchema>;

export const BillingIntervalSchema = z.enum(["MONTHLY", "YEARLY", "ONE_TIME"]);
export type BillingInterval = z.infer<typeof BillingIntervalSchema>;

export const PricingAvailabilitySchema = z.enum([
  "published",
  "contact-sales",
  "free",
  "trial",
  "regional",
  "not-published",
]);
export type PricingAvailability = z.infer<typeof PricingAvailabilitySchema>;

export const PricingPlanSchema = z.object({
  name: z
    .string()
    .describe("Verbatim official plan label (e.g., 'Starter', 'Pro', 'Enterprise', 'Free')."),
  band: PlanBandSchema.describe(
    "Standardized plan tier category: FREE, GROWTH, ENTERPRISE, or CUSTOM.",
  ),
  amount: z
    .number()
    .nullable()
    .describe(
      "Exact numeric price value per unit/seat. Null if contact sales or unpublished. Never infer amounts from discounts or ranges.",
    ),
  currency: z
    .string()
    .default("USD")
    .describe(
      "Standard ISO currency code (e.g., 'USD', 'INR', 'EUR', 'GBP'). Required if amount is numeric.",
    ),
  interval: BillingIntervalSchema.describe(
    "Billing cadence: MONTHLY, YEARLY, or ONE_TIME. Required if amount is numeric.",
  ),
  seatModel: z
    .string()
    .default("unknown")
    .describe(
      "Monetization unit (e.g., 'per user/month', 'per seat/mo', 'flat rate', 'consumption/credits', 'unlimited', 'unknown').",
    ),
  usageLimits: z
    .array(z.string())
    .default([])
    .describe(
      "Extracted usage quotas or limits (e.g. ['Up to 5 users', '10,000 API calls/month', '100 GB storage']).",
    ),
  includedFeatures: z
    .array(z.string())
    .default([])
    .describe("Key features and capabilities explicitly included in this tier."),
  addOns: z
    .array(z.string())
    .default([])
    .describe("Optional paid add-ons, modules, or extra capacity options mentioned for this plan."),
  availability: PricingAvailabilitySchema.describe(
    "Public availability status: published, contact-sales, free, trial, regional, or not-published.",
  ),
  sourceUrl: z
    .string()
    .url()
    .describe("Canonical URL of the pricing page or source where this tier was found."),
  rawPriceString: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Verbatim price string as displayed on the page (e.g., '$49/mo billed annually', 'Custom quote').",
    ),
  excerpt: z
    .string()
    .describe(
      "Exact verbatim excerpt from the pricing table, card, or prose for auditable evidence.",
    ),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .default(80)
    .describe("Deterministic extraction confidence score (0-100)."),
});
export type PricingPlanData = z.infer<typeof PricingPlanSchema>;

export const CompetitorPricingExtractionSchema = z.object({
  plans: z.array(PricingPlanSchema).describe("List of extracted pricing tiers and plans."),
  availabilitySummary: z
    .enum([
      "published",
      "contact-sales",
      "free-only",
      "trial-only",
      "not-published",
      "inaccessible",
    ])
    .describe("Overall pricing availability posture for this competitor."),
  pricingModelType: z
    .string()
    .describe(
      "High-level pricing architecture (e.g., 'Tiered Per-Seat Subscription', 'Freemium', 'Usage-Based', 'Enterprise Quote Only').",
    ),
  trialAvailable: z.boolean().default(false).describe("Whether a free trial is offered."),
  trialDays: z
    .number()
    .nullable()
    .optional()
    .describe("Length of free trial in days if explicitly stated (e.g. 14, 30). Null otherwise."),
  notes: z
    .string()
    .default("")
    .describe("Analytical notes on pricing structure, billing terms, discounts, or caveats."),
});
export type CompetitorPricingExtraction = z.infer<typeof CompetitorPricingExtractionSchema>;

export const PricingStageOutputSchema = z.object({
  targetId: z.string(),
  competitorsEvaluated: z.number(),
  pricingPagesFound: z.number(),
  pricingPagesRead: z.number(),
  plansExtracted: z.number(),
  unavailablePricingCount: z.number(),
  competitorsDirectWithPricing: z.number(),
  warnings: z.array(z.string()).optional(),
});
export type PricingStageOutput = z.infer<typeof PricingStageOutputSchema>;
