import type { PrismaClient } from '@prisma/client';
import JSZip from 'jszip';
import type { TryoutImportRow } from '@/features/admin-cms/lib/import-tryout-questions';
import { importTryoutQuestions } from '@/features/admin-cms/lib/import-tryout-questions';
import { readXlsxBuffer, resolveSheetName, sheetToRecords } from '@/features/admin-cms/lib/xlsx-workbook';
import { validateTryoutQuestionRecords } from '@/features/admin-cms/lib/import-tryout-tryout-rows';
import { parseChokaiExcelRecords } from '@/features/admin-cms/lib/import-chokai-zip';
import { importChokaiZip as importChokaiQuestions } from '@/features/admin-cms/lib/import-chokai-zip';
import type { ChokaiImportRow, ChokaiImportPreview } from '@/features/admin-cms/lib/import-chokai-zip';
import { probeAudioDurationSec, sliceAudioToMp3 } from '@/lib/media/ffmpeg';
import { uploadToR2 } from '@/lib/r2';
import {
    buildTryoutChokaiClipKey,
    buildTryoutChokaiMasterKey,
} from '@/lib/media/tryout-audio';
import { uploadTryoutChokaiImage } from '@/lib/media/tryout-chokai-image';
import { chokaiClipDedupeKey } from '@/features/admin-cms/lib/chokai-excel-columns';

type ZipAssets = Map<string, Map<string, Buffer>>;

export type UnifiedImportPreview = {
    ok: boolean;
    sections: {
        moji?: { ok: boolean; rowCount: number; errors: { row: number; message: string }[] };
        bunpou?: { ok: boolean; rowCount: number; errors: { row: number; message: string }[] };
        chokai?: { ok: boolean; rowCount: number; errors: { row: number; message: string }[] };
    };
    totalRows: number;
    errors: { row: number; message: string; section?: string }[];
};

export type UnifiedImportResult = {
    moji: { imported: number };
    bunpou: { imported: number };
    chokai: { imported: number };
    totalImported: number;
};

/**
 * Extract ZIP file and parse internal structure
 * Expected: jlpt.xlsx at root + optional assets/ folder for CHOKAI media
 */
async function extractUnifiedZip(buffer: Buffer): Promise<
    | { ok: true; xlsx: Buffer; assets: ZipAssets }
    | { ok: false; error: string }
> {
    let zip: JSZip;
    try {
        zip = await JSZip.loadAsync(buffer);
    } catch {
        return { ok: false, error: 'File ZIP tidak bisa dibaca.' };
    }

    let xlsx: Buffer | null = null;
    const assets: ZipAssets = new Map();

    for (const [path, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;
        const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '');

        // Match jlpt.xlsx at root (case-insensitive)
        if (/^jlpt\.xlsx$/i.test(normalized)) {
            xlsx = Buffer.from(await entry.async('arraybuffer'));
            continue;
        }

        // Extract assets/ folder (for CHOKAI media)
        const assetMatch = /^assets\/([^/]+)\/(.+)$/i.exec(normalized);
        if (assetMatch) {
            const folder = assetMatch[1]!;
            const filename = assetMatch[2]!;
            if (!assets.has(folder)) assets.set(folder, new Map());
            assets.get(folder)!.set(filename, Buffer.from(await entry.async('arraybuffer')));
        }
    }

    if (!xlsx) {
        return { ok: false, error: 'jlpt.xlsx tidak ditemukan di akar ZIP.' };
    }

    return { ok: true, xlsx, assets };
}

/**
 * Preview unified JLPT ZIP import without modifying database
 */
