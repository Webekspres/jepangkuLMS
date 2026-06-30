import { NextResponse } from 'next/server';
import { corsHeaders, handleCorsPreflight } from '@/lib/security/cors';

const PARTNER_CACHE_CONTROL = 'public, max-age=60, s-maxage=300';

function withPartnerHeaders(request: Request, init?: ResponseInit): ResponseInit {
    return {
        ...init,
        headers: {
            ...corsHeaders(request),
            ...(init?.headers as Record<string, string> | undefined),
        },
    };
}

export function partnerJson<T>(request: Request, body: T, init?: { status?: number }): NextResponse {
    return NextResponse.json(body, withPartnerHeaders(request, {
        status: init?.status ?? 200,
        headers: {
            'Cache-Control': PARTNER_CACHE_CONTROL,
        },
    }));
}

export function partnerApiDisabled(request: Request): NextResponse {
    return NextResponse.json(
        {
            error: 'Partner API is not configured.',
            code: 'PARTNER_API_DISABLED',
        },
        withPartnerHeaders(request, { status: 503 }),
    );
}

export function partnerUnauthorized(request: Request): NextResponse {
    return NextResponse.json(
        {
            error: 'Invalid or missing API key.',
            code: 'UNAUTHORIZED',
        },
        withPartnerHeaders(request, { status: 401 }),
    );
}

export function partnerNotFound(request: Request, message = 'Resource not found.'): NextResponse {
    return NextResponse.json(
        {
            error: message,
            code: 'NOT_FOUND',
        },
        withPartnerHeaders(request, { status: 404 }),
    );
}

export { handleCorsPreflight };
