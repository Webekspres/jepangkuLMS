import { describe, expect, test } from 'bun:test';
import { sanitizeInternalRedirectPath } from '@/lib/auth/oauth-urls';

const ORIGIN = 'https://kursus.jepangku.com';

describe('sanitizeInternalRedirectPath', () => {
  test('allows dashboard and admin paths with search', () => {
    expect(sanitizeInternalRedirectPath('/dashboard', ORIGIN)).toBe('/dashboard');
    expect(
      sanitizeInternalRedirectPath(
        '/dashboard/live-class/57277b2e-25ae-46a8-a406-8d45b32177cc',
        ORIGIN,
      ),
    ).toBe('/dashboard/live-class/57277b2e-25ae-46a8-a406-8d45b32177cc');
    expect(sanitizeInternalRedirectPath('/dashboard/kursus/n5?tab=silabus', ORIGIN)).toBe(
      '/dashboard/kursus/n5?tab=silabus',
    );
    expect(sanitizeInternalRedirectPath('/admin/badges', ORIGIN)).toBe('/admin/badges');
  });

  test('rejects external and protocol-relative URLs', () => {
    expect(sanitizeInternalRedirectPath('https://evil.com', ORIGIN)).toBeNull();
    expect(sanitizeInternalRedirectPath('https://evil.com/dashboard', ORIGIN)).toBeNull();
    expect(sanitizeInternalRedirectPath('//evil.com', ORIGIN)).toBeNull();
    expect(sanitizeInternalRedirectPath('//evil.com/dashboard', ORIGIN)).toBeNull();
    expect(sanitizeInternalRedirectPath('javascript:alert(1)', ORIGIN)).toBeNull();
  });

  test('rejects auth loops and non-allowlisted paths', () => {
    expect(sanitizeInternalRedirectPath('/sign-in', ORIGIN)).toBeNull();
    expect(sanitizeInternalRedirectPath('/sign-up/sso-callback', ORIGIN)).toBeNull();
    expect(sanitizeInternalRedirectPath('/auth/sso-callback', ORIGIN)).toBeNull();
    expect(sanitizeInternalRedirectPath('/auth/complete', ORIGIN)).toBeNull();
    expect(sanitizeInternalRedirectPath('/kursus', ORIGIN)).toBeNull();
    expect(sanitizeInternalRedirectPath('/', ORIGIN)).toBeNull();
  });

  test('rejects empty and malformed input', () => {
    expect(sanitizeInternalRedirectPath(null, ORIGIN)).toBeNull();
    expect(sanitizeInternalRedirectPath('', ORIGIN)).toBeNull();
    expect(sanitizeInternalRedirectPath('dashboard', ORIGIN)).toBeNull();
    expect(sanitizeInternalRedirectPath('\\/dashboard', ORIGIN)).toBeNull();
  });
});