export async function previewUnifiedTryoutZip(buffer: Buffer): Promise<UnifiedImportPreview> {
    const extracted = await extractUnifiedZip(buffer);
    if (!extracted.ok) {
        return {
            ok: false,
            sections: {},
            totalRows: 0,
            errors: [{ row: 0, message: extracted.error }],
        };
    }

    const { xlsx, assets } = extracted;
    let workbook: Awaited<ReturnType<typeof readXlsxBuffer>>;

    try {
        workbook = await readXlsxBuffer(xlsx);
    } catch {
        return {
            ok: false,
            sections: {},
            totalRows: 0,
            errors: [{ row: 0, message: 'jlpt.xlsx tidak bisa dibaca.' }],
        };
    }

    const sections: UnifiedImportPreview['sections'] = {};
    const allErrors: UnifiedImportPreview['errors'] = [];
    let totalRows = 0;

    // Parse MOJI_GOI sheet
    const mojiSheet = resolveSheetName(workbook, ['moji_goi', 'mojigoi', 'moji-goi', 'moji goi']);
    if (mojiSheet) {
        const parsed = sheetToRecords(workbook, [mojiSheet], ['pertanyaan']);
        if ('error' in parsed) {
            sections.moji = { ok: false, rowCount: 0, errors: [{ row: 0, message: parsed.error }] };
            allErrors.push({ row: 0, message: parsed.error, section: 'MOJI_GOI' });
        } else {
            const { validRows, errors } = validateTryoutQuestionRecords(
                parsed.records,
                'MOJI_GOI',
                parsed.headerRow,
                'MOJI_GOI',
            );
            sections.moji = {
                ok: errors.length === 0 && validRows.length > 0,
                rowCount: validRows.length,
                errors,
            };
            totalRows += validRows.length;
            allErrors.push(
                ...errors.map((e) => ({
                    ...e,
                    section: 'MOJI_GOI',
                })),
            );
        }
    }

    // Parse BUNPOU_DOKKAI sheet
    const bunpouSheet = resolveSheetName(workbook, ['bunpou_dokkai', 'bunpoudokkai', 'bunpou-dokkai', 'bunpou dokkai']);
    if (bunpouSheet) {
        const parsed = sheetToRecords(workbook, [bunpouSheet], ['pertanyaan']);
        if ('error' in parsed) {
            sections.bunpou = { ok: false, rowCount: 0, errors: [{ row: 0, message: parsed.error }] };
            allErrors.push({ row: 0, message: parsed.error, section: 'BUNPOU_DOKKAI' });
        } else {
            const { validRows, errors } = validateTryoutQuestionRecords(
                parsed.records,
                'BUNPOU_DOKKAI',
                parsed.headerRow,
                'BUNPOU_DOKKAI',
            );
            sections.bunpou = {
                ok: errors.length === 0 && validRows.length > 0,
                rowCount: validRows.length,
                errors,
            };
            totalRows += validRows.length;
            allErrors.push(
                ...errors.map((e) => ({
                    ...e,
                    section: 'BUNPOU_DOKKAI',
                })),
            );
        }
    }

    // Parse CHOKAI sheet
    const chokaiSheet = resolveSheetName(workbook, ['chokai', 'choukai', 'listening']);
    if (chokaiSheet) {
        const parsed = sheetToRecords(workbook, [chokaiSheet], ['folder', 'tipe_jawaban']);
        if ('error' in parsed) {
            sections.chokai = { ok: false, rowCount: 0, errors: [{ row: 0, message: parsed.error }] };
            allErrors.push({ row: 0, message: parsed.error, section: 'CHOKAI' });
        } else {
            const { validRows, errors } = await parseChokaiExcelRecords(xlsx, assets);
            sections.chokai = {
                ok: errors.length === 0 && validRows.length > 0,
                rowCount: validRows.length,
                errors,
            };
            totalRows += validRows.length;
            allErrors.push(
                ...errors.map((e) => ({
                    ...e,
                    section: 'CHOKAI',
                })),
            );
        }
    }

    const allOk = Object.values(sections).every((s) => !s || s.ok);

    return {
        ok: allOk && totalRows > 0,
        sections,
        totalRows,
        errors: allErrors,
    };
}

/**
 * Import unified JLPT ZIP into session
 * Handles MOJI_GOI, BUNPOU_DOKKAI, and CHOKAI sections
 */
export async function importUnifiedTryoutZip(
    db: PrismaClient,
    input: {
        sessionId: string;
        sessionCode: string;
        buffer: Buffer;
        replaceExisting?: boolean;
    },
): Promise<UnifiedImportResult> {
    const extracted = await extractUnifiedZip(input.buffer);
    if (!extracted.ok) throw new Error(extracted.error);

    const { xlsx, assets } = extracted;
    let workbook: Awaited<ReturnType<typeof readXlsxBuffer>>;

    try {
        workbook = await readXlsxBuffer(xlsx);
    } catch {
        throw new Error('jlpt.xlsx tidak bisa dibaca.');
    }

    const result: UnifiedImportResult = {
        moji: { imported: 0 },
        bunpou: { imported: 0 },
        chokai: { imported: 0 },
        totalImported: 0,
    };

    // Import MOJI_GOI
    const mojiSheet = resolveSheetName(workbook, ['moji_goi', 'mojigoi', 'moji-goi', 'moji goi']);
    if (mojiSheet) {
        const parsed = sheetToRecords(workbook, [mojiSheet], ['pertanyaan', 'questiontext', 'soal']);
        if ('error' in parsed) {
            throw new Error(parsed.error);
        }
        const { validRows, errors } = validateTryoutQuestionRecords(
            parsed.records,
            'MOJI_GOI',
            parsed.headerRow,
            'MOJI_GOI',
        );
        if (errors.length === 0 && validRows.length > 0) {
            const imported = await importTryoutQuestions(db, {
                sessionId: input.sessionId,
                rows: validRows,
                replaceExisting: input.replaceExisting,
            });
            result.moji.imported = imported.imported;
            result.totalImported += imported.imported;
        }
    }

    // Import BUNPOU_DOKKAI
    const bunpouSheet = resolveSheetName(workbook, [
        'bunpou_dokkai',
        'bunpoudokkai',
        'bunpou-dokkai',
        'bunpou dokkai',
    ]);
    if (bunpouSheet) {
        const parsed = sheetToRecords(workbook, [bunpouSheet], ['pertanyaan', 'questiontext', 'soal']);
        if ('error' in parsed) {
            throw new Error(parsed.error);
        }
        const { validRows, errors } = validateTryoutQuestionRecords(
            parsed.records,
            'BUNPOU_DOKKAI',
            parsed.headerRow,
            'BUNPOU_DOKKAI',
        );
        if (errors.length === 0 && validRows.length > 0) {
            const imported = await importTryoutQuestions(db, {
                sessionId: input.sessionId,
                rows: validRows,
                replaceExisting: input.replaceExisting,
            });
            result.bunpou.imported = imported.imported;
            result.totalImported += imported.imported;
        }
    }

    // Import CHOKAI
    const chokaiSheet = resolveSheetName(workbook, ['chokai', 'choukai', 'listening']);
    if (chokaiSheet) {
        // Use existing CHOKAI import logic which handles all the audio processing
        try {
            const imported = await importChokaiQuestions(db, {
                sessionId: input.sessionId,
                sessionCode: input.sessionCode,
                buffer: input.buffer,
            });
            result.chokai.imported = imported.imported;
            result.totalImported += imported.imported;
        } catch (error) {
            // If CHOKAI import fails, we still want to report partial success for MOJI/BUNPOU
            console.error('CHOKAI import failed:', error);
            throw error;
        }
    }

    return result;
}
