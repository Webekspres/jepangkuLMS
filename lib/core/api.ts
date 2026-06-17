import { getCoreApiBaseUrl } from './client';
import { loggers, logUpstreamFailure, serializeError } from '@/lib/logger';

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
      let responseBody: string | undefined;

      try {
        const bodyText = await response.text();
        responseBody = bodyText;
        const body = JSON.parse(bodyText) as CoreErrorBody;
        code = body.error?.code;
        message = body.error?.message ?? message;
      } catch {
        // ignore
      }

      const { context, summary } = logUpstreamFailure(
        {
          method,
          path,
          statusCode: response.status,
          code,
          durationMs,
          responseBody,
        },
        `Core API request failed: ${message}`,
      );
      coreLog.warn(context, summary);

      const error = new Error(message) as Error & {
        statusCode: number;
        code?: string;
        upstream: string;
      };
      error.statusCode = response.status;
      error.code = code;
      error.upstream = 'core-backend';
      throw error;
    }

    const { context, summary } = logUpstreamFailure(
      { method, path, statusCode: response.status, durationMs },
      'Core API request OK',
    );
    coreLog.debug(context, summary);
    return (await response.json()) as T;
  } catch (error) {
    const durationMs = Date.now() - started;

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
    } else if (
      !(
        error instanceof Error &&
        'statusCode' in error &&
        typeof (error as { statusCode?: number }).statusCode === 'number'
      )
    ) {
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
