import { z } from "zod";
// We do not import directly from @flank/database here to avoid tightly coupling shared to the DB in a way that breaks client boundary if not careful, but we can import enums.
import { _EvidenceClaimType } from "@flank/database";

export type ApiResponse<T> =
  | { data: T; meta?: Record<string, unknown> }
  | { error: { code: string; message: string; fields?: Record<string, unknown> } };

// Path Parameters
export const WorkspaceSlugParam = z.object({
  workspaceSlug: z.string(),
});

export const TargetRunParams = z.object({
  targetId: z.string(),
  runId: z.string(),
});

export const TargetParams = z.object({
  targetId: z.string(),
});

// Requests
export const CreateTargetRequest = z.object({
  url: z.string().url(),
  context: z.string().optional(),
  knownCompetitors: z.array(z.string()).optional(),
  targetMarket: z.string().optional(),
  careAbout: z.string().optional(),
});

export const UpdateTargetProfileRequest = z.object({
  correctedJson: z.record(z.any()),
});

export const ReclassifyCompetitorRequest = z.object({
  type: z.enum(["DIRECT", "INDIRECT", "ASPIRATIONAL", "IRRELEVANT"]),
  pinned: z.boolean().optional(),
});

export const DismissOpportunityRequest = z.object({
  reason: z.string().min(1),
});
