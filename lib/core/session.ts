import type { JepangKuJwtClaims } from './jwt-claims';
import {
  getRolesFromClaims,
  mapClaimsToGamificationSummary,
  mapClaimsToUserProfile,
  parseJwtPayload,
} from './jwt-claims';
import type { CoreGamificationSummary, CoreUserProfile } from './types';

export type CoreSession = {
  claims: JepangKuJwtClaims;
  profile: CoreUserProfile;
  gamification: CoreGamificationSummary | null;
  roles: string[];
};

/**
 * Bangun sesi LMS dari JWT yang sudah diverifikasi oleh Core.
 * Sumber kebenaran profil user saat ini: **claims di dalam token**, bukan Prisma LMS.
 */
export function buildSessionFromVerifiedJwt(payload: unknown): CoreSession | null {
  const claims = parseJwtPayload(payload);
  if (!claims) {
    return null;
  }

  return {
    claims,
    profile: mapClaimsToUserProfile(claims),
    gamification: mapClaimsToGamificationSummary(claims),
    roles: getRolesFromClaims(claims),
  };
}

/**
 * Ambil sesi user aktif (server-only).
 * @deprecated Import from `@/lib/core/get-core-session` — implementasi aktif di sana.
 */
export async function getCoreSession(): Promise<CoreSession | null> {
  const { getCoreSession: loadSession } = await import('./get-core-session');
  return loadSession();
}

export function hasRole(session: CoreSession, roleCode: string): boolean {
  return session.roles.includes(roleCode);
}
