import { describe, expect, test } from 'bun:test';
import {
  getLiveClassEnrollmentCutoff,
  isLiveClassEnrollmentClosed,
} from '@/features/live-class/lib/live-class-access';

describe('live class enrollment cutoff', () => {
  test('cuts off exactly one day before first session', () => {
    const firstSession = new Date('2026-08-12T12:00:00.000Z');
    expect(getLiveClassEnrollmentCutoff(firstSession).toISOString()).toBe(
      '2026-08-11T12:00:00.000Z',
    );
  });

  test('is open before cutoff and closed at cutoff', () => {
    const firstSession = new Date('2026-08-12T12:00:00.000Z');
    expect(
      isLiveClassEnrollmentClosed(firstSession, new Date('2026-08-11T11:59:59.000Z')),
    ).toBe(false);
    expect(
      isLiveClassEnrollmentClosed(firstSession, new Date('2026-08-11T12:00:00.000Z')),
    ).toBe(true);
  });

  test('stays open when first session is missing', () => {
    expect(isLiveClassEnrollmentClosed(null, new Date('2026-08-11T12:00:00.000Z'))).toBe(false);
  });
});
