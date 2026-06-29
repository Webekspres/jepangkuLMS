import { NextResponse } from 'next/server';
import { R2_OBJECT_CACHE_CONTROL } from '@/lib/media/constants';
import { fetchR2Object } from '@/lib/r2';

export const dynamic = 'force-dynamic';

/** Serve R2 objects via LMS when pub-*.r2.dev public access returns 401. */
export async function GET(request: Request) {
    const key = new URL(request.url).searchParams.get('key')?.trim();
    if (!key?.startsWith('lms/') || key.includes('..')) {
        return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    try {
        const object = await fetchR2Object(key);
        if (!object) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return new NextResponse(object.body, {
            headers: {
                'Content-Type': object.contentType,
                'Cache-Control': R2_OBJECT_CACHE_CONTROL,
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
}
