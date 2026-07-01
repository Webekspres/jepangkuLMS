import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';
import { importTryoutWorkbook, previewTryoutWorkbookImport } from '@/features/admin-cms/lib/import-tryout-workbook';
import { importUnifiedTryoutZip, previewUnifiedTryoutZip } from '@/features/admin-cms/lib/import-unified-tryout';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { prisma } from '@/lib/prisma';

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

        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json({ ok: false, message: 'File wajib diunggah.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = file.name.toLowerCase();

        // Check if file is ZIP or XLSX
        const isZip = filename.endsWith('.zip');
        const isXlsx = filename.endsWith('.xlsx') || filename.endsWith('.xls');

        // If sessionId is provided, expect ZIP format (unified import)
        if (sessionId) {
            if (!isZip) {
                return NextResponse.json(
                    {
                        ok: false,
                        message: 'Format file harus .zip. Untuk impor ke sesi, gunakan format ZIP dengan jlpt.xlsx di dalamnya.',
                        imported: 0,
                    },
                    { status: 400 },
                );
            }

            const session = await prisma.tryoutSession.findUnique({ where: { id: sessionId } });
            if (!session) {
                return NextResponse.json({ ok: false, message: 'Sesi tryout tidak ditemukan.' }, { status: 404 });
            }

            // Dry-run: preview unified import
            if (dryRun) {
                const preview = await previewUnifiedTryoutZip(buffer);
                return NextResponse.json({
                    ok: preview.ok,
                    preview,
                    message: preview.ok ? 'Paket JLPT valid.' : 'Paket perlu diperbaiki.',
                });
            }

            // Import unified ZIP
            const result = await importUnifiedTryoutZip(prisma, {
                sessionId,
                sessionCode: session.code,
                buffer,
            });

            revalidatePath(ADMIN_ROUTES.tryoutSessionQuestions(sessionId));
            revalidatePath(ADMIN_ROUTES.tryoutSessions);
            revalidatePath('/dashboard/tryout');

            const sections = [];
            if (result.moji.imported > 0) sections.push(`MOJI GOI: ${result.moji.imported}`);
            if (result.bunpou.imported > 0) sections.push(`BUNPOU: ${result.bunpou.imported}`);
            if (result.chokai.imported > 0) sections.push(`CHOKAI: ${result.chokai.imported}`);

            return NextResponse.json({
                ok: true,
                message: `${result.totalImported} soal berhasil diimpor (${sections.join(', ')}).`,
                imported: result.totalImported,
            });
        }

        // No sessionId: expect XLSX (workbook import to create new session)
        if (!isXlsx) {
            return NextResponse.json(
                {
                    ok: false,
                    message: 'Format file harus .xlsx. Untuk impor ke sesi yang ada, gunakan format ZIP.',
                    imported: 0,
                },
                { status: 400 },
            );
        }

        if (dryRun) {
            const preview = await previewTryoutWorkbookImport(buffer);
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
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Impor gagal.';
        return NextResponse.json({ ok: false, message, imported: 0, errors: [] }, { status: 500 });
    }
}
