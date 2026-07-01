import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';
import { buildJlptTemplateZipBuffer } from '@/features/admin-cms/lib/build-jlpt-template-zip';

export async function GET() {
    try {
        await requireAdminAccess();
    } catch {
        return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
    }

    const buffer = await buildJlptTemplateZipBuffer();
    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="template-jlpt-import.zip"',
        },
    });
}
