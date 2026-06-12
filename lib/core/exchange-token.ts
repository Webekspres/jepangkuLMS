import { getCoreApiBaseUrl } from './client';
import { CoreApiError, type CoreErrorBody } from './core-api-error';
import { loggers, logUpstreamFailure } from '@/lib/logger';

const coreLog = loggers.core;

type CoreTokenSuccess = {
    token: string;
    expiresIn: string;
};

export class CoreTokenExchangeError extends CoreApiError {
    constructor(
        message: string,
        status: number,
        code?: string,
        details?: Record<string, unknown>,
        coreRequestId?: string,
    ) {
        super(message, status, code, details, coreRequestId);
        this.name = 'CoreTokenExchangeError';
    }
}

export async function exchangeClerkSessionForCoreJwt(
    clerkSessionToken: string,
): Promise<CoreTokenSuccess> {
    const baseUrl = getCoreApiBaseUrl();
    if (!baseUrl) {
        coreLog.error('Core token exchange aborted — JEPANGKU_CORE_API_URL not set');
        throw new CoreTokenExchangeError(
            'JEPANGKU_CORE_API_URL belum dikonfigurasi.',
            503,
            'CORE_NOT_CONFIGURED',
            { hint: 'Set JEPANGKU_CORE_API_URL in LMS .env' },
        );
    }

    const response = await fetch(`${baseUrl}/api/v1/auth/token`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${clerkSessionToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ application: 'LMS' }),
        cache: 'no-store',
    });

    if (!response.ok) {
        let body: CoreErrorBody = {};
        try {
            body = (await response.json()) as CoreErrorBody;
        } catch {
            // ignore parse errors
        }

        const coreError = CoreApiError.fromResponse(
            response.status,
            body,
            `Core token exchange failed (${response.status})`,
        );

        const failure = logUpstreamFailure(
            {
                method: 'POST',
                path: '/api/v1/auth/token',
                statusCode: response.status,
                code: coreError.code,
            },
            `Core JWT token exchange rejected: ${coreError.message}`,
        );
        coreLog.warn(failure.context, failure.summary);

        throw new CoreTokenExchangeError(
            coreError.message,
            coreError.status,
            coreError.code,
            {
                ...coreError.details,
                coreUrl: `${baseUrl}/api/v1/auth/token`,
                httpStatus: response.status,
            },
            coreError.coreRequestId ?? response.headers.get('x-request-id') ?? undefined,
        );
    }

    const { context, summary } = logUpstreamFailure(
        { method: 'POST', path: '/api/v1/auth/token', statusCode: response.status },
        'Core JWT token exchange succeeded',
    );
    coreLog.info(context, summary);
    return (await response.json()) as CoreTokenSuccess;
}
