import { z } from 'zod';
import { levelJlptSchema, slugSchema } from '@/lib/validations/shared';
import {
  dedupeSlugInSet,
  resolveSlugInput,
} from '@/lib/lms/slug';
import { csvRowsToRecords, parseCsv } from '@/lib/csv/parse-csv';
import {
  courseSyllabusTreeSchema,
  importCourseSyllabusTree,
  type CourseSyllabusTree,
  type ImportSyllabusTreeResult,
} from '@/prisma/lib/import-syllabus-tree';
import type { PrismaClient } from '@prisma/client';

export const CSV_ROW_TYPES = ['lesson', 'kosakata', 'kanji', 'tatabahasa', 'quiz'] as const;
export type CsvRowType = (typeof CSV_ROW_TYPES)[number];

/** Kolom format flat CSV — baris `lesson` untuk struktur, baris lain untuk materi/kuis. */
export const COURSE_CSV_COLUMNS = [
  'row_type',
  'course_slug',
  'course_title',
  'course_level',
  'course_description',
  'course_published',
  'module_slug',
  'module_title',
  'module_order',
  'module_description',
  'lesson_slug',
  'lesson_title',
  'lesson_order',
  'lesson_content',
  'lesson_video_url',
  'fc_kosakata',
  'fc_furigana',
  'fc_romaji',
  'fc_arti',
  'fc_contoh_kalimat',
  'fc_kanji',
  'fc_kanji_furigana',
  'fc_kanji_romaji',
  'fc_kanji_arti',
  'fc_onyomi',
  'fc_kunyomi',
  'fc_tata_bahasa',
  'fc_tb_arti',
  'fc_tb_contoh',
  'quiz_question',
  'quiz_explanation',
  'quiz_xp',
  'quiz_option_1',
  'quiz_option_2',
  'quiz_option_3',
  'quiz_option_4',
  'quiz_correct_option',
] as const;

const REQUIRED_CSV_COLUMNS = [
  'course_title',
  'course_level',
  'module_title',
  'module_order',
  'lesson_title',
  'lesson_order',
] as const;

function parseExplicitCsvSlug(
  value: string | undefined,
  rowNumber: number,
  field: string,
): { ok: true; slug?: string } | { ok: false; error: CsvImportRowError } {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return { ok: true, slug: undefined };
  const parsed = slugSchema.safeParse(trimmed);
  if (!parsed.success) {
    return {
      ok: false,
      error: { row: rowNumber, message: `${field}: ${parsed.error.issues[0]?.message}` },
    };
  }
  return { ok: true, slug: parsed.data };
}

const optionalText = z.string().trim().optional().or(z.literal(''));
const optionalUrl = optionalText.refine(
  (val) => !val || z.string().url().safeParse(val).success,
  'URL tidak valid',
);

export type LessonCsvRow = {
  rowType: 'lesson';
  rowNumber: number;
  course_slug: string;
  course_title: string;
  course_level: z.infer<typeof levelJlptSchema>;
  course_description?: string;
  course_published?: string;
  module_slug: string;
  module_title: string;
  module_order: number;
  module_description?: string;
  lesson_slug: string;
  lesson_title: string;
  lesson_order: number;
  lesson_content?: string;
  lesson_video_url?: string;
};

export type KosakataCsvRow = {
  rowType: 'kosakata';
  rowNumber: number;
  lesson_slug: string;
  kosakata: string;
  furigana?: string;
  romaji?: string;
  arti: string;
  contohKalimat?: string;
};

export type KanjiCsvRow = {
  rowType: 'kanji';
  rowNumber: number;
  lesson_slug: string;
  huruf: string;
  furigana?: string;
  romaji?: string;
  arti: string;
  onyomi?: string;
  kunyomi?: string;
};

export type TataBahasaCsvRow = {
  rowType: 'tatabahasa';
  rowNumber: number;
  lesson_slug: string;
  tataBahasa: string;
  arti: string;
  contohKalimat?: string;
};

export type QuizCsvRow = {
  rowType: 'quiz';
  rowNumber: number;
  lesson_slug: string;
  questionText: string;
  explanation?: string;
  xpReward: number;
  options: Array<{ text: string; isCorrect: boolean }>;
};

