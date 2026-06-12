import { CoreTokenExchangeError, exchangeClerkSessionForCoreJwt } from './exchange-token';
import { loggers, formatUpstreamSummary } from '@/lib/logger';

const coreLog = loggers.core;

const WEBHOOK_SYNC_DELAYS_MS = [0, 1200, 2400, 3600, 5000];

function isRetryableExchangeError(error: CoreTokenExchangeError): boolean {
    if (error.code === 'USER_NOT_FOUND') return true;
    if (error.code === 'INTERNAL_ERROR') return true;
    return error.status >= 500;
}

/** Core butuh user dari webhook Clerk — retry jika belum tersinkron atau Core sementara error */
export async function exchangeClerkSessionForCoreJwtWithRetry(clerkSessionToken: string) {
    let lastError: CoreTokenExchangeError | undefined;

    for (let i = 0; i < WEBHOOK_SYNC_DELAYS_MS.length; i++) {
        const delayMs = WEBHOOK_SYNC_DELAYS_MS[i];
        const attempt = i + 1;

        if (delayMs > 0) {
            coreLog.debug(
                { attempt, delayMs, code: lastError?.code },
                'Retrying Core JWT exchange after delay',
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        try {
            const result = await exchangeClerkSessionForCoreJwt(clerkSessionToken);
            if (attempt > 1) {
                coreLog.info({ attempt }, 'Core JWT exchange succeeded after retry');
            }
            return result;
        } catch (error) {
            if (error instanceof CoreTokenExchangeError && isRetryableExchangeError(error)) {
                lastError = error;
                coreLog.warn(
                    {
                        attempt,
                        maxAttempts: WEBHOOK_SYNC_DELAYS_MS.length,
                        code: error.code,
                        statusCode: error.status,
                        coreRequestId: error.coreRequestId,
                        upstream: 'core-backend',
                        path: '/api/v1/auth/token',
                        method: 'POST',
                    },
                    formatUpstreamSummary(
                        {
                            method: 'POST',
                            path: '/api/v1/auth/token',
                            statusCode: error.status,
                            code: error.code,
                        },
                        `Core JWT exchange attempt ${attempt}/${WEBHOOK_SYNC_DELAYS_MS.length} failed — will retry if attempts remain`,
                    ),
                );
                continue;
            }
            throw error;
        }
    }

    coreLog.error(
        {
            maxAttempts: WEBHOOK_SYNC_DELAYS_MS.length,
            code: lastError?.code,
            statusCode: lastError?.status,
            coreRequestId: lastError?.coreRequestId,
            upstream: 'core-backend',
            path: '/api/v1/auth/token',
            method: 'POST',
        },
        formatUpstreamSummary(
            {
                method: 'POST',
                path: '/api/v1/auth/token',
                statusCode: lastError?.status,
                code: lastError?.code,
            },
            'Core JWT exchange exhausted all retries',
        ),
    );

    throw (
        lastError ??
        new CoreTokenExchangeError(
            'User belum tersinkron di Core.',
            404,
            'USER_NOT_FOUND',
            { retriesExhausted: WEBHOOK_SYNC_DELAYS_MS.length },
        )
    );
}
