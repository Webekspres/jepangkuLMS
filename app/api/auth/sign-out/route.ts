import { NextResponse } from 'next/server';
import { CORE_JWT_COOKIE } from '@/lib/auth/constants';
import { getCoreJwtCookieOptions } from '@/lib/auth/cookie-options';
import { assertSameOriginPost } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/rate-limit';

const SIGN_OUT_RATE_LIMIT = 10; // requests
const SIGN_OUT_RATE_WINDOW_MS = 60_000; // per minute

/** Extract client IP from request headers — respects proxies (ngrok, Cloudflare, VPS). */
function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
    return request.headers.get('cf-connecting-ip') || 'unknown';
}

export async function POST(request: Request) {
    const csrfBlock = assertSameOriginPost(request);
    if (csrfBlock) return csrfBlock;

    // Rate limit sign-out per IP (bukan requestId — UUID per-request tidak efektif)
    const clientIp = getClientIp(request);
    const rateCheck = await checkRateLimit(
        `auth:sign-out:ip:${clientIp}`,
        SIGN_OUT_RATE_LIMIT,
        SIGN_OUT_RATE_WINDOW_MS,
    );
    if (!rateCheck.success) {
        return NextResponse.json(
            { ok: false, error: 'Too many requests' },
            { status: 429 },
        );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(CORE_JWT_COOKIE, '', { ...getCoreJwtCookieOptions(), maxAge: 0 });
    return response;
}
