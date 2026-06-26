import { type RateLimitResult } from "./in-memory";

export class RedisRateLimiter {
  private client: any = null;
  private status: "disconnected" | "connected" | "unavailable" = "disconnected";

  constructor(
    private redisUrl: string,
    private prefix: string = "jepangku:lms:rl:"
  ) {
    this.init();
  }

  private async init() {
    if (process.env.REDIS_ENABLED !== "true") {
      this.status = "unavailable";
      return;
    }

    try {
      const { RedisClient } = await import("bun");
      this.client = new RedisClient(this.redisUrl, {
        enableAutoPipelining: true,
        autoReconnect: true,
      });
      await this.client.ping();
      this.status = "connected";
    } catch (error) {
      this.status = "unavailable";
      console.warn("[redis-ratelimit] Redis initialization failed, using fallback:", error);
    }
  }

  public getStatus() {
    return this.status;
  }

  public async limit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    if (this.status !== "connected" || !this.client) {
      throw new Error("Redis client is not available");
    }

    const fullKey = `${this.prefix}${key}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      await this.client.zremrangebyscore(fullKey, 0, windowStart);
      const member = `${now}-${Math.random().toString(36).substring(2, 7)}`;
      await this.client.zadd(fullKey, now, member);
      const count = await this.client.zcard(fullKey);
      await this.client.expire(fullKey, Math.ceil(windowMs / 1000));

      if (count > limit) {
        const range = await this.client.zrange(fullKey, 0, 0, "WITHSCORES");
        let reset = now + windowMs;
        if (range && range.length > 1) {
          const oldestScore = parseFloat(range[1]);
          if (!isNaN(oldestScore)) {
            reset = oldestScore + windowMs;
          }
        }

        return {
          success: false,
          limit,
          remaining: 0,
          reset,
        };
      }

      return {
        success: true,
        limit,
        remaining: limit - count,
        reset: now + windowMs,
      };
    } catch (err) {
      this.status = "unavailable";
      console.error("[redis-ratelimit] Redis operation failed, marking as unavailable:", err);
      throw err;
    }
  }
}
