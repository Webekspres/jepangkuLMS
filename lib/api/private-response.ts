import { NextResponse } from 'next/server';

/** Authenticated API — jangan di-cache CDN/browser (Cloudflare pernah serve profil user A ke user B). */
export const PRIVATE_API_CACHE_CONTROL = 'private, no-store, max-age=0, must-revalidate';

const PRIVATE_API_HEADERS = {
  'Cache-Control': PRIVATE_API_CACHE_CONTROL,
  Vary: 'Cookie',
  'X-Content-Type-Options': 'nosniff',
} as const;

export function privateApiJson<T>(body: T, init?: { status?: number }): NextResponse {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: PRIVATE_API_HEADERS,
  });
}
