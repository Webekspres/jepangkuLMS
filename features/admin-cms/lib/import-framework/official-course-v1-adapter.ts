import type ExcelJS from 'exceljs';
import type { LessonType } from '@prisma/client';
import { buildCourseImportReport } from '@/features/admin-cms/lib/import-framework/build-course-import-report';
import { buildPreviewFromNormalized } from '@/features/admin-cms/lib/import-framework/build-preview-from-normalized';
import { courseImportIssueToRowError } from '@/features/admin-cms/lib/import-framework/format-course-import-issue';
import type { CourseImportIssue } from '@/features/admin-cms/lib/import-framework/import-issues';
import type { NormalizedCourseImport } from '@/features/admin-cms/lib/import-framework/normalized-import-types';
import {
  isOfficialCourseV1Metadata,
  readOfficialCourseV1Metadata,
} from '@/features/admin-cms/lib/import-framework/official-course-v1-metadata';
import {
  OFFICIAL_COURSE_V1_FIELDS,
  OFFICIAL_COURSE_V1_HEADERS,
  OFFICIAL_COURSE_V1_SHEET_ALIASES,
} from '@/features/admin-cms/lib/import-framework/official-course-v1-schema';
import {
  emptyCourseImportPreview,
  parseCorrectAnswer,
  parseQuizOptions,
} from '@/features/admin-cms/lib/import-framework/sensei-jlpt-v1-shared';
import type { CourseImportPreview } from '@/features/admin-cms/lib/course-import-types';
import { resolveImportSlug } from '@/features/admin-cms/lib/import-framework/resolve-import-slug';
import {
  parsePositiveInt,
  parseYesNo,
  pickField,
  resolveSheetName,
  sheetToRecords,
  stripSheetPrefix,
} from '@/features/admin-cms/lib/xlsx-workbook';

type OfficialNormalizeResult =
  | {
      ok: false;
      preview: CourseImportPreview;
      report: ReturnType<typeof buildCourseImportReport>;
    }
  | {
      ok: true;
      preview: CourseImportPreview;
      normalized: NormalizedCourseImport;
      report: ReturnType<typeof buildCourseImportReport>;
    };

function sheetIssue(
  sheet: string,
  row: number,
  code: string,
  message: string,
): CourseImportIssue {
  return { severity: 'error', code, message, sheet, row };
}

function failPreview(issues: CourseImportIssue[]): OfficialNormalizeResult {
  const report = buildCourseImportReport(issues);
  return {
    ok: false,
    preview: {
      ok: false,
      ...emptyCourseImportPreview(),
      errors: report.errors.map(courseImportIssueToRowError),
      warnings: report.warnings.map((warning) => warning.message),
      template: {
        key: 'official-course',
        version: 'v1',
        detectedBy: 'metadata',
      },
    },
    report,
  };
}

function parseLessonType(raw: string): LessonType | null {
  const value = raw.trim().toUpperCase();
  if (value === 'VIDEO' || value === 'FLASHCARD' || value === 'QUIZ' || value === 'TEXT') {
    return value;
  }
  return null;
}

function parseFlashcardTrack(raw: string): 'KANJI' | 'KOSAKATA' | 'TATA_BAHASA' | null {
  const value = raw.trim().toUpperCase();
  if (value === 'KANJI' || value === 'KOSAKATA' || value === 'TATA_BAHASA') {
    return value;
  }
  return null;
}

function parseSheet(
  workbook: ExcelJS.Workbook,
  aliases: readonly string[],
  requiredHeaders: readonly string[],
): { records: Record<string, string>[]; sheet: string } | { error: CourseImportIssue } {
  const sheetName = resolveSheetName(workbook, [...aliases]);
  if (!sheetName) {
    return {
      error: {
        severity: 'error',
        code: 'SHEET_PARSE_ERROR',
        message: `Tab "${aliases[0]}" tidak ditemukan.`,
        sheet: aliases[0],
      },
    };
  }

  const parsed = sheetToRecords(workbook, [...aliases], [...requiredHeaders]);
  if ('error' in parsed) {
    return {
      error: {
        severity: 'error',
        code: 'SHEET_PARSE_ERROR',
        message: parsed.error,
        sheet: stripSheetPrefix(sheetName),
      },
    };
  }

  return { records: parsed.records, sheet: stripSheetPrefix(sheetName) };
}

