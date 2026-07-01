import { describe, expect, test } from 'bun:test';
import { previewCourseXlsxImport } from '@/features/admin-cms/lib/import-course-xlsx';
import { buildCourseImportTemplateBuffer } from '@/features/admin-cms/lib/xlsx-template-builder';

describe('course-xlsx-import', () => {
    test('preview accepts styled template workbook', async () => {
        const buffer = await buildCourseImportTemplateBuffer();
        const preview = await previewCourseXlsxImport(buffer);
        expect(preview.ok).toBe(true);
        expect(preview.courseCount).toBe(1);
        expect(preview.lessonCount).toBe(1);
        expect(preview.kosakataCount).toBe(1);
        expect(preview.questionCount).toBe(1);
    });

    test('preview rejects empty buffer', async () => {
        const preview = await previewCourseXlsxImport(Buffer.from('not-excel'));
        expect(preview.ok).toBe(false);
    });
});