export type ParsedCsvRow =
  | LessonCsvRow
  | KosakataCsvRow
  | KanjiCsvRow
  | TataBahasaCsvRow
  | QuizCsvRow;

export type CsvImportRowError = {
  row: number;
  message: string;
};

export type CsvImportPreview = {
  ok: boolean;
  rowCount: number;
  courseCount: number;
  moduleCount: number;
  lessonCount: number;
  kosakataCount: number;
  kanjiCount: number;
  tataBahasaCount: number;
  questionCount: number;
  courses: Array<{
    slug: string;
    title: string;
    level: string;
    isPublished: boolean;
    moduleCount: number;
    lessonCount: number;
  }>;
  errors: CsvImportRowError[];
  warnings: string[];
};

export type CsvImportResult = {
  ok: boolean;
  preview: CsvImportPreview;
  imported: ImportSyllabusTreeResult[];
  errors: CsvImportRowError[];
};

const MAX_CSV_ROWS = 5000;
const MAX_CSV_BYTES = 5 * 1024 * 1024;

const emptyPreview = (): Omit<CsvImportPreview, 'ok' | 'errors' | 'warnings'> => ({
  rowCount: 0,
  courseCount: 0,
  moduleCount: 0,
  lessonCount: 0,
  kosakataCount: 0,
  kanjiCount: 0,
  tataBahasaCount: 0,
  questionCount: 0,
  courses: [],
});

function parsePublished(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'ya', 'published'].includes(normalized);
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeRowType(value: string | undefined): CsvRowType | null {
  const normalized = (value ?? 'lesson').trim().toLowerCase();
  if (CSV_ROW_TYPES.includes(normalized as CsvRowType)) {
    return normalized as CsvRowType;
  }
  return null;
}

function parseQuizOptions(
  record: Record<string, string>,
  rowNumber: number,
): { options: QuizCsvRow['options'] } | { error: CsvImportRowError } {
  const options = [
    emptyToUndefined(record.quiz_option_1),
    emptyToUndefined(record.quiz_option_2),
    emptyToUndefined(record.quiz_option_3),
    emptyToUndefined(record.quiz_option_4),
  ].filter((opt): opt is string => Boolean(opt));

  if (options.length < 2) {
    return {
      error: {
        row: rowNumber,
        message: 'Baris quiz membutuhkan minimal quiz_option_1 dan quiz_option_2.',
      },
    };
  }

  const correctRaw = emptyToUndefined(record.quiz_correct_option);
  const correctIndex = correctRaw ? Number.parseInt(correctRaw, 10) : Number.NaN;
  if (!Number.isInteger(correctIndex) || correctIndex < 1 || correctIndex > options.length) {
    return {
      error: {
        row: rowNumber,
        message: `quiz_correct_option harus angka 1–${options.length}.`,
      },
    };
  }

  return {
    options: options.map((text, index) => ({
      text,
      isCorrect: index + 1 === correctIndex,
    })),
  };
}

