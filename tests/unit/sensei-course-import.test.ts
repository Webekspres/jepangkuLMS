import { describe, expect, test } from 'bun:test';
import {
    importSenseiCourseXlsx,
    previewSenseiCourseImport,
} from '@/features/admin-cms/lib/import-sensei-course-xlsx';
import { readXlsxBuffer } from '@/features/admin-cms/lib/xlsx-workbook';
import { detectSenseiLevel } from '@/prisma/lib/sensei-import-manifests';
import { buildSenseiTestWorkbookBuffer } from '@/tests/helpers/build-sensei-test-workbook';
import { createMockSenseiImportPrisma } from '@/tests/helpers/mock-sensei-import-prisma';

describe('sensei-course-import', () => {
    test('preview accepts minimal N5 workbook', async () => {
        const buffer = await buildSenseiTestWorkbookBuffer({ level: 'N5', includeStrokeGif: true });
        const preview = await previewSenseiCourseImport(buffer);
        expect(preview.ok).toBe(true);
        expect(preview.courses[0]?.slug).toBe('jlpt-n5-kursus-lengkap');
        expect(preview.kanjiCount).toBe(1);
        expect(preview.questionCount).toBe(4);
    });

    test('preview accepts minimal N4 workbook', async () => {
        const buffer = await buildSenseiTestWorkbookBuffer({ level: 'N4' });
        const preview = await previewSenseiCourseImport(buffer);
        expect(preview.ok).toBe(true);
        expect(preview.courses[0]?.slug).toBe('jlpt-n4-kursus-lengkap');
        expect(preview.moduleCount).toBe(5);
        expect(preview.questionCount).toBe(3);
    });

    test('detectSenseiLevel distinguishes N4 and N5', async () => {
        const n5 = await readXlsxBuffer(await buildSenseiTestWorkbookBuffer({ level: 'N5' }));
        const n4 = await readXlsxBuffer(await buildSenseiTestWorkbookBuffer({ level: 'N4' }));
        expect(detectSenseiLevel(n5)).toBe('N5');
        expect(detectSenseiLevel(n4)).toBe('N4');
    });

    test('unknown category yields warning and is excluded from counts', async () => {
        const buffer = await buildSenseiTestWorkbookBuffer({
            level: 'N5',
            unknownKanjiCategory: 'Kategori Baru Sensei',
        });
        const preview = await previewSenseiCourseImport(buffer);
        expect(preview.ok).toBe(true);
        expect(preview.kanjiCount).toBe(1);
        expect(preview.warnings.some((w) => w.includes('Kategori Baru Sensei'))).toBe(true);
    });

    test('import stores stroke gif when N5 gif column exists', async () => {
        const buffer = await buildSenseiTestWorkbookBuffer({
            level: 'N5',
            includeStrokeGif: true,
        });
        const { prisma, createdKanji } = createMockSenseiImportPrisma();
        const result = await importSenseiCourseXlsx(prisma, buffer);
        expect(result.ok).toBe(true);
        expect(createdKanji[0]?.strokeGifUrl).toBe('https://example.com/kanji.gif');
    });

    test('import keeps stroke gif null when gif column absent', async () => {
        const buffer = await buildSenseiTestWorkbookBuffer({
            level: 'N5',
            includeStrokeGif: false,
        });
        const { prisma, createdKanji } = createMockSenseiImportPrisma();
        const result = await importSenseiCourseXlsx(prisma, buffer);
        expect(result.ok).toBe(true);
        expect(createdKanji[0]?.strokeGifUrl).toBeNull();
    });

    test('import keeps quiz markdown text as-is', async () => {
        const buffer = await buildSenseiTestWorkbookBuffer({
            level: 'N5',
            quizRichText: true,
        });
        const { prisma, createdQuestions } = createMockSenseiImportPrisma();
        const result = await importSenseiCourseXlsx(prisma, buffer);
        expect(result.ok).toBe(true);
        expect(createdQuestions[0]?.questionText).toContain('**tebal**');
    });

    test('preview rejects invalid buffer', async () => {
        const preview = await previewSenseiCourseImport(Buffer.from('not-excel'));
        expect(preview.ok).toBe(false);
        expect(preview.errors[0]?.message).toContain('tidak bisa dibaca');
    });

    test('preview rejects corrupted workbook', async () => {
        const buffer = await buildSenseiTestWorkbookBuffer({ level: 'N5' });
        const corrupted = Buffer.from(buffer);
        corrupted.write('ZZ', 0);
        const preview = await previewSenseiCourseImport(corrupted);
        expect(preview.ok).toBe(false);
    });

    test('preview requires exact legacy sheet names for level detection', async () => {
        const buffer = await buildSenseiTestWorkbookBuffer({ level: 'N5' });
        const workbook = await readXlsxBuffer(buffer);
        const sheet = workbook.getWorksheet('N5 - 漢字 (Kanji)');
        if (!sheet) throw new Error('Expected N5 kanji sheet');
        sheet.name = 'N5 - Kanji';
        const mutated = Buffer.from(await workbook.xlsx.writeBuffer());

        const preview = await previewSenseiCourseImport(mutated);

        expect(preview.ok).toBe(false);
        expect(preview.errors[0]?.message).toContain('Format workbook tidak dikenali');
    });

    test('preview counts only numbered quiz rows when instructional rows are present', async () => {
        const buffer = await buildSenseiTestWorkbookBuffer({
            level: 'N5',
            prependInstructionRowsToQuiz: true,
        });

        const preview = await previewSenseiCourseImport(buffer);

        expect(preview.ok).toBe(true);
        expect(preview.questionCount).toBe(4);
    });

    test('import skips quiz rows with fewer than two answer options', async () => {
        const buffer = await buildSenseiTestWorkbookBuffer({
            level: 'N5',
            invalidQuizOptions: true,
        });
        const { prisma, createdQuestions } = createMockSenseiImportPrisma();

        const result = await importSenseiCourseXlsx(prisma, buffer);

        expect(result.ok).toBe(true);
        expect(createdQuestions).toHaveLength(3);
    });
});
