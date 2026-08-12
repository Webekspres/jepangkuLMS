import { describe, expect, test } from 'bun:test';
import {
  buildEnrollmentActivatedIdempotencyKey,
  buildEnrollmentActivatedSubject,
} from '@/lib/email/send-enrollment-activated-email';

describe('enrollment activated email helpers', () => {
  test('idempotency key is stable per enrollment', () => {
    expect(buildEnrollmentActivatedIdempotencyKey('enr-123')).toBe(
      'lms:enrollment-activated:enr-123',
    );
  });

  test('subject includes product title', () => {
    expect(buildEnrollmentActivatedSubject('Kelas Kaiwa N4')).toBe(
      'Akses aktif: Kelas Kaiwa N4',
    );
  });
});