function parseCsvRow(
  record: Record<string, string>,
  rowNumber: number,
): { ok: true; data: ParsedCsvRow } | { ok: false; error: CsvImportRowError } {
  const rowType = normalizeRowType(record.row_type);
  if (!rowType) {
    return {
      ok: false,
      error: {
        row: rowNumber,
        message: `row_type "${record.row_type}" tidak dikenal. Gunakan: ${CSV_ROW_TYPES.join(', ')}.`,
      },
    };
  }

  const lessonSlugInput = parseExplicitCsvSlug(record.lesson_slug, rowNumber, 'lesson_slug');
  if (!lessonSlugInput.ok) {
    return { ok: false, error: lessonSlugInput.error };
  }

  if (rowType === 'lesson') {
    const courseSlugInput = parseExplicitCsvSlug(record.course_slug, rowNumber, 'course_slug');
    if (!courseSlugInput.ok) {
      return { ok: false, error: courseSlugInput.error };
    }
    const moduleSlugInput = parseExplicitCsvSlug(record.module_slug, rowNumber, 'module_slug');
    if (!moduleSlugInput.ok) {
      return { ok: false, error: moduleSlugInput.error };
    }

    const parsed = z
      .object({
        course_title: z.string().trim().min(1, 'course_title wajib diisi').max(200),
        course_level: levelJlptSchema,
        course_description: optionalText,
        course_published: optionalText,
        module_title: z.string().trim().min(1, 'module_title wajib diisi').max(200),
        module_order: z.coerce.number().int().min(1).max(999),
        module_description: optionalText,
        lesson_title: z.string().trim().min(1, 'lesson_title wajib diisi').max(200),
        lesson_order: z.coerce.number().int().min(1).max(9999),
        lesson_content: optionalText,
        lesson_video_url: optionalUrl,
      })
      .safeParse(record);

    if (!parsed.success) {
      const message = Object.entries(parsed.error.flatten().fieldErrors)
        .map(([field, msgs]) => `${field}: ${(msgs ?? []).join(', ')}`)
        .join('; ');
      return { ok: false, error: { row: rowNumber, message: message || 'Baris lesson tidak valid' } };
    }

    const course_slug = resolveSlugInput(
      courseSlugInput.slug,
      parsed.data.course_title,
      'kursus',
    );
    const module_slug = resolveSlugInput(
      moduleSlugInput.slug,
      parsed.data.module_title,
      'modul',
      parsed.data.module_order,
    );
    const lesson_slug = resolveSlugInput(
      lessonSlugInput.slug,
      parsed.data.lesson_title,
      'pelajaran',
      parsed.data.lesson_order,
    );

    return {
      ok: true,
      data: {
        rowType: 'lesson',
        rowNumber,
        course_slug,
        module_slug,
        lesson_slug,
        ...parsed.data,
      },
    };
  }

  if (!lessonSlugInput.slug) {
    return {
      ok: false,
      error: {
        row: rowNumber,
        message: 'lesson_slug wajib diisi untuk baris materi/kuis (gunakan slug dari baris lesson terkait).',
      },
    };
  }

  const lesson_slug = lessonSlugInput.slug;

  if (rowType === 'kosakata') {
    const kosakata = emptyToUndefined(record.fc_kosakata);
    const arti = emptyToUndefined(record.fc_arti);
    if (!kosakata || !arti) {
      return {
        ok: false,
        error: { row: rowNumber, message: 'Baris kosakata membutuhkan fc_kosakata dan fc_arti.' },
      };
    }
    return {
      ok: true,
      data: {
        rowType: 'kosakata',
        rowNumber,
        lesson_slug,
        kosakata,
        arti,
        furigana: emptyToUndefined(record.fc_furigana),
        romaji: emptyToUndefined(record.fc_romaji),
        contohKalimat: emptyToUndefined(record.fc_contoh_kalimat),
      },
    };
  }

  if (rowType === 'kanji') {
    const huruf = emptyToUndefined(record.fc_kanji);
    const arti = emptyToUndefined(record.fc_kanji_arti);
    if (!huruf || !arti) {
      return {
        ok: false,
        error: { row: rowNumber, message: 'Baris kanji membutuhkan fc_kanji dan fc_kanji_arti.' },
      };
    }
    return {
      ok: true,
      data: {
        rowType: 'kanji',
        rowNumber,
        lesson_slug,
        huruf,
        arti,
        furigana: emptyToUndefined(record.fc_kanji_furigana),
        romaji: emptyToUndefined(record.fc_kanji_romaji),
        onyomi: emptyToUndefined(record.fc_onyomi),
        kunyomi: emptyToUndefined(record.fc_kunyomi),
      },
    };
  }

  if (rowType === 'tatabahasa') {
    const tataBahasa = emptyToUndefined(record.fc_tata_bahasa);
    const arti = emptyToUndefined(record.fc_tb_arti);
    if (!tataBahasa || !arti) {
      return {
        ok: false,
        error: {
          row: rowNumber,
          message: 'Baris tatabahasa membutuhkan fc_tata_bahasa dan fc_tb_arti.',
        },
      };
    }
    return {
      ok: true,
      data: {
        rowType: 'tatabahasa',
        rowNumber,
        lesson_slug,
        tataBahasa,
        arti,
        contohKalimat: emptyToUndefined(record.fc_tb_contoh),
      },
    };
  }

  const questionText = emptyToUndefined(record.quiz_question);
  if (!questionText) {
    return {
      ok: false,
      error: { row: rowNumber, message: 'Baris quiz membutuhkan quiz_question.' },
    };
  }

  const optionsResult = parseQuizOptions(record, rowNumber);
  if ('error' in optionsResult) {
    return { ok: false, error: optionsResult.error };
  }

  const xpParsed = z.coerce.number().int().min(1).max(1000).safeParse(record.quiz_xp || '10');
  if (!xpParsed.success) {
    return { ok: false, error: { row: rowNumber, message: 'quiz_xp tidak valid (1–1000).' } };
  }

  return {
    ok: true,
    data: {
      rowType: 'quiz',
      rowNumber,
      lesson_slug,
      questionText,
      explanation: emptyToUndefined(record.quiz_explanation),
      xpReward: xpParsed.data,
      options: optionsResult.options,
    },
  };
}

