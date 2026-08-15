import { SearchProvider } from "../interfaces";
import { SearchRequest, SearchResult, SearchResultItem } from "@flank/shared";
import * as cheerio from "cheerio";
import { providerMetrics } from "../metrics";

export class DuckDuckGoSearchProvider implements SearchProvider {
  readonly name = "duckduckgo-html";

  async search(request: SearchRequest): Promise<SearchResult> {
    const startTime = Date.now();
    try {
      const url = new URL("https://html.duckduckgo.com/html/");
      url.searchParams.set("q", request.query);

      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`DuckDuckGo returned ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const results: SearchResultItem[] = [];
      let rank = 1;

      $(".result").each((_, el) => {
        if (results.length >= request.limit) return false;

        const titleNode = $(el).find(".result__title .result__a");
        const snippetNode = $(el).find(".result__snippet");
        const urlNode = $(el).find(".result__url");

        const title = titleNode.text().trim();
        // DuckDuckGo redirects links through their own domain, so we need to parse the real URL
        // In html.duckduckgo.com, the href is usually something like //duckduckgo.com/l/?uddg=...
        // For simplicity, we can extract it from the display URL or parse the query param.
        const rawHref = titleNode.attr("href") || "";
        let realUrl = "";

        if (rawHref.includes("uddg=")) {
          const match = rawHref.match(/uddg=([^&]+)/);
          if (match && match[1]) {
            realUrl = decodeURIComponent(match[1]);
          }
        } else {
          // Fallback to text if possible, but DDG result__url text often truncates
          realUrl = `https://${urlNode.text().trim().replace(/ /g, "")}`;
        }

        const snippet = snippetNode.text().trim();

        if (title && realUrl && realUrl.startsWith("http")) {
          results.push({
            title,
            url: realUrl,
            snippet,
            rank: rank++,
            discoveredAt: new Date().toISOString(),
          });
        }
      });

      const latencyMs = Date.now() - startTime;
      providerMetrics.recordSearch(this.name, request.query, latencyMs, false);

      return {
        results,
        providerName: this.name,
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      providerMetrics.recordError(this.name, "search", error);
      throw error;
    }
  }
}
