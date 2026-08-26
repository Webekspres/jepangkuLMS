import { describe, expect, test } from 'bun:test';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { authEntryWithReturn, sanitizeInternalRedirectPath } from '@/lib/auth/oauth-urls';

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

describe('authEntryWithReturn', () => {
  test('appends safe redirect_url for student detail paths', () => {
    expect(authEntryWithReturn(AUTH_ROUTES.signIn, '/dashboard/kursus/n5')).toBe(
      '/sign-in?redirect_url=%2Fdashboard%2Fkursus%2Fn5',
    );
    expect(
      authEntryWithReturn(AUTH_ROUTES.signUp, '/dashboard/live-class/abc'),
    ).toBe('/sign-up?redirect_url=%2Fdashboard%2Flive-class%2Fabc');
    expect(authEntryWithReturn(AUTH_ROUTES.signIn, '/dashboard/tryout')).toBe(
      '/sign-in?redirect_url=%2Fdashboard%2Ftryout',
    );
  });

  test('falls back to bare entry when path is not allowlisted', () => {
    expect(authEntryWithReturn(AUTH_ROUTES.signUp, '/kursus/n5')).toBe('/sign-up');
    expect(authEntryWithReturn(AUTH_ROUTES.signIn, 'https://evil.com')).toBe('/sign-in');
  });
});
