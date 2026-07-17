import { describe, expect, test } from 'bun:test';
import type { AnalyzedTryoutAttempt } from '@/features/tryout/lib/tryout-attempt-analysis';
import {
  buildJlptPathFromLevelSummaries,
  summarizeTryoutAttempts,
} from '@/features/tryout/lib/jlpt-path-from-tryouts';

function attempt(
  overrides: Partial<AnalyzedTryoutAttempt> & Pick<AnalyzedTryoutAttempt, 'attemptId' | 'level'>,
): AnalyzedTryoutAttempt {
  return {
    createdAt: new Date('2026-07-17T00:00:00.000Z'),
    scaledTotalScore: 0,
    jlptPassOverall: false,
    totalPassScore: 80,
    totalPassPercent: 44,
    ...overrides,
  };
}

describe('JLPT path from tryout attempts', () => {
  test('returns a locked preview before the first tryout', () => {
    const result = buildJlptPathFromLevelSummaries(new Map());

    expect(result.started).toBe(false);
    expect(result.activeQuest).toBeUndefined();
    expect(result.path.every((item) => item.status === 'locked')).toBe(true);
  });

  test('starts at N5 when a legacy attempt cannot be analyzed', () => {
    const result = buildJlptPathFromLevelSummaries(new Map(), true);

    expect(result.started).toBe(true);
    expect(result.path[0]).toEqual({ level: 'N5', status: 'active', progress: 0 });
    expect(result.activeQuest?.level).toBe('N5');
  });

  test('uses the highest score and latest attempt as tie-breaker', () => {
    const summaries = summarizeTryoutAttempts([
      attempt({ attemptId: 'low', level: 'N5', scaledTotalScore: 70 }),
      attempt({
        attemptId: 'high-old',
        level: 'N5',
        scaledTotalScore: 90,
        jlptPassOverall: true,
      }),
      attempt({
        attemptId: 'high-new',
        level: 'N5',
        scaledTotalScore: 90,
        jlptPassOverall: false,
        createdAt: new Date('2026-07-18T00:00:00.000Z'),
      }),
    ]);

    expect(summaries.get('N5')).toEqual({
      bestScaledScore: 90,
      bestPassOverall: false,
      attemptCount: 3,
      bestAttemptId: 'high-new',
      bestAttemptAt: new Date('2026-07-18T00:00:00.000Z'),
    });
  });

  test('builds a linear done, active, and locked chain', () => {
    const summaries = summarizeTryoutAttempts([
      attempt({
        attemptId: 'n5-pass',
        level: 'N5',
        scaledTotalScore: 90,
        jlptPassOverall: true,
      }),
      attempt({
        attemptId: 'n4-fail',
        level: 'N4',
        scaledTotalScore: 45,
        totalPassScore: 90,
      }),
    ]);
    const result = buildJlptPathFromLevelSummaries(summaries);

    expect(result.path.map(({ status }) => status)).toEqual([
      'done',
      'active',
      'locked',
      'locked',
      'locked',
    ]);
    expect(result.path[1]?.progress).toBe(50);
    expect(result.activeQuest).toEqual({
      level: 'N4',
      bestScaledScore: 45,
      totalPassScore: 90,
      attemptCount: 1,
      bestAttemptId: 'n4-fail',
    });
  });

  test('caps progress at 99 until the best attempt passes every section', () => {
    const summaries = summarizeTryoutAttempts([
      attempt({
        attemptId: 'n5-sectional-fail',
        level: 'N5',
        scaledTotalScore: 120,
        jlptPassOverall: false,
      }),
    ]);

    const result = buildJlptPathFromLevelSummaries(summaries);

    expect(result.path[0]).toEqual({ level: 'N5', status: 'active', progress: 99 });
  });
});
