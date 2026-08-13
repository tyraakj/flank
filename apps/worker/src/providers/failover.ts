import { SearchProvider, PageReader } from './interfaces';
import { SearchRequest, SearchResult, PageReadRequest, PageReadResult } from '@flank/shared';

export class FailoverSearchProvider implements SearchProvider {
  readonly name = 'failover-search';

  constructor(
    private primary: SearchProvider,
    private fallback: SearchProvider
  ) {}

  async search(request: SearchRequest): Promise<SearchResult> {
    try {
      return await this.primary.search(request);
    } catch (err: any) {
      console.warn(`[Failover] Primary search (${this.primary.name}) failed. Failing over to ${this.fallback.name}. Error: ${err.message}`);
      const result = await this.fallback.search(request);
      result.warnings = result.warnings || [];
      result.warnings.push(`Primary provider failed, used fallback: ${this.fallback.name}`);
      return result;
    }
  }
}

export class FailoverPageReader implements PageReader {
  readonly name = 'failover-reader';

  constructor(
    private primary: PageReader,
    private fallback: PageReader
  ) {}

  async read(request: PageReadRequest): Promise<PageReadResult> {
    try {
      return await this.primary.read(request);
    } catch (err: any) {
      console.warn(`[Failover] Primary reader (${this.primary.name}) failed. Failing over to ${this.fallback.name}. Error: ${err.message}`);
      const result = await this.fallback.read(request);
      // We don't have a warnings field on PageReadResult yet, but we could add it
      return result;
    }
  }
}
