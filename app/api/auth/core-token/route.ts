import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CORE_JWT_COOKIE } from '@/lib/auth/constants';
import { getCoreJwtCookieOptions } from '@/lib/auth/cookie-options';
import { syncUserAnchor } from '@/lib/auth/sync-user-anchor';
import { createRequestId, jsonApiError, logApiError } from '@/lib/errors/api-error';
import { CoreTokenExchangeError } from '@/lib/core/exchange-token';
import { exchangeClerkSessionForCoreJwtWithRetry } from '@/lib/core/exchange-token-with-retry';

function mapExchangeError(error: CoreTokenExchangeError) {
    if (error.code === 'USER_NOT_FOUND') {
        return {
            status: 503,
            message:
                'Akun belum tersinkron di Core. Clerk webhook atau db:reconcile-clerk diperlukan — tunggu ~10 detik lalu coba lagi.',
            details: {
                coreCode: error.code,
                coreRequestId: error.coreRequestId,
                ...error.details,
            },
        };
    }

    if (error.status === 401 || error.code === 'INVALID_SESSION') {
        return {
            status: 401,
            message: 'Sesi Clerk tidak valid. Silakan masuk ulang.',
            details: {
                coreCode: error.code,
                coreRequestId: error.coreRequestId,
                ...error.details,
            },
        };
    }

    if (error.code === 'AUTH_NOT_CONFIGURED' || error.code === 'CORE_NOT_CONFIGURED') {
        return {
            status: 503,
            message: 'Layanan auth Core belum siap. Coba lagi nanti.',
            details: { coreCode: error.code, ...error.details },
        };
    }

    if (error.code === 'INTERNAL_ERROR') {
        return {
            status: 503,
            message:
                'Core Backend error saat menerbitkan JWT. Cek log Core dengan coreRequestId di details.',
            details: {
                coreCode: error.code,
                coreRequestId: error.coreRequestId,
                ...error.details,
            },
        };
    }

    if (error.code === 'JWT_SIGN_FAILED') {
        return {
            status: 503,
            message: 'Core gagal menandatangani JWT (JWT_PRIVATE_KEY). Minta tim Core perbaiki & redeploy.',
            details: {
                coreCode: error.code,
                coreRequestId: error.coreRequestId,
                ...error.details,
            },
        };
    }

    return {
        status: error.status >= 500 ? 503 : error.status,
        message: error.message,
        details: {
            coreCode: error.code,
            coreRequestId: error.coreRequestId,
            ...error.details,
        },
    };
}

/** Exchange Clerk session → Core JWT, simpan httpOnly cookie, upsert User jangkar */
export async function POST() {
    const requestId = createRequestId();

    const { userId, getToken } = await auth();

    if (!userId) {
        return jsonApiError('CLERK_NOT_AUTHENTICATED', 'Clerk session required', 401, {
            requestId,
            details: { hint: 'Sign in via Clerk before calling /api/auth/core-token' },
        });
    }

    const clerkToken = await getToken();
    if (!clerkToken) {
        return jsonApiError('CLERK_TOKEN_MISSING', 'Clerk session token missing', 401, {
            requestId,
            details: { clerkUserId: userId },
        });
    }

    try {
        const { token } = await exchangeClerkSessionForCoreJwtWithRetry(clerkToken);

        try {
            await syncUserAnchor(userId);
        } catch (dbError) {
            logApiError(
                'auth/core-token.anchor_sync_failed',
                {
                    requestId,
                    clerkUserId: userId,
                    note: 'Core JWT was issued; LMS anchor sync failed',
                },
                dbError,
            );
        }

        const response = NextResponse.json({ ok: true, requestId });
        response.headers.set('x-request-id', requestId);
        response.cookies.set(CORE_JWT_COOKIE, token, getCoreJwtCookieOptions());

        return response;
    } catch (error) {
        if (error instanceof CoreTokenExchangeError) {
            logApiError(
                'auth/core-token.exchange_failed',
                {
                    requestId,
                    clerkUserId: userId,
                    coreCode: error.code,
                    coreStatus: error.status,
                    coreRequestId: error.coreRequestId,
                    coreDetails: error.details,
                },
                error,
            );
            const mapped = mapExchangeError(error);
            return jsonApiError(
                error.code ?? 'CORE_EXCHANGE_FAILED',
                mapped.message,
                mapped.status,
                { requestId, details: mapped.details },
            );
        }

        logApiError('auth/core-token.unexpected', { requestId, clerkUserId: userId }, error);
        return jsonApiError(
            'CORE_EXCHANGE_UNEXPECTED',
            'Gagal menghubungkan ke Core Backend.',
            503,
            {
                requestId,
                details: {
                    hint: 'Check LMS server logs with requestId',
                },
            },
        );
    }
}
