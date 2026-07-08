import { describe, expect, test } from 'bun:test';
import { buildCourseImportReport } from '@/features/admin-cms/lib/import-framework/build-course-import-report';
import { normalizeSenseiJlptV1Workbook } from '@/features/admin-cms/lib/import-framework/sensei-jlpt-v1-adapter';
import { validateNormalizedCourseImport } from '@/features/admin-cms/lib/import-framework/validate-normalized-course-import';
import type { NormalizedCourseImport } from '@/features/admin-cms/lib/import-framework/normalized-import-types';
import { buildSenseiTestWorkbookBuffer } from '@/tests/helpers/build-sensei-test-workbook';

function buildValidImport(): NormalizedCourseImport {
  return {
    template: {
      key: 'sensei-jlpt',
      version: 'v1',
      detectedBy: 'sheet-pattern',
    },
    course: {
      courseExternalId: 'jlpt-n5',
      title: 'JLPT N5',
      slug: 'jlpt-n5-kursus-lengkap',
      description: 'Kursus N5',
      level: 'N5',
    },
    modules: [
      {
        moduleExternalId: 'mod-1',
        courseExternalId: 'jlpt-n5',
        title: 'Modul 1',
        slug: 'modul-1',
        order: 1,
        lessons: [
          {
            lessonExternalId: 'lesson-1',
            moduleExternalId: 'mod-1',
            title: 'Quiz 1',
            slug: 'quiz-1',
            order: 1,
            lessonType: 'QUIZ',
            content: {
              kind: 'QUIZ',
              questionType: 'QUIZ',
              questions: [
                {
                  prompt: 'Apa arti 一?',
                  options: [
                    { text: 'satu', isCorrect: true },
                    { text: 'dua', isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

describe('normalized-course-import', () => {
  test('validator accepts a valid normalized import', () => {
    const issues = validateNormalizedCourseImport(buildValidImport());

    expect(issues).toHaveLength(0);
  });

  test('validator rejects duplicate external ids and invalid quiz structure', () => {
    const input = buildValidImport();
    input.modules.push({
      moduleExternalId: 'mod-1',
      courseExternalId: 'jlpt-n5',
      title: 'Modul 2',
      order: 2,
      lessons: [
        {
          lessonExternalId: 'lesson-1',
          moduleExternalId: 'mod-1',
          title: 'Quiz rusak',
          order: 1,
          lessonType: 'QUIZ',
          content: {
            kind: 'QUIZ',
            questionType: 'QUIZ',
            questions: [
              {
                prompt: 'Rusak?',
                options: [{ text: 'opsi tunggal', isCorrect: true }],
              },
            ],
          },
        },
      ],
    });

    const issues = validateNormalizedCourseImport(input);

    expect(issues.some((issue) => issue.code === 'DUPLICATE_MODULE_EXTERNAL_ID')).toBe(true);
    expect(issues.some((issue) => issue.code === 'DUPLICATE_LESSON_EXTERNAL_ID')).toBe(true);
    expect(issues.some((issue) => issue.code === 'QUIZ_OPTIONS_MINIMUM')).toBe(true);
  });

  test('report separates warnings from blocking errors', () => {
    const report = buildCourseImportReport([
      { severity: 'warning', code: 'UNKNOWN_CATEGORY', message: 'Unknown category' },
      { severity: 'error', code: 'COURSE_TITLE_REQUIRED', message: 'Missing title' },
    ]);

    expect(report.ok).toBe(false);
    expect(report.errors).toHaveLength(1);
    expect(report.warnings).toHaveLength(1);
  });

  test('sensei adapter normalizes workbook into a valid import model', async () => {
    const buffer = await buildSenseiTestWorkbookBuffer({ level: 'N5', includeStrokeGif: true });

    const result = await normalizeSenseiJlptV1Workbook(buffer);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.normalized.course.courseExternalId).toBe('jlpt-n5-kursus-lengkap');
    expect(result.normalized.modules.some((module) => module.lessons.length > 0)).toBe(true);
    expect(validateNormalizedCourseImport(result.normalized)).toHaveLength(0);
  });

  test('sensei adapter converts preview warnings into non-blocking report warnings', async () => {
    const buffer = await buildSenseiTestWorkbookBuffer({
      level: 'N5',
      unknownKanjiCategory: 'Kategori Baru Sensei',
    });

    const result = await normalizeSenseiJlptV1Workbook(buffer);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.report.ok).toBe(true);
    expect(result.report.warnings.some((warning) => warning.message.includes('Kategori Baru Sensei'))).toBe(true);
  });
});
