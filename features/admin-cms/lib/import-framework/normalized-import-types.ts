import type { LessonType, QuestionType } from '@prisma/client';
import type { SupportedCourseImportTemplate } from '@/features/admin-cms/lib/import-framework/import-template-types';

export type NormalizedCourseImport = {
  template: SupportedCourseImportTemplate;
  course: NormalizedCourse;
  modules: NormalizedModule[];
};

export type NormalizedCourse = {
  courseExternalId: string;
  title: string;
  slug?: string;
  description?: string | null;
  level?: string | null;
  isPublished?: boolean;
};

export type NormalizedModule = {
  moduleExternalId: string;
  courseExternalId: string;
  title: string;
  slug?: string;
  description?: string | null;
  order: number;
  lessons: NormalizedLesson[];
};

export type NormalizedLesson = {
  lessonExternalId: string;
  moduleExternalId: string;
  title: string;
  slug?: string;
  order: number;
  lessonType: LessonType;
  content:
    | NormalizedVideoLessonContent
    | NormalizedFlashcardLessonContent
    | NormalizedQuizLessonContent
    | NormalizedTextLessonContent;
};

export type NormalizedVideoLessonContent = {
  kind: 'VIDEO';
  videoUrl: string;
  textContent?: string | null;
};

export type NormalizedFlashcardLessonContent = {
  kind: 'FLASHCARD';
  kanjis: Array<{
    categoryName?: string | null;
    huruf: string;
    furigana?: string | null;
    romaji?: string | null;
    arti: string;
    onyomi?: string | null;
    kunyomi?: string | null;
    contohOnyomi?: string | null;
    artiOnyomi?: string | null;
    contohKunyomi?: string | null;
    artiKunyomi?: string | null;
    mnemonik?: string | null;
    strokeGifUrl?: string | null;
  }>;
  kosakatas: Array<{
    categoryName?: string | null;
    kosakata: string;
    furigana?: string | null;
    romaji?: string | null;
    arti: string;
    contohKalimat?: string | null;
  }>;
  tataBahasas: Array<{
    categoryName?: string | null;
    tataBahasa: string;
    arti: string;
    contohKalimat?: string | null;
  }>;
};

export type NormalizedQuizLessonContent = {
  kind: 'QUIZ';
  questionType: QuestionType;
  questions: Array<{
    prompt: string;
    explanation?: string | null;
    options: Array<{
      text: string;
      isCorrect: boolean;
    }>;
  }>;
};

export type NormalizedTextLessonContent = {
  kind: 'TEXT';
  textContent: string;
};