type LessonAttachments = {
  kosakatas: KosakataCsvRow[];
  kanjis: KanjiCsvRow[];
  tataBahasas: TataBahasaCsvRow[];
  questions: QuizCsvRow[];
};

function emptyAttachments(): LessonAttachments {
  return { kosakatas: [], kanjis: [], tataBahasas: [], questions: [] };
}

/** Assign globally unique lesson slugs; remap attachment rows. */
function normalizeImportSlugs(
  parsedRows: ParsedCsvRow[],
): { ok: true; rows: ParsedCsvRow[] } | { ok: false; errors: CsvImportRowError[] } {
  const errors: CsvImportRowError[] = [];
  const usedLessonSlugs = new Set<string>();
  const lessonRefMap = new Map<string, string>();

  const normalizedLessonRows: LessonCsvRow[] = [];

  for (const row of parsedRows) {
    if (row.rowType !== 'lesson') continue;

    const lessonBase = row.lesson_slug;
    const lesson_slug = dedupeSlugInSet(lessonBase, usedLessonSlugs);
    if (!lessonRefMap.has(lessonBase)) {
      lessonRefMap.set(lessonBase, lesson_slug);
    }
    lessonRefMap.set(lesson_slug, lesson_slug);

    normalizedLessonRows.push({
      ...row,
      lesson_slug,
    });
  }

  const normalizedRows: ParsedCsvRow[] = [...normalizedLessonRows];

  for (const row of parsedRows) {
    if (row.rowType === 'lesson') continue;

    const resolved = lessonRefMap.get(row.lesson_slug);
    if (!resolved) {
      errors.push({
        row: row.rowNumber,
        message: `lesson_slug "${row.lesson_slug}" tidak ditemukan pada baris lesson di file ini.`,
      });
      continue;
    }

    normalizedRows.push({ ...row, lesson_slug: resolved });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, rows: normalizedRows };
}

function countAttachments(rows: ParsedCsvRow[]) {
  return rows.reduce(
    (acc, row) => {
      if (row.rowType === 'kosakata') acc.kosakataCount += 1;
      if (row.rowType === 'kanji') acc.kanjiCount += 1;
      if (row.rowType === 'tatabahasa') acc.tataBahasaCount += 1;
      if (row.rowType === 'quiz') acc.questionCount += 1;
      return acc;
    },
    { kosakataCount: 0, kanjiCount: 0, tataBahasaCount: 0, questionCount: 0 },
  );
}

export function parseCourseCsvText(csvText: string): {
  records: Record<string, string>[];
  missingColumns: string[];
} {
  const { headers, rows } = parseCsv(csvText);
  if (headers.length === 0) {
    return { records: [], missingColumns: [...REQUIRED_CSV_COLUMNS] };
  }

  const missingColumns = REQUIRED_CSV_COLUMNS.filter((col) => !headers.includes(col));
  const records = csvRowsToRecords(headers, rows);

  return { records, missingColumns };
}

