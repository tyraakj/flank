import { PageReader } from '../interfaces';
import { PageReadRequest, PageReadResult } from '@flank/shared';
import { chromium } from 'playwright';
import { isAllowedByRobots } from './robots';
import { providerMetrics } from '../metrics';
import * as crypto from 'crypto';
import * as cheerio from 'cheerio';

export class PlaywrightPageReader implements PageReader {
  readonly name = 'playwright-reader';

  async read(request: PageReadRequest): Promise<PageReadResult> {
    const startTime = Date.now();
    try {
      const allowed = await isAllowedByRobots(request.url);
      if (!allowed) {
        throw new Error(`Access denied by robots.txt for ${request.url}`);
      }

      // Launch headless browser
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: 'FlankBot/1.0',
        viewport: { width: 1280, height: 800 }
      });
      const page = await context.newPage();

      // Set a timeout of 15s to not hang forever
      page.setDefaultTimeout(15000);

      // Block unnecessary resources for speed and safety
      await page.route('**/*', (route) => {
        const type = route.request().resourceType();
        if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
          route.abort();
        } else {
          route.continue();
        }
      });

      await page.goto(request.url, { waitUntil: 'networkidle' });

      const html = await page.content();
      const title = await page.title();
      
      await browser.close();

      const $ = cheerio.load(html);
      
      // Remove unwanted elements
      $('script, style, noscript, iframe, img, svg, video').remove();
      
      const text = $('body').text().replace(/\s+/g, ' ').trim();
      const contentHash = crypto.createHash('sha256').update(text).digest('hex');

      const latencyMs = Date.now() - startTime;
      providerMetrics.recordPageRead(this.name, request.url, latencyMs, false, html.length);

      return {
        canonicalUrl: request.url,
        title: title || $('title').text().trim(),
        text,
        html,
        fetchedAt: new Date().toISOString(),
        contentHash,
        providerName: this.name,
        cached: false
      };
    } catch (err: any) {
      providerMetrics.recordError(this.name, `read(${request.url})`, err);
      throw err;
    }
  }
}
