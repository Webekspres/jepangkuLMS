import { describe, expect, it } from 'bun:test';
import { getRolesFromClaims } from '@/lib/core/jwt-claims';
import { validateLmsDisplayName } from '@/lib/lms/user-profile';

describe('jwt-claims roles (Core v2.1+)', () => {
  it('reads rolesInContext first', () => {
    const roles = getRolesFromClaims({
      sub: 'user_1',
      jepangku: {
        rolesInContext: ['SISWA'],
        roles: { byApplication: { LMS: ['LMS_ADMIN'] } },
      },
    });
    expect(roles).toEqual(['SISWA']);
  });

  it('falls back to byApplication.LMS', () => {
    const roles = getRolesFromClaims({
      sub: 'user_1',
      jepangku: {
        roles: { byApplication: { LMS: ['LMS_ADMIN'] } },
      },
    });
    expect(roles).toEqual(['LMS_ADMIN']);
  });
});

describe('validateLmsDisplayName', () => {
  it('accepts valid names', () => {
    expect(validateLmsDisplayName('Kenji Tanaka')).toBeNull();
    expect(validateLmsDisplayName('Kris_99')).toBeNull();
  });

  it('rejects too short names', () => {
    expect(validateLmsDisplayName('K')).not.toBeNull();
  });
});
