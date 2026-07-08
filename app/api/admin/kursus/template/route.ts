import { NextResponse } from 'next/server';
import { buildCourseImportTemplateV1Buffer } from '@/features/admin-cms/lib/build-course-import-template-v1';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';

export async function GET() {
    try {
        await requireAdminAccess();
    } catch {
        return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
    }

    const buffer = await buildCourseImportTemplateV1Buffer();
    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="template-impor-kursus-v1.xlsx"',
        },
    });
}
