/**
 * Impor materi N5 dari workbook Excel sensei → model Prisma LMS.
 *
 * Strategi:
 * 1. Excel tetap sumber kebenaran konten (mudah diedit tim pedagogis).
 * 2. Skrip ini dipanggil dari `prisma/seed.ts` (idempotent per lesson).
 * 3. Sheet → lesson + tabel materi:
 *    - Kanji / Kosakata / Tata Bahasa → Material* + Category
 *    - Quiz 1 & 2 → Question (QUIZ) + QuestionOption
 *    - Placement Test & Try Out → Question (TRYOUT), tanpa lessonId
 *
 * Env opsional:
 * - MATERI_XLSX_PATH — path workbook (default: docs/Materi LMS JepangKu - Nihongo.xlsx)
 * - MATERI_IMPORT_LIMIT — batas baris per sheet (dev cepat), contoh: 50
 */
import type { PrismaClient } from '@prisma/client';
import type { CategoryType, QuestionType } from '@prisma/client';
import * as path from 'node:path';
import * as XLSX from 'xlsx';

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

const MATERIAL_LESSONS = [
  {
    slug: 'kanji-n5',
    title: 'Kanji N5',
    order: 5,
    content: 'Daftar kanji JLPT N5 lengkap dengan bacaan dan contoh kata.',
  },
  {
    slug: 'kosakata-n5',
    title: 'Kosakata N5',
    order: 6,
    content: 'Kosakata JLPT N5 dengan furigana, romaji, dan contoh kalimat.',
  },
  {
    slug: 'tata-bahasa-n5',
    title: 'Tata Bahasa N5',
    order: 7,
    content: 'Pola tata bahasa N5 dengan penjelasan dan contoh kalimat.',
  },
  {
    slug: 'kuis-n5-1',
    title: 'Kuis N5 — Set 1',
    order: 8,
    content: 'Latihan pilihan ganda kanji & kosakata N5 (set 1).',
  },
  {
    slug: 'kuis-n5-2',
    title: 'Kuis N5 — Set 2',
    order: 9,
    content: 'Latihan pilihan ganda kanji & kosakata N5 (set 2).',
  },
] as const;

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

function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
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

async function ensureMaterialLessons(
  prisma: PrismaClient,
  courseId: string,
): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};

  for (const lesson of MATERIAL_LESSONS) {
    const row = await prisma.lesson.upsert({
      where: { slug: lesson.slug },
      create: { ...lesson, courseId },
      update: {
        title: lesson.title,
        order: lesson.order,
        content: lesson.content,
        courseId,
      },
    });
    ids[lesson.slug] = row.id;
  }

  return ids;
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

async function resetTryoutQuestions(prisma: PrismaClient) {
  await prisma.questionOption.deleteMany({
    where: { question: { type: 'TRYOUT', lessonId: null } },
  });
  await prisma.question.deleteMany({
    where: { type: 'TRYOUT', lessonId: null },
  });
}

