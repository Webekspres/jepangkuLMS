const DEFAULT_ALLOWED_ORIGINS = ['https://kursus.jepangku.com'];

function parseAllowedOrigins(): Set<string> {
    const origins = new Set<string>();

    for (const raw of DEFAULT_ALLOWED_ORIGINS) {
        origins.add(raw);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (appUrl) {
        try {
            origins.add(new URL(appUrl).origin);
        } catch {
            // ponytail: invalid APP_URL — skip
        }
    }

    const extra = process.env.CORS_ALLOWED_ORIGINS?.trim();
    if (extra) {
        for (const part of extra.split(',')) {
            const trimmed = part.trim();
            if (!trimmed) continue;
            try {
                origins.add(new URL(trimmed).origin);
            } catch {
                origins.add(trimmed);
            }
        }
    }

    return origins;
}

export function resolveCorsOrigin(request: Request): string | null {
    const origin = request.headers.get('origin');
    if (!origin) return null;

    const allowed = parseAllowedOrigins();
    return allowed.has(origin) ? origin : null;
}

export function corsHeaders(request: Request): HeadersInit {
    const origin = resolveCorsOrigin(request);
    if (!origin) return {};

    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-LMS-API-Key',
        'Vary': 'Origin',
    };
}

export function handleCorsPreflight(request: Request): Response | null {
    if (request.method !== 'OPTIONS') return null;

    const origin = resolveCorsOrigin(request);
    if (!origin) {
        return new Response(null, { status: 403 });
    }

    return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
    });
}
