import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CORE_JWT_COOKIE } from '@/lib/auth/constants';
import { getCoreJwtCookieOptions } from '@/lib/auth/cookie-options';
import { syncUserAnchor } from '@/lib/auth/sync-user-anchor';
import { CoreTokenExchangeError } from '@/lib/core/exchange-token';
import { exchangeClerkSessionForCoreJwtWithRetry } from '@/lib/core/exchange-token-with-retry';
import { loggers, formatErrorSummary, formatUpstreamSummary, serializeError } from '@/lib/logger';

const apiLog = loggers.api.child({ route: 'POST /api/auth/core-token' });

function mapExchangeError(error: CoreTokenExchangeError) {
  if (error.code === 'USER_NOT_FOUND') {
    return {
      status: 503,
      message:
        'Profil kamu belum siap. Tunggu beberapa detik lalu klik Coba lagi.',
    };
  }

  if (error.code === 'INVALID_SESSION' || error.status === 401) {
    return {
      status: 401,
      message: 'Sesi login tidak valid. Keluar lalu masuk kembali.',
    };
  }

  if (error.code === 'AUTH_NOT_CONFIGURED' || error.code === 'CORE_NOT_CONFIGURED') {
    return { status: 503, message: 'Layanan profil belum siap. Coba lagi nanti.' };
  }

  if (error.code === 'INTERNAL_ERROR') {
    return {
      status: 503,
      message: 'Terjadi gangguan server. Coba lagi dalam beberapa menit.',
    };
  }

  if (error.code === 'JWT_SIGN_FAILED') {
    return {
      status: 503,
      message: 'Terjadi gangguan server. Coba lagi dalam beberapa menit.',
    };
  }

  if (error.code === 'USER_SYNC_FAILED') {
    return {
      status: 503,
      message: 'Gagal memuat profil akun. Coba lagi atau hubungi tim support.',
    };
  }

  return { status: error.status >= 500 ? 503 : error.status, message: error.message };
}

/** Exchange Clerk session → Core JWT, simpan httpOnly cookie, upsert User jangkar */
export async function POST() {
  const { userId, getToken } = await auth();

  if (!userId) {
    apiLog.warn('Core token exchange rejected — no Clerk session');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clerkToken = await getToken();
  if (!clerkToken) {
    apiLog.warn({ userId }, 'Core token exchange rejected — Clerk session token missing');
    return NextResponse.json({ error: 'Clerk session token missing' }, { status: 401 });
  }

  apiLog.info({ userId }, 'Core token exchange started');

  try {
    const { token, expiresIn } = await exchangeClerkSessionForCoreJwtWithRetry(clerkToken);

    try {
      await syncUserAnchor(userId);
    } catch (dbError) {
      apiLog.error(
        { userId, expiresIn, ...serializeError(dbError) },
        'LMS user anchor sync failed after successful Core JWT exchange',
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(CORE_JWT_COOKIE, token, getCoreJwtCookieOptions());

    apiLog.info({ userId, expiresIn }, 'Core token exchange completed — cookie set');
    return response;
  } catch (error) {
    if (error instanceof CoreTokenExchangeError) {
      const mapped = mapExchangeError(error);
      apiLog.error(
        {
          userId,
          code: error.code,
          statusCode: error.status,
          httpStatus: mapped.status,
          upstream: 'core-backend',
          method: 'POST',
          path: '/api/v1/auth/token',
        },
        formatUpstreamSummary(
          {
            method: 'POST',
            path: '/api/v1/auth/token',
            statusCode: error.status,
            code: error.code,
          },
          `Core token exchange failed: ${error.message}`,
        ),
      );
      return NextResponse.json({ error: mapped.message, code: error.code }, { status: mapped.status });
    }

    apiLog.error(
      { userId, ...serializeError(error) },
      formatErrorSummary(error, 'jepangku-lms'),
    );
    return NextResponse.json({ error: 'Gagal menghubungkan layanan profil.' }, { status: 503 });
  }
}
