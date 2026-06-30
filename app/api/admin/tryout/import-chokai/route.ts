import { NextResponse } from 'next/server';
import type { LevelJLPT } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';
import { importChokaiZip, previewChokaiZipImport } from '@/features/admin-cms/lib/import-chokai-zip';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { prisma } from '@/lib/prisma';

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
            return NextResponse.json({ ok: false, message: 'File ZIP wajib diunggah.' }, { status: 400 });
        }

        if (!sessionId || !LEVELS.includes(level)) {
            return NextResponse.json({ ok: false, message: 'sessionId dan level wajib.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        if (dryRun) {
            const preview = await previewChokaiZipImport(buffer);
            return NextResponse.json({
                ok: preview.ok,
                preview,
                message: preview.ok ? 'Paket Chokai valid.' : 'Paket perlu diperbaiki.',
            });
        }

        const session = await prisma.tryoutSession.findUnique({ where: { id: sessionId } });
        if (!session) {
            return NextResponse.json({ ok: false, message: 'Sesi tidak ditemukan.' }, { status: 404 });
        }

        const result = await importChokaiZip(prisma, {
            sessionId,
            sessionCode: session.code,
            level,
            buffer,
        });

        revalidatePath(ADMIN_ROUTES.tryoutSessionQuestions(sessionId));
        revalidatePath(ADMIN_ROUTES.tryoutSessions);
        revalidatePath('/dashboard/tryout');

        return NextResponse.json({
            ok: true,
            message: `${result.imported} soal Chokai berhasil diimpor (mengganti Chokai level ${level}).`,
            imported: result.imported,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Impor Chokai gagal.';
        return NextResponse.json({ ok: false, message, imported: 0 }, { status: 500 });
    }
}
