import type { PrismaClient } from '@prisma/client';
import type { CourseImportPreview, CourseImportResult } from '@/features/admin-cms/lib/course-import-types';
import { MAX_IMPORT_BYTES } from '@/features/admin-cms/lib/course-import-types';
import { buildCourseImportReport } from '@/features/admin-cms/lib/import-framework/build-course-import-report';
import { detectCourseImportTemplate } from '@/features/admin-cms/lib/import-framework/detect-course-import-template';
import { courseImportIssueToRowError } from '@/features/admin-cms/lib/import-framework/format-course-import-issue';
import { normalizeOfficialCourseV1Workbook } from '@/features/admin-cms/lib/import-framework/official-course-v1-adapter';
import { persistNormalizedCourseImport } from '@/features/admin-cms/lib/import-framework/persist-normalized-course-import';
import { normalizeSenseiJlptV1Workbook } from '@/features/admin-cms/lib/import-framework/sensei-jlpt-v1-adapter';
import { emptyCourseImportPreview } from '@/features/admin-cms/lib/import-framework/sensei-jlpt-v1-shared';
import { validateNormalizedCourseImport } from '@/features/admin-cms/lib/import-framework/validate-normalized-course-import';
import { readXlsxBuffer } from '@/features/admin-cms/lib/xlsx-workbook';

type NormalizeSuccess = Extract<
  Awaited<ReturnType<typeof normalizeSenseiJlptV1Workbook>>,
  { ok: true }
>;

function mergePreviewWithValidation(
  preview: CourseImportPreview,
  validationIssues: ReturnType<typeof validateNormalizedCourseImport>,
): CourseImportPreview {
  if (validationIssues.length === 0) return preview;
  return {
    ...preview,
    ok: false,
    errors: [...preview.errors, ...validationIssues.map(courseImportIssueToRowError)],
  };
}

async function normalizeCourseImportBuffer(buffer: Buffer) {
  if (buffer.byteLength > MAX_IMPORT_BYTES) {
    return {
      ok: false as const,
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
      ok: false as const,
      preview: {
        ok: false,
        ...emptyCourseImportPreview(),
        errors: [{ row: 0, message: 'File Excel tidak bisa dibaca. Pastikan format .xlsx.' }],
      },
    };
  }

  const template = detectCourseImportTemplate(workbook);
  if (!template) {
    return {
      ok: false as const,
      preview: {
        ok: false,
        ...emptyCourseImportPreview(),
        errors: [
          {
            row: 0,
            message:
              'Format workbook tidak dikenali. Gunakan template resmi JepangKu atau workbook sensei N4/N5.',
          },
        ],
      },
    };
  }

  if (template.key === 'official-course') {
    return normalizeOfficialCourseV1Workbook(workbook);
  }

  return normalizeSenseiJlptV1Workbook(buffer);
}

export async function previewCourseImport(buffer: Buffer): Promise<CourseImportPreview> {
  const result = await normalizeCourseImportBuffer(buffer);
  if (!result.ok) {
    return result.preview;
  }

  const validationIssues = validateNormalizedCourseImport(result.normalized);
  return {
    ...mergePreviewWithValidation(result.preview, validationIssues),
    warnings: [
      ...result.preview.warnings,
      ...result.report.warnings.map((warning) => warning.message),
    ],
    template: result.preview.template ?? {
      key: result.normalized.template.key,
      version: result.normalized.template.version,
      detectedBy: result.normalized.template.detectedBy,
    },
  };
}

export async function importCourseWorkbook(
  prisma: PrismaClient,
  buffer: Buffer,
): Promise<CourseImportResult> {
  const result = await normalizeCourseImportBuffer(buffer);
  if (!result.ok) {
    return {
      ok: false,
      preview: result.preview,
      imported: [],
      errors: result.preview.errors,
    };
  }

  const validationIssues = validateNormalizedCourseImport(result.normalized);
  if (validationIssues.length > 0) {
    const report = buildCourseImportReport(validationIssues);
    return {
      ok: false,
      preview: mergePreviewWithValidation(result.preview, validationIssues),
      imported: [],
      errors: report.errors.map(courseImportIssueToRowError),
    };
  }

  return persistNormalizedCourseImport(prisma, result.normalized, {
    ...result.preview,
    warnings: [
      ...result.preview.warnings,
      ...result.report.warnings.map((warning) => warning.message),
    ],
  });
}

// Exported for tests that need the full normalize result.
export async function normalizeCourseImportForTest(buffer: Buffer): Promise<
  | { ok: false; preview: CourseImportPreview }
  | { ok: true; normalized: NormalizeSuccess['normalized']; preview: CourseImportPreview }
> {
  const result = await normalizeCourseImportBuffer(buffer);
  if (!result.ok) return result;
  return { ok: true, normalized: result.normalized, preview: result.preview };
}
