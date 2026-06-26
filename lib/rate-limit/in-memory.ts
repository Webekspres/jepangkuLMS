export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // timestamp in ms when the window resets
}

export class InMemoryRateLimiter {
  private store = new Map<string, number[]>();
  private lastCleanup = Date.now();
  private cleanupIntervalMs = 60000; // 1 minute

  constructor(private defaultWindowMs: number = 60000) {}

  public async limit(key: string, limit: number, windowMs: number = this.defaultWindowMs): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Periodic cleanup of stale timestamps to prevent memory growth
    if (now - this.lastCleanup > this.cleanupIntervalMs) {
      this.cleanup(now);
    }

    let timestamps = this.store.get(key) || [];
    // Filter timestamps within the current window
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= limit) {
      const oldest = timestamps[0] || now;
      const reset = oldest + windowMs;
      return {
        success: false,
        limit,
        remaining: 0,
        reset,
      };
    }

    timestamps.push(now);
    this.store.set(key, timestamps);

    return {
      success: true,
      limit,
      remaining: limit - timestamps.length,
      reset: now + windowMs,
    };
  }

  private cleanup(now: number) {
    for (const [key, timestamps] of this.store.entries()) {
      // Keep timestamps that are within the last 1 hour max window
      const valid = timestamps.filter((t) => t > now - 3600000);
      if (valid.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, valid);
      }
    }
    this.lastCleanup = now;
  }
}

// Global instance for sharing memory across middleware imports
const globalForLimiter = globalThis as unknown as {
  inMemoryRateLimiter: InMemoryRateLimiter | undefined;
};

export const inMemoryRateLimiter =
  globalForLimiter.inMemoryRateLimiter ?? new InMemoryRateLimiter();

if (process.env.NODE_ENV !== 'production') {
  globalForLimiter.inMemoryRateLimiter = inMemoryRateLimiter;
}
