import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { buildCourseImportTemplateV1Buffer } from '@/features/admin-cms/lib/build-course-import-template-v1';
import {
  importCourseWorkbook,
  previewCourseImport,
} from '@/features/admin-cms/lib/import-framework/import-course-workbook';
import { prisma } from '@/lib/prisma';
import { buildInvalidOfficialVideoWorkbookBuffer } from '@/tests/helpers/build-official-test-workbook';

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

describe('course-import-official integration', () => {
  test('preview and import official template against database', async () => {
    if (!dbAvailable) {
      console.warn('Skipping integration test: PostgreSQL not reachable.');
      return;
    }

    const buffer = await buildCourseImportTemplateV1Buffer();
    const preview = await previewCourseImport(buffer);

    expect(preview.ok).toBe(true);
    expect(preview.template?.key).toBe('official-course');
    expect(preview.modulePreview?.length).toBe(1);
    expect(preview.modulePreview?.[0]?.lessons[0]?.lessonType).toBe('FLASHCARD');

    const result = await importCourseWorkbook(prisma, buffer);
    expect(result.ok).toBe(true);
    expect(result.imported[0]?.kanjiCount).toBe(1);

    const course = await prisma.course.findFirst({
      where: { courseExternalId: 'kursus-contoh-n5' },
      select: {
        id: true,
        title: true,
        modules: {
          select: {
            moduleExternalId: true,
            lessons: {
              select: {
                lessonExternalId: true,
                lessonType: true,
                kanjis: { select: { strokeGifUrl: true, huruf: true } },
              },
            },
          },
        },
      },
    });

    expect(course).not.toBeNull();
    expect(course?.title).toBe('Kursus Contoh JLPT N5');

    const kanjiLesson = course?.modules
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.kanjis.length > 0);
    expect(kanjiLesson?.lessonExternalId).toBe('pelajaran-kanji-1');
    expect(kanjiLesson?.kanjis[0]?.strokeGifUrl).toBe('https://example.com/kanji-ichi.gif');
    expect(kanjiLesson?.kanjis[0]?.huruf).toBe('一');
  });

  test('failed validation does not partially persist course data', async () => {
    if (!dbAvailable) {
      console.warn('Skipping integration test: PostgreSQL not reachable.');
      return;
    }

    const validBuffer = await buildCourseImportTemplateV1Buffer();
    const validResult = await importCourseWorkbook(prisma, validBuffer);
    expect(validResult.ok).toBe(true);

    const courseBefore = await prisma.course.findFirst({
      where: { courseExternalId: 'kursus-contoh-n5' },
      include: {
        modules: { include: { lessons: { select: { id: true, lessonExternalId: true } } } },
      },
    });
    expect(courseBefore).not.toBeNull();

    const lessonIdsBefore = courseBefore!.modules.flatMap((module) =>
      module.lessons.map((lesson) => lesson.id),
    );
    const kanjiCountBefore = await prisma.materialKanji.count({
      where: { lessonId: { in: lessonIdsBefore } },
    });

    const invalidBuffer = await buildInvalidOfficialVideoWorkbookBuffer();
    const invalidPreview = await previewCourseImport(invalidBuffer);
    expect(invalidPreview.ok).toBe(false);
    expect(invalidPreview.errors.some((error) => error.code === 'VIDEO_URL_REQUIRED')).toBe(true);

    const invalidResult = await importCourseWorkbook(prisma, invalidBuffer);
    expect(invalidResult.ok).toBe(false);

    const courseAfter = await prisma.course.findFirst({
      where: { courseExternalId: 'kursus-contoh-n5' },
      include: {
        modules: { include: { lessons: { select: { id: true, lessonExternalId: true } } } },
      },
    });

    const lessonIdsAfter = courseAfter!.modules.flatMap((module) =>
      module.lessons.map((lesson) => lesson.id),
    );
    const kanjiCountAfter = await prisma.materialKanji.count({
      where: { lessonId: { in: lessonIdsAfter } },
    });

    expect(lessonIdsAfter).toEqual(lessonIdsBefore);
    expect(kanjiCountAfter).toBe(kanjiCountBefore);
    expect(courseAfter?.modules.flatMap((m) => m.lessons).some((l) => l.lessonExternalId === 'pelajaran-video-invalid')).toBe(
      false,
    );
  });
});
