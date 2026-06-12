import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/** questionId → selected optionId */
export type QuizAnswerMap = Record<string, string>;

export interface QuizSessionState {
  lessonSlug: string | null;
  questionIds: string[];
  answers: QuizAnswerMap;
  currentIndex: number;
}

export interface QuizSessionActions {
  /** Mulai sesi kuis baru; mengosongkan jawaban sebelumnya. */
  startSession: (lessonSlug: string, questionIds: string[]) => void;
  setAnswer: (questionId: string, optionId: string) => void;
  clearAnswer: (questionId: string) => void;
  setCurrentIndex: (index: number) => void;
  goNext: () => void;
  goPrevious: () => void;
  reset: () => void;
}

export type QuizStore = QuizSessionState & QuizSessionActions;

const initialState: QuizSessionState = {
  lessonSlug: null,
  questionIds: [],
  answers: {},
  currentIndex: 0,
};

export const useQuizStore = create<QuizStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      startSession: (lessonSlug, questionIds) =>
        set(
          {
            lessonSlug,
            questionIds,
            answers: {},
            currentIndex: 0,
          },
          false,
          'quiz/startSession'
        ),

      setAnswer: (questionId, optionId) =>
        set(
          (state) => ({
            answers: { ...state.answers, [questionId]: optionId },
          }),
          false,
          'quiz/setAnswer'
        ),

      clearAnswer: (questionId) =>
        set(
          (state) => {
            const rest = { ...state.answers };
            delete rest[questionId];
            return { answers: rest };
          },
          false,
          'quiz/clearAnswer'
        ),

      setCurrentIndex: (index) => {
        const { questionIds } = get();
        const clamped = Math.max(0, Math.min(index, Math.max(0, questionIds.length - 1)));
        set({ currentIndex: clamped }, false, 'quiz/setCurrentIndex');
      },

      goNext: () => {
        const { currentIndex, questionIds } = get();
        if (currentIndex < questionIds.length - 1) {
          set({ currentIndex: currentIndex + 1 }, false, 'quiz/goNext');
        }
      },

      goPrevious: () => {
        const { currentIndex } = get();
        if (currentIndex > 0) {
          set({ currentIndex: currentIndex - 1 }, false, 'quiz/goPrevious');
        }
      },

      reset: () => set({ ...initialState }, false, 'quiz/reset'),
    }),
    { name: 'jepangku-quiz-session', enabled: process.env.NODE_ENV === 'development' }
  )
);

/** ID soal pada indeks navigasi saat ini */
export function selectCurrentQuestionId(state: QuizStore): string | null {
  return state.questionIds[state.currentIndex] ?? null;
}

export function selectAnsweredCount(state: QuizStore): number {
  return Object.keys(state.answers).length;
}

export function selectIsQuizComplete(state: QuizStore): boolean {
  const { questionIds, answers } = state;
  if (questionIds.length === 0) return false;
  return questionIds.every((id) => Boolean(answers[id]));
}

export function selectHasActiveSession(state: QuizStore): boolean {
  return state.lessonSlug !== null && state.questionIds.length > 0;
}
