import type { StudentAchievementBadge } from '@/features/student/lib/core-badge-mapper';

export type { StudentAchievementBadge };

export type StudentLeaderboardRow = {
  rank: number;
  name: string;
  xp: number;
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

/** Snapshot gamifikasi dari Core — dipakai seluruh tampilan student. */
export type StudentCoreData = {
  coreConnected: boolean;
  userId: string | null;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  totalXp: number;
  currentPoints: number;
  level: number;
  levelTitle: string | null;
  globalRank: number | null;
  badgeCount: number;
  recentBadges: StudentCoreBadge[];
  badges: StudentAchievementBadge[];
  leaderboardPreview: StudentLeaderboardRow[];
  leaderboardTop10: StudentLeaderboardEntry[];
  leaderboardTotal: number;
};

export const EMPTY_STUDENT_CORE_DATA: StudentCoreData = {
  coreConnected: false,
  userId: null,
  displayName: null,
  email: null,
  avatarUrl: null,
  totalXp: 0,
  currentPoints: 0,
  level: 1,
  levelTitle: null,
  globalRank: null,
  badgeCount: 0,
  recentBadges: [],
  badges: [],
  leaderboardPreview: [],
  leaderboardTop10: [],
  leaderboardTotal: 0,
};
