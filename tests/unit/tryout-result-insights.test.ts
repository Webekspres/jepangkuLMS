import { describe, expect, test } from 'bun:test';
import {
  buildTryoutFeedback,
  getJlptPassFailReason,
  getWeakestSectionLabel,
  SIMULATION_PASS_PERCENT,
} from '@/features/tryout/lib/tryout-result-insights';

describe('tryout-result-insights', () => {
  test('SIMULATION_PASS_PERCENT remains 60 for XP backend', () => {
    expect(SIMULATION_PASS_PERCENT).toBe(60);
  });

  test('getJlptPassFailReason covers total and section gaps', () => {
    expect(
      getJlptPassFailReason({
        jlptPassOverall: true,
        meetsJlptTotalPass: true,
        meetsAllSectionalPass: true,
      }),
    ).toBeNull();
    expect(
      getJlptPassFailReason({
        jlptPassOverall: false,
        meetsJlptTotalPass: false,
        meetsAllSectionalPass: true,
      }),
    ).toContain('Skor total');
    expect(
      getJlptPassFailReason({
        jlptPassOverall: false,
        meetsJlptTotalPass: true,
        meetsAllSectionalPass: false,
      }),
    ).toContain('bagian');
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
      meetsJlptTotalPass: true,
      meetsAllSectionalPass: true,
      indicatedCefr: 'A1',
      level: 'N5',
    });

    expect(feedback.headline).toContain('sempurna');
    expect(feedback.sectionNote).toBe('Semua bagian ujian terjawab benar.');
    expect(feedback.sectionNoteEmphasis).toBeNull();
    expect(feedback.tips.some((tip) => tip.toLowerCase().includes('salah'))).toBe(false);
  });

  test('buildTryoutFeedback fail path does not mention Aman/SOS', () => {
    const feedback = buildTryoutFeedback({
      correct: 9,
      total: 48,
      sectionRows: [
        {
          section: 'MOJI_GOI',
          sectionLabel: 'MOJI GOI',
          correct: 2,
          total: 12,
          minToPass: 4,
          passed: false,
          wrongCount: 10,
        },
      ],
      jlptPassOverall: false,
      meetsJlptTotalPass: false,
      meetsAllSectionalPass: false,
      indicatedCefr: null,
      level: 'N5',
    });

    expect(feedback.headline).toContain('Belum memenuhi');
    expect(feedback.headline.toLowerCase()).not.toContain('aman');
    expect(feedback.headline.toLowerCase()).not.toContain('sos');
    expect(feedback.feedback.toLowerCase()).not.toContain('simulasi');
  });
});
