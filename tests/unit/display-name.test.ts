import { describe, expect, test } from 'bun:test';
import {
  isGenericLmsDisplayName,
  resolvePublicDisplayName,
} from '@/lib/lms/display-name';

describe('isGenericLmsDisplayName', () => {
  test('detects placeholder variants', () => {
    expect(isGenericLmsDisplayName('Siswa JepangKu')).toBe(true);
    expect(isGenericLmsDisplayName('siswa jepangku')).toBe(true);
    expect(isGenericLmsDisplayName('Siswa_JepangKu')).toBe(true);
  });

  test('allows real names', () => {
    expect(isGenericLmsDisplayName('Winata')).toBe(false);
    expect(isGenericLmsDisplayName('Kenji Tanaka')).toBe(false);
  });
});

describe('resolvePublicDisplayName', () => {
  test('skips generic local name and uses SSO', () => {
    expect(
      resolvePublicDisplayName({
        displayName: 'Siswa JepangKu',
        ssoDisplayName: 'Winata Pratama',
      }),
    ).toBe('Winata Pratama');
  });

  test('prefers custom local name over SSO', () => {
    expect(
      resolvePublicDisplayName({
        displayName: 'Kenji',
        ssoDisplayName: 'Winata Pratama',
      }),
    ).toBe('Kenji');
  });

  test('falls back to email prefix before generic label', () => {
    expect(
      resolvePublicDisplayName({
        displayName: null,
        ssoDisplayName: null,
        email: 'winata@gmail.com',
      }),
    ).toBe('winata');
  });
});
