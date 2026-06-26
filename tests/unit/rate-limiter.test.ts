import { describe, expect, test, mock } from 'bun:test';
import { InMemoryRateLimiter } from '@/lib/rate-limit/in-memory';

describe('InMemoryRateLimiter', () => {
  test('permits requests under the limit', async () => {
    const limiter = new InMemoryRateLimiter();
    const key = 'test-client-1';
    
    const res1 = await limiter.limit(key, 3, 5000);
    expect(res1.success).toBe(true);
    expect(res1.limit).toBe(3);
    expect(res1.remaining).toBe(2);
    
    const res2 = await limiter.limit(key, 3, 5000);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = await limiter.limit(key, 3, 5000);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  test('blocks requests exceeding the limit', async () => {
    const limiter = new InMemoryRateLimiter();
    const key = 'test-client-2';

    // Consume all tokens
    await limiter.limit(key, 2, 5000);
    await limiter.limit(key, 2, 5000);

    // Over the limit
    const res = await limiter.limit(key, 2, 5000);
    expect(res.success).toBe(false);
    expect(res.remaining).toBe(0);
    expect(res.reset).toBeGreaterThan(Date.now());
  });

  test('resets after the window expires', async () => {
    const limiter = new InMemoryRateLimiter();
    const key = 'test-client-3';

    // Set a very short window (10ms)
    const windowMs = 10;
    
    const res1 = await limiter.limit(key, 1, windowMs);
    expect(res1.success).toBe(true);

    const res2 = await limiter.limit(key, 1, windowMs);
    expect(res2.success).toBe(false); // blocked

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, windowMs + 5));

    const res3 = await limiter.limit(key, 1, windowMs);
    expect(res3.success).toBe(true); // allowed again!
  });

  test('maintains separate limits for different keys', async () => {
    const limiter = new InMemoryRateLimiter();
    const key1 = 'client-a';
    const key2 = 'client-b';

    await limiter.limit(key1, 1, 5000);
    
    // key1 is now blocked
    const res1 = await limiter.limit(key1, 1, 5000);
    expect(res1.success).toBe(false);

    // key2 is not blocked
    const res2 = await limiter.limit(key2, 1, 5000);
    expect(res2.success).toBe(true);
  });
});
