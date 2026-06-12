import { getCoreApiBaseUrl } from './client';
import { CoreApiError, type CoreErrorBody } from './core-api-error';

async function fetchCoreJson<T>(path: string, init?: RequestInit): Promise<T> {
    const baseUrl = getCoreApiBaseUrl();
    if (!baseUrl) {
        throw new CoreApiError(
            'JEPANGKU_CORE_API_URL belum dikonfigurasi',
            503,
            'CORE_NOT_CONFIGURED',
            { hint: 'Set JEPANGKU_CORE_API_URL in LMS .env' },
        );
    }

    const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
            Accept: 'application/json',
            ...init?.headers,
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        let body: CoreErrorBody = {};
        try {
            body = (await response.json()) as CoreErrorBody;
        } catch {
            // ignore
        }

        const error = CoreApiError.fromResponse(
            response.status,
            body,
            `Core API error (${response.status})`,
        );

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

    return (await response.json()) as T;
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