function parseValidatedRows(csvText: string):
  | { ok: true; parsedRows: ParsedCsvRow[]; rowCount: number }
  | { ok: false; errors: CsvImportRowError[]; rowCount: number } {
  const { records, missingColumns } = parseCourseCsvText(csvText);
  if (missingColumns.length > 0) {
    return {
      ok: false,
      rowCount: 0,
      errors: [{ row: 1, message: `Kolom wajib hilang: ${missingColumns.join(', ')}` }],
    };
  }
  if (records.length === 0) {
    return { ok: false, rowCount: 0, errors: [{ row: 0, message: 'CSV tidak memiliki baris data.' }] };
  }

  const errors: CsvImportRowError[] = [];
  const parsedRows: ParsedCsvRow[] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const parsed = parseCsvRow(record, rowNumber);
    if (!parsed.ok) {
      errors.push(parsed.error);
      return;
    }
    parsedRows.push(parsed.data);
  });

  if (errors.length > 0) {
    return { ok: false, rowCount: records.length, errors };
  }

  const lessonRows = parsedRows.filter((row): row is LessonCsvRow => row.rowType === 'lesson');
  if (lessonRows.length === 0) {
    return {
      ok: false,
      rowCount: records.length,
      errors: [{ row: 0, message: 'CSV harus memiliki minimal satu baris row_type=lesson.' }],
    };
  }

  const moduleLessonKeys = new Map<string, number>();
  for (const row of lessonRows) {
    const key = `${row.course_slug}|${row.module_slug}|${row.lesson_slug}`;
    if (moduleLessonKeys.has(key)) {
      errors.push({
        row: row.rowNumber,
        message: `lesson_slug "${row.lesson_slug}" duplikat dalam modul "${row.module_slug}" (baris ${moduleLessonKeys.get(key)}).`,
      });
    } else {
      moduleLessonKeys.set(key, row.rowNumber);
    }
  }

  if (errors.length > 0) {
    return { ok: false, rowCount: records.length, errors };
  }

  const normalized = normalizeImportSlugs(parsedRows);
  if (!normalized.ok) {
    return { ok: false, rowCount: records.length, errors: normalized.errors };
  }

  const normalizedLessonRows = normalized.rows.filter(
    (row): row is LessonCsvRow => row.rowType === 'lesson',
  );

  const lessonSlugs = new Map<string, number>();
  for (const row of normalizedLessonRows) {
    if (lessonSlugs.has(row.lesson_slug)) {
      errors.push({
        row: row.rowNumber,
        message: `lesson_slug "${row.lesson_slug}" duplikat (baris ${lessonSlugs.get(row.lesson_slug)}).`,
      });
    } else {
      lessonSlugs.set(row.lesson_slug, row.rowNumber);
    }
  }

  for (const row of normalized.rows) {
    if (row.rowType === 'lesson') continue;
    if (!lessonSlugs.has(row.lesson_slug)) {
      errors.push({
        row: row.rowNumber,
        message: `lesson_slug "${row.lesson_slug}" tidak ditemukan pada baris lesson di file ini.`,
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, rowCount: records.length, errors };
  }

  return { ok: true, parsedRows: normalized.rows, rowCount: records.length };
}

export function previewCourseCsvImport(csvText: string): CsvImportPreview {
  const byteLength = new TextEncoder().encode(csvText).byteLength;
  if (byteLength > MAX_CSV_BYTES) {
    return {
      ok: false,
      ...emptyPreview(),
      errors: [{ row: 0, message: `File terlalu besar (maks. ${MAX_CSV_BYTES / 1024 / 1024} MB).` }],
      warnings: [],
    };
  }

  const parsed = parseValidatedRows(csvText);
  if (!parsed.ok) {
    return {
      ok: false,
      ...emptyPreview(),
      rowCount: parsed.rowCount,
      errors: parsed.errors,
      warnings: [],
    };
  }

  if (parsed.rowCount > MAX_CSV_ROWS) {
    return {
      ok: false,
      ...emptyPreview(),
      rowCount: parsed.rowCount,
      errors: [{ row: 0, message: `Terlalu banyak baris (maks. ${MAX_CSV_ROWS}).` }],
      warnings: [],
    };
  }

  const warnings: string[] = [];
  const treesResult = buildTreesFromRows(parsed.parsedRows, warnings);
  if ('errors' in treesResult) {
    return {
      ok: false,
      ...emptyPreview(),
      rowCount: parsed.rowCount,
      errors: treesResult.errors,
      warnings,
    };
  }

  const { trees, publishedBySlug } = treesResult;
  const materialCounts = countAttachments(parsed.parsedRows);

  const courses = trees.map((tree) => ({
    slug: tree.course.slug,
    title: tree.course.title,
    level: tree.course.level,
    isPublished: publishedBySlug[tree.course.slug] ?? false,
    moduleCount: tree.course.modules.length,
    lessonCount: tree.course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0),
  }));

  const moduleCount = courses.reduce((sum, course) => sum + course.moduleCount, 0);
  const lessonCount = courses.reduce((sum, course) => sum + course.lessonCount, 0);

  return {
    ok: true,
    rowCount: parsed.rowCount,
    courseCount: courses.length,
    moduleCount,
    lessonCount,
    ...materialCounts,
    courses,
    errors: [],
    warnings,
  };
}

