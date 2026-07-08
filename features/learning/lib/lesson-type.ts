import type { LessonType } from '@prisma/client';

export const LESSON_TYPE_LABEL: Record<LessonType, string> = {
  VIDEO: 'Video',
  FLASHCARD: 'Flashcard',
  QUIZ: 'Quiz',
  TEXT: 'Text',
};

export type LegacyLessonContentKinds = {
  hasVideo: boolean;
  hasFlashcard: boolean;
  hasQuiz: boolean;
  hasText: boolean;
};

export function detectLegacyLessonContentKinds(input: LegacyLessonContentKinds): LessonType[] {
  const detected: LessonType[] = [];
  if (input.hasVideo) detected.push('VIDEO');
  if (input.hasFlashcard) detected.push('FLASHCARD');
  if (input.hasQuiz) detected.push('QUIZ');
  if (input.hasText) detected.push('TEXT');
  return detected;
}

export function isLegacyLesson(lessonType: LessonType | null | undefined): boolean {
  return lessonType == null;
}

export function resolveLessonTypeFromLegacyContent(
  input: LegacyLessonContentKinds,
): LessonType | null {
  const detected = detectLegacyLessonContentKinds(input);
  return detected.length === 1 ? detected[0] : null;
}

export function assertLessonType(
  lessonType: LessonType | null | undefined,
  expected: LessonType,
): asserts lessonType is LessonType {
  if (lessonType !== expected) {
    throw new Error(`Lesson type mismatch. Expected ${expected}, got ${lessonType ?? 'LEGACY'}.`);
  }
}
