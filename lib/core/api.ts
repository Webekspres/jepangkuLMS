import { getCoreApiBaseUrl } from './client';
import { CoreApiError, type CoreErrorBody } from './core-api-error';
import { loggers, logUpstreamFailure, serializeError } from '@/lib/logger';

const coreLog = loggers.core;
const CORE_FETCH_TIMEOUT_MS = 4_000;

async function fetchCoreJson<T>(path: string, init?: RequestInit): Promise<T> {
    const baseUrl = getCoreApiBaseUrl();
    if (!baseUrl) {
        coreLog.error({ path }, 'Core API base URL not configured');
        throw new CoreApiError(
            'JEPANGKU_CORE_API_URL belum dikonfigurasi',
            503,
            'CORE_NOT_CONFIGURED',
            { hint: 'Set JEPANGKU_CORE_API_URL in LMS .env' },
        );
    }

    const started = Date.now();
    const method = init?.method ?? 'GET';

    try {
        const response = await fetch(`${baseUrl}${path}`, {
            ...init,
            headers: {
                Accept: 'application/json',
                ...init?.headers,
            },
            cache: 'no-store',
            signal: AbortSignal.timeout(CORE_FETCH_TIMEOUT_MS),
        });

        const durationMs = Date.now() - started;

        if (!response.ok) {
            let body: CoreErrorBody = {};
            let responseBody: string | undefined;

            try {
                const bodyText = await response.text();
                responseBody = bodyText;
                body = JSON.parse(bodyText) as CoreErrorBody;
            } catch {
                // ignore
            }

            const error = CoreApiError.fromResponse(
                response.status,
                body,
                `Core API error (${response.status})`,
            );

            const { context, summary } = logUpstreamFailure(
                {
                    method,
                    path,
                    statusCode: response.status,
                    code: error.code,
                    durationMs,
                    responseBody,
                },
                `Core API request failed: ${error.message}`,
            );
            coreLog.warn(context, summary);

            throw new CoreApiError(
                error.message,
                error.status,
                error.code,
                {
                    ...error.details,
                    path,
                    coreUrl: `${baseUrl}${path}`,
                    httpStatus: response.status,
                },
                error.coreRequestId ?? response.headers.get('x-request-id') ?? undefined,
            );
        }

        const { context, summary } = logUpstreamFailure(
            { method, path, statusCode: response.status, durationMs },
            'Core API request OK',
        );
        coreLog.debug(context, summary);
        return (await response.json()) as T;
    } catch (error) {
        const durationMs = Date.now() - started;

        if (error instanceof CoreApiError) {
            throw error;
        }

        if (error instanceof Error && error.name === 'TimeoutError') {
            const { context, summary } = logUpstreamFailure(
                {
                    method,
                    path,
                    statusCode: 504,
                    code: 'TIMEOUT',
                    durationMs,
                },
                `Core API request timed out after ${CORE_FETCH_TIMEOUT_MS}ms`,
            );
            coreLog.error(context, summary);
            throw new CoreApiError(
                `Core API request timed out after ${CORE_FETCH_TIMEOUT_MS}ms`,
                504,
                'TIMEOUT',
                { path, durationMs },
            );
        }

        coreLog.error(
            {
                method,
                path,
                durationMs,
                upstream: 'core-backend',
                ...serializeError(error),
            },
            `[core-backend] ${method} ${path} — Core API request error: ${serializeError(error).err.message}`,
        );
        throw error;
    }
}

export type CoreLeaderboardItem = {
    rank: number;
    id: string;
    name: string | null;
    imageUrl: string | null;
    totalXp: number;
    currentPoints: number;
    currentLevel: number;
    levelTitle: string | null;
};

export type CoreLeaderboardResponse = {
    items: CoreLeaderboardItem[];
    total: number;
    limit: number;
    offset: number;
};

export type CoreUserProfileResponse = {
    id: string;
    name: string | null;
    email: string;
    imageUrl: string | null;
    totalXp: number;
    currentPoints: number;
    currentLevel: number;
    levelTitle: string | null;
    roles: string[];
};

export type CoreUserBadgeItem = {
    id: string;
    code: string;
    title: string;
    description: string;
    imageUrl: string;
    badgeType: string;
    application: string | null;
    unlockedAt: string;
};

export type CoreUserBadgesResponse = {
    badges: CoreUserBadgeItem[];
};

export type CoreBadgeCatalogItem = {
    id: string;
    code: string;
    title: string;
    description: string;
    imageUrl: string;
    badgeType: string;
};

export type CoreBadgeCatalogResponse = {
    badges: CoreBadgeCatalogItem[];
};

export { CoreApiError };

export async function fetchCoreLeaderboard(
    limit = 10,
    offset = 0,
): Promise<CoreLeaderboardResponse> {
    const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
    });
    return fetchCoreJson<CoreLeaderboardResponse>(`/api/v1/leaderboard?${params}`);
}

export async function fetchCoreUserMe(coreJwt: string): Promise<CoreUserProfileResponse> {
    return fetchCoreJson<CoreUserProfileResponse>('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${coreJwt}` },
    });
}

export async function fetchCoreUserBadges(userId: string): Promise<CoreUserBadgesResponse> {
    return fetchCoreJson<CoreUserBadgesResponse>(
        `/api/v1/badges/users/${encodeURIComponent(userId)}`,
    );
}

export async function fetchCoreBadgeCatalog(): Promise<CoreBadgeCatalogResponse> {
    return fetchCoreJson<CoreBadgeCatalogResponse>('/api/v1/badges');
}
