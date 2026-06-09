import { NextResponse } from 'next/server';
import { CORE_JWT_COOKIE } from '@/lib/auth/constants';
import { getCoreJwtCookieOptions } from '@/lib/auth/cookie-options';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CORE_JWT_COOKIE, '', { ...getCoreJwtCookieOptions(), maxAge: 0 });
  return response;
}
