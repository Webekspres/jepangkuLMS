import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export type AdminLessonContent = {
  lesson: {
    id: string;
    title: string;
    slug: string;
    order: number;
    content: string | null;
    videoUrl: string | null;
  };
  kosakatas: Array<{
    id: string;
    kosakata: string;
    furigana: string | null;
    romaji: string | null;
    arti: string;
    contohKalimat: string | null;
  }>;
  kanjis: Array<{
    id: string;
    huruf: string;
    furigana: string | null;
    romaji: string | null;
    arti: string;
    onyomi: string | null;
    kunyomi: string | null;
  }>;
  tataBahasas: Array<{
    id: string;
    tataBahasa: string;
    arti: string;
    contohKalimat: string | null;
  }>;
  questions: Array<{
    id: string;
    questionText: string;
    explanation: string | null;
    xpReward: number;
    options: Array<{ id: string; text: string; isCorrect: boolean }>;
  }>;
};

export const loadAdminLessonContent = cache(async function loadAdminLessonContent(
  courseId: string,
  moduleId: string,
  lessonId: string,
): Promise<AdminLessonContent | null> {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, moduleId, module: { courseId } },
    select: {
      id: true,
      title: true,
      slug: true,
      order: true,
      content: true,
      videoUrl: true,
      kosakatas: {
        orderBy: { kosakata: 'asc' },
        select: {
          id: true,
          kosakata: true,
          furigana: true,
          romaji: true,
          arti: true,
          contohKalimat: true,
        },
      },
      kanjis: {
        orderBy: { huruf: 'asc' },
        select: {
          id: true,
          huruf: true,
          furigana: true,
          romaji: true,
          arti: true,
          onyomi: true,
          kunyomi: true,
        },
      },
      tataBahasas: {
        orderBy: { tataBahasa: 'asc' },
        select: {
          id: true,
          tataBahasa: true,
          arti: true,
          contohKalimat: true,
        },
      },
      questions: {
        where: { lessonId },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          questionText: true,
          explanation: true,
          xpReward: true,
          options: {
            orderBy: { id: 'asc' },
            select: { id: true, text: true, isCorrect: true },
          },
        },
      },
    },
  });

  if (!lesson) return null;

  return {
    lesson: {
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      order: lesson.order,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
    },
    kosakatas: lesson.kosakatas,
    kanjis: lesson.kanjis,
    tataBahasas: lesson.tataBahasas,
    questions: lesson.questions,
  };
});
