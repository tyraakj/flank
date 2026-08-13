import { prisma } from '@flank/database';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 Client pointing to Cloudflare R2 if configured
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET || 'flank-snapshots';

export class ProviderCacheService {
  /**
   * Fetch a cached search result
   */
  async getSearchCache(cacheKey: string) {
    return prisma.providerCache.findUnique({
      where: { cacheKey }
    });
  }

  /**
   * Set a cached search result
   */
  async setSearchCache(cacheKey: string, provider: string, query: string, contentHash: string, metadata: any, ttlSeconds: number) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    
    await prisma.providerCache.upsert({
      where: { cacheKey },
      update: {
        contentHash,
        metadata,
        expiresAt
      },
      create: {
        cacheKey,
        provider,
        type: 'SEARCH',
        query,
        contentHash,
        metadata,
        expiresAt
      }
    });
  }

  /**
   * Get a cached page read, optionally fetching the HTML from R2
   */
  async getPageReadCache(cacheKey: string) {
    const cache = await prisma.providerCache.findUnique({
      where: { cacheKey }
    });

    if (!cache) return null;

    // The text is stored in metadata.text usually, or we can fetch HTML from R2 if needed
    // We leave R2 fetching explicit to avoid downloading large HTML unless necessary
    return cache;
  }

  /**
   * Store a page read cache in Postgres and optionally save HTML snapshot to R2
   */
  async setPageReadCache(
    cacheKey: string,
    provider: string,
    url: string,
    contentHash: string,
    text: string,
    html?: string,
    ttlSeconds?: number
  ) {
    const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;
    let snapshotKey: string | undefined = undefined;

    // Upload raw HTML to R2 if provided and credentials are valid
    if (html && process.env.R2_ACCESS_KEY_ID) {
      snapshotKey = `snapshots/${cacheKey}.html`;
      try {
        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: snapshotKey,
          Body: html,
          ContentType: 'text/html'
        }));
      } catch (err) {
        console.error('[ProviderCache] Failed to upload snapshot to R2:', err);
        snapshotKey = undefined;
      }
    }

    await prisma.providerCache.upsert({
      where: { cacheKey },
      update: {
        contentHash,
        snapshotKey,
        metadata: { text },
        expiresAt
      },
      create: {
        cacheKey,
        provider,
        type: 'PAGE_READ',
        url,
        contentHash,
        snapshotKey,
        metadata: { text },
        expiresAt
      }
    });
    
    return snapshotKey;
  }
}

export const providerCache = new ProviderCacheService();
