import { describe, expect, test } from 'bun:test';
import {
  coreXpRequiredForLevel,
  getCoreLevelProgress,
} from '@/features/student/lib/gamification-rewards';

describe('core level progress', () => {
  test('coreXpRequiredForLevel follows (L - 1) * 50', () => {
    expect(coreXpRequiredForLevel(1)).toBe(0);
    expect(coreXpRequiredForLevel(8)).toBe(350);
    expect(coreXpRequiredForLevel(9)).toBe(400);
  });

  test('getCoreLevelProgress at level 8 with 383 total XP', () => {
    const progress = getCoreLevelProgress(383, 8);
    expect(progress.xpInCurrentLevel).toBe(33);
    expect(progress.xpRemaining).toBe(17);
    expect(progress.xpNeededForNextLevel).toBe(50);
    expect(progress.percent).toBe(66);
    expect(progress.isMaxLevel).toBe(false);
  });

  test('getCoreLevelProgress at max level is 100%', () => {
    const progress = getCoreLevelProgress(5000, 100);
    expect(progress.isMaxLevel).toBe(true);
    expect(progress.percent).toBe(100);
    expect(progress.xpRemaining).toBe(0);
  });
});
