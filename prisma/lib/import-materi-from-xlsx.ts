/**
 * Impor materi N5 dari workbook Excel sensei → model Prisma LMS.
 *
 * Strategi:
 * 1. Excel tetap sumber kebenaran konten (mudah diedit tim pedagogis).
 * 2. Setiap baris di-route ke lesson per **Kategori** (kanji/kosakata/tata bahasa).
 * 3. Quiz & tryout tetap dari sheet dedicated.
 *
 * Env opsional:
 * - MATERI_XLSX_PATH — path workbook
 * - MATERI_IMPORT_LIMIT — batas baris per sheet (dev cepat)
 */
import type { PrismaClient } from '@prisma/client';
import type { CategoryType, QuestionType } from '@prisma/client';
import * as path from 'node:path';
import * as XLSX from 'xlsx';
import {
  categoryLessonSlug,
  N5_ALL_LESSONS,
  N5_OBSOLETE_LESSON_SLUGS,
  slugifyCategory,
} from './n5-curriculum';

const DEFAULT_XLSX = path.join(
  process.cwd(),
  'docs',
  'Materi LMS JepangKu - Nihongo.xlsx',
);

const SHEET_KANJI = 'N5 - 漢字 (Kanji)';
const SHEET_KOSAKATA = 'N5 - 語彙 (Kosakata)';
const SHEET_TATA_BAHASA = 'N5 - 文法 (Tata Bahasa)';
const SHEET_QUIZ_1 = 'N5 - Quiz 1';
const SHEET_QUIZ_2 = 'N5 - Quiz 2';
const SHEET_PLACEMENT = 'N5 - Placement Test';
const SHEET_TRYOUT = 'N5 - Try Out 1';

type RowRecord = Record<string, string | number>;

function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function isDataRow(no: unknown): boolean {
  if (typeof no === 'number' && Number.isFinite(no)) return true;
  const text = cell(no);
  return text !== '' && /^\d+$/.test(text);
}

function parseQuizOptions(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
}

function parseCorrectIndex(raw: string): number {
  const match = raw.match(/^(\d+)/);
  if (!match) return -1;
  return Number.parseInt(match[1], 10) - 1;
}

function sheetRows(workbook: XLSX.WorkBook, sheetName: string): RowRecord[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.warn(`  Sheet "${sheetName}" tidak ditemukan — dilewati.`);
    return [];
  }
  return XLSX.utils.sheet_to_json<RowRecord>(sheet, { defval: '' });
}

function applyLimit<T>(rows: T[], limit?: number): T[] {
  if (!limit || limit <= 0) return rows;
  return rows.slice(0, limit);
}

