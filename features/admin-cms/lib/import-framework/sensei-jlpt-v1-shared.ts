import type { CourseImportPreview } from '@/features/admin-cms/lib/course-import-types';
import { MAX_IMPORT_BYTES, MAX_IMPORT_ROWS } from '@/features/admin-cms/lib/course-import-types';
import { readXlsxBuffer, sheetFirstRowToRecords } from '@/features/admin-cms/lib/xlsx-workbook';
import { detectSenseiLevel, getSenseiManifest } from '@/prisma/lib/sensei-import-manifests';
import type { SenseiImportManifest, SenseiLevel } from '@/prisma/lib/sensei-import-manifests/types';
import { N4_KANJI_CATEGORIES, N4_KOSAKATA_CATEGORIES, N4_TATA_BAHASA_CATEGORIES } from '@/prisma/lib/n4-curriculum';
import { N5_KANJI_CATEGORIES, N5_KOSAKATA_CATEGORIES, N5_TATA_BAHASA_CATEGORIES } from '@/prisma/lib/n5-curriculum';

export type SenseiRowRecord = Record<string, string | number>;

export function emptyCourseImportPreview(): Omit<CourseImportPreview, 'ok'> {
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

export function toText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export function isDataRow(no: unknown): boolean {
  const text = toText(no);
  return /^\d+$/.test(text);
}

export function parseQuizOptions(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\d+[\.\)]\s*/, '').trim())
    .filter(Boolean);
}

export function parseCorrectAnswer(raw: string, options: string[]): number {
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

export function buildCategorySets(level: SenseiLevel) {
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

function collectUnknownCategoryWarnings(
  records: SenseiRowRecord[],
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
  return [...counts.entries()].map(
    ([category, count]) =>
      `Kategori ${label} "${category}" (${count} baris) belum terdaftar di kurikulum — baris dilewati saat impor.`,
  );
}

function countImportableCategoryRows(
  records: SenseiRowRecord[],
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

export type ParsedSenseiJlptWorkbook =
  | {
      ok: false;
      preview: CourseImportPreview;
      manifest?: undefined;
      sheets?: undefined;
      level?: undefined;
    }
  | {
      ok: true;
      preview: CourseImportPreview;
      manifest: SenseiImportManifest;
      sheets: {
        kanji: SenseiRowRecord[];
        kosakata: SenseiRowRecord[];
        tataBahasa: SenseiRowRecord[];
        quiz1: SenseiRowRecord[];
        quiz2: SenseiRowRecord[];
        placement: SenseiRowRecord[];
        tryout: SenseiRowRecord[];
      };
      level: SenseiLevel;
    };

export async function parseSenseiJlptWorkbook(
  buffer: Buffer,
): Promise<ParsedSenseiJlptWorkbook> {
  if (buffer.byteLength > MAX_IMPORT_BYTES) {
    return {
      ok: false,
      preview: {
        ok: false,
        ...emptyCourseImportPreview(),
        errors: [{ row: 0, message: 'File terlalu besar (maks. 10 MB).' }],
      },
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
        ...emptyCourseImportPreview(),
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
        ...emptyCourseImportPreview(),
        errors: [
          {
            row: 0,
            message: 'Level workbook tidak dikenali. Gunakan format sensei N4.xlsx atau N5.xlsx.',
          },
        ],
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
        ...emptyCourseImportPreview(),
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
        ...emptyCourseImportPreview(),
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

  const moduleCount = level === 'N5' ? 6 : 5;
  const lessonCount = sets.kanji.size + sets.kosakata.size + sets.tataBahasa.size + (level === 'N5' ? 4 : 3);

  return {
    ok: true,
    manifest,
    sheets,
    level,
    preview: {
      ok: true,
      rowCount,
      courseCount: 1,
      moduleCount,
      lessonCount,
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
          moduleCount,
          lessonCount,
        },
      ],
      errors: [],
      warnings,
    },
  };
}