async function importKanji(
  prisma: PrismaClient,
  rows: RowRecord[],
  lessonId: string,
  categoryCache: Map<string, string>,
) {
  const data = [];

  for (const row of rows) {
    if (!isDataRow(row['No'])) continue;
    const huruf = cell(row['Huruf']);
    if (!huruf) continue;

    const categoryId = await upsertCategory(
      prisma,
      categoryCache,
      cell(row['Kategori']),
      'KANJI',
    );

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

  if (data.length === 0) return 0;

  const chunkSize = 500;
  for (let i = 0; i < data.length; i += chunkSize) {
    await prisma.materialKanji.createMany({
      data: data.slice(i, i + chunkSize),
    });
  }

  return data.length;
}

async function importKosakata(
  prisma: PrismaClient,
  rows: RowRecord[],
  lessonId: string,
  categoryCache: Map<string, string>,
) {
  const data = [];

  for (const row of rows) {
    if (!isDataRow(row['No'])) continue;
    const kosakata = cell(row['Kosakata']);
    if (!kosakata) continue;

    const categoryId = await upsertCategory(
      prisma,
      categoryCache,
      cell(row['Kategori']),
      'KOSAKATA',
    );

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

  if (data.length === 0) return 0;

  const chunkSize = 500;
  for (let i = 0; i < data.length; i += chunkSize) {
    await prisma.materialKosakata.createMany({
      data: data.slice(i, i + chunkSize),
    });
  }

  return data.length;
}

async function importTataBahasa(
  prisma: PrismaClient,
  rows: RowRecord[],
  lessonId: string,
  categoryCache: Map<string, string>,
) {
  const data = [];

  for (const row of rows) {
    if (!isDataRow(row['No'])) continue;
    const tataBahasa = cell(row['Tata Bahasa']);
    if (!tataBahasa) continue;

    const categoryId = await upsertCategory(
      prisma,
      categoryCache,
      cell(row['Kategori']),
      'TATA_BAHASA',
    );

    data.push({
      lessonId,
      categoryId,
      tataBahasa,
      arti: cell(row['Arti']) || tataBahasa,
      contohKalimat: cell(row['Contoh Kalimat']) || null,
    });
  }

  if (data.length === 0) return 0;

  const chunkSize = 500;
  for (let i = 0; i < data.length; i += chunkSize) {
    await prisma.materialTataBahasa.createMany({
      data: data.slice(i, i + chunkSize),
    });
  }

  return data.length;
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

  const lessonIds = await ensureMaterialLessons(prisma, course.id);
  const categoryCache = new Map<string, string>();

  await resetLessonContent(prisma, lessonIds['kanji-n5']);
  await resetLessonContent(prisma, lessonIds['kosakata-n5']);
  await resetLessonContent(prisma, lessonIds['tata-bahasa-n5']);
  await resetLessonContent(prisma, lessonIds['kuis-n5-1']);
  await resetLessonContent(prisma, lessonIds['kuis-n5-2']);
  await resetTryoutQuestions(prisma);

  const kanji = await importKanji(
    prisma,
    applyLimit(sheetRows(workbook, SHEET_KANJI), limit),
    lessonIds['kanji-n5'],
    categoryCache,
  );
  const kosakata = await importKosakata(
    prisma,
    applyLimit(sheetRows(workbook, SHEET_KOSAKATA), limit),
    lessonIds['kosakata-n5'],
    categoryCache,
  );
  const tataBahasa = await importTataBahasa(
    prisma,
    applyLimit(sheetRows(workbook, SHEET_TATA_BAHASA), limit),
    lessonIds['tata-bahasa-n5'],
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
    null,
    'TRYOUT',
  );
  const tryout = await importQuizSheet(
    prisma,
    applyLimit(sheetRows(workbook, SHEET_TRYOUT), limit),
    null,
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
  };

  console.log(
    `  Imported: ${kanji} kanji, ${kosakata} kosakata, ${tataBahasa} tata bahasa, ` +
      `${quiz1 + quiz2} quiz, ${placement + tryout} tryout/placement, ` +
      `${categoryCache.size} categories`,
  );

  return result;
}

/** Utility untuk dokumentasi mapping sheet → slug kategori */
export function describeMateriMapping() {
  return {
    workbook: DEFAULT_XLSX,
    sheets: {
      [SHEET_KANJI]: { lessonSlug: 'kanji-n5', model: 'MaterialKanji' },
      [SHEET_KOSAKATA]: { lessonSlug: 'kosakata-n5', model: 'MaterialKosakata' },
      [SHEET_TATA_BAHASA]: { lessonSlug: 'tata-bahasa-n5', model: 'MaterialTataBahasa' },
      [SHEET_QUIZ_1]: { lessonSlug: 'kuis-n5-1', model: 'Question (QUIZ)' },
      [SHEET_QUIZ_2]: { lessonSlug: 'kuis-n5-2', model: 'Question (QUIZ)' },
      [SHEET_PLACEMENT]: { lessonSlug: null, model: 'Question (TRYOUT)' },
      [SHEET_TRYOUT]: { lessonSlug: null, model: 'Question (TRYOUT)' },
    },
    categoryKey: slugifyCategory,
  };
}
