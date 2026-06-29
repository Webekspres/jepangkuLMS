import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';
import { buildTryoutImportTemplateBuffer } from '@/features/admin-cms/lib/xlsx-template-builder';

export async function GET() {
    try {
        await requireAdminAccess();
    } catch {
        return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
    }

    const buffer = await buildTryoutImportTemplateBuffer();
    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="formulir-impor-tryout.xlsx"',
        },
    });
}
