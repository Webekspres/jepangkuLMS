import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
  importSenseiCourseXlsx,
  previewSenseiCourseImport,
} from '@/features/admin-cms/lib/import-sensei-course-xlsx';
import { prisma } from '@/lib/prisma';
import { buildSenseiTestWorkbookBuffer } from '@/tests/helpers/build-sensei-test-workbook';

let dbAvailable = false;

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  }
});

afterAll(async () => {
  if (dbAvailable) {
    await prisma.$disconnect();
  }
});

describe('course-import-sensei integration', () => {
  test('preview and import N5 workbook against database', async () => {
    if (!dbAvailable) {
      console.warn('Skipping integration test: PostgreSQL not reachable.');
      return;
    }

    const buffer = await buildSenseiTestWorkbookBuffer({
      level: 'N5',
      includeStrokeGif: true,
    });

    const preview = await previewSenseiCourseImport(buffer);
    expect(preview.ok).toBe(true);
    expect(preview.courses[0]?.slug).toBe('jlpt-n5-kursus-lengkap');

    const result = await importSenseiCourseXlsx(prisma, buffer);
    expect(result.ok).toBe(true);
    expect(result.imported[0]?.kanjiCount).toBe(1);
    expect(result.imported[0]?.questionCount).toBe(4);

    const course = await prisma.course.findFirst({
      where: { slug: 'jlpt-n5-kursus-lengkap' },
      select: {
        id: true,
        courseExternalId: true,
        modules: {
          select: {
            moduleExternalId: true,
            slug: true,
            lessons: {
              select: {
                lessonExternalId: true,
                slug: true,
                lessonType: true,
                kanjis: { select: { strokeGifUrl: true } },
                questions: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    expect(course).not.toBeNull();
    expect(course?.courseExternalId).toBe('jlpt-n5-kursus-lengkap');

    const kanjiLesson = course?.modules
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.kanjis.length > 0);
    expect(kanjiLesson?.kanjis[0]?.strokeGifUrl).toBe('https://example.com/kanji.gif');

    const quizLesson = course?.modules
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.questions.length > 0);
    expect(quizLesson?.lessonType).toBe('QUIZ');
  });
});
