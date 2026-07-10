import { describe, expect, test } from 'bun:test';
import { countTryoutCompositionQuestions } from '@/features/tryout/lib/count-tryout-paper-questions';

describe('countTryoutCompositionQuestions', () => {
  test('counts moji/bunpou items as one question each', () => {
    expect(
      countTryoutCompositionQuestions([
        { jlptQuestionId: 'q1', listeningStimulus: null },
        { jlptQuestionId: 'q2', listeningStimulus: null },
      ]),
    ).toBe(2);
  });

  test('expands choukai stimulus items by child question count', () => {
    expect(
      countTryoutCompositionQuestions([
        {
          jlptQuestionId: null,
          listeningStimulus: { _count: { questions: 12 } },
        },
      ]),
    ).toBe(12);
  });

  test('sums mixed sections', () => {
    expect(
      countTryoutCompositionQuestions([
        { jlptQuestionId: 'mg1', listeningStimulus: null },
        { jlptQuestionId: 'bd1', listeningStimulus: null },
        {
          jlptQuestionId: null,
          listeningStimulus: { _count: { questions: 3 } },
        },
      ]),
    ).toBe(5);
  });
});
