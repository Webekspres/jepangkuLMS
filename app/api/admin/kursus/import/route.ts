import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';
import {
    importCoursesFromXlsxBuffer,
    previewCourseXlsxImport,
} from '@/features/admin-cms/lib/import-course-xlsx';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { revalidateStudentLearningSurfaces } from '@/lib/cache/revalidate-learning';

export async function POST(request: Request) {
    try {
        await requireAdminAccess();
    } catch {
        return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
    }

    try {
        const url = new URL(request.url);
        const dryRun = url.searchParams.get('dryRun') === '1';

        const formData = await request.formData();
        const file = formData.get('file');
        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json({ ok: false, message: 'File wajib diunggah.' }, { status: 400 });
        }

        // Security: batasi ukuran file XLSX maksimal 10MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { ok: false, message: 'Ukuran file XLSX maksimal 10 MB.' },
                { status: 400 },
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        if (dryRun) {
            const preview = await previewCourseXlsxImport(buffer);
            return NextResponse.json({ ok: preview.ok, preview });
        }

        const result = await importCoursesFromXlsxBuffer(prisma, buffer);
        if (!result.ok) {
            return NextResponse.json(
                { ok: false, message: 'Validasi impor gagal.', preview: result.preview, errors: result.errors },
                { status: 422 },
            );
        }

        revalidateStudentLearningSurfaces();
        revalidatePath(ADMIN_ROUTES.kursus);
        for (const row of result.imported) {
            revalidatePath(ADMIN_ROUTES.kursusModules(row.courseId));
        }

        const lessonTotal = result.imported.reduce((sum, row) => sum + row.lessonCount, 0);

        return NextResponse.json({
            ok: true,
            message: `Berhasil mengimpor ${result.imported.length} kursus (${lessonTotal} pelajaran).`,
            preview: result.preview,
            imported: result.imported,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Impor gagal.';
        return NextResponse.json({ ok: false, message }, { status: 500 });
    }
}
