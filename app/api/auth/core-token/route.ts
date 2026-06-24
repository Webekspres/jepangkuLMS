import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CORE_JWT_COOKIE } from '@/lib/auth/constants';
import { getCoreJwtCookieOptions } from '@/lib/auth/cookie-options';
import { syncUserAnchor } from '@/lib/auth/sync-user-anchor';
import { createRequestId, jsonApiError, logApiError } from '@/lib/errors/api-error';
import { CoreTokenExchangeError } from '@/lib/core/exchange-token';
import { exchangeClerkSessionForCoreJwtWithRetry } from '@/lib/core/exchange-token-with-retry';
import { loggers, formatErrorSummary, formatUpstreamSummary, serializeError } from '@/lib/logger';

const apiLog = loggers.api.child({ route: 'POST /api/auth/core-token' });

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
            message:
                'Core menolak sesi Clerk (INVALID_SESSION). Pastikan LMS dan Core memakai app Clerk yang sama — sk_test dengan sk_test, atau sk_live dengan sk_live.',
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

    if (error.code === 'USER_SYNC_FAILED') {
        return {
            status: 503,
            message:
                'Core gagal sync user dari Clerk. Pastikan CLERK_SECRET_KEY Core sama dengan app Clerk LMS.',
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
        apiLog.warn({ requestId }, 'Core token exchange rejected — no Clerk session');
        return jsonApiError('CLERK_NOT_AUTHENTICATED', 'Clerk session required', 401, {
            requestId,
            details: { hint: 'Sign in via Clerk before calling /api/auth/core-token' },
        });
    }

    const clerkToken = await getToken();
    if (!clerkToken) {
        apiLog.warn({ requestId, userId }, 'Core token exchange rejected — Clerk session token missing');
        return jsonApiError('CLERK_TOKEN_MISSING', 'Clerk session token missing', 401, {
            requestId,
            details: { clerkUserId: userId },
        });
    }

    apiLog.info({ requestId, userId }, 'Core token exchange started');

    try {
        const { token, expiresIn } = await exchangeClerkSessionForCoreJwtWithRetry(clerkToken);

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
            apiLog.error(
                { requestId, userId, expiresIn, ...serializeError(dbError) },
                'LMS user anchor sync failed after successful Core JWT exchange',
            );
        }

        const response = NextResponse.json({ ok: true, requestId });
        response.headers.set('x-request-id', requestId);
        response.cookies.set(CORE_JWT_COOKIE, token, getCoreJwtCookieOptions());

        apiLog.info({ requestId, userId, expiresIn }, 'Core token exchange completed — cookie set');
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
            apiLog.error(
                {
                    requestId,
                    userId,
                    code: error.code,
                    statusCode: error.status,
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
            const mapped = mapExchangeError(error);
            return jsonApiError(
                error.code ?? 'CORE_EXCHANGE_FAILED',
                mapped.message,
                mapped.status,
                { requestId, details: mapped.details },
            );
        }

        logApiError('auth/core-token.unexpected', { requestId, clerkUserId: userId }, error);
        apiLog.error(
            { requestId, userId, ...serializeError(error) },
            formatErrorSummary(error, 'jepangku-lms'),
        );
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
