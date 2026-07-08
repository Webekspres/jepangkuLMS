'use server';

import { revalidatePath } from 'next/cache';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { revalidateStudentLearningSurfaces } from '@/lib/cache/revalidate-learning';
import { prisma } from '@/lib/prisma';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import type { CourseImportPreview } from '@/features/admin-cms/lib/course-import-types';
import {
    importCourseWorkbook,
    previewCourseImport,
} from '@/features/admin-cms/lib/import-framework/import-course-workbook';

export type CmsImportPreviewResult = {
    ok: boolean;
    preview: CourseImportPreview;
};

export async function previewCourseImportAction(base64: string): Promise<CmsImportPreviewResult> {
    await requireAdminAction();
    const buffer = Buffer.from(base64, 'base64');
    const preview = await previewCourseImport(buffer);
    return { ok: preview.ok, preview };
}

/** @deprecated Use previewCourseImportAction */
export const previewSenseiCourseAction = previewCourseImportAction;

export type CmsImportCommitResult = {
    ok: boolean;
    message: string;
    preview: CourseImportPreview;
    imported?: Array<{ courseId: string; moduleCount: number; lessonCount: number }>;
    errors?: Array<{ row: number; message: string; sheet?: string; code?: string }>;
};

export async function importCourseWorkbookAction(base64: string): Promise<CmsImportCommitResult> {
    await requireAdminAction();
    const buffer = Buffer.from(base64, 'base64');
    const result = await importCourseWorkbook(prisma, buffer);

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
            message: `Berhasil mengimpor ${result.imported.length} kursus (${lessonTotal} pelajaran, ${kosakataTotal} kosakata, ${kanjiTotal} kanji, ${tataBahasaTotal} tata bahasa, ${questionTotal} kuis).`,
            preview: result.preview,
            imported: result.imported.map((row) => ({
                courseId: row.courseId,
                moduleCount: row.moduleCount,
                lessonCount: row.lessonCount,
            })),
        };
    }

    const templateLabel = result.preview.template
        ? `${result.preview.template.key} ${result.preview.template.version}`
        : 'workbook';

    return {
        ok: false,
        message: `Impor gagal. Perbaiki error pada ${templateLabel} lalu coba lagi.`,
        preview: result.preview,
        errors: result.errors,
    };
}

/** @deprecated Use importCourseWorkbookAction */
export const importSenseiCourseAction = importCourseWorkbookAction;
