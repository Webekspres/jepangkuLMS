import type { StudentAchievementBadge } from '@/features/student/lib/core-badge-mapper';

export type StudentLeaderboardRow = {
  rank: number;
  name: string;
  points: number;
  isYou: boolean;
};

export type StudentLeaderboardEntry = StudentLeaderboardRow & {
  userId: string;
  avatar: string;
  imageUrl: string | null;
  levelLabel: string;
  currentLevel: number;
};

export type StudentCoreBadge = {
  title: string;
  imageUrl: string;
  unlockedAt: string;
};

/** Snapshot gamifikasi: XP/level dari Core; poin/badge/leaderboard dari DB LMS. */
export type StudentCoreData = {
  coreConnected: boolean;
  userId: string | null;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  totalXp: number;
  lmsPoints: number;
  level: number;
  levelTitle: string | null;
  lmsRank: number | null;
  badgeCount: number;
  recentBadges: StudentCoreBadge[];
  badges: StudentAchievementBadge[];
  leaderboardPreview: StudentLeaderboardRow[];
  leaderboardTop10: StudentLeaderboardEntry[];
  leaderboardTotal: number;
  /** True jika user punya role admin Core atau LMS_DEV_ADMIN_BYPASS aktif. */
  canAccessAdmin: boolean;
};

export type StudentCoreDataStatus = 'loading' | 'ready';

export type StudentCoreDataContextValue = StudentCoreData & {
  /** `loading` = fetch pertama / revalidasi; jangan tampilkan banner gagal koneksi. */
  status: StudentCoreDataStatus;
};

export const EMPTY_STUDENT_CORE_DATA: StudentCoreData = {
  coreConnected: false,
  userId: null,
  displayName: null,
  email: null,
  avatarUrl: null,
  totalXp: 0,
  lmsPoints: 0,
  level: 1,
  levelTitle: null,
  lmsRank: null,
  badgeCount: 0,
  recentBadges: [],
  badges: [],
  leaderboardPreview: [],
  leaderboardTop10: [],
  leaderboardTotal: 0,
  canAccessAdmin: false,
};

export function toStudentCoreDataContextValue(
  data: StudentCoreData,
  status: StudentCoreDataStatus,
): StudentCoreDataContextValue {
  return { ...data, status };
}
