import { z } from "zod";

export const GateStatusSchema = z.enum(["PASS", "WARNING", "REJECT", "BLOCKED"]);
export type GateStatus = z.infer<typeof GateStatusSchema>;

export const QualityStageKeySchema = z.enum([
  "PROFILER",
  "DISCOVERY",
  "SEMANTIC_DEDUP",
  "VERIFIER",
  "PRICING",
  "FEATURE",
  "POSITIONING",
  "STRATEGIST",
  "CRITIC",
]);
export type QualityStageKey = z.infer<typeof QualityStageKeySchema>;

export const StageQualityScoreSchema = z.object({
  stageKey: QualityStageKeySchema,
  completeness: z.number().min(0).max(100).describe("Percentage of required artifact fields and coverage present (0-100)."),
  sourcing: z.number().min(0).max(100).describe("Percentage of assertions backed by auditable evidence rows, quotes, and URLs (0-100)."),
  plausibility: z.number().min(0).max(100).describe("Coherence and boundary validity of values, intervals, coordinates, and scopes (0-100)."),
  contradictionCount: z.number().int().min(0).default(0).describe("Count of direct contradictions found in this stage."),
  status: GateStatusSchema,
  issues: z.array(z.string()).default([]),
});
export type StageQualityScore = z.infer<typeof StageQualityScoreSchema>;

export const RetryDirectiveSchema = z.object({
  targetStage: QualityStageKeySchema.describe("The earliest responsible stage that must be re-run to fix the root quality issue."),
  reason: z.string().describe("Plain-language explanation of why this stage must be re-evaluated."),
  failedChecks: z.array(z.string()).describe("List of deterministic checks that failed."),
  retryBudgetRemaining: z.number().int().min(0).default(1).describe("Remaining retry budget for this stage in this run."),
  isRetryable: z.boolean().default(true).describe("Whether the stage can be safely retried within budget limits."),
});
export type RetryDirective = z.infer<typeof RetryDirectiveSchema>;

export const QualityReportDataSchema = z.object({
  runId: z.string(),
  score: z.number().min(0).max(100).describe("Overall composite quality score across all stages."),
  completeness: z.number().min(0).max(100),
  sourcing: z.number().min(0).max(100),
  plausibility: z.number().min(0).max(100),
  overallStatus: GateStatusSchema,
  canPublish: z.boolean().describe("Hard publication gate: true if all essential gates pass and no blocking contradictions remain."),
  isPartialReportAllowed: z.boolean().describe("Whether a partial report is allowed when non-blocking stages fail."),
  blockingReasons: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  stageScores: z.array(StageQualityScoreSchema),
  retryDirective: RetryDirectiveSchema.nullable().default(null),
  rulesVersion: z.string().default("1.0.0"),
});
export type QualityReportData = z.infer<typeof QualityReportDataSchema>;

export const CriticStageOutputSchema = z.object({
  targetId: z.string(),
  qualityScore: z.number(),
  overallStatus: GateStatusSchema,
  canPublish: z.boolean(),
  rerunStage: QualityStageKeySchema.nullable(),
  blockingIssuesCount: z.number(),
  warningsCount: z.number(),
  rulesVersion: z.string(),
});
export type CriticStageOutput = z.infer<typeof CriticStageOutputSchema>;
