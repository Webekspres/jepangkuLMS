import type { PrismaClient } from '@prisma/client';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { importSenseiCourseXlsx } from '@/features/admin-cms/lib/import-sensei-course-xlsx';

const DEFAULT_XLSX = path.join(
    process.cwd(),
    'docs',
    'Materi LMS JepangKu - Nihongo.xlsx',
);

export type ImportMateriResult = {
    kanji: number;
    kosakata: number;
    tataBahasa: number;
    quiz1: number;
    quiz2: number;
    placement: number;
    tryout: number;
    categories: number;
    lessons: number;
};

export type ImportMateriOptions = {
    filePath?: string;
    courseSlug?: string;
    limit?: number;
};

export async function importMateriFromXlsx(
    prisma: PrismaClient,
    options: ImportMateriOptions = {},
): Promise<ImportMateriResult | null> {
    const filePath = options.filePath ?? process.env.MATERI_XLSX_PATH ?? DEFAULT_XLSX;
    const limit =
        options.limit ??
        (process.env.MATERI_IMPORT_LIMIT
            ? Number.parseInt(process.env.MATERI_IMPORT_LIMIT, 10)
            : undefined);

    let buffer: Buffer;
    try {
        buffer = await fs.readFile(filePath);
    } catch {
        console.warn(`Workbook materi tidak ditemukan di "${filePath}" — lewati impor Excel.`);
        return null;
    }

    console.log(`Import materi dari: ${filePath}${limit ? ` (limit ${limit}/sheet)` : ''}`);
    const imported = await importSenseiCourseXlsx(prisma, buffer);
    if (!imported.ok) {
        const firstError = imported.errors?.[0]?.message ?? 'Validasi workbook sensei gagal.';
        throw new Error(firstError);
    }

    const row = imported.imported[0];
    if (!row) return null;
    return {
        kanji: row.kanjiCount,
        kosakata: row.kosakataCount,
        tataBahasa: row.tataBahasaCount,
        quiz1: 0,
        quiz2: 0,
        placement: 0,
        tryout: row.questionCount,
        categories: 0,
        lessons: row.lessonCount,
    };
}

export function describeMateriMapping() {
    return {
        workbook: DEFAULT_XLSX,
        strategy: 'Delegasi ke importer sensei N4/N5 yang sama dengan admin import.',
    };
}