async function upsertCategory(
  prisma: PrismaClient,
  cache: Map<string, string>,
  name: string,
  type: CategoryType,
): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed || trimmed === '-') return null;

  const key = `${type}:${trimmed}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const category = await prisma.category.upsert({
    where: { name_type: { name: trimmed, type } },
    create: { name: trimmed, type },
    update: {},
  });
  cache.set(key, category.id);
  return category.id;
}

async function ensureN5Lessons(
  prisma: PrismaClient,
  courseId: string,
): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};

  for (const lesson of N5_ALL_LESSONS) {
    const row = await prisma.lesson.upsert({
      where: { slug: lesson.slug },
      create: {
        slug: lesson.slug,
        title: lesson.title,
        order: lesson.order,
        content: lesson.content,
        videoUrl: lesson.videoUrl ?? null,
        courseId,
      },
      update: {
        title: lesson.title,
        order: lesson.order,
        content: lesson.content,
        videoUrl: lesson.videoUrl ?? null,
        courseId,
      },
    });
    ids[lesson.slug] = row.id;
  }

  return ids;
}

async function removeObsoleteLessons(prisma: PrismaClient, courseId: string) {
  for (const slug of N5_OBSOLETE_LESSON_SLUGS) {
    const existing = await prisma.lesson.findUnique({ where: { slug } });
    if (existing) {
      await prisma.lesson.delete({ where: { slug } });
      console.log(`  Removed obsolete lesson: ${slug}`);
    }
  }

  const validSlugs = new Set(N5_ALL_LESSONS.map((l) => l.slug));
  const orphans = await prisma.lesson.findMany({
    where: { courseId },
    select: { id: true, slug: true },
  });

  for (const lesson of orphans) {
    if (!validSlugs.has(lesson.slug)) {
      await prisma.lesson.delete({ where: { id: lesson.id } });
      console.log(`  Removed orphan lesson: ${lesson.slug}`);
    }
  }
}

async function resetLessonContent(prisma: PrismaClient, lessonId: string) {
  await prisma.questionOption.deleteMany({
    where: { question: { lessonId } },
  });
  await prisma.question.deleteMany({ where: { lessonId } });
  await prisma.materialKanji.deleteMany({ where: { lessonId } });
  await prisma.materialKosakata.deleteMany({ where: { lessonId } });
  await prisma.materialTataBahasa.deleteMany({ where: { lessonId } });
}

async function importKanjiByCategory(
  prisma: PrismaClient,
  rows: RowRecord[],
  lessonIds: Record<string, string>,
  categoryCache: Map<string, string>,
) {
  const buckets = new Map<string, typeof rows>();

  for (const row of rows) {
    if (!isDataRow(row['No'])) continue;
    const category = cell(row['Kategori']) || 'Umum';
    const list = buckets.get(category) ?? [];
    list.push(row);
    buckets.set(category, list);
  }

  let total = 0;

  for (const [category, categoryRows] of buckets) {
    const slug = categoryLessonSlug('kanji', category);
    const lessonId = lessonIds[slug];
    if (!lessonId) {
      console.warn(`  Kanji category "${category}" → lesson "${slug}" tidak ditemukan, dilewati.`);
      continue;
    }

    const data = [];
    for (const row of categoryRows) {
      const huruf = cell(row['Huruf']);
      if (!huruf) continue;

      const categoryId = await upsertCategory(prisma, categoryCache, category, 'KANJI');

      data.push({
        lessonId,
        categoryId,
        huruf,
        furigana: cell(row['Furigana']) || null,
        romaji: cell(row['Romaji']) || null,
        arti: cell(row['Arti']) || huruf,
        kunyomi: cell(row['Romaji Kunyomi']) || null,
        contohKunyomi: cell(row['Contoh Kata Kunyomi']) || null,
        artiKunyomi: cell(row['Arti Kunyomi']) || null,
        onyomi: cell(row['Romaji Onyomi']) || null,
        contohOnyomi: cell(row['Contoh Kata Onyomi']) || null,
        artiOnyomi: cell(row['Arti Onyomi']) || null,
      });
    }

    if (data.length > 0) {
      await prisma.materialKanji.createMany({ data });
      total += data.length;
    }
  }

  return total;
}

async function importKosakataByCategory(
  prisma: PrismaClient,
  rows: RowRecord[],
  lessonIds: Record<string, string>,
  categoryCache: Map<string, string>,
) {
  const buckets = new Map<string, typeof rows>();
  let total = 0;

  for (const row of rows) {
    if (!isDataRow(row['No'])) continue;
    const category = cell(row['Kategori']) || 'Umum';
    const list = buckets.get(category) ?? [];
    list.push(row);
    buckets.set(category, list);
  }

  for (const [category, categoryRows] of buckets) {
    const slug = categoryLessonSlug('kosakata', category);
    const lessonId = lessonIds[slug];
    if (!lessonId) {
      console.warn(`  Kosakata category "${category}" → lesson "${slug}" tidak ditemukan.`);
      continue;
    }

    const data = [];
    for (const row of categoryRows) {
      const kosakata = cell(row['Kosakata']);
      if (!kosakata) continue;

      const categoryId = await upsertCategory(prisma, categoryCache, category, 'KOSAKATA');

      data.push({
        lessonId,
        categoryId,
        kosakata,
        furigana: cell(row['Furigana']) || null,
        romaji: cell(row['Romaji']) || null,
        arti: cell(row['Arti']) || kosakata,
        contohKalimat: cell(row['Contoh Kalimat']) || null,
      });
    }

    if (data.length > 0) {
      await prisma.materialKosakata.createMany({ data });
      total += data.length;
    }
  }

  return total;
}

async function importTataBahasaByCategory(
  prisma: PrismaClient,
  rows: RowRecord[],
  lessonIds: Record<string, string>,
  categoryCache: Map<string, string>,
) {
  const buckets = new Map<string, typeof rows>();
  let total = 0;

  for (const row of rows) {
    if (!isDataRow(row['No'])) continue;
    const category = cell(row['Kategori']) || 'Umum';
    const list = buckets.get(category) ?? [];
    list.push(row);
    buckets.set(category, list);
  }

  for (const [category, categoryRows] of buckets) {
    const slug = categoryLessonSlug('tata-bahasa', category);
    const lessonId = lessonIds[slug];
    if (!lessonId) {
      console.warn(`  Tata bahasa category "${category}" → lesson "${slug}" tidak ditemukan.`);
      continue;
    }

    const data = [];
    for (const row of categoryRows) {
      const tataBahasa = cell(row['Tata Bahasa']);
      if (!tataBahasa) continue;

      const categoryId = await upsertCategory(prisma, categoryCache, category, 'TATA_BAHASA');

      data.push({
        lessonId,
        categoryId,
        tataBahasa,
        arti: cell(row['Arti']) || tataBahasa,
        contohKalimat: cell(row['Contoh Kalimat']) || null,
      });
    }

    if (data.length > 0) {
      await prisma.materialTataBahasa.createMany({ data });
      total += data.length;
    }
  }

  return total;
}

async function importQuizSheet(
  prisma: PrismaClient,
  rows: RowRecord[],
  lessonId: string | null,
  type: QuestionType,
) {
  let count = 0;

  for (const row of rows) {
    if (!isDataRow(row['No'])) continue;

    const questionText = cell(row['Pertanyaan']);
    const optionsRaw = cell(row['Pilihan Jawaban']);
    const correctRaw = cell(row['Jawaban Benar']);
    if (!questionText || !optionsRaw) continue;

    const optionTexts = parseQuizOptions(optionsRaw);
    if (optionTexts.length === 0) continue;

    const correctIndex = parseCorrectIndex(correctRaw);

    await prisma.question.create({
      data: {
        lessonId,
        type,
        questionText,
        explanation: cell(row['Penjelasan']) || null,
        options: {
          create: optionTexts.map((text, index) => ({
            text,
            isCorrect: index === correctIndex,
          })),
        },
      },
    });
    count += 1;
  }

  return count;
}

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

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.readFile(filePath);
  } catch {
    console.warn(
      `Workbook materi tidak ditemukan di "${filePath}" — lewati impor Excel.`,
    );
    return null;
  }

  const courseSlug = options.courseSlug ?? 'jlpt-n5-kursus-lengkap';
  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) {
    throw new Error(`Kursus "${courseSlug}" belum ada — seed katalog dulu.`);
  }

  console.log(`Import materi dari: ${filePath}${limit ? ` (limit ${limit}/sheet)` : ''}`);

  await removeObsoleteLessons(prisma, course.id);

  const lessonIds = await ensureN5Lessons(prisma, course.id);
  const categoryCache = new Map<string, string>();

  const materialLessonIds = N5_ALL_LESSONS.filter(
    (l) => l.module === 'kanji' || l.module === 'kosakata' || l.module === 'tata-bahasa' || l.module === 'kuis' || l.module === 'tryout',
  ).map((l) => lessonIds[l.slug]);

  for (const lessonId of materialLessonIds) {
    if (lessonId) await resetLessonContent(prisma, lessonId);
  }

  const kanji = await importKanjiByCategory(
    prisma,
    applyLimit(sheetRows(workbook, SHEET_KANJI), limit),
    lessonIds,
    categoryCache,
  );
  const kosakata = await importKosakataByCategory(
    prisma,
    applyLimit(sheetRows(workbook, SHEET_KOSAKATA), limit),
    lessonIds,
    categoryCache,
  );
  const tataBahasa = await importTataBahasaByCategory(
    prisma,
    applyLimit(sheetRows(workbook, SHEET_TATA_BAHASA), limit),
    lessonIds,
    categoryCache,
  );
  const quiz1 = await importQuizSheet(
    prisma,
    applyLimit(sheetRows(workbook, SHEET_QUIZ_1), limit),
    lessonIds['kuis-n5-1'],
    'QUIZ',
  );
  const quiz2 = await importQuizSheet(
    prisma,
    applyLimit(sheetRows(workbook, SHEET_QUIZ_2), limit),
    lessonIds['kuis-n5-2'],
    'QUIZ',
  );
  const placement = await importQuizSheet(
    prisma,
    applyLimit(sheetRows(workbook, SHEET_PLACEMENT), limit),
    lessonIds['tryout-n5-placement'],
    'TRYOUT',
  );
  const tryout = await importQuizSheet(
    prisma,
    applyLimit(sheetRows(workbook, SHEET_TRYOUT), limit),
    lessonIds['tryout-n5-simulasi-1'],
    'TRYOUT',
  );

  const result: ImportMateriResult = {
    kanji,
    kosakata,
    tataBahasa,
    quiz1,
    quiz2,
    placement,
    tryout,
    categories: categoryCache.size,
    lessons: N5_ALL_LESSONS.length,
  };

  console.log(
    `  Imported: ${kanji} kanji, ${kosakata} kosakata, ${tataBahasa} tata bahasa, ` +
      `${quiz1 + quiz2} quiz, ${placement + tryout} tryout/placement, ` +
      `${categoryCache.size} categories, ${N5_ALL_LESSONS.length} lessons`,
  );

  return result;
}

export function describeMateriMapping() {
  return {
    workbook: DEFAULT_XLSX,
    lessonCount: N5_ALL_LESSONS.length,
    strategy: 'Per-kategori Excel → lesson slug kanji-n5-* / kosakata-n5-* / tata-bahasa-n5-*',
    sheets: {
      [SHEET_KANJI]: { model: 'MaterialKanji', routedBy: 'Kategori' },
      [SHEET_KOSAKATA]: { model: 'MaterialKosakata', routedBy: 'Kategori' },
      [SHEET_TATA_BAHASA]: { model: 'MaterialTataBahasa', routedBy: 'Kategori' },
      [SHEET_QUIZ_1]: { lessonSlug: 'kuis-n5-1' },
      [SHEET_QUIZ_2]: { lessonSlug: 'kuis-n5-2' },
      [SHEET_PLACEMENT]: { lessonSlug: 'tryout-n5-placement' },
      [SHEET_TRYOUT]: { lessonSlug: 'tryout-n5-simulasi-1' },
    },
    categoryKey: slugifyCategory,
  };
}
