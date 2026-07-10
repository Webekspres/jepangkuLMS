import { describe, expect, test } from 'bun:test';
import {
  buildTryoutFeedback,
  getWeakestSectionLabel,
  SIMULATION_PASS_PERCENT,
} from '@/features/tryout/lib/tryout-result-insights';

describe('tryout-result-insights', () => {
  test('SIMULATION_PASS_PERCENT is 60', () => {
    expect(SIMULATION_PASS_PERCENT).toBe(60);
  });

  test('getWeakestSectionLabel returns null when all sections perfect', () => {
    expect(
      getWeakestSectionLabel([
        {
          section: 'MOJI_GOI',
          sectionLabel: 'MOJI GOI',
          correct: 1,
          total: 1,
          minToPass: 1,
          passed: true,
          wrongCount: 0,
        },
        {
          section: 'CHOKAI',
          sectionLabel: 'CHOKAI',
          correct: 1,
          total: 1,
          minToPass: 1,
          passed: true,
          wrongCount: 0,
        },
      ]),
    ).toBeNull();
  });

  test('buildTryoutFeedback for perfect score avoids weakest section', () => {
    const feedback = buildTryoutFeedback({
      scorePercent: 100,
      correct: 3,
      total: 3,
      sectionRows: [
        {
          section: 'MOJI_GOI',
          sectionLabel: 'MOJI GOI',
          correct: 1,
          total: 1,
          minToPass: 1,
          passed: true,
          wrongCount: 0,
        },
        {
          section: 'BUNPOU_DOKKAI',
          sectionLabel: 'BUNPOU DOKKAI',
          correct: 1,
          total: 1,
          minToPass: 1,
          passed: true,
          wrongCount: 0,
        },
        {
          section: 'CHOKAI',
          sectionLabel: 'CHOKAI',
          correct: 1,
          total: 1,
          minToPass: 1,
          passed: true,
          wrongCount: 0,
        },
      ],
      jlptPassOverall: true,
      indicatedCefr: 'A1',
      level: 'N5',
    });

    expect(feedback.headline).toContain('sempurna');
    expect(feedback.sectionNote).toBe('Semua bagian simulasi terjawab benar.');
    expect(feedback.sectionNoteEmphasis).toBeNull();
    expect(feedback.tips.some((tip) => tip.toLowerCase().includes('salah'))).toBe(false);
  });
});
