import { describe, expect, it } from 'bun:test';
import {
  isIgnorableMediaError,
  safeMediaOperation,
} from '@/lib/vidstack/safe-media-operation';

describe('safe-media-operation', () => {
  it('ignores provider destroyed rejections', () => {
    expect(isIgnorableMediaError('provider destroyed')).toBe(true);
    expect(isIgnorableMediaError(new Error('provider destroyed'))).toBe(true);
  });

  it('ignores AbortError', () => {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    expect(isIgnorableMediaError(error)).toBe(true);
  });

  it('swallows provider destroyed in safeMediaOperation', async () => {
    await expect(
      safeMediaOperation(async () => {
        throw 'provider destroyed';
      }),
    ).resolves.toBeUndefined();
  });

  it('rethrows unexpected errors to console only', async () => {
    const original = console.error;
    let logged: unknown;
    console.error = (...args: unknown[]) => {
      logged = args[0];
    };

    await safeMediaOperation(async () => {
      throw new Error('Network failed');
    });

    console.error = original;
    expect(logged).toBe('Media operation failed:');
  });
});
