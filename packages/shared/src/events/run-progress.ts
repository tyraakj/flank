import { z } from 'zod';

export const RunProgressEventTypeSchema = z.enum([
  'RUN_STATUS',
  'STAGE_TRANSITION',
  'STAGE_SUMMARY',
  'COMPETITOR_VERIFIED',
  'LOG_LINE',
  'PARTIAL_AVAILABLE',
  'RETRY',
  'FAILURE',
  'CANCELLATION',
  'HEARTBEAT'
]);

export type RunProgressEventType = z.infer<typeof RunProgressEventTypeSchema>;

export const RunProgressEventSchema = z.object({
  eventId: z.number(), // Monotonic ID (could be BigInt in Prisma, but we'll cast to Number for JSON)
  type: RunProgressEventTypeSchema,
  runId: z.string().cuid(),
  targetId: z.string().cuid(),
  
  stageKey: z.string().nullable().optional(),
  stageStatus: z.string().nullable().optional(), // Using string to avoid strict prisma dependency here
  
  timestamp: z.string().datetime(),
  summary: z.string(),
  elapsedMs: z.number().nullable().optional(),
  
  payload: z.record(z.any()).nullable().optional() // Safe structured payload
});

export type RunProgressEvent = z.infer<typeof RunProgressEventSchema>;
