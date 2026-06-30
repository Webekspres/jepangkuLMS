import { NextResponse } from 'next/server';
import { CORE_JWT_COOKIE } from '@/lib/auth/constants';
import { getCoreJwtCookieOptions } from '@/lib/auth/cookie-options';
import { assertSameOriginPost } from '@/lib/security/csrf';

export async function POST(request: Request) {
    const csrfBlock = assertSameOriginPost(request);
    if (csrfBlock) return csrfBlock;

    const response = NextResponse.json({ ok: true });
    response.cookies.set(CORE_JWT_COOKIE, '', { ...getCoreJwtCookieOptions(), maxAge: 0 });
    return response;
}
