import { describe, expect, it } from 'bun:test';
import {
  canAccessLmsAdminPanel,
  DEFAULT_LMS_ROLE,
  hasLmsAdminAccess,
  isDevAdminBypassEnabled,
  LMS_ADMIN_ROLES,
  resolveInitialLmsRole,
} from '@/lib/auth/lms-roles';
import { buildLmsIdempotencyKey, toCoreActivityType } from '@/lib/core/activity-map';

describe('lms-roles', () => {
  it('dev bypass is off outside development', () => {
    const prevNodeEnv = process.env.NODE_ENV;
    const prevBypass = process.env.LMS_DEV_ADMIN_BYPASS;
    process.env.NODE_ENV = 'production';
    process.env.LMS_DEV_ADMIN_BYPASS = 'true';
    expect(isDevAdminBypassEnabled()).toBe(false);
    process.env.NODE_ENV = prevNodeEnv;
    process.env.LMS_DEV_ADMIN_BYPASS = prevBypass;
  });

  it('grants admin for LMS_ADMIN and CORE_ADMIN', () => {
    expect(hasLmsAdminAccess(['SISWA', 'LMS_ADMIN'])).toBe(true);
    expect(hasLmsAdminAccess(['STUDENT', 'LMS_ADMIN'])).toBe(true);
    expect(hasLmsAdminAccess(['CORE_ADMIN'])).toBe(true);
    expect(hasLmsAdminAccess(['SISWA'])).toBe(false);
    expect(LMS_ADMIN_ROLES).toContain('LMS_ADMIN');
  });

  it('canAccessLmsAdminPanel respects roles when bypass is off', () => {
    const prevBypass = process.env.LMS_DEV_ADMIN_BYPASS;
    process.env.LMS_DEV_ADMIN_BYPASS = 'false';
    expect(canAccessLmsAdminPanel(['LMS_ADMIN'])).toBe(true);
    expect(canAccessLmsAdminPanel(['SISWA'])).toBe(false);
    process.env.LMS_DEV_ADMIN_BYPASS = prevBypass;
  });

  it('defaults new users to LMS_STUDENT role', () => {
    expect(DEFAULT_LMS_ROLE).toBe('LMS_STUDENT');
    expect(resolveInitialLmsRole('user_any')).toBe('LMS_STUDENT');
  });

  it('bootstrap admin env promotes only designated Clerk user id', () => {
    const prev = process.env.LMS_BOOTSTRAP_ADMIN_USER_ID;
    process.env.LMS_BOOTSTRAP_ADMIN_USER_ID = 'user_bootstrap_admin';
    expect(resolveInitialLmsRole('user_bootstrap_admin')).toBe('LMS_ADMIN');
    expect(resolveInitialLmsRole('user_regular')).toBe('LMS_STUDENT');
    process.env.LMS_BOOTSTRAP_ADMIN_USER_ID = prev;
  });
});

describe('activity-map', () => {
  it('maps lesson and quiz to Core codes', () => {
    expect(toCoreActivityType('lesson_complete')).toBe('COMPLETED_LESSON');
    expect(toCoreActivityType('quiz_complete')).toBe('COMPLETED_QUIZ');
  });

  it('builds stable idempotency keys', () => {
    const key = buildLmsIdempotencyKey('lesson_complete', 'user_abc', 'lesson-1');
    expect(key).toBe('lms:lesson_complete:lesson-1:user_abc');
  });
});
