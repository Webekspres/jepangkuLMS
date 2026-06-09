import { describe, expect, it } from 'bun:test';
import { hasLmsAdminAccess, LMS_ADMIN_ROLES } from '@/lib/auth/lms-roles';
import { buildLmsIdempotencyKey, toCoreActivityType } from '@/lib/core/activity-map';

describe('lms-roles', () => {
  it('grants admin for LMS_ADMIN and CORE_ADMIN', () => {
    expect(hasLmsAdminAccess(['STUDENT', 'LMS_ADMIN'])).toBe(true);
    expect(hasLmsAdminAccess(['CORE_ADMIN'])).toBe(true);
    expect(hasLmsAdminAccess(['STUDENT'])).toBe(false);
    expect(LMS_ADMIN_ROLES).toContain('LMS_ADMIN');
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
