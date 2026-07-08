import type { LessonType } from '@prisma/client';

export type RegisteredLessonType = LessonType | 'LEGACY';

export type LessonTypeDefinition = {
  key: RegisteredLessonType;
  label: string;
  adminTabs: Array<'info' | 'flashcard' | 'quiz'>;
  studentView: 'video' | 'flashcard' | 'quiz' | 'text' | 'legacy';
  allowsVideoField: boolean;
  allowsContentField: boolean;
  contentFieldLabel: string;
};

export const LESSON_TYPE_DEFINITIONS: Record<RegisteredLessonType, LessonTypeDefinition> = {
  LEGACY: {
    key: 'LEGACY',
    label: 'Legacy',
    adminTabs: ['info', 'flashcard', 'quiz'],
    studentView: 'legacy',
    allowsVideoField: true,
    allowsContentField: true,
    contentFieldLabel: 'Catatan / intro',
  },
  VIDEO: {
    key: 'VIDEO',
    label: 'Video',
    adminTabs: ['info'],
    studentView: 'video',
    allowsVideoField: true,
    allowsContentField: true,
    contentFieldLabel: 'Catatan / intro',
  },
  FLASHCARD: {
    key: 'FLASHCARD',
    label: 'Flashcard',
    adminTabs: ['info', 'flashcard'],
    studentView: 'flashcard',
    allowsVideoField: false,
    allowsContentField: false,
    contentFieldLabel: 'Catatan / intro',
  },
  QUIZ: {
    key: 'QUIZ',
    label: 'Quiz',
    adminTabs: ['info', 'quiz'],
    studentView: 'quiz',
    allowsVideoField: false,
    allowsContentField: false,
    contentFieldLabel: 'Catatan / intro',
  },
  TEXT: {
    key: 'TEXT',
    label: 'Text',
    adminTabs: ['info'],
    studentView: 'text',
    allowsVideoField: false,
    allowsContentField: true,
    contentFieldLabel: 'Konten bacaan',
  },
};

export function getLessonTypeDefinition(
  lessonType: LessonType | null | undefined,
): LessonTypeDefinition {
  return lessonType ? LESSON_TYPE_DEFINITIONS[lessonType] : LESSON_TYPE_DEFINITIONS.LEGACY;
}