function buildTreesFromRows(
  parsedRows: ParsedCsvRow[],
  warnings: string[],
):
  | { trees: CourseSyllabusTree[]; publishedBySlug: Record<string, boolean> }
  | { errors: CsvImportRowError[] } {
  const errors: CsvImportRowError[] = [];
  const lessonRows = parsedRows.filter((row): row is LessonCsvRow => row.rowType === 'lesson');

  const attachmentsByLesson = new Map<string, LessonAttachments>();
  for (const row of parsedRows) {
    if (row.rowType === 'lesson') continue;
    const bucket = attachmentsByLesson.get(row.lesson_slug) ?? emptyAttachments();
    if (row.rowType === 'kosakata') bucket.kosakatas.push(row);
    if (row.rowType === 'kanji') bucket.kanjis.push(row);
    if (row.rowType === 'tatabahasa') bucket.tataBahasas.push(row);
    if (row.rowType === 'quiz') bucket.questions.push(row);
    attachmentsByLesson.set(row.lesson_slug, bucket);
  }

  const courseMap = new Map<
    string,
    {
      meta: {
        title: string;
        level: LessonCsvRow['course_level'];
        description?: string;
        isPublished: boolean;
      };
      modules: Map<
        string,
        {
          meta: { title: string; order: number; description?: string };
          lessons: Map<string, LessonCsvRow>;
        }
      >;
    }
  >();

  for (const data of lessonRows) {
    const rowNumber = data.rowNumber;
    let course = courseMap.get(data.course_slug);
    const isPublished = parsePublished(data.course_published);

    if (!course) {
      course = {
        meta: {
          title: data.course_title,
          level: data.course_level,
          description: emptyToUndefined(data.course_description),
          isPublished,
        },
        modules: new Map(),
      };
      courseMap.set(data.course_slug, course);
    } else {
      const { meta } = course;
      if (meta.title !== data.course_title) {
        warnings.push(
          `Baris ${rowNumber}: course_title untuk "${data.course_slug}" berbeda — memakai nilai pertama.`,
        );
      }
      if (meta.level !== data.course_level) {
        errors.push({
          row: rowNumber,
          message: `course_level untuk "${data.course_slug}" tidak konsisten.`,
        });
      }
      if ((meta.description ?? '') !== (emptyToUndefined(data.course_description) ?? '')) {
        warnings.push(
          `Baris ${rowNumber}: course_description untuk "${data.course_slug}" berbeda — memakai nilai pertama.`,
        );
      }
      if (meta.isPublished !== isPublished) {
        warnings.push(
          `Baris ${rowNumber}: course_published untuk "${data.course_slug}" berbeda — memakai nilai pertama.`,
        );
      }
    }

    const moduleKey = data.module_slug;
    let mod = course.modules.get(moduleKey);
    if (!mod) {
      mod = {
        meta: {
          title: data.module_title,
          order: data.module_order,
          description: emptyToUndefined(data.module_description),
        },
        lessons: new Map(),
      };
      course.modules.set(moduleKey, mod);
    } else {
      if (mod.meta.title !== data.module_title) {
        warnings.push(
          `Baris ${rowNumber}: module_title untuk "${data.course_slug}/${moduleKey}" berbeda — memakai nilai pertama.`,
        );
      }
      if (mod.meta.order !== data.module_order) {
        errors.push({
          row: rowNumber,
          message: `module_order untuk modul "${moduleKey}" di kursus "${data.course_slug}" tidak konsisten.`,
        });
      }
      if ((mod.meta.description ?? '') !== (emptyToUndefined(data.module_description) ?? '')) {
        warnings.push(
          `Baris ${rowNumber}: module_description untuk "${moduleKey}" berbeda — memakai nilai pertama.`,
        );
      }
    }

    if (mod.lessons.has(data.lesson_slug)) {
      errors.push({
        row: rowNumber,
        message: `lesson_slug "${data.lesson_slug}" duplikat dalam modul "${moduleKey}".`,
      });
      continue;
    }

    const orderTaken = [...mod.lessons.values()].some(
      (lesson) => lesson.lesson_order === data.lesson_order,
    );
    if (orderTaken) {
      errors.push({
        row: rowNumber,
        message: `lesson_order ${data.lesson_order} bentrok di modul "${moduleKey}".`,
      });
      continue;
    }

    mod.lessons.set(data.lesson_slug, data);
  }

  if (errors.length > 0) {
    return { errors };
  }

  const trees: CourseSyllabusTree[] = [];

  for (const [courseSlug, course] of courseMap) {
    const modules = [...course.modules.entries()]
      .map(([moduleSlug, mod]) => ({
        slug: moduleSlug,
        title: mod.meta.title,
        description: mod.meta.description,
        order: mod.meta.order,
        lessons: [...mod.lessons.values()]
          .sort((a, b) => a.lesson_order - b.lesson_order)
          .map((lesson) => {
            const attachments = attachmentsByLesson.get(lesson.lesson_slug) ?? emptyAttachments();
            return {
              slug: lesson.lesson_slug,
              title: lesson.lesson_title,
              order: lesson.lesson_order,
              content: emptyToUndefined(lesson.lesson_content) ?? null,
              videoUrl: emptyToUndefined(lesson.lesson_video_url) ?? null,
              kosakatas: attachments.kosakatas.map((card) => ({
                kosakata: card.kosakata,
                furigana: card.furigana,
                romaji: card.romaji,
                arti: card.arti,
                contohKalimat: card.contohKalimat,
              })),
              kanjis: attachments.kanjis.map((card) => ({
                huruf: card.huruf,
                furigana: card.furigana,
                romaji: card.romaji,
                arti: card.arti,
                onyomi: card.onyomi,
                kunyomi: card.kunyomi,
              })),
              tataBahasas: attachments.tataBahasas.map((card) => ({
                tataBahasa: card.tataBahasa,
                arti: card.arti,
                contohKalimat: card.contohKalimat,
              })),
              questions: attachments.questions.map((question) => ({
                questionText: question.questionText,
                explanation: question.explanation,
                xpReward: question.xpReward,
                options: question.options,
              })),
            };
          }),
      }))
      .sort((a, b) => a.order - b.order);

    const moduleOrders = new Set(modules.map((m) => m.order));
    if (moduleOrders.size !== modules.length) {
      return {
        errors: [
          {
            row: 0,
            message: `module_order duplikat pada kursus "${courseSlug}".`,
          },
        ],
      };
    }

    const tree: CourseSyllabusTree = {
      course: {
        slug: courseSlug,
        title: course.meta.title,
        description: course.meta.description,
        level: course.meta.level,
        modules,
      },
    };

    const validated = courseSyllabusTreeSchema.safeParse(tree);
    if (!validated.success) {
      return {
        errors: [
          {
            row: 0,
            message: `Kursus "${courseSlug}" tidak valid: ${validated.error.message}`,
          },
        ],
      };
    }

    trees.push(validated.data);
  }

  return {
    trees,
    publishedBySlug: Object.fromEntries(
      [...courseMap.entries()].map(([slug, entry]) => [slug, entry.meta.isPublished]),
    ),
  };
}

