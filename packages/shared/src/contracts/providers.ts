import { z } from 'zod';

// ============================================================================
// Search Contracts
// ============================================================================

export const SearchResultItemSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  snippet: z.string().optional(),
  rank: z.number(),
  discoveredAt: z.string().datetime().optional()
});
export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;

export const SearchResultSchema = z.object({
  results: z.array(SearchResultItemSchema),
  providerName: z.string(),
  requestId: z.string().optional(),
  cached: z.boolean(),
  fetchedAt: z.string().datetime(),
  warnings: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

export const SearchRequestSchema = z.object({
  query: z.string(),
  limit: z.number().default(10),
  fresh: z.boolean().default(false)
});
export type SearchRequest = z.infer<typeof SearchRequestSchema>;

// ============================================================================
// Page Reader Contracts
// ============================================================================

export const PageReadResultSchema = z.object({
  canonicalUrl: z.string().url(),
  title: z.string().optional(),
  text: z.string(),
  html: z.string().optional(), // Raw HTML if needed for deeper parsing
  fetchedAt: z.string().datetime(),
  contentHash: z.string(),
  snapshotKey: z.string().optional(), // R2 key
  providerName: z.string(),
  cached: z.boolean(),
  metadata: z.record(z.any()).optional()
});
export type PageReadResult = z.infer<typeof PageReadResultSchema>;

export const PageReadRequestSchema = z.object({
  url: z.string().url(),
  mode: z.enum(['http', 'browser', 'auto']).default('auto'),
  fresh: z.boolean().default(false)
});
export type PageReadRequest = z.infer<typeof PageReadRequestSchema>;

// ============================================================================
// LLM Contracts
// ============================================================================

export const LlmResultSchema = z.object({
  data: z.any(), // The structured object
  providerName: z.string(),
  model: z.string(),
  tokens: z.object({
    prompt: z.number(),
    completion: z.number(),
    total: z.number()
  }).optional(),
  latencyMs: z.number(),
  warnings: z.array(z.string()).optional()
});
export type LlmResult = z.infer<typeof LlmResultSchema>;

export interface LlmRequest<T> {
  system?: string;
  prompt: string;
  schema: z.ZodType<T>;
  schemaName: string;
  schemaDescription?: string;
  temperature?: number;
  maxTokens?: number;
  fallback?: T; // Deterministic fallback if parsing/generation fails completely
}
