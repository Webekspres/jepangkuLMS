import { buildCourseImportReport } from '@/features/admin-cms/lib/import-framework/build-course-import-report';
import type { CourseImportIssue } from '@/features/admin-cms/lib/import-framework/import-issues';
import type { NormalizedCourseImport } from '@/features/admin-cms/lib/import-framework/normalized-import-types';
import {
  isDataRow,
  parseCorrectAnswer,
  parseQuizOptions,
  parseSenseiJlptWorkbook,
  toText,
  type ParsedSenseiJlptWorkbook,
  type SenseiRowRecord,
} from '@/features/admin-cms/lib/import-framework/sensei-jlpt-v1-shared';
import { N4_ALL_LESSONS, type N4LessonDef } from '@/prisma/lib/n4-curriculum';
import { N4_MODULE_DEFINITIONS } from '@/prisma/lib/n4-modules';
import { N5_ALL_LESSONS, type N5LessonDef } from '@/prisma/lib/n5-curriculum';
import { N5_MODULE_DEFINITIONS } from '@/prisma/lib/n5-modules';

function issueFromWarning(message: string): CourseImportIssue {
  return {
    severity: 'warning',
    code: 'LEGACY_IMPORT_WARNING',
    message,
  };
}

function buildQuizQuestions(rows: SenseiRowRecord[], parsed: Extract<ParsedSenseiJlptWorkbook, { ok: true }>) {
  const { manifest } = parsed;

  return rows
    .filter((row) => isDataRow(row[manifest.columns.quiz.no]))
    .map((row) => {
      const prompt = toText(row[manifest.columns.quiz.pertanyaan]);
      const options = parseQuizOptions(toText(row[manifest.columns.quiz.pilihanJawaban]));
      const correctIndex = parseCorrectAnswer(toText(row[manifest.columns.quiz.jawabanBenar]), options);

      return {
        prompt,
        isValid: prompt.length > 0 && options.length >= 2 && correctIndex >= 0,
        explanation: toText(row[manifest.columns.quiz.penjelasan]) || null,
        questionType: 'QUIZ' as const,
        options: options.map((text, index) => ({
          text,
          isCorrect: index === correctIndex,
        })),
      };
    })
    .filter((question) => question.isValid)
    .map(({ prompt, explanation, options }) => ({
      prompt,
      explanation,
      options,
    }));
}

function getQuizRowsForLesson(
  slug: string,
  parsed: Extract<ParsedSenseiJlptWorkbook, { ok: true }>,
) {
  if (slug === 'kuis-n4-1' || slug === 'kuis-n5-1') return parsed.sheets.quiz1;
  if (slug === 'kuis-n4-2' || slug === 'kuis-n5-2') return parsed.sheets.quiz2;
  if (slug === 'tryout-n5-placement') return parsed.sheets.placement;
  if (slug === 'tryout-n4-simulasi-1' || slug === 'tryout-n5-simulasi-1') return parsed.sheets.tryout;
  return [];
}

