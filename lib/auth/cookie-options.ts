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
    // Path '/' diperlukan agar cookie dikirim ke semua halaman SSR (dashboard, admin, etc.).
    // Browser hanya mengirim cookie ke path yang match — path '/api' akan mematahkan
    // proxy.ts (admin guard) dan getCoreSession() di Server Components.
    // Lihat SECURITY_AUDIT.md M-11 untuk diskusi risiko vs fungsionalitas.
    path: '/',
    maxAge: CORE_JWT_COOKIE_MAX_AGE,
  };
}
