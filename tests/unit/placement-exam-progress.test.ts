import { describe, expect, test } from 'bun:test';
import { parsePlacementProgressJson } from '@/features/placement/lib/placement-exam-progress';

describe('placement progress json', () => {
  test('parses answers and cursor fields', () => {
    const state = parsePlacementProgressJson(
      JSON.stringify({
        answers: { q1: 'a', q2: 'b' },
        flagged: ['q1'],
        sectionIndex: 1,
        questionIndex: 16,
        phase: 'section-exam',
        chokaiView: 'question',
        activeMondai: 'CHOKAI_2',
      }),
    );
    expect(state.answers).toEqual({ q1: 'a', q2: 'b' });
    expect(state.flagged).toEqual(['q1']);
    expect(state.sectionIndex).toBe(1);
    expect(state.questionIndex).toBe(16);
    expect(state.phase).toBe('section-exam');
    expect(state.activeMondai).toBe('CHOKAI_2');
  });

  test('falls back safely on invalid json', () => {
    const state = parsePlacementProgressJson('not-json');
    expect(state.answers).toEqual({});
    expect(state.phase).toBe('section-intro');
    expect(state.questionIndex).toBe(0);
  });
});
