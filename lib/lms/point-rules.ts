/**
 * LMS platform points — selaras pola Portal Berita (`jepangku-news/lib/points.ts`).
 * Poin LMS disimpan lokal (`UserLmsStats` + `LmsPointEvent`), terpisah dari poin news & XP global Core.
 */

export const LMS_SOURCE_APP = 'lms' as const;

/** Nilai poin tetap per aktivitas LMS. */
export const LMS_POINTS = {
  DAILY_LOGIN: 3,
  LESSON_COMPLETE: 15,
  FLASHCARD_VISIT: 5,
  LESSON_COMMENT: 2,
  QUIZ_BASE: 10,
  QUIZ_PER_CORRECT: 5,
  TRYOUT_BASE: 10,
  TRYOUT_PER_CORRECT: 5,
} as const;

export type LmsPointActivityType =
  | 'daily_login'
  | 'lesson_complete'
  | 'flashcard_visit'
  | 'lesson_comment'
  | 'quiz_completed'
  | 'quiz_correct_answers'
  | 'tryout_completed'
  | 'tryout_correct_answers';

export const LMS_POINT_ACTIVITY_LABELS: Record<LmsPointActivityType, string> = {
  daily_login: 'Login Harian',
  lesson_complete: 'Menyelesaikan Pelajaran',
  flashcard_visit: 'Menjelajahi Flashcard',
  lesson_comment: 'Komentar Pelajaran',
  quiz_completed: 'Kuis Selesai',
  quiz_correct_answers: 'Jawaban Benar Kuis',
  tryout_completed: 'Tryout Selesai',
  tryout_correct_answers: 'Jawaban Benar Tryout',
};

export type ScoredActivityPoints = {
  base: number;
  bonus: number;
  total: number;
};

/** Rumus kuis/tryout: base + (perCorrect × jumlah benar). */
export function calculateScoredActivityPoints(
  correctCount: number,
  base: number,
  perCorrect: number,
): ScoredActivityPoints {
  const bonus = correctCount > 0 ? perCorrect * correctCount : 0;
  return {
    base,
    bonus,
    total: base + bonus,
  };
}

export function calculateQuizPoints(correctCount: number): ScoredActivityPoints {
  return calculateScoredActivityPoints(
    correctCount,
    LMS_POINTS.QUIZ_BASE,
    LMS_POINTS.QUIZ_PER_CORRECT,
  );
}

export function calculateTryoutPoints(correctCount: number): ScoredActivityPoints {
  return calculateScoredActivityPoints(
    correctCount,
    LMS_POINTS.TRYOUT_BASE,
    LMS_POINTS.TRYOUT_PER_CORRECT,
  );
}

/** Idempotency keys — mirip unique constraint news (user + activity + source). */
export function lmsDailyLoginSourceKey(userId: string, dateKey: string): string {
  return `daily_login:${userId}:${dateKey}`;
}

export function lmsLessonCompleteSourceKey(lessonId: string, userId: string): string {
  return `lesson:${lessonId}:${userId}:complete`;
}

export function lmsFlashcardVisitSourceKey(lessonId: string, userId: string): string {
  return `flashcard:${lessonId}:${userId}`;
}

export function lmsLessonCommentSourceKey(lessonId: string, userId: string): string {
  return `lesson_comment:${lessonId}:${userId}`;
}

export function lmsQuizCompletedSourceKey(lessonId: string, userId: string): string {
  return `quiz:${lessonId}:${userId}:completed`;
}

export function lmsQuizCorrectSourceKey(lessonId: string, userId: string): string {
  return `quiz:${lessonId}:${userId}:correct`;
}

export function lmsTryoutCompletedSourceKey(
  sessionCode: string,
  level: string,
  userId: string,
): string {
  return `tryout:${sessionCode}:${level}:${userId}:completed`;
}

export function lmsTryoutCorrectSourceKey(
  sessionCode: string,
  level: string,
  userId: string,
): string {
  return `tryout:${sessionCode}:${level}:${userId}:correct`;
}
