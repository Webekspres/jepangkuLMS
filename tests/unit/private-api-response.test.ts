import { describe, expect, test } from 'bun:test';
import { privateApiJson, PRIVATE_API_CACHE_CONTROL } from '@/lib/api/private-response';

describe('privateApiJson', () => {
  test('sets no-store cache headers for authenticated API responses', () => {
    const response = privateApiJson({ ok: true });
    expect(response.headers.get('Cache-Control')).toBe(PRIVATE_API_CACHE_CONTROL);
    expect(response.headers.get('Vary')).toBe('Cookie');
  });

  test('preserves error status codes', () => {
    const response = privateApiJson({ error: 'Unauthorized' }, { status: 401 });
    expect(response.status).toBe(401);
  });
});
