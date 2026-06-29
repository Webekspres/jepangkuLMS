import type { LevelJLPT, PrismaClient } from '@prisma/client';
import type { TryoutSectionValue } from '@/features/admin-cms/lib/tryout-sections';
import {
    validateTryoutImportRecords,
    validateTryoutQuestionRecords,
} from '@/features/admin-cms/lib/import-tryout-tryout-rows';
import { readXlsxBuffer, resolveSheetName, sheetToRecords } from '@/features/admin-cms/lib/xlsx-workbook';

export type TryoutImportRow = {
    rowNumber: number;
    sortHint: number | null;
    section: TryoutSectionValue;
    questionText: string;
    explanation: string | null;
    options: string[];
    correctIndex: number;
    audioUrl: string | null;
    audioGroupId: string | null;
};

export type TryoutImportPreview = {
    ok: boolean;
    rowCount: number;
    validRows: TryoutImportRow[];
    errors: { row: number; message: string }[];
    sectionCounts: Record<TryoutSectionValue, number>;
};

function emptyPreview(errors: { row: number; message: string }[]): TryoutImportPreview {
    return {
        ok: false,
        rowCount: 0,
        validRows: [],
        errors,
        sectionCounts: { MOJI_GOI: 0, BUNPOU_DOKKAI: 0, CHOKAI: 0 },
    };
}

function toPreview(
    validRows: TryoutImportRow[],
    errors: { row: number; message: string }[],
): TryoutImportPreview {
    const sectionCounts: Record<TryoutSectionValue, number> = {
        MOJI_GOI: 0,
        BUNPOU_DOKKAI: 0,
        CHOKAI: 0,
    };
    for (const row of validRows) sectionCounts[row.section] += 1;

    return {
        ok: errors.length === 0 && validRows.length > 0,
        rowCount: validRows.length,
        validRows,
        errors,
        sectionCounts,
    };
}

/** Legacy flat sheet (satu tab + kolom Section) — untuk tambah soal di sesi existing. */
export function parseTryoutImportBuffer(buffer: Buffer, filename: string): TryoutImportPreview {
    const lower = filename.toLowerCase();
    if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
        return emptyPreview([{ row: 0, message: 'Format harus .xlsx. Unduh formulir Excel.' }]);
    }

    let workbook: ReturnType<typeof readXlsxBuffer>;
    try {
        workbook = readXlsxBuffer(buffer);
    } catch {
        return emptyPreview([{ row: 0, message: 'File Excel tidak bisa dibaca.' }]);
    }

    if (resolveSheetName(workbook, ['info sesi', '1. info sesi', 'sesi'])) {
        return emptyPreview([
            {
                row: 0,
                message:
                    'File ini adalah formulir tryout lengkap. Unggah di halaman Impor Tryout (bukan dari detail sesi).',
            },
        ]);
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        return emptyPreview([{ row: 0, message: 'File Excel kosong.' }]);
    }

    const parsed = sheetToRecords(workbook, [sheetName], ['section', 'pertanyaan', 'questiontext']);
    if ('error' in parsed) {
        return emptyPreview([{ row: 0, message: parsed.error }]);
    }

    const { validRows, errors } = validateTryoutImportRecords(parsed.records);
    return toPreview(validRows, errors.map((e) => ({ ...e, message: e.message })));
}

export function parseTryoutLegacyFlatXlsx(buffer: Buffer): TryoutImportPreview {
    return parseTryoutImportBuffer(buffer, 'legacy.xlsx');
}

async function nextSortOrderForSection(
    db: PrismaClient,
    sessionId: string,
    level: LevelJLPT,
    section: TryoutSectionValue,
): Promise<number> {
    const agg = await db.question.aggregate({
        where: {
            tryoutSessionId: sessionId,
            tryoutLevel: level,
            tryoutSection: section,
            type: 'TRYOUT',
        },
        _max: { sortOrder: true },
    });
    return (agg._max.sortOrder ?? 0) + 1;
}

export async function importTryoutQuestions(
    db: PrismaClient,
    input: {
        sessionId: string;
        level: LevelJLPT;
        rows: TryoutImportRow[];
        replaceExisting?: boolean;
    },
): Promise<{ imported: number }> {
    const session = await db.tryoutSession.findUnique({ where: { id: input.sessionId } });
    if (!session) throw new Error('Sesi tryout tidak ditemukan.');

    if (input.replaceExisting) {
        await db.question.deleteMany({
            where: {
                tryoutSessionId: input.sessionId,
                tryoutLevel: input.level,
                type: 'TRYOUT',
            },
        });
    }

    const counters: Record<TryoutSectionValue, number> = {
        MOJI_GOI: await nextSortOrderForSection(db, input.sessionId, input.level, 'MOJI_GOI'),
        BUNPOU_DOKKAI: await nextSortOrderForSection(db, input.sessionId, input.level, 'BUNPOU_DOKKAI'),
        CHOKAI: await nextSortOrderForSection(db, input.sessionId, input.level, 'CHOKAI'),
    };

    await db.$transaction(async (tx) => {
        for (const row of input.rows) {
            const sortOrder = row.sortHint ?? counters[row.section]++;
            if (row.sortHint != null) {
                counters[row.section] = Math.max(counters[row.section], sortOrder + 1);
            }

            await tx.question.create({
                data: {
                    type: 'TRYOUT',
                    tryoutSessionId: input.sessionId,
                    tryoutLevel: input.level,
                    tryoutSection: row.section,
                    sortOrder,
                    questionText: row.questionText,
                    explanation: row.explanation,
                    audioUrl: row.section === 'CHOKAI' ? row.audioUrl : null,
                    audioGroupId: row.section === 'CHOKAI' ? row.audioGroupId : null,
                    xpReward: 0,
                    options: {
                        create: row.options.map((text, index) => ({
                            text,
                            isCorrect: index === row.correctIndex,
                        })),
                    },
                },
            });
        }
    });

    return { imported: input.rows.length };
}

export { validateTryoutQuestionRecords };
