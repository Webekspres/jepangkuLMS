/**
 * Types for JepangKu Core Backend (SSO, profil, gamifikasi).
 * Sumber data BUKAN database LMS — lihat docs/ECOSYSTEM.md
 */

/** Profil global user dari Core Service (bukan model Prisma LMS). */
export type CoreUserProfile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
};

/** Ringkasan gamifikasi dari Core (XP, level, poin). Selaraskan dengan docs/backend_core_services. */
export type CoreGamificationSummary = {
  userId: string;
  totalXp: number;
  /** Saldo poin spendable (`users.current_points` di Core) */
  currentPoints?: number;
  level: number;
};

/** Entri leaderboard dari Core. */
export type CoreLeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalXp: number;
};
