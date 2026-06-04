import type { CoreGamificationSummary, CoreUserProfile } from './types';

/**
 * Custom claims yang dikeluarkan Core Service di dalam JWT.
 * Nama namespace (`jepangku`) dan field pastikan diselaraskan dengan Sultan sebelum production.
 */
export type JepangKuJwtClaims = {
  /** Clerk / Core user id — sama dengan `users.id` & LMS `User.id` */
  sub: string;
  email?: string;
  /** Standar OIDC — bisa dipakai Core sebagai display name */
  name?: string;
  picture?: string;
  /** Payload kustom JepangKu (profil + gamifikasi + roles) */
  jepangku?: {
    displayName?: string | null;
    avatarUrl?: string | null;
    totalXp?: number;
    currentPoints?: number;
    level?: number;
    /** Kode role dari Core `roles.code`, mis. STUDENT, LMS_ADMIN */
    roles?: string[];
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
  claims: JepangKuJwtClaims
): CoreGamificationSummary | null {
  const j = claims.jepangku;
  if (
    j?.totalXp === undefined &&
    j?.currentPoints === undefined &&
    j?.level === undefined
  ) {
    return null;
  }
  return {
    userId: claims.sub,
    totalXp: j?.totalXp ?? 0,
    currentPoints: j?.currentPoints,
    level: j?.level ?? 1,
  };
}

export function getRolesFromClaims(claims: JepangKuJwtClaims): string[] {
  return claims.jepangku?.roles ?? [];
}

/**
 * Parse payload JWT yang sudah diverifikasi (gunakan di adapter sesi setelah verify signature).
 * Implementasi verify: Core public key / shared secret — tanggung jawab layer auth LMS.
 */
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
