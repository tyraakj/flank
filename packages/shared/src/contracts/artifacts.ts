import { z } from "zod";

// The envelope stored in Stage.outputArtifact
export const ArtifactEnvelope = z.object({
  version: z.number().default(1),
  runId: z.string(),
  stageKey: z.string(),
  sourceStageIds: z.array(z.string()), // IDs of upstream stages this depended on
  generatedAt: z.string().datetime(),
  data: z.unknown(), // The actual artifact, validated by the specific stage
  storageKey: z.string().optional(), // If saved in R2 instead of postgres
  provenance: z
    .object({
      model: z.string().optional(),
      tokens: z.number().optional(),
      ms: z.number().optional(),
    })
    .optional(),
});

export type ArtifactEnvelopeData = z.infer<typeof ArtifactEnvelope>;