export async function importCoursesFromCsvText(
  prisma: PrismaClient,
  csvText: string,
): Promise<CsvImportResult> {
  const preview = previewCourseCsvImport(csvText);
  if (!preview.ok) {
    return { ok: false, preview, imported: [], errors: preview.errors };
  }

  const parsed = parseValidatedRows(csvText);
  if (!parsed.ok) {
    return {
      ok: false,
      preview: { ...preview, ok: false, errors: parsed.errors },
      imported: [],
      errors: parsed.errors,
    };
  }

  const warnings: string[] = [];
  const treesResult = buildTreesFromRows(parsed.parsedRows, warnings);
  if ('errors' in treesResult) {
    return {
      ok: false,
      preview: { ...preview, ok: false, errors: treesResult.errors, warnings },
      imported: [],
      errors: treesResult.errors,
    };
  }

  const imported: ImportSyllabusTreeResult[] = [];

  for (const tree of treesResult.trees) {
    const isPublished = treesResult.publishedBySlug[tree.course.slug] ?? false;
    const result = await importCourseSyllabusTree(prisma, tree, { isPublished });
    imported.push(result);
  }

  return {
    ok: true,
    preview: { ...preview, warnings: [...preview.warnings, ...warnings] },
    imported,
    errors: [],
  };
}

