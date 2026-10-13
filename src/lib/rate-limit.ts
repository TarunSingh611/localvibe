import { getDatabase } from './mongodb';
import { ApiError } from './api';

interface RateLimitRule {
  key: string;
  limit: number;
  windowSeconds: number;
}

/**
 * Fixed-window rate limiter backed by MongoDB so limits hold across
 * serverless instances. Expired windows are removed by a TTL index.
 */
export async function rateLimit({ key, limit, windowSeconds }: RateLimitRule): Promise<void> {
  const db = await getDatabase();
  const windowStart = Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds;
  const id = `${key}:${windowStart}`;

  const result = await db.collection<{ _id: string; count: number; expiresAt: Date }>('rateLimits').findOneAndUpdate(
    { _id: id },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((windowStart + windowSeconds) * 1000) },
    },
    { upsert: true, returnDocument: 'after' }
  );

  if (result && result.count > limit) {
    throw new ApiError(429, 'You are doing that too often. Please slow down and try again shortly.');
  }
}
