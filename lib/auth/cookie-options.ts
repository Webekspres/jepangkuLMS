import { CORE_JWT_COOKIE_MAX_AGE } from '@/lib/auth/constants';

/** Cookie Core JWT — secure=true saat prod atau APP_URL https (ngrok). */
export function getCoreJwtCookieOptions() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const secure =
    process.env.NODE_ENV === 'production' || appUrl.startsWith('https://');

  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    // Path dibatasi ke /api agar cookie tidak dikirim ke halaman statis/marketing
    path: '/api',
    maxAge: CORE_JWT_COOKIE_MAX_AGE,
  };
}
