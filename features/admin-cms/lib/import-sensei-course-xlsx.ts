import type { CourseCategoryType, PrismaClient } from '@prisma/client';
import type { CourseImportPreview, CourseImportResult } from '@/features/admin-cms/lib/course-import-types';
import { MAX_IMPORT_BYTES, MAX_IMPORT_ROWS } from '@/features/admin-cms/lib/course-import-types';
import { readXlsxBuffer, sheetFirstRowToRecords } from '@/features/admin-cms/lib/xlsx-workbook';
import { detectSenseiLevel, getSenseiManifest } from '@/prisma/lib/sensei-import-manifests';
import type { SenseiImportManifest, SenseiLevel } from '@/prisma/lib/sensei-import-manifests/types';
import { categoryLessonSlug as n5CategoryLessonSlug, N5_KANJI_CATEGORIES, N5_KOSAKATA_CATEGORIES, N5_TATA_BAHASA_CATEGORIES } from '@/prisma/lib/n5-curriculum';
import { categoryLessonSlug as n4CategoryLessonSlug, N4_KANJI_CATEGORIES, N4_KOSAKATA_CATEGORIES, N4_TATA_BAHASA_CATEGORIES } from '@/prisma/lib/n4-curriculum';
import { seedN5CourseStructure } from '@/prisma/lib/seed-n5-structure';
import { seedN4CourseStructure } from '@/prisma/lib/seed-n4-structure';

type RowRecord = Record<string, string | number>;

type CourseImportSummary = {
    courseId: string;
    moduleCount: number;
    lessonCount: number;
    kosakataCount: number;
    kanjiCount: number;
    tataBahasaCount: number;
    questionCount: number;
};

function emptyPreview(): Omit<CourseImportPreview, 'ok'> {
    return {
        rowCount: 0,
        courseCount: 0,
        moduleCount: 0,
        lessonCount: 0,
        kosakataCount: 0,
        kanjiCount: 0,
        tataBahasaCount: 0,
        questionCount: 0,
        courses: [],
        errors: [],
        warnings: [],
    };
}

function toText(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

function isDataRow(no: unknown): boolean {
    const text = toText(no);
    return /^\d+$/.test(text);
}

function parseQuizOptions(raw: string): string[] {
    return raw
        .split(/\r?\n/)
        .map((line) => line.replace(/^\s*\d+[\.\)]\s*/, '').trim())
        .filter(Boolean);
}

function parseCorrectAnswer(raw: string, options: string[]): number {
    const trimmed = raw.trim();
    const numberMatch = trimmed.match(/^(\d+)/);
    if (numberMatch) {
        const idx = Number.parseInt(numberMatch[1]!, 10) - 1;
        if (idx >= 0 && idx < options.length) return idx;
    }

    const clean = trimmed.replace(/^\s*\d+[\.\)]\s*/, '').trim().toLowerCase();
    const matched = options.findIndex((opt) => opt.toLowerCase() === clean);
    if (matched >= 0) return matched;

    return -1;
}

function buildCategorySets(level: SenseiLevel) {
    if (level === 'N4') {
        return {
            kanji: new Set<string>(N4_KANJI_CATEGORIES),
            kosakata: new Set<string>(N4_KOSAKATA_CATEGORIES),
            tataBahasa: new Set<string>(N4_TATA_BAHASA_CATEGORIES),
        };
    }

    return {
        kanji: new Set<string>(N5_KANJI_CATEGORIES),
        kosakata: new Set<string>(N5_KOSAKATA_CATEGORIES),
        tataBahasa: new Set<string>(N5_TATA_BAHASA_CATEGORIES),
    };
}

function resolveCategorySlug(level: SenseiLevel, track: 'kanji' | 'kosakata' | 'tata-bahasa', category: string): string {
    return level === 'N4'
        ? n4CategoryLessonSlug(track, category)
        : n5CategoryLessonSlug(track, category);
}

