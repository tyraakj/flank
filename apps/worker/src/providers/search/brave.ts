import { SearchProvider } from "../interfaces";
import { SearchRequest, SearchResult, SearchResultItem } from "@flank/shared";
import { providerMetrics } from "../metrics";

export class BraveSearchProvider implements SearchProvider {
  readonly name = "brave-search";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(request: SearchRequest): Promise<SearchResult> {
    const startTime = Date.now();
    try {
      const url = new URL("https://api.search.brave.com/res/v1/web/search");
      url.searchParams.set("q", request.query);
      url.searchParams.set("count", Math.min(request.limit, 20).toString());

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Brave Search returned ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      const results: SearchResultItem[] = (data.web?.results || []).map(
        (res: unknown, index: number) => ({
          title: (res as any).title,
          url: (res as any).url,
          snippet: (res as any).description,
          rank: index + 1,
          discoveredAt: new Date().toISOString(),
        }),
      );

      const latencyMs = Date.now() - startTime;
      providerMetrics.recordSearch(this.name, request.query, latencyMs, false);

      return {
        results,
        providerName: this.name,
        requestId: data.query?.query_id || "",
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      providerMetrics.recordError(this.name, "search", err);
      throw err;
    }
  }
}