function normalizeLessonsFromDefinitions(
  parsed: Extract<ParsedSenseiJlptWorkbook, { ok: true }>,
  definitions: Array<N4LessonDef | N5LessonDef>,
) {
  const { manifest, level, sheets } = parsed;

  return definitions.map((lesson) => {
    if (lesson.module === 'kanji' && lesson.excelCategory) {
      return {
        lessonExternalId: lesson.slug,
        moduleExternalId: lesson.module,
        title: lesson.title,
        slug: lesson.slug,
        order: lesson.order,
        lessonType: 'FLASHCARD' as const,
        content: {
          kind: 'FLASHCARD' as const,
          kanjis: sheets.kanji
            .filter((row) => isDataRow(row[manifest.columns.kanji.no]))
            .filter((row) => toText(row[manifest.columns.kanji.category]) === lesson.excelCategory)
            .filter((row) => toText(row[manifest.columns.kanji.huruf]))
            .map((row) => ({
              categoryName: lesson.excelCategory ?? null,
              huruf: toText(row[manifest.columns.kanji.huruf]),
              furigana: toText(row[manifest.columns.kanji.furigana]) || null,
              romaji: toText(row[manifest.columns.kanji.romaji]) || null,
              arti: toText(row[manifest.columns.kanji.arti]) || toText(row[manifest.columns.kanji.huruf]),
              kunyomi: toText(row[manifest.columns.kanji.romajiKunyomi]) || null,
              contohKunyomi: toText(row[manifest.columns.kanji.contohKunyomi]) || null,
              artiKunyomi: toText(row[manifest.columns.kanji.artiKunyomi]) || null,
              onyomi: toText(row[manifest.columns.kanji.romajiOnyomi]) || null,
              contohOnyomi: toText(row[manifest.columns.kanji.contohOnyomi]) || null,
              artiOnyomi: toText(row[manifest.columns.kanji.artiOnyomi]) || null,
              mnemonik: manifest.columns.kanji.mnemonik
                ? toText(row[manifest.columns.kanji.mnemonik]) || null
                : null,
              strokeGifUrl: manifest.columns.kanji.strokeGif
                ? toText(row[manifest.columns.kanji.strokeGif]) || null
                : null,
            })),
          kosakatas: [],
          tataBahasas: [],
        },
      };
    }

    if (lesson.module === 'kosakata' && lesson.excelCategory) {
      return {
        lessonExternalId: lesson.slug,
        moduleExternalId: lesson.module,
        title: lesson.title,
        slug: lesson.slug,
        order: lesson.order,
        lessonType: 'FLASHCARD' as const,
        content: {
          kind: 'FLASHCARD' as const,
          kanjis: [],
          kosakatas: sheets.kosakata
            .filter((row) => isDataRow(row[manifest.columns.kosakata.no]))
            .filter((row) => toText(row[manifest.columns.kosakata.category]) === lesson.excelCategory)
            .filter((row) => toText(row[manifest.columns.kosakata.kosakata]))
            .map((row) => ({
              categoryName: lesson.excelCategory ?? null,
              kosakata: toText(row[manifest.columns.kosakata.kosakata]),
              furigana: toText(row[manifest.columns.kosakata.furigana]) || null,
              romaji: toText(row[manifest.columns.kosakata.romaji]) || null,
              arti: toText(row[manifest.columns.kosakata.arti]) || toText(row[manifest.columns.kosakata.kosakata]),
              contohKalimat: toText(row[manifest.columns.kosakata.contohKalimat]) || null,
            })),
          tataBahasas: [],
        },
      };
    }

    if (lesson.module === 'tata-bahasa' && lesson.excelCategory) {
      return {
        lessonExternalId: lesson.slug,
        moduleExternalId: lesson.module,
        title: lesson.title,
        slug: lesson.slug,
        order: lesson.order,
        lessonType: 'FLASHCARD' as const,
        content: {
          kind: 'FLASHCARD' as const,
          kanjis: [],
          kosakatas: [],
          tataBahasas: sheets.tataBahasa
            .filter((row) => isDataRow(row[manifest.columns.tataBahasa.no]))
            .filter((row) => toText(row[manifest.columns.tataBahasa.category]) === lesson.excelCategory)
            .filter((row) => toText(row[manifest.columns.tataBahasa.tataBahasa]))
            .map((row) => ({
              categoryName: lesson.excelCategory ?? null,
              tataBahasa: toText(row[manifest.columns.tataBahasa.tataBahasa]),
              arti: toText(row[manifest.columns.tataBahasa.arti]) || toText(row[manifest.columns.tataBahasa.tataBahasa]),
              contohKalimat: toText(row[manifest.columns.tataBahasa.contohKalimat]) || null,
            })),
        },
      };
    }

    if (lesson.module === 'kuis' || lesson.module === 'tryout') {
      return {
        lessonExternalId: lesson.slug,
        moduleExternalId: lesson.module,
        title: lesson.title,
        slug: lesson.slug,
        order: lesson.order,
        lessonType: 'QUIZ' as const,
        content: {
          kind: 'QUIZ' as const,
          questionType: lesson.module === 'tryout' ? 'TRYOUT' as const : 'QUIZ' as const,
          questions: buildQuizQuestions(getQuizRowsForLesson(lesson.slug, parsed), parsed),
        },
      };
    }

    return {
      lessonExternalId: lesson.slug,
      moduleExternalId: lesson.module,
      title: lesson.title,
      slug: lesson.slug,
      order: lesson.order,
      lessonType: 'TEXT' as const,
      content: {
        kind: 'TEXT' as const,
        textContent: lesson.content,
      },
    };
  });
}

export async function normalizeSenseiJlptV1Workbook(buffer: Buffer) {
  const parsed = await parseSenseiJlptWorkbook(buffer);
  if (!parsed.ok) {
    return {
      ok: false as const,
      preview: parsed.preview,
      report: buildCourseImportReport(
        parsed.preview.errors.map((error) => ({
          severity: 'error' as const,
          code: 'WORKBOOK_PARSE_ERROR',
          message: error.message,
          row: error.row,
          sheet: error.sheet,
        })),
      ),
    };
  }

  const moduleDefinitions = parsed.level === 'N4' ? N4_MODULE_DEFINITIONS : N5_MODULE_DEFINITIONS;
  const lessonDefinitions = parsed.level === 'N4' ? N4_ALL_LESSONS : N5_ALL_LESSONS;
  const normalizedLessons = normalizeLessonsFromDefinitions(parsed, lessonDefinitions);
  const normalized: NormalizedCourseImport = {
    template: {
      key: 'sensei-jlpt',
      version: 'v1',
      detectedBy: 'sheet-pattern',
    },
    course: {
      courseExternalId: parsed.manifest.course.slug,
      title: parsed.manifest.course.title,
      slug: parsed.manifest.course.slug,
      description: parsed.manifest.course.description,
      level: parsed.manifest.course.level,
      isPublished: false,
    },
    modules: moduleDefinitions.map((module) => ({
      moduleExternalId: module.slug,
      courseExternalId: parsed.manifest.course.slug,
      title: module.title,
      slug: module.slug,
      description: module.description,
      order: module.order,
      lessons: normalizedLessons.filter((lesson) => lesson.moduleExternalId === module.slug),
    })),
  };

  const report = buildCourseImportReport(parsed.preview.warnings.map(issueFromWarning));

  return {
    ok: true as const,
    preview: parsed.preview,
    normalized,
    report,
  };
}