function collectUnknownCategoryWarnings(
    records: RowRecord[],
    noField: string,
    categoryField: string,
    known: Set<string>,
    label: string,
): string[] {
    const counts = new Map<string, number>();
    for (const row of records) {
        if (!isDataRow(row[noField])) continue;
        const category = toText(row[categoryField]) || 'Umum';
        if (known.has(category)) continue;
        counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return [...counts.entries()].map(([category, count]) => `Kategori ${label} "${category}" (${count} baris) belum terdaftar di kurikulum — baris dilewati saat impor.`);
}

function countImportableCategoryRows(
    records: RowRecord[],
    noField: string,
    categoryField: string,
    known: Set<string>,
): number {
    return records.filter((row) => {
        if (!isDataRow(row[noField])) return false;
        const category = toText(row[categoryField]) || 'Umum';
        return known.has(category);
    }).length;
}

async function parseWorkbook(buffer: Buffer): Promise<
    | { ok: false; preview: CourseImportPreview; manifest?: undefined; sheets?: undefined; level?: undefined }
    | { ok: true; preview: CourseImportPreview; manifest: SenseiImportManifest; sheets: Record<string, RowRecord[]>; level: SenseiLevel }
> {
    if (buffer.byteLength > MAX_IMPORT_BYTES) {
        return {
            ok: false,
            preview: { ok: false, ...emptyPreview(), errors: [{ row: 0, message: 'File terlalu besar (maks. 10 MB).' }] },
        };
    }

    let workbook: Awaited<ReturnType<typeof readXlsxBuffer>>;
    try {
        workbook = await readXlsxBuffer(buffer);
    } catch {
        return {
            ok: false,
            preview: {
                ok: false,
                ...emptyPreview(),
                errors: [{ row: 0, message: 'File Excel tidak bisa dibaca. Pastikan format .xlsx.' }],
            },
        };
    }

    const level = detectSenseiLevel(workbook);
    if (!level) {
        return {
            ok: false,
            preview: {
                ok: false,
                ...emptyPreview(),
                errors: [{ row: 0, message: 'Level workbook tidak dikenali. Gunakan format sensei N4.xlsx atau N5.xlsx.' }],
            },
        };
    }

    const manifest = getSenseiManifest(level);
    const sheets = {
        kanji: sheetFirstRowToRecords(workbook, manifest.sheets.kanji),
        kosakata: sheetFirstRowToRecords(workbook, manifest.sheets.kosakata),
        tataBahasa: sheetFirstRowToRecords(workbook, manifest.sheets.tataBahasa),
        quiz1: sheetFirstRowToRecords(workbook, manifest.sheets.quiz1),
        quiz2: sheetFirstRowToRecords(workbook, manifest.sheets.quiz2),
        placement: manifest.sheets.placement ? sheetFirstRowToRecords(workbook, manifest.sheets.placement) : [],
        tryout: sheetFirstRowToRecords(workbook, manifest.sheets.tryout),
    };

    if (sheets.kanji.length === 0 || sheets.kosakata.length === 0 || sheets.tataBahasa.length === 0) {
        return {
            ok: false,
            preview: {
                ok: false,
                ...emptyPreview(),
                errors: [{ row: 0, message: 'Sheet utama (Kanji/Kosakata/Tata Bahasa) kosong atau tidak ditemukan.' }],
            },
        };
    }

    const rowCount =
        sheets.kanji.length +
        sheets.kosakata.length +
        sheets.tataBahasa.length +
        sheets.quiz1.length +
        sheets.quiz2.length +
        sheets.placement.length +
        sheets.tryout.length;

    if (rowCount > MAX_IMPORT_ROWS) {
        return {
            ok: false,
            preview: {
                ok: false,
                ...emptyPreview(),
                errors: [{ row: 0, message: `Terlalu banyak baris (maks. ${MAX_IMPORT_ROWS}).` }],
            },
        };
    }

    const sets = buildCategorySets(level);
    const warnings = [
        ...collectUnknownCategoryWarnings(
            sheets.kanji,
            manifest.columns.kanji.no,
            manifest.columns.kanji.category,
            sets.kanji,
            'kanji',
        ),
        ...collectUnknownCategoryWarnings(
            sheets.kosakata,
            manifest.columns.kosakata.no,
            manifest.columns.kosakata.category,
            sets.kosakata,
            'kosakata',
        ),
        ...collectUnknownCategoryWarnings(
            sheets.tataBahasa,
            manifest.columns.tataBahasa.no,
            manifest.columns.tataBahasa.category,
            sets.tataBahasa,
            'tata bahasa',
        ),
    ];

    const preview: CourseImportPreview = {
        ok: true,
        rowCount,
        courseCount: 1,
        moduleCount: level === 'N5' ? 6 : 5,
        lessonCount: sets.kanji.size + sets.kosakata.size + sets.tataBahasa.size + (level === 'N5' ? 4 : 3),
        kosakataCount: countImportableCategoryRows(
            sheets.kosakata,
            manifest.columns.kosakata.no,
            manifest.columns.kosakata.category,
            sets.kosakata,
        ),
        kanjiCount: countImportableCategoryRows(
            sheets.kanji,
            manifest.columns.kanji.no,
            manifest.columns.kanji.category,
            sets.kanji,
        ),
        tataBahasaCount: countImportableCategoryRows(
            sheets.tataBahasa,
            manifest.columns.tataBahasa.no,
            manifest.columns.tataBahasa.category,
            sets.tataBahasa,
        ),
        questionCount:
            sheets.quiz1.filter((row) => isDataRow(row[manifest.columns.quiz.no])).length +
            sheets.quiz2.filter((row) => isDataRow(row[manifest.columns.quiz.no])).length +
            sheets.placement.filter((row) => isDataRow(row[manifest.columns.quiz.no])).length +
            sheets.tryout.filter((row) => isDataRow(row[manifest.columns.quiz.no])).length,
        courses: [
            {
                slug: manifest.course.slug,
                title: manifest.course.title,
                level: manifest.course.level,
                isPublished: false,
                moduleCount: level === 'N5' ? 6 : 5,
                lessonCount: sets.kanji.size + sets.kosakata.size + sets.tataBahasa.size + (level === 'N5' ? 4 : 3),
            },
        ],
        errors: [],
        warnings,
    };

    return { ok: true, preview, manifest, sheets, level };
}

async function resetLessonContent(prisma: PrismaClient, lessonId: string) {
    await prisma.questionOption.deleteMany({ where: { question: { lessonId } } });
    await prisma.question.deleteMany({ where: { lessonId } });
    await prisma.materialKanji.deleteMany({ where: { lessonId } });
    await prisma.materialKosakata.deleteMany({ where: { lessonId } });
    await prisma.materialTataBahasa.deleteMany({ where: { lessonId } });
}

async function upsertCategory(
    prisma: PrismaClient,
    cache: Map<string, string>,
    category: string,
    type: 'KANJI' | 'KOSAKATA' | 'TATA_BAHASA',
) {
    const key = `${type}:${category}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const row = await prisma.category.upsert({
        where: { name_type: { name: category, type } },
        create: { name: category, type },
        update: {},
    });
    cache.set(key, row.id);
    return row.id;
}

async function ensureCourseAndStructure(
    prisma: PrismaClient,
    level: SenseiLevel,
    manifest: SenseiImportManifest,
) {
    const course = await prisma.course.upsert({
        where: { slug: manifest.course.slug },
        create: {
            slug: manifest.course.slug,
            title: manifest.course.title,
            description: manifest.course.description,
            level: manifest.course.level,
            category: 'KURSUS_UTAMA' as CourseCategoryType,
            isPublished: false,
            outcomes: [],
            priceIdr: 0,
        },
        update: {
            title: manifest.course.title,
            description: manifest.course.description,
            level: manifest.course.level,
        },
    });

    return level === 'N4'
        ? { course, ...(await seedN4CourseStructure(prisma, course.id)) }
        : { course, ...(await seedN5CourseStructure(prisma, course.id)) };
}

export async function previewSenseiCourseImport(buffer: Buffer): Promise<CourseImportPreview> {
    const parsed = await parseWorkbook(buffer);
    return parsed.preview;
}

export async function importSenseiCourseXlsx(
    prisma: PrismaClient,
    buffer: Buffer,
): Promise<CourseImportResult> {
    const parsed = await parseWorkbook(buffer);
    if (!parsed.ok) {
        return { ok: false, preview: parsed.preview, imported: [], errors: parsed.preview.errors };
    }

    const { preview, manifest, sheets, level } = parsed;
    const { course, lessonIdsBySlug, moduleIds } = await ensureCourseAndStructure(prisma, level, manifest);
    const categorySets = buildCategorySets(level);
    const categoryCache = new Map<string, string>();

    const lessonIds = Object.values(lessonIdsBySlug);
    for (const lessonId of lessonIds) {
        await resetLessonContent(prisma, lessonId);
    }

    let kanjiCount = 0;
    let kosakataCount = 0;
    let tataBahasaCount = 0;
    let questionCount = 0;

    for (const row of sheets.kanji) {
        if (!isDataRow(row[manifest.columns.kanji.no])) continue;
        const category = toText(row[manifest.columns.kanji.category]) || 'Umum';
        if (!categorySets.kanji.has(category)) continue;
        const huruf = toText(row[manifest.columns.kanji.huruf]);
        if (!huruf) continue;

        const lessonSlug = resolveCategorySlug(level, 'kanji', category);
        const lessonId = lessonIdsBySlug[lessonSlug];
        if (!lessonId) continue;

        const categoryId = await upsertCategory(prisma, categoryCache, category, 'KANJI');
        await prisma.materialKanji.create({
            data: {
                lessonId,
                categoryId,
                huruf,
                furigana: toText(row[manifest.columns.kanji.furigana]) || null,
                romaji: toText(row[manifest.columns.kanji.romaji]) || null,
                arti: toText(row[manifest.columns.kanji.arti]) || huruf,
                kunyomi: toText(row[manifest.columns.kanji.romajiKunyomi]) || null,
                contohKunyomi: toText(row[manifest.columns.kanji.contohKunyomi]) || null,
                artiKunyomi: toText(row[manifest.columns.kanji.artiKunyomi]) || null,
                onyomi: toText(row[manifest.columns.kanji.romajiOnyomi]) || null,
                contohOnyomi: toText(row[manifest.columns.kanji.contohOnyomi]) || null,
                artiOnyomi: toText(row[manifest.columns.kanji.artiOnyomi]) || null,
                mnemonik: manifest.columns.kanji.mnemonik ? toText(row[manifest.columns.kanji.mnemonik]) || null : null,
                strokeGifUrl: manifest.columns.kanji.strokeGif ? toText(row[manifest.columns.kanji.strokeGif]) || null : null,
            },
        });
        kanjiCount += 1;
    }

    for (const row of sheets.kosakata) {
        if (!isDataRow(row[manifest.columns.kosakata.no])) continue;
        const category = toText(row[manifest.columns.kosakata.category]) || 'Umum';
        if (!categorySets.kosakata.has(category)) continue;
        const kosakata = toText(row[manifest.columns.kosakata.kosakata]);
        if (!kosakata) continue;

        const lessonSlug = resolveCategorySlug(level, 'kosakata', category);
        const lessonId = lessonIdsBySlug[lessonSlug];
        if (!lessonId) continue;

        const categoryId = await upsertCategory(prisma, categoryCache, category, 'KOSAKATA');
        await prisma.materialKosakata.create({
            data: {
                lessonId,
                categoryId,
                kosakata,
                furigana: toText(row[manifest.columns.kosakata.furigana]) || null,
                romaji: toText(row[manifest.columns.kosakata.romaji]) || null,
                arti: toText(row[manifest.columns.kosakata.arti]) || kosakata,
                contohKalimat: toText(row[manifest.columns.kosakata.contohKalimat]) || null,
            },
        });
        kosakataCount += 1;
    }

    for (const row of sheets.tataBahasa) {
        if (!isDataRow(row[manifest.columns.tataBahasa.no])) continue;
        const category = toText(row[manifest.columns.tataBahasa.category]) || 'Umum';
        if (!categorySets.tataBahasa.has(category)) continue;
        const tataBahasa = toText(row[manifest.columns.tataBahasa.tataBahasa]);
        if (!tataBahasa) continue;

        const lessonSlug = resolveCategorySlug(level, 'tata-bahasa', category);
        const lessonId = lessonIdsBySlug[lessonSlug];
        if (!lessonId) continue;

        const categoryId = await upsertCategory(prisma, categoryCache, category, 'TATA_BAHASA');
        await prisma.materialTataBahasa.create({
            data: {
                lessonId,
                categoryId,
                tataBahasa,
                arti: toText(row[manifest.columns.tataBahasa.arti]) || tataBahasa,
                contohKalimat: toText(row[manifest.columns.tataBahasa.contohKalimat]) || null,
            },
        });
        tataBahasaCount += 1;
    }

    const quizSheetMaps: Array<{ rows: RowRecord[]; lessonSlug: string | undefined }> = [
        { rows: sheets.quiz1, lessonSlug: level === 'N4' ? 'kuis-n4-1' : 'kuis-n5-1' },
        { rows: sheets.quiz2, lessonSlug: level === 'N4' ? 'kuis-n4-2' : 'kuis-n5-2' },
        { rows: sheets.placement, lessonSlug: level === 'N5' ? 'tryout-n5-placement' : undefined },
        { rows: sheets.tryout, lessonSlug: level === 'N4' ? 'tryout-n4-simulasi-1' : 'tryout-n5-simulasi-1' },
    ];

    for (const sheet of quizSheetMaps) {
        if (!sheet.lessonSlug) continue;
        const lessonId = lessonIdsBySlug[sheet.lessonSlug];
        if (!lessonId) continue;

        for (const row of sheet.rows) {
            if (!isDataRow(row[manifest.columns.quiz.no])) continue;
            const questionText = toText(row[manifest.columns.quiz.pertanyaan]);
            if (!questionText) continue;
            const optionsRaw = toText(row[manifest.columns.quiz.pilihanJawaban]);
            const options = parseQuizOptions(optionsRaw);
            if (options.length < 2) continue;
            const correctIndex = parseCorrectAnswer(toText(row[manifest.columns.quiz.jawabanBenar]), options);

            await prisma.question.create({
                data: {
                    lessonId,
                    type: sheet.lessonSlug.startsWith('kuis-') ? 'QUIZ' : 'TRYOUT',
                    questionText,
                    explanation: toText(row[manifest.columns.quiz.penjelasan]) || null,
                    options: {
                        create: options.map((text, idx) => ({
                            text,
                            isCorrect: idx === correctIndex,
                        })),
                    },
                },
            });
            questionCount += 1;
        }
    }

    const imported: CourseImportSummary[] = [
        {
            courseId: course.id,
            moduleCount: Object.keys(moduleIds).length,
            lessonCount: Object.keys(lessonIdsBySlug).length,
            kosakataCount,
            kanjiCount,
            tataBahasaCount,
            questionCount,
        },
    ];

    return { ok: true, preview, imported };
}
