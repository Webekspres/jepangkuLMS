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
  badgeTitle: string | null;
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
  /** True sampai user konfirmasi nama tampilan pertama kali. */
  needsDisplayNameSetup: boolean;
  /** True sampai user mengisi nomor ponsel pertama kali. */
  needsPhoneSetup: boolean;
  /**
   * True jika belum pernah tes penempatan dan belum dismiss dialog ajakan.
   * Hanya ditampilkan setelah setup nama/ponsel selesai.
   */
  needsPlacementPrompt: boolean;
  /** Nama awal dari SSO — prefill modal onboarding. */
  suggestedDisplayName: string | null;
  displayName: string | null;
  phone: string | null;
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
  /** True jika user punya role admin Core, LMS lokal, atau LMS_DEV_ADMIN_BYPASS aktif. */
  canAccessAdmin: boolean;
  lmsRole: 'LMS_STUDENT' | 'LMS_ADMIN';
  bio: string | null;
  /** Badge title yang dipakai user (equipped). */
  equippedBadgeTitle: string | null;
  equippedBadgeImageUrl: string | null;
};

export type StudentCoreDataStatus = 'loading' | 'ready';

export type StudentCoreDataContextValue = StudentCoreData & {
  /** `loading` = fetch pertama / revalidasi; jangan tampilkan banner gagal koneksi. */
  status: StudentCoreDataStatus;
  /** True setelah retry sync Core gagal — tampilkan banner peringatan (bukan hard block). */
  coreSyncWarning: boolean;
};

export const EMPTY_STUDENT_CORE_DATA: StudentCoreData = {
  coreConnected: false,
  userId: null,
  displayName: null,
  needsDisplayNameSetup: false,
  needsPhoneSetup: false,
  needsPlacementPrompt: false,
  suggestedDisplayName: null,
  phone: null,
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
  lmsRole: 'LMS_STUDENT',
  bio: null,
  equippedBadgeTitle: null,
  equippedBadgeImageUrl: null,
};

export function toStudentCoreDataContextValue(
  data: StudentCoreData,
  status: StudentCoreDataStatus,
  coreSyncWarning = false,
): StudentCoreDataContextValue {
  return { ...data, status, coreSyncWarning };
}