function parseOptionalSheet(
  workbook: ExcelJS.Workbook,
  aliases: readonly string[],
  requiredHeaders: readonly string[],
): { records: Record<string, string>[]; sheet: string } {
  const parsed = parseSheet(workbook, aliases, requiredHeaders);
  if ('error' in parsed) {
    return { records: [], sheet: stripSheetPrefix(aliases[0] ?? 'Sheet') };
  }
  return parsed;
}

export function normalizeOfficialCourseV1Workbook(
  workbook: ExcelJS.Workbook,
): OfficialNormalizeResult {
  const metadata = readOfficialCourseV1Metadata(workbook);
  if (!metadata || !isOfficialCourseV1Metadata(metadata)) {
    return failPreview([
      {
        severity: 'error',
        code: 'INVALID_TEMPLATE_METADATA',
        message: 'Metadata template official-course v1 tidak valid.',
      },
    ]);
  }

  const issues: CourseImportIssue[] = [];
  let rowCount = 0;

  const courseSheet = parseSheet(workbook, OFFICIAL_COURSE_V1_SHEET_ALIASES.course, OFFICIAL_COURSE_V1_HEADERS.course);
  if ('error' in courseSheet) return failPreview([courseSheet.error]);
  rowCount += courseSheet.records.length;

  const moduleSheet = parseSheet(workbook, OFFICIAL_COURSE_V1_SHEET_ALIASES.module, OFFICIAL_COURSE_V1_HEADERS.module);
  if ('error' in moduleSheet) return failPreview([moduleSheet.error]);
  rowCount += moduleSheet.records.length;

  const lessonSheet = parseSheet(workbook, OFFICIAL_COURSE_V1_SHEET_ALIASES.lesson, OFFICIAL_COURSE_V1_HEADERS.lesson);
  if ('error' in lessonSheet) return failPreview([lessonSheet.error]);
  rowCount += lessonSheet.records.length;

  const videoSheet = parseOptionalSheet(
    workbook,
    OFFICIAL_COURSE_V1_SHEET_ALIASES.video,
    OFFICIAL_COURSE_V1_HEADERS.video,
  );
  rowCount += videoSheet.records.length;

  const textSheet = parseOptionalSheet(workbook, OFFICIAL_COURSE_V1_SHEET_ALIASES.text, OFFICIAL_COURSE_V1_HEADERS.text);
  rowCount += textSheet.records.length;

  const flashcardSheet = parseOptionalSheet(
    workbook,
    OFFICIAL_COURSE_V1_SHEET_ALIASES.flashcard,
    OFFICIAL_COURSE_V1_HEADERS.flashcard,
  );
  rowCount += flashcardSheet.records.length;

  const quizSheet = parseOptionalSheet(workbook, OFFICIAL_COURSE_V1_SHEET_ALIASES.quiz, OFFICIAL_COURSE_V1_HEADERS.quiz);
  rowCount += quizSheet.records.length;

  if (courseSheet.records.length === 0) {
    return failPreview([
      sheetIssue(courseSheet.sheet, 4, 'COURSE_ROW_REQUIRED', 'Tab Course wajib berisi minimal satu baris kursus.'),
    ]);
  }

  const courseRow = courseSheet.records[0]!;
  const courseExternalId = pickField(courseRow, [OFFICIAL_COURSE_V1_FIELDS.courseExternalId]);
  const courseTitle = pickField(courseRow, [OFFICIAL_COURSE_V1_FIELDS.title]);
  if (!courseExternalId) {
    issues.push(
      sheetIssue(courseSheet.sheet, 4, 'COURSE_EXTERNAL_ID_REQUIRED', 'ID eksternal kursus wajib diisi.'),
    );
  }
  if (!courseTitle) {
    issues.push(sheetIssue(courseSheet.sheet, 4, 'COURSE_TITLE_REQUIRED', 'Judul kursus wajib diisi.'));
  }

  const videos = new Map<string, Record<string, string>>();
  for (let i = 0; i < videoSheet.records.length; i++) {
    const row = videoSheet.records[i]!;
    const lessonExternalId = pickField(row, [OFFICIAL_COURSE_V1_FIELDS.lessonExternalId]);
    if (!lessonExternalId) {
      issues.push(
        sheetIssue(videoSheet.sheet, i + 4, 'LESSON_EXTERNAL_ID_REQUIRED', 'lesson_external_id wajib diisi.'),
      );
      continue;
    }
    videos.set(lessonExternalId, row);
  }

  const texts = new Map<string, Record<string, string>>();
  for (let i = 0; i < textSheet.records.length; i++) {
    const row = textSheet.records[i]!;
    const lessonExternalId = pickField(row, [OFFICIAL_COURSE_V1_FIELDS.lessonExternalId]);
    if (!lessonExternalId) {
      issues.push(
        sheetIssue(textSheet.sheet, i + 4, 'LESSON_EXTERNAL_ID_REQUIRED', 'lesson_external_id wajib diisi.'),
      );
      continue;
    }
    texts.set(lessonExternalId, row);
  }

  type FlashcardBuckets = {
    kanjis: Array<{
      categoryName?: string | null;
      huruf: string;
      furigana?: string | null;
      romaji?: string | null;
      arti: string;
      onyomi?: string | null;
      kunyomi?: string | null;
      contohOnyomi?: string | null;
      artiOnyomi?: string | null;
      contohKunyomi?: string | null;
      artiKunyomi?: string | null;
      mnemonik?: string | null;
      strokeGifUrl?: string | null;
    }>;
    kosakatas: Array<{
      categoryName?: string | null;
      kosakata: string;
      furigana?: string | null;
      romaji?: string | null;
      arti: string;
      contohKalimat?: string | null;
    }>;
    tataBahasas: Array<{
      categoryName?: string | null;
      tataBahasa: string;
      arti: string;
      contohKalimat?: string | null;
    }>;
  };

  const flashcardBuckets = new Map<string, FlashcardBuckets>();

  for (let i = 0; i < flashcardSheet.records.length; i++) {
    const row = flashcardSheet.records[i]!;
    const lessonExternalId = pickField(row, [OFFICIAL_COURSE_V1_FIELDS.lessonExternalId]);
    const track = parseFlashcardTrack(pickField(row, [OFFICIAL_COURSE_V1_FIELDS.track]));
    if (!lessonExternalId) {
      issues.push(
        sheetIssue(flashcardSheet.sheet, i + 4, 'LESSON_EXTERNAL_ID_REQUIRED', 'lesson_external_id wajib diisi.'),
      );
      continue;
    }
    if (!track) {
      issues.push(
        sheetIssue(
          flashcardSheet.sheet,
          i + 4,
          'FLASHCARD_TRACK_INVALID',
          'Kolom track harus KANJI, KOSAKATA, atau TATA_BAHASA.',
        ),
      );
      continue;
    }

    const bucket = flashcardBuckets.get(lessonExternalId) ?? { kanjis: [], kosakatas: [], tataBahasas: [] };
    const categoryName = pickField(row, [OFFICIAL_COURSE_V1_FIELDS.category]) || null;

    if (track === 'KANJI') {
      const huruf = pickField(row, [OFFICIAL_COURSE_V1_FIELDS.flashcardTerm]);
      if (!huruf) {
        issues.push(sheetIssue(flashcardSheet.sheet, i + 4, 'KANJI_HURUF_REQUIRED', 'Kolom huruf wajib untuk track KANJI.'));
        continue;
      }
      bucket.kanjis.push({
        categoryName,
        huruf,
        furigana: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.furigana]) || null,
        romaji: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.romaji]) || null,
        arti: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.meaning]) || huruf,
        onyomi: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.onyomi, 'onyomi']) || null,
        kunyomi: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.kunyomi, 'kunyomi']) || null,
        contohOnyomi: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.exampleOnyomi, 'contoh_onyomi']) || null,
        artiOnyomi: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.meaningOnyomi]) || null,
        contohKunyomi: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.exampleKunyomi, 'contoh_kunyomi']) || null,
        artiKunyomi: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.meaningKunyomi]) || null,
        mnemonik: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.mnemonic]) || null,
        strokeGifUrl:
          pickField(row, [OFFICIAL_COURSE_V1_FIELDS.strokeGifUrl, 'stroke_gif_url']) || null,
      });
    } else if (track === 'KOSAKATA') {
      const kosakata = pickField(row, [OFFICIAL_COURSE_V1_FIELDS.vocabulary, OFFICIAL_COURSE_V1_FIELDS.flashcardTerm]);
      if (!kosakata) {
        issues.push(
          sheetIssue(flashcardSheet.sheet, i + 4, 'KOSAKATA_REQUIRED', 'Kolom kosakata wajib untuk track KOSAKATA.'),
        );
        continue;
      }
      bucket.kosakatas.push({
        categoryName,
        kosakata,
        furigana: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.furigana]) || null,
        romaji: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.romaji]) || null,
        arti: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.meaning]) || kosakata,
        contohKalimat: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.exampleSentence]) || null,
      });
    } else {
      const tataBahasa = pickField(row, [OFFICIAL_COURSE_V1_FIELDS.grammar, OFFICIAL_COURSE_V1_FIELDS.flashcardTerm]);
      if (!tataBahasa) {
        issues.push(
          sheetIssue(
            flashcardSheet.sheet,
            i + 4,
            'TATA_BAHASA_REQUIRED',
            'Kolom tata_bahasa wajib untuk track TATA_BAHASA.',
          ),
        );
        continue;
      }
      bucket.tataBahasas.push({
        categoryName,
        tataBahasa,
        arti: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.meaning]) || tataBahasa,
        contohKalimat: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.exampleSentence]) || null,
      });
    }

    flashcardBuckets.set(lessonExternalId, bucket);
  }

  const quizzesByLesson = new Map<
    string,
    Array<{
      prompt: string;
      explanation?: string | null;
      options: Array<{ text: string; isCorrect: boolean }>;
    }>
  >();

  for (let i = 0; i < quizSheet.records.length; i++) {
    const row = quizSheet.records[i]!;
    const lessonExternalId = pickField(row, [OFFICIAL_COURSE_V1_FIELDS.lessonExternalId]);
    const prompt = pickField(row, [OFFICIAL_COURSE_V1_FIELDS.question]);
    const options = parseQuizOptions(pickField(row, [OFFICIAL_COURSE_V1_FIELDS.options]));
    const correctIndex = parseCorrectAnswer(pickField(row, [OFFICIAL_COURSE_V1_FIELDS.correctAnswer]), options);

    if (!lessonExternalId) {
      issues.push(
        sheetIssue(quizSheet.sheet, i + 4, 'LESSON_EXTERNAL_ID_REQUIRED', 'lesson_external_id wajib diisi.'),
      );
      continue;
    }
    if (!prompt || options.length < 2 || correctIndex < 0) {
      issues.push(
        sheetIssue(
          quizSheet.sheet,
          i + 4,
          'QUIZ_ROW_INVALID',
          'Baris kuis tidak valid: pertanyaan, pilihan jawaban, dan jawaban benar wajib lengkap.',
        ),
      );
      continue;
    }

    const questions = quizzesByLesson.get(lessonExternalId) ?? [];
    questions.push({
      prompt,
      explanation: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.explanation]) || null,
      options: options.map((text, index) => ({
        text,
        isCorrect: index === correctIndex,
      })),
    });
    quizzesByLesson.set(lessonExternalId, questions);
  }

  const modules = moduleSheet.records.map((row, index) => {
    const moduleExternalId = pickField(row, [OFFICIAL_COURSE_V1_FIELDS.moduleExternalId]);
    const rowCourseExternalId = pickField(row, [OFFICIAL_COURSE_V1_FIELDS.courseExternalId]);
    const title = pickField(row, [OFFICIAL_COURSE_V1_FIELDS.title]);
    const order = parsePositiveInt(pickField(row, [OFFICIAL_COURSE_V1_FIELDS.order]), index + 1) ?? index + 1;
    const rowNumber = index + 4;

    if (!moduleExternalId) {
      issues.push(
        sheetIssue(moduleSheet.sheet, rowNumber, 'MODULE_EXTERNAL_ID_REQUIRED', 'module_external_id wajib diisi.'),
      );
    }
    if (!title) {
      issues.push(sheetIssue(moduleSheet.sheet, rowNumber, 'MODULE_TITLE_REQUIRED', 'Judul modul wajib diisi.'));
    }
    if (rowCourseExternalId && courseExternalId && rowCourseExternalId !== courseExternalId) {
      issues.push(
        sheetIssue(
          moduleSheet.sheet,
          rowNumber,
          'MODULE_COURSE_MISMATCH',
          `course_external_id "${rowCourseExternalId}" tidak cocok dengan kursus "${courseExternalId}".`,
        ),
      );
    }

    return {
      moduleExternalId: moduleExternalId || `module-${index + 1}`,
      courseExternalId: rowCourseExternalId || courseExternalId,
      title: title || `Modul ${index + 1}`,
      slug: resolveImportSlug(
        title || `Modul ${index + 1}`,
        moduleExternalId || `module-${index + 1}`,
        pickField(row, [OFFICIAL_COURSE_V1_FIELDS.slug]),
      ),
      description: pickField(row, [OFFICIAL_COURSE_V1_FIELDS.description]) || null,
      order,
      lessons: [] as NormalizedCourseImport['modules'][number]['lessons'],
    };
  });

  const moduleById = new Map(modules.map((module) => [module.moduleExternalId, module]));

  for (let i = 0; i < lessonSheet.records.length; i++) {
    const row = lessonSheet.records[i]!;
    const rowNumber = i + 4;
    const lessonExternalId = pickField(row, [OFFICIAL_COURSE_V1_FIELDS.lessonExternalId]);
    const moduleExternalId = pickField(row, [OFFICIAL_COURSE_V1_FIELDS.moduleExternalId]);
    const title = pickField(row, [OFFICIAL_COURSE_V1_FIELDS.title]);
    const lessonType = parseLessonType(pickField(row, [OFFICIAL_COURSE_V1_FIELDS.lessonType]));
    const order = parsePositiveInt(pickField(row, [OFFICIAL_COURSE_V1_FIELDS.order]), i + 1) ?? i + 1;

    if (!lessonExternalId) {
      issues.push(
        sheetIssue(lessonSheet.sheet, rowNumber, 'LESSON_EXTERNAL_ID_REQUIRED', 'lesson_external_id wajib diisi.'),
      );
      continue;
    }
    if (!moduleExternalId || !moduleById.has(moduleExternalId)) {
      issues.push(
        sheetIssue(
          lessonSheet.sheet,
          rowNumber,
          'MODULE_NOT_FOUND',
          `Modul "${moduleExternalId || '(kosong)'}" tidak ditemukan di tab Module.`,
        ),
      );
      continue;
    }
    if (!title) {
      issues.push(sheetIssue(lessonSheet.sheet, rowNumber, 'LESSON_TITLE_REQUIRED', 'Judul pelajaran wajib diisi.'));
      continue;
    }
    if (!lessonType) {
      issues.push(
        sheetIssue(
          lessonSheet.sheet,
          rowNumber,
          'LESSON_TYPE_INVALID',
          'tipe_pelajaran harus VIDEO, FLASHCARD, QUIZ, atau TEXT.',
        ),
      );
      continue;
    }

    const courseModule = moduleById.get(moduleExternalId)!;
    const content =
      lessonType === 'VIDEO'
        ? {
            kind: 'VIDEO' as const,
            videoUrl: pickField(videos.get(lessonExternalId) ?? {}, [OFFICIAL_COURSE_V1_FIELDS.videoUrl]),
            textContent: pickField(videos.get(lessonExternalId) ?? {}, [OFFICIAL_COURSE_V1_FIELDS.textContent]) || null,
          }
        : lessonType === 'TEXT'
          ? {
              kind: 'TEXT' as const,
              textContent: pickField(texts.get(lessonExternalId) ?? {}, [OFFICIAL_COURSE_V1_FIELDS.textContent]),
            }
          : lessonType === 'FLASHCARD'
            ? {
                kind: 'FLASHCARD' as const,
                kanjis: flashcardBuckets.get(lessonExternalId)?.kanjis ?? [],
                kosakatas: flashcardBuckets.get(lessonExternalId)?.kosakatas ?? [],
                tataBahasas: flashcardBuckets.get(lessonExternalId)?.tataBahasas ?? [],
              }
            : {
                kind: 'QUIZ' as const,
                questionType: 'QUIZ' as const,
                questions: (quizzesByLesson.get(lessonExternalId) ?? []).map(
                  ({ prompt, explanation, options }) => ({
                    prompt,
                    explanation,
                    options,
                  }),
                ),
              };

    courseModule.lessons.push({
      lessonExternalId,
      moduleExternalId,
      title,
      slug: resolveImportSlug(title, lessonExternalId, pickField(row, [OFFICIAL_COURSE_V1_FIELDS.slug])),
      order,
      lessonType,
      content,
    });
  }

  if (issues.length > 0) return failPreview(issues);

  const normalized: NormalizedCourseImport = {
    template: {
      key: 'official-course',
      version: 'v1',
      detectedBy: 'metadata',
    },
    course: {
      courseExternalId,
      title: courseTitle,
      slug: resolveImportSlug(
        courseTitle,
        courseExternalId,
        pickField(courseRow, [OFFICIAL_COURSE_V1_FIELDS.slug]),
      ),
      description: pickField(courseRow, [OFFICIAL_COURSE_V1_FIELDS.description]) || null,
      level: pickField(courseRow, [OFFICIAL_COURSE_V1_FIELDS.level]) || null,
      isPublished: parseYesNo(pickField(courseRow, [OFFICIAL_COURSE_V1_FIELDS.published])),
    },
    modules,
  };

  const preview = buildPreviewFromNormalized(normalized, { rowCount, ok: true });
  const report = buildCourseImportReport([]);

  return {
    ok: true,
    preview,
    normalized,
    report,
  };
}
