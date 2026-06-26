import { inMemoryRateLimiter, type RateLimitResult } from "./in-memory";
import { RedisRateLimiter } from "./redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const prefix = process.env.REDIS_KEY_PREFIX || "jepangku:lms:rl:";

let redisRateLimiter: RedisRateLimiter | null = null;

function getRedisRateLimiter(): RedisRateLimiter | null {
  if (process.env.REDIS_ENABLED !== "true") {
    return null;
  }
  if (!redisRateLimiter) {
    redisRateLimiter = new RedisRateLimiter(redisUrl, prefix);
  }
  return redisRateLimiter;
}

/**
 * Unified rate limit check for API Routes and Server Actions.
 * Attempts to use Redis when enabled, falling back to in-memory rate limiting.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redisLimiter = getRedisRateLimiter();
  
  if (redisLimiter && redisLimiter.getStatus() === "connected") {
    try {
      return await redisLimiter.limit(key, limit, windowMs);
    } catch {
      // Fallback on Redis error
    }
  }

  return inMemoryRateLimiter.limit(key, limit, windowMs);
}

export type { RateLimitResult };
export { inMemoryRateLimiter };
export { RedisRateLimiter };
