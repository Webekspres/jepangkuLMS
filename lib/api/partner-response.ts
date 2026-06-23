import { NextResponse } from 'next/server';

const PARTNER_CACHE_CONTROL = 'public, max-age=60, s-maxage=300';

export function partnerJson<T>(body: T, init?: { status?: number }): NextResponse {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      'Cache-Control': PARTNER_CACHE_CONTROL,
    },
  });
}

export function partnerApiDisabled(): NextResponse {
  return NextResponse.json(
    {
      error: 'Partner API is not configured.',
      code: 'PARTNER_API_DISABLED',
    },
    { status: 503 },
  );
}

export function partnerUnauthorized(): NextResponse {
  return NextResponse.json(
    {
      error: 'Invalid or missing API key.',
      code: 'UNAUTHORIZED',
    },
    { status: 401 },
  );
}

export function partnerNotFound(message = 'Resource not found.'): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: 'NOT_FOUND',
    },
    { status: 404 },
  );
}
