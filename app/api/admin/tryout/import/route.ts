import { NextResponse } from 'next/server';
import type { LevelJLPT } from '@prisma/client';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';
import {
    importTryoutQuestions,
    parseTryoutImportBuffer,
} from '@/features/admin-cms/lib/import-tryout-questions';
import { importTryoutWorkbook, previewTryoutWorkbookImport } from '@/features/admin-cms/lib/import-tryout-workbook';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ADMIN_ROUTES } from '@/lib/auth/constants';

const LEVELS: LevelJLPT[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

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
        const sessionId = String(formData.get('sessionId') ?? '').trim();
        const level = String(formData.get('level') ?? 'N5').trim() as LevelJLPT;

        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json({ ok: false, message: 'File wajib diunggah.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        if (!sessionId) {
            if (dryRun) {
                const preview = previewTryoutWorkbookImport(buffer);
                return NextResponse.json({
                    ok: preview.ok,
                    preview,
                    message: preview.ok ? 'Formulir valid.' : 'Validasi gagal.',
                });
            }

            const result = await importTryoutWorkbook(prisma, buffer);
            if (!result.ok) {
                return NextResponse.json({ ok: false, message: result.message, imported: 0 }, { status: 422 });
            }

            revalidatePath(ADMIN_ROUTES.tryoutSessions);
            if (result.sessionId) {
                revalidatePath(ADMIN_ROUTES.tryoutSessionQuestions(result.sessionId));
            }
            revalidatePath('/dashboard/tryout');

            return NextResponse.json({
                ok: true,
                message: result.message,
                imported: result.imported,
                sessionId: result.sessionId,
            });
        }

        if (!LEVELS.includes(level)) {
            return NextResponse.json({ ok: false, message: 'Level JLPT tidak valid.' }, { status: 400 });
        }

        const preview = parseTryoutImportBuffer(buffer, file.name);

        if (!preview.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    message: 'Validasi impor gagal.',
                    imported: 0,
                    errors: preview.errors,
                    sectionCounts: preview.sectionCounts,
                },
                { status: 422 },
            );
        }

        const result = await importTryoutQuestions(prisma, {
            sessionId,
            level,
            rows: preview.validRows,
        });

        revalidatePath(ADMIN_ROUTES.tryoutSessionQuestions(sessionId));
        revalidatePath(ADMIN_ROUTES.tryoutSessions);
        revalidatePath('/dashboard/tryout');

        return NextResponse.json({
            ok: true,
            message: `${result.imported} soal berhasil ditambahkan.`,
            imported: result.imported,
            sectionCounts: preview.sectionCounts,
            errors: [],
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Impor gagal.';
        return NextResponse.json({ ok: false, message, imported: 0, errors: [] }, { status: 500 });
    }
}
