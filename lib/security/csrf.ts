/** Reject cross-site POST when Origin/Referer does not match the app. */
export function assertSameOriginPost(request: Request): Response | null {
    const host = request.headers.get('host') || '';
    // Skip CSRF check only for pure localhost dev (127.0.0.1 or localhost)
    const isPlainLocalhost =
        host === 'localhost:3000' ||
        host === '127.0.0.1:3000' ||
        host === 'localhost' ||
        host === '127.0.0.1';
    if (isPlainLocalhost) return null;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (!appUrl) return null;

    let allowedOrigin: string;
    try {
        allowedOrigin = new URL(appUrl).origin;
    } catch {
        return null;
    }

    const origin = request.headers.get('origin');
    if (origin) {
        if (origin === allowedOrigin) return null;
        return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const referer = request.headers.get('referer');
    if (referer?.startsWith(`${allowedOrigin}/`) || referer === `${allowedOrigin}/`) {
        return null;
    }

    return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });
}
