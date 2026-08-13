import { z } from 'zod';

export const BaseJobPayload = z.object({
  runId: z.string(),
  stageKey: z.string().optional(),
  requestedBy: z.string().optional(),
  idempotencyKey: z.string(),
  version: z.number().default(1),
});

export const RunExecutePayload = BaseJobPayload.extend({
  targetId: z.string(),
});

export const StageExecutePayload = BaseJobPayload.extend({});
export const StageReplayPayload = BaseJobPayload.extend({
  reason: z.string().optional(),
});

export const RunCancelPayload = BaseJobPayload.extend({});

export const DeadLetterReviewPayload = BaseJobPayload.extend({
  failedJobName: z.string(),
  failedJobId: z.string(),
  error: z.string(),
});

export type RunExecuteJob = z.infer<typeof RunExecutePayload>;
export type StageExecuteJob = z.infer<typeof StageExecutePayload>;
export type StageReplayJob = z.infer<typeof StageReplayPayload>;
export type RunCancelJob = z.infer<typeof RunCancelPayload>;
export type DeadLetterReviewJob = z.infer<typeof DeadLetterReviewPayload>;
