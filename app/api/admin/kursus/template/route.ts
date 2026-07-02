import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';

export async function GET() {
    try {
        await requireAdminAccess();
    } catch {
        return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
        {
            ok: false,
            message: 'Template formulir tidak lagi dipakai. Gunakan workbook sensei N4.xlsx atau N5.xlsx.',
        },
        { status: 410 },
    );
}
