'use server';

import { revalidatePath } from 'next/cache';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { revalidateStudentLearningSurfaces } from '@/lib/cache/revalidate-learning';
import { prisma } from '@/lib/prisma';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import {
  importCoursesFromCsvText,
  previewCourseCsvImport,
  type CsvImportPreview,
} from '@/features/admin-cms/lib/import-course-csv';

export type CmsImportPreviewResult = {
  ok: boolean;
  preview: CsvImportPreview;
};

export async function previewCourseCsvAction(csvText: string): Promise<CmsImportPreviewResult> {
  await requireAdminAction();
  const preview = previewCourseCsvImport(csvText);
  return { ok: preview.ok, preview };
}

export type CmsImportCommitResult = {
  ok: boolean;
  message: string;
  preview: CsvImportPreview;
  imported?: Array<{ courseId: string; moduleCount: number; lessonCount: number }>;
  errors?: Array<{ row: number; message: string }>;
};

export async function importCoursesCsvAction(csvText: string): Promise<CmsImportCommitResult> {
  await requireAdminAction();
  const result = await importCoursesFromCsvText(prisma, csvText);

  if (result.ok) {
    revalidateStudentLearningSurfaces();
    revalidatePath(ADMIN_ROUTES.kursus);
    for (const row of result.imported) {
      revalidatePath(ADMIN_ROUTES.kursusModules(row.courseId));
    }

    const lessonTotal = result.imported.reduce((sum, row) => sum + row.lessonCount, 0);
    const kosakataTotal = result.imported.reduce((sum, row) => sum + row.kosakataCount, 0);
    const kanjiTotal = result.imported.reduce((sum, row) => sum + row.kanjiCount, 0);
    const tataBahasaTotal = result.imported.reduce((sum, row) => sum + row.tataBahasaCount, 0);
    const questionTotal = result.imported.reduce((sum, row) => sum + row.questionCount, 0);

    return {
      ok: true,
      message: `Berhasil mengimpor ${result.imported.length} kursus (${lessonTotal} pelajaran, ${kosakataTotal} kosakata, ${kanjiTotal} kanji, ${tataBahasaTotal} tata bahasa, ${questionTotal} soal kuis).`,
      preview: result.preview,
      imported: result.imported.map((row) => ({
        courseId: row.courseId,
        moduleCount: row.moduleCount,
        lessonCount: row.lessonCount,
      })),
    };
  }

  return {
    ok: false,
    message: 'Impor gagal. Perbaiki error pada CSV lalu coba lagi.',
    preview: result.preview,
    errors: result.errors,
  };
}