export const COURSE_CSV_TEMPLATE = `row_type,course_slug,course_title,course_level,course_description,course_published,module_slug,module_title,module_order,module_description,lesson_slug,lesson_title,lesson_order,lesson_content,lesson_video_url,fc_kosakata,fc_furigana,fc_romaji,fc_arti,fc_contoh_kalimat,fc_kanji,fc_kanji_furigana,fc_kanji_romaji,fc_kanji_arti,fc_onyomi,fc_kunyomi,fc_tata_bahasa,fc_tb_arti,fc_tb_contoh,quiz_question,quiz_explanation,quiz_xp,quiz_option_1,quiz_option_2,quiz_option_3,quiz_option_4,quiz_correct_option
lesson,jlpt-n5-demo,JLPT N5 Demo,N5,Kursus contoh dari impor CSV,false,modul-1,Modul 1 - Pengenalan,1,Pengenalan dasar,pengenalan-aksara,Pengenalan Aksara,1,Belajar hiragana dan katakana,https://www.youtube.com/watch?v=example,,,,,,,,,,,,,,,,,,,,,
kosakata,,,,,,,,,,pengenalan-aksara,,,,,あ,あ,a,Huruf a,,,,,,,,,,,,,,,,,
kosakata,,,,,,,,,,pengenalan-aksara,,,,,い,い,i,Huruf i,,,,,,,,,,,,,,,,,
quiz,,,,,,,,,,pengenalan-aksara,,,,,,,,,,,,,,,,,,,Huruf apa ini: あ?,,10,い,i,あ,う,3
lesson,jlpt-n5-demo,JLPT N5 Demo,N5,Kursus contoh dari impor CSV,false,modul-1,Modul 1 - Pengenalan,1,Pengenalan dasar,kanji-satu,Kanji Satu,2,Belajar kanji dasar,,,,,,,,,,,,,,,,,,,,,,,
kanji,,,,,,,,,,kanji-satu,,,,,,,,,,一,いち,ichi,Satu,いち,ひと/いち,,,,,,,,,,,
quiz,,,,,,,,,,kanji-satu,,,,,,,,,,,,,,,,,,,Arti kanji 一?,,10,Satu,Dua,Tiga,Empat,1
lesson,jlpt-n4-demo,JLPT N4 Demo,N4,Kursus kedua dalam file yang sama,false,modul-grammar,Tata Bahasa Inti,1,Pola dasar N4,te-form,Pengenalan て-form,1,Penjelasan て-form dasar,,,,,,,,,,,,,,,,,,,,,,,
tatabahasa,,,,,,,,,,te-form,,,,,,,,,,,,,,,て-form,Bentuk て dari kata kerja,食べる → 食べて,,,,,,,,
`;
