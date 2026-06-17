import { cache } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { canAccessLmsAdminPanel } from '@/lib/auth/lms-roles';
import { fetchCoreUserMe } from '@/lib/core/api';
import { isCoreApiConfigured } from '@/lib/core/client';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';
import { getCoreJwtFromCookies, getCoreSession } from '@/lib/core/get-core-session';
import { loadLmsBadgesForUser } from '@/lib/lms/badges';
import {
  fetchLmsLeaderboard,
  getLmsRankForUser,
  leaderboardDisplayInitials,
} from '@/lib/lms/leaderboard';
import { getUserLmsPoints } from '@/lib/lms/points';
import { resolveLmsDisplayName } from '@/lib/lms/user-profile';
import {
  EMPTY_STUDENT_CORE_DATA,
  type StudentCoreData,
  type StudentLeaderboardEntry,
  type StudentLeaderboardRow,
} from '@/features/student/types/student-core-data';

function clerkDisplayName(
  clerkUser: Awaited<ReturnType<typeof currentUser>>,
): string | null {
  if (!clerkUser) return null;
  return (
    clerkUser.fullName?.trim() ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
    null
  );
}

function mapLeaderboardEntries(
  items: Awaited<ReturnType<typeof fetchLmsLeaderboard>>['items'],
  userId: string | null,
): StudentLeaderboardEntry[] {
  return items.map((item) => {
    const name = item.displayName?.trim() || 'Pengguna';
    return {
      rank: item.rank,
      userId: item.userId,
      name,
      points: item.points,
      isYou: Boolean(userId && item.userId === userId),
      avatar: leaderboardDisplayInitials(name),
      imageUrl: null,
      currentLevel: item.level ?? 1,
      levelLabel: item.level != null ? `Lv.${item.level}` : '—',
    };
  });
}

function toPreviewRows(entries: StudentLeaderboardEntry[]): StudentLeaderboardRow[] {
  return entries.slice(0, 5).map(({ rank, name, points, isYou }) => ({
    rank,
    name,
    points,
    isYou,
  }));
}

/** Muat profil LMS + XP/level Core + poin/badge/leaderboard lokal. */
export const loadStudentCoreData = cache(async function loadStudentCoreData(): Promise<StudentCoreData> {
  const { userId } = await auth();
  const clerkUser = userId ? await currentUser() : null;
  const clerkName = clerkDisplayName(clerkUser);

  const data: StudentCoreData = {
    ...EMPTY_STUDENT_CORE_DATA,
    userId: userId ?? null,
    email: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
    avatarUrl: clerkUser?.imageUrl ?? null,
    displayName: clerkName,
  };

  if (userId) {
    data.displayName = (await resolveLmsDisplayName(userId, clerkName)) ?? clerkName;
    data.lmsPoints = await getUserLmsPoints(userId);
    data.lmsRank = await getLmsRankForUser(userId);

    const badges = await loadLmsBadgesForUser(userId);
    data.badges = badges;
    data.badgeCount = badges.filter((b) => b.unlocked).length;
    data.recentBadges = badges
      .filter((b) => b.unlocked && b.date)
      .slice(0, 3)
      .map((b) => ({
        title: b.name,
        imageUrl: b.imageUrl,
        unlockedAt: b.date!,
      }));
  }

  const leaderboard = await fetchLmsLeaderboard(10);
  data.leaderboardTop10 = mapLeaderboardEntries(leaderboard.items, userId ?? null);
  data.leaderboardPreview = toPreviewRows(data.leaderboardTop10);
  data.leaderboardTotal = leaderboard.total;

  const youInTop = data.leaderboardTop10.find((row) => row.isYou);
  if (youInTop) {
    data.lmsRank = youInTop.rank;
  }

  if (!isCoreIntegrationEnabled() || !isCoreApiConfigured()) {
    data.canAccessAdmin = canAccessLmsAdminPanel();
    return data;
  }

  const session = await getCoreSession();
  if (session) {
    data.coreConnected = true;
    data.avatarUrl = session.profile.avatarUrl ?? data.avatarUrl;
    data.canAccessAdmin = canAccessLmsAdminPanel(session.roles);
    if (session.gamification) {
      data.totalXp = session.gamification.totalXp;
      data.level = session.gamification.level;
    }
  } else {
    data.canAccessAdmin = canAccessLmsAdminPanel();
  }

  const coreJwt = await getCoreJwtFromCookies();
  if (coreJwt) {
    try {
      const profile = await fetchCoreUserMe(coreJwt);
      data.coreConnected = true;
      data.totalXp = profile.totalXp;
      data.level = profile.currentLevel;
      data.levelTitle = profile.levelTitle;
    } catch {
      // Core down — tetap pakai data LMS lokal
    }
  }

  return data;
});
