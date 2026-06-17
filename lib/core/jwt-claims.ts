import type { CoreGamificationSummary, CoreUserProfile } from './types';

/** Custom claims Core JWT (v2.1+). */
export type JepangKuJwtClaims = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  jepangku?: {
    displayName?: string | null;
    avatarUrl?: string | null;
    totalXp?: number;
    level?: number;
    context?: string;
    rolesInContext?: string[];
    roles?:
      | string[]
      | {
          global?: string[];
          byApplication?: Record<string, string[]>;
        };
  };
};

export function mapClaimsToUserProfile(claims: JepangKuJwtClaims): CoreUserProfile {
  const j = claims.jepangku;
  return {
    id: claims.sub,
    displayName: j?.displayName ?? claims.name ?? null,
    avatarUrl: j?.avatarUrl ?? claims.picture ?? null,
  };
}

export function mapClaimsToGamificationSummary(
  claims: JepangKuJwtClaims,
): CoreGamificationSummary | null {
  const j = claims.jepangku;
  if (j?.totalXp === undefined && j?.level === undefined) {
    return null;
  }
  return {
    userId: claims.sub,
    totalXp: j?.totalXp ?? 0,
    level: j?.level ?? 1,
  };
}

/** Role efektif untuk konteks LMS (prioritas rolesInContext / byApplication.LMS). */
export function getRolesFromClaims(claims: JepangKuJwtClaims): string[] {
  const j = claims.jepangku;
  if (!j) return [];

  if (j.rolesInContext?.length) return j.rolesInContext;

  const grouped = j.roles;
  if (grouped && !Array.isArray(grouped)) {
    const lms = grouped.byApplication?.LMS;
    if (lms?.length) return lms;
    if (grouped.global?.length) return grouped.global;
  }

  if (Array.isArray(grouped)) return grouped;

  return [];
}

export function parseJwtPayload(payload: unknown): JepangKuJwtClaims | null {
  if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
    return null;
  }
  const sub = (payload as { sub: unknown }).sub;
  if (typeof sub !== 'string' || sub.length === 0) {
    return null;
  }
  return payload as JepangKuJwtClaims;
}
