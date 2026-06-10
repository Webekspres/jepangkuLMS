import { getCoreApiBaseUrl } from './client';

const CORE_FETCH_TIMEOUT_MS = 4_000;

type CoreErrorBody = {
  error?: { code?: string; message?: string };
};

async function fetchCoreJson<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getCoreApiBaseUrl();
  if (!baseUrl) {
    throw new Error('JEPANGKU_CORE_API_URL belum dikonfigurasi');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(CORE_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    let message = `Core API error (${response.status})`;
    try {
      const body = (await response.json()) as CoreErrorBody;
      message = body.error?.message ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
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
