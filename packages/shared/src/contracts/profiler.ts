import { z } from "zod";

export const TargetProfileSchema = z.object({
  category: z
    .string()
    .describe(
      "The primary category or market the product belongs to. (e.g. 'CRM', 'Email Marketing') Use 'unknown' if not apparent.",
    ),
  icp: z
    .string()
    .describe(
      "Ideal Customer Profile. A description of the target audience or customer. Use 'unknown' if not apparent.",
    ),
  pricingModel: z
    .string()
    .describe(
      "The pricing model (e.g. 'Freemium', 'Per Seat', 'Usage-based', 'Open Source'). Use 'unknown' if not apparent.",
    ),
  valueProps: z
    .array(z.string())
    .max(5)
    .describe("Key value propositions offered by the product. Max 5. Keep them concise."),
  jobsToBeDone: z
    .array(z.string())
    .max(5)
    .describe("The main Jobs-To-Be-Done that the product solves for its users. Max 5."),
  seedKeywords: z
    .array(z.string())
    .max(10)
    .describe(
      "Seed keywords relevant to this product for discovering competitors or related topics. Max 10.",
    ),
  detectedLanguage: z
    .string()
    .describe("The detected language of the website (e.g. 'en', 'es', 'fr')."),
  sourceNotes: z
    .string()
    .describe(
      "Any important notes about the source material, confidence in the extraction, or missing information.",
    ),
});

export type TargetProfileData = z.infer<typeof TargetProfileSchema>;
