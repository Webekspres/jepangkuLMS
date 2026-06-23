import { NextResponse } from 'next/server';

export type ApiErrorPayload = {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
        requestId?: string;
    };
};

export function createRequestId(): string {
    return crypto.randomUUID();
}

export function jsonApiError(
    code: string,
    message: string,
    status: number,
    options?: {
        details?: Record<string, unknown>;
        requestId?: string;
    },
): NextResponse<ApiErrorPayload> {
    const requestId = options?.requestId ?? createRequestId();
    const details = options?.details;

    return NextResponse.json(
        {
            error: {
                code,
                message,
                ...(details && Object.keys(details).length > 0 ? { details } : {}),
                requestId,
            },
        },
        {
            status,
            headers: { 'x-request-id': requestId },
        },
    );
}

export function logApiError(
    scope: string,
    context: Record<string, unknown>,
    error?: unknown,
): string {
    const requestId =
        typeof context.requestId === 'string' ? context.requestId : createRequestId();

    const entry = {
        timestamp: new Date().toISOString(),
        level: 'error',
        service: 'jepangku-lms',
        scope,
        requestId,
        ...context,
        ...(error instanceof Error
            ? {
                errorName: error.name,
                errorMessage: error.message,
                stack: error.stack,
            }
            : error !== undefined
                ? { error }
                : {}),
    };

    console.error(JSON.stringify(entry));
    return requestId;
}

export function logApiWarn(scope: string, context: Record<string, unknown>): void {
    console.warn(
        JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'warn',
            service: 'jepangku-lms',
            scope,
            ...context,
        }),
    );
}
