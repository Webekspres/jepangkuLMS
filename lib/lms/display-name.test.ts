import { describe, expect, test } from 'bun:test';
import { resolvePublicDisplayName } from '@/lib/lms/display-name';

describe('resolvePublicDisplayName', () => {
  test('prefers LMS display name', () => {
    expect(
      resolvePublicDisplayName({
        displayName: 'Kenji',
        ssoDisplayName: 'Google User',
        email: 'a@b.com',
      }),
    ).toBe('Kenji');
  });

  test('falls back to SSO name', () => {
    expect(
      resolvePublicDisplayName({
        displayName: null,
        ssoDisplayName: 'Kriss',
        email: 'tester@mail.com',
      }),
    ).toBe('Kriss');
  });

  test('falls back to email prefix', () => {
    expect(
      resolvePublicDisplayName({
        displayName: null,
        ssoDisplayName: null,
        email: 'tester@mail.com',
      }),
    ).toBe('tester');
  });
});
