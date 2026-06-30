import type { LevelJLPT, PrismaClient } from '@prisma/client';
import { levelJlptSchema } from '@/lib/validations/shared';
import type { TryoutImportRow, TryoutImportPreview } from '@/features/admin-cms/lib/import-tryout-questions';
import { importTryoutQuestions } from '@/features/admin-cms/lib/import-tryout-questions';
import { validateTryoutQuestionRecords } from '@/features/admin-cms/lib/import-tryout-tryout-rows';
import {
    formatTabError,
    parsePositiveInt,
    parseYesNo,
    pickField,
    readXlsxBuffer,
    resolveSheetName,
    sheetToRecords,
    stripSheetPrefix,
} from '@/features/admin-cms/lib/xlsx-workbook';

export type TryoutWorkbookSession = {
    title: string;
    code: string;
    phaseLabel: string;
    level: LevelJLPT;
    description: string | null;
    scheduledAt: Date | null;
    timeLimitMinutes: number;
    sortOrder: number;
    isActive: boolean;
};

export type TryoutWorkbookPreview = {
    ok: boolean;
    session: TryoutWorkbookSession | null;
    questionPreview: TryoutImportPreview;
    warnings: string[];
};

function slugifyCode(input: string): string {
    return input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function parseSessionRow(
    record: Record<string, string>,
    row: number,
): { session: TryoutWorkbookSession } | { errors: { row: number; message: string }[] } {
    const errors: { row: number; message: string }[] = [];
    const title = pickField(record, ['judul_sesi', 'judul', 'title']);
    const codeRaw = pickField(record, ['kode_sesi', 'kode', 'code']);
    const phaseLabel = pickField(record, ['nama_fase', 'fase', 'phase']);
    const levelRaw = pickField(record, ['tingkat_jlpt', 'level', 'tingkat']);
    const levelParsed = levelJlptSchema.safeParse(levelRaw.trim().toUpperCase());

    if (!title) errors.push({ row, message: formatTabError('Info Sesi', row, 'Judul Sesi wajib diisi.') });
    if (!codeRaw) errors.push({ row, message: formatTabError('Info Sesi', row, 'Kode Sesi wajib diisi.') });
    if (!phaseLabel) errors.push({ row, message: formatTabError('Info Sesi', row, 'Nama Fase wajib diisi.') });
    if (!levelParsed.success) {
        errors.push({
            row,
            message: formatTabError('Info Sesi', row, `Tingkat JLPT "${levelRaw || '(kosong)'}" tidak valid.`),
        });
    }

    if (errors.length > 0) return { errors };

    const code = slugifyCode(codeRaw);
    if (!code) {
        return { errors: [{ row, message: formatTabError('Info Sesi', row, 'Kode Sesi tidak valid.') }] };
    }

    const jadwalRaw = pickField(record, ['jadwal', 'scheduledat']);
    let scheduledAt: Date | null = null;
    if (jadwalRaw) {
        const d = new Date(jadwalRaw);
        if (Number.isNaN(d.getTime())) {
            errors.push({ row, message: formatTabError('Info Sesi', row, 'Format Jadwal tidak valid (gunakan YYYY-MM-DD).') });
        } else {
            scheduledAt = d;
        }
    }

    if (errors.length > 0) return { errors };

    return {
        session: {
            title,
            code,
            phaseLabel,
            level: levelParsed.data!,
            description: pickField(record, ['deskripsi']) || null,
            scheduledAt,
            timeLimitMinutes: parsePositiveInt(pickField(record, ['durasi_menit', 'durasi']), 120) ?? 120,
            sortOrder: parsePositiveInt(pickField(record, ['urutan_tampil', 'urutan']), 0) ?? 0,
            isActive: parseYesNo(pickField(record, ['aktif_ya_tidak', 'aktif', 'active']) || 'ya'),
        },
    };
}

function isWorkbookMode(workbook: ReturnType<typeof readXlsxBuffer>): boolean {
    return Boolean(
        resolveSheetName(workbook, ['info sesi', '1. info sesi', 'sesi']),
    );
}

export function previewTryoutWorkbookImport(buffer: Buffer): TryoutWorkbookPreview {
    const warnings: string[] = [];
    let workbook: ReturnType<typeof readXlsxBuffer>;
    try {
        workbook = readXlsxBuffer(buffer);
    } catch {
        return {
            ok: false,
            session: null,
            questionPreview: {
                ok: false,
                rowCount: 0,
                validRows: [],
                errors: [{ row: 0, message: 'File Excel tidak bisa dibaca.' }],
                sectionCounts: { MOJI_GOI: 0, BUNPOU_DOKKAI: 0, CHOKAI: 0 },
            },
            warnings,
        };
    }

    if (!isWorkbookMode(workbook)) {
        return {
            ok: false,
            session: null,
            questionPreview: {
                ok: false,
                rowCount: 0,
                validRows: [],
                errors: [{ row: 0, message: 'Tab Info Sesi tidak ditemukan. Gunakan formulir tryout lengkap.' }],
                sectionCounts: { MOJI_GOI: 0, BUNPOU_DOKKAI: 0, CHOKAI: 0 },
            },
            warnings,
        };
    }

    if (resolveSheetName(workbook, ['chokai', '4. chokai', 'mendengarkan'])) {
        warnings.push('Tab Chokai (mendengarkan) diabaikan — kelola audio terpisah di admin.');
    }

    const sesiSheet = sheetToRecords(workbook, ['info sesi', '1. info sesi', 'sesi'], [
        'judul_sesi',
        'kode_sesi',
    ]);
    if ('error' in sesiSheet) {
        return {
            ok: false,
            session: null,
            questionPreview: {
                ok: false,
                rowCount: 0,
                validRows: [],
                errors: [{ row: 0, message: sesiSheet.error }],
                sectionCounts: { MOJI_GOI: 0, BUNPOU_DOKKAI: 0, CHOKAI: 0 },
            },
            warnings,
        };
    }

    if (sesiSheet.records.length === 0) {
        return {
            ok: false,
            session: null,
            questionPreview: {
                ok: false,
                rowCount: 0,
                validRows: [],
                errors: [{ row: 0, message: 'Tab Info Sesi: isi minimal satu baris.' }],
                sectionCounts: { MOJI_GOI: 0, BUNPOU_DOKKAI: 0, CHOKAI: 0 },
            },
            warnings,
        };
    }

    const sessionResult = parseSessionRow(sesiSheet.records[0]!, sesiSheet.headerRow + 1);
    if ('errors' in sessionResult) {
        return {
            ok: false,
            session: null,
            questionPreview: {
                ok: false,
                rowCount: 0,
                validRows: [],
                errors: sessionResult.errors,
                sectionCounts: { MOJI_GOI: 0, BUNPOU_DOKKAI: 0, CHOKAI: 0 },
            },
            warnings,
        };
    }

    const rows: TryoutImportRow[] = [];
    const errors: { row: number; message: string }[] = [];

    const mojiSheet = sheetToRecords(workbook, ['kosakata_kanji', '2. kosakata & kanji', 'moji_goi'], [
        'pertanyaan',
    ]);
    if (!('error' in mojiSheet)) {
        const tab = stripSheetPrefix(resolveSheetName(workbook, ['2. kosakata & kanji', 'kosakata']) ?? 'Kosakata & Kanji');
        const result = validateTryoutQuestionRecords(mojiSheet.records, 'MOJI_GOI', mojiSheet.headerRow, tab);
        rows.push(...result.validRows);
        errors.push(...result.errors);
    }

    const bunpouSheet = sheetToRecords(workbook, [
        'tata_bahasa_membaca',
        '3. tata bahasa & membaca',
        'bunpou_dokkai',
    ], ['pertanyaan']);
    if (!('error' in bunpouSheet)) {
        const tab =
            stripSheetPrefix(
                resolveSheetName(workbook, ['3. tata bahasa & membaca', 'tata bahasa']) ?? 'Tata Bahasa & Membaca',
            );
        const result = validateTryoutQuestionRecords(
            bunpouSheet.records,
            'BUNPOU_DOKKAI',
            bunpouSheet.headerRow,
            tab,
        );
        rows.push(...result.validRows);
        errors.push(...result.errors);
    }

    const sectionCounts = { MOJI_GOI: 0, BUNPOU_DOKKAI: 0, CHOKAI: 0 as const };
    for (const row of rows) sectionCounts[row.section] += 1;

    const questionPreview: TryoutImportPreview = {
        ok: errors.length === 0 && rows.length > 0,
        rowCount: rows.length,
        validRows: rows,
        errors,
        sectionCounts,
    };

    return {
        ok: questionPreview.ok,
        session: sessionResult.session,
        questionPreview,
        warnings,
    };
}

export async function importTryoutWorkbook(
    db: PrismaClient,
    buffer: Buffer,
): Promise<{ ok: boolean; message: string; sessionId?: string; imported: number }> {
    const preview = previewTryoutWorkbookImport(buffer);
    if (!preview.ok || !preview.session) {
        const first = preview.questionPreview.errors[0]?.message ?? 'Validasi gagal.';
        return { ok: false, message: first, imported: 0 };
    }

    const { session } = preview;
    const rows = preview.questionPreview.validRows;

    const sessionRow = await db.$transaction(async (tx) => {
        const upserted = await tx.tryoutSession.upsert({
            where: { code: session.code },
            create: {
                code: session.code,
                title: session.title,
                phaseLabel: session.phaseLabel,
                description: session.description,
                scheduledAt: session.scheduledAt,
                timeLimitMinutes: session.timeLimitMinutes,
                sortOrder: session.sortOrder,
                isActive: session.isActive,
            },
            update: {
                title: session.title,
                phaseLabel: session.phaseLabel,
                description: session.description,
                scheduledAt: session.scheduledAt,
                timeLimitMinutes: session.timeLimitMinutes,
                sortOrder: session.sortOrder,
                isActive: session.isActive,
            },
        });

        await tx.question.deleteMany({
            where: {
                tryoutSessionId: upserted.id,
                tryoutLevel: session.level,
                type: 'TRYOUT',
            },
        });

        return upserted;
    });

    const result = await importTryoutQuestions(db, {
        sessionId: sessionRow.id,
        level: session.level,
        rows,
        replaceExisting: false,
    });

    return {
        ok: true,
        message: `Sesi "${session.title}" dan ${result.imported} soal berhasil diimpor.`,
        sessionId: sessionRow.id,
        imported: result.imported,
    };
}