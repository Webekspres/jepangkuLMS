import type { LevelJLPT } from '@prisma/client';

export type PublicCourseSummary = {
  slug: string;
  title: string;
  description: string | null;
  level: LevelJLPT;
  priceIdr: number;
  lessonCount: number;
  moduleCount: number;
  /** Public marketing URL on LMS */
  url: string;
};

export type PublicLessonOutline = {
  slug: string;
  title: string;
  order: number;
  hasQuiz: boolean;
};

export type PublicModuleOutline = {
  slug: string;
  title: string;
  description: string | null;
  order: number;
  lessons: PublicLessonOutline[];
};

export type PublicCourseDetail = PublicCourseSummary & {
  modules: PublicModuleOutline[];
};
