import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';
import JSZip from 'jszip';
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

        // Security: batasi ukuran file (ZIP maks 50MB, XLSX maks 10MB)
        const filename = file.name.toLowerCase();
        const isZip = filename.endsWith('.zip');
        const isXlsx = filename.endsWith('.xlsx') || filename.endsWith('.xls');
        const maxBytes = isZip ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxBytes) {
            return NextResponse.json(
                {
                    ok: false,
                    message: isZip
                        ? 'Ukuran file ZIP maksimal 50 MB.'
                        : 'Ukuran file XLSX maksimal 10 MB.',
                    imported: 0,
                },
                { status: 400 },
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

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

        // No sessionId: expect ZIP or XLSX (workbook import to create new session)
        let workbookBuffer = buffer;

        if (isZip) {
            // Extract jlpt.xlsx from ZIP
            let zip: JSZip;
            try {
                zip = await JSZip.loadAsync(buffer);
            } catch {
                return NextResponse.json({ ok: false, message: 'File ZIP tidak bisa dibaca.', imported: 0 }, { status: 400 });
            }

            let xlsxFound = false;
            for (const [path, entry] of Object.entries(zip.files)) {
                if (entry.dir) continue;
                if (/^jlpt\.xlsx$/i.test(path.replace(/\\/g, '/').replace(/^\.\//, ''))) {
                    workbookBuffer = Buffer.from(await entry.async('arraybuffer'));
                    xlsxFound = true;
                    break;
                }
            }

            if (!xlsxFound) {
                return NextResponse.json({ ok: false, message: 'jlpt.xlsx tidak ditemukan di akar ZIP.', imported: 0 }, { status: 400 });
            }
        } else if (!isXlsx) {
            return NextResponse.json(
                {
                    ok: false,
                    message: 'Format file harus .zip atau .xlsx.',
                    imported: 0,
                },
                { status: 400 },
            );
        }

        if (dryRun) {
            const preview = await previewTryoutWorkbookImport(workbookBuffer);
            return NextResponse.json({
                ok: preview.ok,
                preview,
                message: preview.ok ? 'Formulir valid.' : 'Validasi gagal.',
            });
        }

        const result = await importTryoutWorkbook(prisma, workbookBuffer);
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
