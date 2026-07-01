import { describe, expect, test } from 'bun:test';
import { previewTryoutWorkbookImport } from '@/features/admin-cms/lib/import-tryout-workbook';
import { buildTryoutImportTemplateBuffer } from '@/features/admin-cms/lib/xlsx-template-builder';

describe('tryout-workbook-import', () => {
    test('preview accepts styled tryout template', async () => {
        const buffer = await buildTryoutImportTemplateBuffer();
        const preview = await previewTryoutWorkbookImport(buffer);
        expect(preview.ok).toBe(true);
        expect(preview.session?.code).toBe('n5-fase-1');
        expect(preview.questionPreview.sectionCounts.MOJI_GOI).toBe(1);
        expect(preview.questionPreview.sectionCounts.BUNPOU_DOKKAI).toBe(1);
        expect(preview.questionPreview.sectionCounts.CHOKAI).toBe(0);
    });
});
