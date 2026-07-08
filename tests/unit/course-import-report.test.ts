import { describe, expect, test } from 'bun:test';
import { buildCourseImportReportText } from '@/features/admin-cms/lib/import-framework/build-course-import-report-text';
import type { CourseImportPreview } from '@/features/admin-cms/lib/course-import-types';

const basePreview: CourseImportPreview = {
  ok: false,
  rowCount: 2,
  courseCount: 1,
  moduleCount: 1,
  lessonCount: 2,
  kosakataCount: 0,
  kanjiCount: 1,
  tataBahasaCount: 0,
  questionCount: 0,
  courses: [],
  errors: [
    {
      row: 5,
      code: 'VIDEO_URL_REQUIRED',
      message: 'Tab 4. Video, baris 5: Lesson "Video Tanpa URL" requires a video URL.',
      sheet: '4. Video',
    },
  ],
  warnings: ['Baris kuis diabaikan'],
  structuredWarnings: [
    {
      row: 10,
      code: 'QUIZ_ORPHAN',
      message: 'Tab 7. Quiz, baris 10: pelajaran tidak ditemukan di tab Lesson.',
      sheet: '7. Quiz',
    },
  ],
  modulePreview: [
    {
      moduleTitle: 'Modul 1',
      moduleExternalId: 'modul-1',
      order: 1,
      lessons: [
        { title: 'Kanji Dasar', lessonType: 'FLASHCARD', lessonExternalId: 'pelajaran-kanji-1' },
        { title: 'Video Tanpa URL', lessonType: 'VIDEO', lessonExternalId: 'pelajaran-video-invalid' },
      ],
    },
  ],
  template: { key: 'official-course', version: 'v1', detectedBy: 'metadata' },
};

describe('buildCourseImportReportText', () => {
  test('includes error codes, warnings, and module structure', () => {
    const text = buildCourseImportReportText(basePreview);

    expect(text).toContain('official-course v1');
    expect(text).toContain('[VIDEO_URL_REQUIRED]');
    expect(text).toContain('[QUIZ_ORPHAN]');
    expect(text).toContain('Modul 1: Modul 1 (modul-1)');
    expect(text).toContain('[FLASHCARD] Kanji Dasar');
    expect(text).toContain('Ada error');
  });
});
