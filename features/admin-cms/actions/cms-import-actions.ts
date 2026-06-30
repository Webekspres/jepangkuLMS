'use server';

import { revalidatePath } from 'next/cache';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { revalidateStudentLearningSurfaces } from '@/lib/cache/revalidate-learning';
import { prisma } from '@/lib/prisma';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import type { CourseImportPreview } from '@/features/admin-cms/lib/course-import-types';
import {
    importCoursesFromXlsxBuffer,
    previewCourseXlsxImport,
} from '@/features/admin-cms/lib/import-course-xlsx';

export type CmsImportPreviewResult = {
    ok: boolean;
    preview: CourseImportPreview;
};

export async function previewCourseXlsxAction(base64: string): Promise<CmsImportPreviewResult> {
    await requireAdminAction();
    const buffer = Buffer.from(base64, 'base64');
    const preview = await previewCourseXlsxImport(buffer);
    return { ok: preview.ok, preview };
}

export type CmsImportCommitResult = {
    ok: boolean;
    message: string;
    preview: CourseImportPreview;
    imported?: Array<{ courseId: string; moduleCount: number; lessonCount: number }>;
    errors?: Array<{ row: number; message: string }>;
};

export async function importCoursesXlsxAction(base64: string): Promise<CmsImportCommitResult> {
    await requireAdminAction();
    const buffer = Buffer.from(base64, 'base64');
    const result = await importCoursesFromXlsxBuffer(prisma, buffer);

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

    return {
        ok: false,
        message: 'Impor gagal. Perbaiki error pada formulir Excel lalu coba lagi.',
        preview: result.preview,
        errors: result.errors,
    };
}
