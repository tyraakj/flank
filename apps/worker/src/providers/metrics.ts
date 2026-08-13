/**
 * Simple metrics logging for providers.
 * Real observability (e.g. OpenTelemetry, PostHog, or custom dashboards) 
 * will be added in Unit 40: Observability and Eval Harness.
 */
export const providerMetrics = {
  recordSearch(provider: string, query: string, latencyMs: number, cached: boolean) {
    console.log(`[Metrics:Search] ${provider} | Query: "${query}" | Latency: ${latencyMs}ms | Cached: ${cached}`);
  },
  
  recordPageRead(provider: string, url: string, latencyMs: number, cached: boolean, sizeBytes?: number) {
    console.log(`[Metrics:PageRead] ${provider} | URL: ${url} | Latency: ${latencyMs}ms | Cached: ${cached} | Size: ${sizeBytes} bytes`);
  },

  recordLlmGeneration(provider: string, model: string, latencyMs: number, promptTokens: number, completionTokens: number) {
    console.log(`[Metrics:LLM] ${provider}:${model} | Latency: ${latencyMs}ms | Tokens (P/C/T): ${promptTokens}/${completionTokens}/${promptTokens + completionTokens}`);
  },

  recordError(provider: string, operation: string, error: Error) {
    console.error(`[Metrics:Error] ${provider} on ${operation} failed: ${error.message}`);
  }
};
