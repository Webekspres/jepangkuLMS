import {
  fetchCoreLeaderboard,
  type CoreLeaderboardResponse,
} from './api';
import { getCoreSession } from './session';
import { isCoreApiConfigured } from './client';
import type { CoreGamificationSummary, CoreLeaderboardEntry, CoreUserProfile } from './types';
import type { JepangKuJwtClaims } from './jwt-claims';
import { mapClaimsToGamificationSummary, mapClaimsToUserProfile } from './jwt-claims';

function mapLeaderboardItem(
  item: CoreLeaderboardResponse['items'][number],
): CoreLeaderboardEntry {
  return {
    rank: item.rank,
    userId: item.id,
    displayName: item.name,
    avatarUrl: item.imageUrl,
    totalXp: item.totalXp,
  };
}

/**
 * Profil dari JWT claims (alur utama yang disepakati tim).
 * Gunakan di Server Component / Server Action setelah token diverifikasi.
 */
export function getUserProfileFromClaims(claims: JepangKuJwtClaims): CoreUserProfile {
  return mapClaimsToUserProfile(claims);
}

export function getGamificationFromClaims(
  claims: JepangKuJwtClaims
): CoreGamificationSummary | null {
  return mapClaimsToGamificationSummary(claims);
}

/**
 * Ambil profil user aktif dari sesi (JWT → claims).
 * Fallback: jika hanya `userId` diketahui tanpa token, return minimal (dev).
 */
export async function getUserProfile(userId?: string): Promise<CoreUserProfile | null> {
  const session = await getCoreSession();
  if (session) {
    return session.profile;
  }

  if (userId) {
    return { id: userId, displayName: null, avatarUrl: null };
  }

  return null;
}

export async function getGamificationSummary(
  userId?: string
): Promise<CoreGamificationSummary | null> {
  const session = await getCoreSession();
  if (session?.gamification) {
    return session.gamification;
  }

  if (!isCoreApiConfigured()) {
    return null;
  }

  // Leaderboard / user lain: tetap via Core API bila claims hanya untuk user sendiri
  void userId;
  return null;
}

/**
 * Top N leaderboard — biasanya membutuhkan Core API (bukan JWT per user).
 */
export async function getLeaderboard(limit = 10): Promise<CoreLeaderboardEntry[]> {
  if (!isCoreApiConfigured()) {
    return [];
  }

  try {
    const data = await fetchCoreLeaderboard(limit);
    return data.items.map(mapLeaderboardItem);
  } catch {
    return [];
  }
}
