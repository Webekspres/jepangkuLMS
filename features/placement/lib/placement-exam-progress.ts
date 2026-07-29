import type { ChokaiMondaiKey } from '@/features/placement/data/chokai-mondai-instructions';

export type PlacementExamPhase = 'section-intro' | 'section-exam';
export type PlacementChokaiView = 'mondai-intro' | 'question';

export type PlacementExamProgressState = {
  answers: Record<string, string>;
  flagged: string[];
  sectionIndex: number;
  questionIndex: number;
  phase: PlacementExamPhase;
  chokaiView: PlacementChokaiView;
  activeMondai: ChokaiMondaiKey;
};

export const EMPTY_PLACEMENT_PROGRESS_STATE: PlacementExamProgressState = {
  answers: {},
  flagged: [],
  sectionIndex: 0,
  questionIndex: 0,
  phase: 'section-intro',
  chokaiView: 'mondai-intro',
  activeMondai: 'CHOKAI_1',
};

function isChokaiMondaiKey(value: unknown): value is ChokaiMondaiKey {
  return (
    value === 'CHOKAI_1' ||
    value === 'CHOKAI_2' ||
    value === 'CHOKAI_3' ||
    value === 'CHOKAI_4'
  );
}

export function parsePlacementProgressJson(raw: string): PlacementExamProgressState {
  try {
    const parsed = JSON.parse(raw) as Partial<PlacementExamProgressState>;
    const answers =
      parsed.answers && typeof parsed.answers === 'object' && !Array.isArray(parsed.answers)
        ? Object.fromEntries(
            Object.entries(parsed.answers).filter(
              ([qid, oid]) => typeof qid === 'string' && typeof oid === 'string',
            ),
          )
        : {};
    const flagged = Array.isArray(parsed.flagged)
      ? parsed.flagged.filter((id): id is string => typeof id === 'string')
      : [];

    return {
      answers,
      flagged,
      sectionIndex:
        typeof parsed.sectionIndex === 'number' && Number.isFinite(parsed.sectionIndex)
          ? Math.max(0, Math.trunc(parsed.sectionIndex))
          : 0,
      questionIndex:
        typeof parsed.questionIndex === 'number' && Number.isFinite(parsed.questionIndex)
          ? Math.max(0, Math.trunc(parsed.questionIndex))
          : 0,
      phase: parsed.phase === 'section-exam' ? 'section-exam' : 'section-intro',
      chokaiView: parsed.chokaiView === 'question' ? 'question' : 'mondai-intro',
      activeMondai: isChokaiMondaiKey(parsed.activeMondai) ? parsed.activeMondai : 'CHOKAI_1',
    };
  } catch {
    return {
      ...EMPTY_PLACEMENT_PROGRESS_STATE,
      answers: {},
      flagged: [],
    };
  }
}

export function sanitizePlacementProgressState(
  state: PlacementExamProgressState,
): PlacementExamProgressState {
  return {
    answers:
      state.answers && typeof state.answers === 'object'
        ? Object.fromEntries(
            Object.entries(state.answers).filter(
              ([qid, oid]) => typeof qid === 'string' && typeof oid === 'string',
            ),
          )
        : {},
    flagged: Array.isArray(state.flagged)
      ? state.flagged.filter((id): id is string => typeof id === 'string')
      : [],
    sectionIndex: Math.max(0, Math.trunc(state.sectionIndex || 0)),
    questionIndex: Math.max(0, Math.trunc(state.questionIndex || 0)),
    phase: state.phase === 'section-exam' ? 'section-exam' : 'section-intro',
    chokaiView: state.chokaiView === 'question' ? 'question' : 'mondai-intro',
    activeMondai: isChokaiMondaiKey(state.activeMondai) ? state.activeMondai : 'CHOKAI_1',
  };
}
