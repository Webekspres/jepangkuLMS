import { describe, expect, test } from 'bun:test';
import {
  formatStableActivityTime,
  formatXpActivityTime,
} from '@/lib/lms/xp-activity-types';

describe('xp activity time formatters', () => {
  test('formatXpActivityTime uses injected now for deterministic relative labels', () => {
    const createdAt = new Date('2026-06-30T10:00:00.000Z');
    const now = createdAt.getTime() + 40 * 60_000;
    expect(formatXpActivityTime(createdAt, now)).toBe('40 mnt lalu');
  });

  test('formatStableActivityTime is timezone-stable for SSR', () => {
    const createdAt = new Date('2026-06-30T10:00:00.000Z');
    expect(formatStableActivityTime(createdAt)).toMatch(/2026/);
    expect(formatStableActivityTime(createdAt)).toMatch(/17\.00/);
  });
});
