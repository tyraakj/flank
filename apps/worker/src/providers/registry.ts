import { SearchProvider, PageReader, LlmProvider } from './interfaces';

import { DuckDuckGoSearchProvider } from './search/duckduckgo';
import { BraveSearchProvider } from './search/brave';
import { HttpPageReader } from './reader/http';
import { PlaywrightPageReader } from './reader/playwright';
import { GeminiLlmProvider } from './llm/gemini';
import { FailoverSearchProvider, FailoverPageReader } from './failover';

class ProviderRegistry {
  private searchProvider: SearchProvider | null = null;
  private httpReader: PageReader | null = null;
  private browserReader: PageReader | null = null;
  private llmProvider: LlmProvider | null = null;

  getSearchProvider(): SearchProvider {
    if (!this.searchProvider) {
      const duckduckgo = new DuckDuckGoSearchProvider();
      const braveApiKey = process.env.BRAVE_API_KEY;
      
      if (braveApiKey) {
        const brave = new BraveSearchProvider(braveApiKey);
        this.searchProvider = new FailoverSearchProvider(brave, duckduckgo);
      } else {
        this.searchProvider = duckduckgo;
      }
    }
    return this.searchProvider;
  }

  getHttpReader(): PageReader {
    if (!this.httpReader) {
      this.httpReader = new HttpPageReader();
    }
    return this.httpReader;
  }

  getBrowserReader(): PageReader {
    if (!this.browserReader) {
      this.browserReader = new PlaywrightPageReader();
    }
    return this.browserReader;
  }

  getLlmProvider(): LlmProvider {
    if (!this.llmProvider) {
      this.llmProvider = new GeminiLlmProvider();
    }
    return this.llmProvider;
  }
}

export const registry = new ProviderRegistry();
