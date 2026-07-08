import { describe, expect, test } from 'bun:test';
import { buildCourseImportTemplateV1Buffer } from '@/features/admin-cms/lib/build-course-import-template-v1';
import { detectCourseImportTemplate } from '@/features/admin-cms/lib/import-framework/detect-course-import-template';
import { normalizeOfficialCourseV1Workbook } from '@/features/admin-cms/lib/import-framework/official-course-v1-adapter';
import { previewCourseImport } from '@/features/admin-cms/lib/import-framework/import-course-workbook';
import { validateNormalizedCourseImport } from '@/features/admin-cms/lib/import-framework/validate-normalized-course-import';
import { readXlsxBuffer } from '@/features/admin-cms/lib/xlsx-workbook';
import { buildSenseiTestWorkbookBuffer } from '@/tests/helpers/build-sensei-test-workbook';

describe('course-import-template-detection', () => {
  test('detects official-course-v1 from metadata sheet', async () => {
    const buffer = await buildCourseImportTemplateV1Buffer();
    const workbook = await readXlsxBuffer(buffer);
    const template = detectCourseImportTemplate(workbook);

    expect(template).toEqual({
      key: 'official-course',
      version: 'v1',
      detectedBy: 'metadata',
    });
  });

  test('detects sensei-jlpt-v1 from legacy workbook pattern', async () => {
    const buffer = await buildSenseiTestWorkbookBuffer({ level: 'N5' });
    const workbook = await readXlsxBuffer(buffer);
    const template = detectCourseImportTemplate(workbook);

    expect(template).toEqual({
      key: 'sensei-jlpt',
      version: 'v1',
      detectedBy: 'sheet-pattern',
    });
  });

  test('official template normalizes and validates', async () => {
    const buffer = await buildCourseImportTemplateV1Buffer();
    const workbook = await readXlsxBuffer(buffer);
    const result = normalizeOfficialCourseV1Workbook(workbook);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.normalized.course.courseExternalId).toBe('kursus-contoh-n5');
    expect(result.normalized.course.slug).toBe('kursus-contoh-jlpt-n5');
    expect(result.normalized.modules).toHaveLength(1);
    expect(result.normalized.modules[0]?.lessons).toHaveLength(1);
    const lessonContent = result.normalized.modules[0]?.lessons[0]?.content;
    expect(lessonContent?.kind).toBe('FLASHCARD');
    if (lessonContent?.kind === 'FLASHCARD') {
      expect(lessonContent.kanjis[0]?.strokeGifUrl).toBe('https://example.com/kanji-ichi.gif');
      expect(lessonContent.kanjis[0]?.contohOnyomi).toBe('いちばん');
    }
    expect(validateNormalizedCourseImport(result.normalized)).toHaveLength(0);
  });

  test('previewCourseImport routes official template', async () => {
    const buffer = await buildCourseImportTemplateV1Buffer();
    const preview = await previewCourseImport(buffer);

    expect(preview.ok).toBe(true);
    expect(preview.template?.key).toBe('official-course');
    expect(preview.kanjiCount).toBe(1);
  });

  test('previewCourseImport still supports sensei workbook', async () => {
    const buffer = await buildSenseiTestWorkbookBuffer({ level: 'N5' });
    const preview = await previewCourseImport(buffer);

    expect(preview.ok).toBe(true);
    expect(preview.template?.key).toBe('sensei-jlpt');
    expect(preview.courseCount).toBe(1);
  });
});
