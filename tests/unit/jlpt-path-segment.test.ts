import { describe, expect, test } from 'bun:test';
import type { JlptPathItem } from '@/features/student/components/dashboard-data';

/** Mirror of dashboard-jlpt-path segment fill logic. */
function getSegmentFillPercent(jlptPath: JlptPathItem[], segmentIndex: number): number {
  const from = jlptPath[segmentIndex];
  if (!from) return 0;
  if (from.status === 'done') return 100;
  if (from.status === 'active') {
    return Math.min(from.progress ?? 0, 90);
  }
  return 0;
}

describe('JLPT path segment fill', () => {
  test('active level progress fills its outgoing segment', () => {
    const path: JlptPathItem[] = [
      { level: 'N5', status: 'active', progress: 20 },
      { level: 'N4', status: 'locked' },
      { level: 'N3', status: 'locked' },
      { level: 'N2', status: 'locked' },
      { level: 'N1', status: 'locked' },
    ];
    expect(getSegmentFillPercent(path, 0)).toBe(20);
    expect(getSegmentFillPercent(path, 1)).toBe(0);
  });

  test('completed level fills segment at 100%', () => {
    const path: JlptPathItem[] = [
      { level: 'N5', status: 'done', progress: 100 },
      { level: 'N4', status: 'active', progress: 50 },
      { level: 'N3', status: 'locked' },
      { level: 'N2', status: 'locked' },
      { level: 'N1', status: 'locked' },
    ];
    expect(getSegmentFillPercent(path, 0)).toBe(100);
    expect(getSegmentFillPercent(path, 1)).toBe(50);
  });

  test('active segment visual fill caps at 90% so stroke does not pierce next node', () => {
    const path: JlptPathItem[] = [
      { level: 'N5', status: 'active', progress: 99 },
      { level: 'N4', status: 'locked' },
      { level: 'N3', status: 'locked' },
      { level: 'N2', status: 'locked' },
      { level: 'N1', status: 'locked' },
    ];
    expect(getSegmentFillPercent(path, 0)).toBe(90);
  });
});
