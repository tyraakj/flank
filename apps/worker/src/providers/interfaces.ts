import {
  SearchRequest,
  SearchResult,
  PageReadRequest,
  PageReadResult,
  LlmRequest,
  LlmResult
} from '@flank/shared';

/**
 * Interface for Web Search providers (e.g. DuckDuckGo, Brave)
 */
export interface SearchProvider {
  /**
   * Unique name of the provider (e.g., 'duckduckgo-html', 'brave')
   */
  readonly name: string;

  /**
   * Perform a web search
   */
  search(request: SearchRequest): Promise<SearchResult>;
}

/**
 * Interface for Page Reading providers (e.g. HTTP fetch, Playwright)
 */
export interface PageReader {
  /**
   * Unique name of the reader (e.g., 'http-reader', 'playwright-reader')
   */
  readonly name: string;

  /**
   * Read and extract normalized content from a URL
   */
  read(request: PageReadRequest): Promise<PageReadResult>;
}

/**
 * Interface for LLM generation providers (e.g. Gemini, OpenAI)
 */
export interface LlmProvider {
  /**
   * Unique name of the provider (e.g., 'gemini-1.5-flash', 'gemini-1.5-pro')
   */
  readonly name: string;

  /**
   * Generate structured output from a prompt
   */
  generateStructured<T>(request: LlmRequest<T>): Promise<LlmResult>;
}
