import { PageReader } from "../interfaces";
import { PageReadRequest, PageReadResult } from "@flank/shared";
import * as cheerio from "cheerio";
import { isAllowedByRobots } from "./robots";
import { providerMetrics } from "../metrics";
import * as crypto from "crypto";

export class HttpPageReader implements PageReader {
  readonly name = "http-reader";

  async read(request: PageReadRequest): Promise<PageReadResult> {
    const startTime = Date.now();
    try {
      const allowed = await isAllowedByRobots(request.url);
      if (!allowed) {
        throw new Error(`Access denied by robots.txt for ${request.url}`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(request.url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "FlankBot/1.0",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      const $ = cheerio.load(html);

      // Remove unwanted elements
      $("script, style, noscript, iframe, img, svg, video").remove();

      const title = $("title").text().trim();
      const text = $("body").text().replace(/\s+/g, " ").trim();

      const contentHash = crypto.createHash("sha256").update(text).digest("hex");

      const latencyMs = Date.now() - startTime;
      providerMetrics.recordPageRead(this.name, request.url, latencyMs, false, html.length);

      return {
        canonicalUrl: request.url,
        title,
        text,
        html, // keep html for caching/snapshots
        fetchedAt: new Date().toISOString(),
        contentHash,
        providerName: this.name,
        cached: false,
      };
    } catch (err: unknown) {
      providerMetrics.recordError(this.name, `read(${request.url})`, err);
      throw err;
    }
  }
}
