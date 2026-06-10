import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CORE_JWT_COOKIE } from '@/lib/auth/constants';
import { getCoreJwtCookieOptions } from '@/lib/auth/cookie-options';
import { syncUserAnchor } from '@/lib/auth/sync-user-anchor';
import { CoreTokenExchangeError } from '@/lib/core/exchange-token';
import { exchangeClerkSessionForCoreJwtWithRetry } from '@/lib/core/exchange-token-with-retry';

function mapExchangeError(error: CoreTokenExchangeError) {
  if (error.code === 'USER_NOT_FOUND') {
    return {
      status: 503,
      message:
        'Akun baru belum tersinkron di Core. Clerk webhook perlu mengirim user.created ke Core — tunggu ~10 detik lalu klik Coba lagi.',
    };
  }

  if (error.status === 401) {
    return { status: 401, message: 'Sesi Clerk tidak valid. Silakan masuk ulang.' };
  }

  if (error.code === 'AUTH_NOT_CONFIGURED' || error.code === 'CORE_NOT_CONFIGURED') {
    return { status: 503, message: 'Layanan auth Core belum siap. Coba lagi nanti.' };
  }

  if (error.code === 'INTERNAL_ERROR') {
    return {
      status: 503,
      message:
        'Core Backend error saat menerbitkan JWT (INTERNAL_ERROR). Minta tim Core cek log server & JWT_PRIVATE_KEY.',
    };
  }

  if (error.code === 'JWT_SIGN_FAILED') {
    return {
      status: 503,
      message:
        'Core gagal menandatangani JWT (JWT_PRIVATE_KEY tidak valid). Minta tim Core perbaiki & redeploy.',
    };
  }

  if (error.code === 'USER_SYNC_FAILED') {
    return {
      status: 503,
      message:
        'Core gagal sync user dari Clerk. Pastikan CLERK_SECRET_KEY Core sama dengan app Clerk LMS.',
    };
  }

  return { status: error.status >= 500 ? 503 : error.status, message: error.message };
}

/** Exchange Clerk session → Core JWT, simpan httpOnly cookie, upsert User jangkar */
export async function POST() {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clerkToken = await getToken();
  if (!clerkToken) {
    return NextResponse.json({ error: 'Clerk session token missing' }, { status: 401 });
  }

  try {
    const { token } = await exchangeClerkSessionForCoreJwtWithRetry(clerkToken);

    try {
      await syncUserAnchor(userId);
    } catch (dbError) {
      console.error('[auth/core-token] LMS user anchor sync failed (Core JWT OK):', dbError);
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(CORE_JWT_COOKIE, token, getCoreJwtCookieOptions());

    return response;
  } catch (error) {
    if (error instanceof CoreTokenExchangeError) {
      console.error('[auth/core-token] Core exchange failed:', {
        code: error.code,
        status: error.status,
        message: error.message,
      });
      const mapped = mapExchangeError(error);
      return NextResponse.json({ error: mapped.message, code: error.code }, { status: mapped.status });
    }

    console.error('[auth/core-token]', error);
    return NextResponse.json({ error: 'Gagal menghubungkan ke Core Backend.' }, { status: 503 });
  }
}
