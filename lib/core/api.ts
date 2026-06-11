import { getCoreApiBaseUrl } from './client';
import { loggers, serializeError } from '@/lib/logger';

const coreLog = loggers.core;
const CORE_FETCH_TIMEOUT_MS = 4_000;

type CoreErrorBody = {
  error?: { code?: string; message?: string };
};

async function fetchCoreJson<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getCoreApiBaseUrl();
  if (!baseUrl) {
    coreLog.error({ path }, 'Core API base URL not configured');
    throw new Error('JEPANGKU_CORE_API_URL belum dikonfigurasi');
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
      let code: string | undefined;
      let message = `Core API error (${response.status})`;
      try {
        const body = (await response.json()) as CoreErrorBody;
        code = body.error?.code;
        message = body.error?.message ?? message;
      } catch {
        // ignore
      }

      coreLog.warn(
        { path, method, status: response.status, code, durationMs },
        `Core API request failed: ${message}`,
      );
      throw new Error(message);
    }

    coreLog.debug({ path, method, status: response.status, durationMs }, 'Core API request OK');
    return (await response.json()) as T;
  } catch (error) {
    const durationMs = Date.now() - started;
    if (error instanceof Error && error.name === 'TimeoutError') {
      coreLog.error(
        { path, method, durationMs, timeoutMs: CORE_FETCH_TIMEOUT_MS },
        'Core API request timed out',
      );
    } else if (!(error instanceof Error && error.message.startsWith('Core API error'))) {
      coreLog.error(
        { path, method, durationMs, ...serializeError(error) },
        'Core API request error',
      );
    }
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
