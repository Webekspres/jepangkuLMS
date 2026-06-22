import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'fs';
import {
  COURSE_CSV_TEMPLATE,
  previewCourseCsvImport,
} from '@/features/admin-cms/lib/import-course-csv';

describe('course-csv-import', () => {
  test('preview accepts template with materials and quiz', () => {
    const preview = previewCourseCsvImport(COURSE_CSV_TEMPLATE);
    expect(preview.ok).toBe(true);
    expect(preview.lessonCount).toBe(3);
    expect(preview.kosakataCount).toBe(2);
    expect(preview.kanjiCount).toBe(1);
    expect(preview.tataBahasaCount).toBe(1);
    expect(preview.questionCount).toBe(2);
  });

  test('preview accepts poc file with 3 courses and materials', () => {
    const csv = readFileSync('public/templates/poc-3-kursus-import.csv', 'utf8');
    const preview = previewCourseCsvImport(csv);
    expect(preview.ok).toBe(true);
    expect(preview.courseCount).toBe(3);
    expect(preview.lessonCount).toBe(12);
    expect(preview.kanjiCount).toBeGreaterThan(0);
    expect(preview.questionCount).toBeGreaterThan(0);
  });

  test('backward compatible without row_type column', () => {
    const csv = `course_slug,course_title,course_level,module_slug,module_title,module_order,lesson_slug,lesson_title,lesson_order,lesson_video_url
legacy-kursus,Kursus Legacy,N5,mod-1,Modul 1,1,pelajaran-1,Pelajaran Satu,1,https://example.com/video`;
    const preview = previewCourseCsvImport(csv);
    expect(preview.ok).toBe(true);
    expect(preview.lessonCount).toBe(1);
  });

  test('preview rejects missing required columns', () => {
    const preview = previewCourseCsvImport('course_slug,course_title\nfoo,Bar');
    expect(preview.ok).toBe(false);
    expect(preview.errors[0]?.message).toContain('Kolom wajib hilang');
  });

  test('preview rejects content row without matching lesson', () => {
    const csv = `row_type,course_slug,course_title,course_level,module_slug,module_title,module_order,lesson_slug,lesson_title,lesson_order,fc_kosakata,fc_arti
lesson,kursus,Kursus,N5,mod-1,Modul 1,1,l1,Pelajaran 1,1,,
kosakata,,,,,,,orphan-lesson,,,こんにちは,Selamat siang`;
    const preview = previewCourseCsvImport(csv);
    expect(preview.ok).toBe(false);
    expect(preview.errors.some((error) => error.message.includes('tidak ditemukan'))).toBe(true);
  });

  test('preview rejects duplicate lesson_slug on lesson rows', () => {
    const csv = `row_type,course_slug,course_title,course_level,module_slug,module_title,module_order,lesson_slug,lesson_title,lesson_order
lesson,same-slug,Judul,N5,mod-1,Modul 1,1,l1,Pelajaran 1,1
lesson,same-slug,Judul,N5,mod-1,Modul 1,1,l1,Pelajaran 1 duplikat,2`;
    const preview = previewCourseCsvImport(csv);
    expect(preview.ok).toBe(false);
    expect(preview.errors.some((error) => error.message.includes('duplikat dalam modul'))).toBe(true);
  });

  test('preview rejects invalid quiz_correct_option', () => {
    const csv = `row_type,course_slug,course_title,course_level,module_slug,module_title,module_order,lesson_slug,lesson_title,lesson_order,quiz_question,quiz_option_1,quiz_option_2,quiz_correct_option
lesson,kursus,Kursus,N5,mod-1,Modul 1,1,l1,Pelajaran 1,1,,,,
quiz,,,,,,,l1,,,Apa ini?,A,B,9`;
    const preview = previewCourseCsvImport(csv);
    expect(preview.ok).toBe(false);
    expect(preview.errors.some((error) => error.message.includes('quiz_correct_option'))).toBe(true);
  });

  test('preview resolves optional slugs from titles only', () => {
    const csv = `row_type,course_slug,course_title,course_level,module_slug,module_title,module_order,lesson_slug,lesson_title,lesson_order,fc_kosakata,fc_arti
lesson,,Kursus Auto,N5,,Modul Satu,1,,Pelajaran Satu,1,,
kosakata,,,,,,,pelajaran-satu,,,こんにちは,Selamat siang`;
    const preview = previewCourseCsvImport(csv);
    expect(preview.ok).toBe(true);
    expect(preview.courses[0]?.slug).toBe('kursus-auto');
    expect(preview.lessonCount).toBe(1);
    expect(preview.kosakataCount).toBe(1);
  });
});
