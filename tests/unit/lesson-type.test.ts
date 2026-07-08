import { describe, expect, test } from 'bun:test';
import { getLessonTypeDefinition } from '@/features/learning/lib/lesson-type-registry';
import {
  detectLegacyLessonContentKinds,
  isLegacyLesson,
  resolveLessonTypeFromLegacyContent,
} from '@/features/learning/lib/lesson-type';

describe('lesson type helpers', () => {
  test('detects single legacy video lesson', () => {
    expect(
      resolveLessonTypeFromLegacyContent({
        hasVideo: true,
        hasFlashcard: false,
        hasQuiz: false,
        hasText: false,
      }),
    ).toBe('VIDEO');
  });

  test('keeps ambiguous multi-content legacy lesson unclassified', () => {
    expect(
      resolveLessonTypeFromLegacyContent({
        hasVideo: true,
        hasFlashcard: true,
        hasQuiz: false,
        hasText: false,
      }),
    ).toBeNull();
  });

  test('lists all detected legacy content kinds in priority order', () => {
    expect(
      detectLegacyLessonContentKinds({
        hasVideo: true,
        hasFlashcard: false,
        hasQuiz: true,
        hasText: true,
      }),
    ).toEqual(['VIDEO', 'QUIZ', 'TEXT']);
  });

  test('treats null lessonType as legacy', () => {
    expect(isLegacyLesson(null)).toBe(true);
    expect(isLegacyLesson('QUIZ')).toBe(false);
  });
});

describe('lesson type registry', () => {
  test('maps null to legacy definition', () => {
    const definition = getLessonTypeDefinition(null);

    expect(definition.key).toBe('LEGACY');
    expect(definition.studentView).toBe('legacy');
    expect(definition.adminTabs).toEqual(['info', 'flashcard', 'quiz']);
  });

  test('maps text lesson to text-only editor behavior', () => {
    const definition = getLessonTypeDefinition('TEXT');

    expect(definition.label).toBe('Text');
    expect(definition.studentView).toBe('text');
    expect(definition.allowsVideoField).toBe(false);
    expect(definition.allowsContentField).toBe(true);
    expect(definition.contentFieldLabel).toBe('Konten bacaan');
  });
});
