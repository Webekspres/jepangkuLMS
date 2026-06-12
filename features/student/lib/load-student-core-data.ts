import { cache } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import {
  fetchCoreBadgeCatalog,
  fetchCoreLeaderboard,
  fetchCoreUserBadges,
  fetchCoreUserMe,
} from '@/lib/core/api';
import { isCoreApiConfigured } from '@/lib/core/client';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';
import { getCoreJwtFromCookies, getCoreSession } from '@/lib/core/get-core-session';
import { mergeCoreBadges, mapUnlockedCoreBadges } from '@/features/student/lib/core-badge-mapper';
import { getInitials } from '@/features/student/lib/leaderboard-helpers';
import {
  EMPTY_STUDENT_CORE_DATA,
  type StudentCoreData,
  type StudentLeaderboardEntry,
  type StudentLeaderboardRow,
} from '@/features/student/types/student-core-data';

function mapLeaderboardEntries(
  items: Awaited<ReturnType<typeof fetchCoreLeaderboard>>['items'],
  userId: string | null,
): StudentLeaderboardEntry[] {
  return items.map((item) => {
    const name = item.name?.trim() || 'Pengguna';
    return {
      rank: item.rank,
      userId: item.id,
      name,
      xp: item.totalXp,
      isYou: Boolean(userId && item.id === userId),
      avatar: getInitials(name),
      imageUrl: item.imageUrl,
      currentLevel: item.currentLevel,
      levelLabel: item.levelTitle ? `Lv.${item.currentLevel}` : `Lv.${item.currentLevel}`,
    };
  });
}

function toPreviewRows(entries: StudentLeaderboardEntry[]): StudentLeaderboardRow[] {
  return entries.slice(0, 5).map(({ rank, name, xp, isYou }) => ({ rank, name, xp, isYou }));
}

/** Muat XP, poin, level, rank, badge, leaderboard dari Core (server-only). */
export const loadStudentCoreData = cache(async function loadStudentCoreData(): Promise<StudentCoreData> {
  const { userId } = await auth();
  const clerkUser = userId ? await currentUser() : null;

  const data: StudentCoreData = {
    ...EMPTY_STUDENT_CORE_DATA,
    userId: userId ?? null,
    email: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
    avatarUrl: clerkUser?.imageUrl ?? null,
    displayName:
      clerkUser?.fullName?.trim() ||
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ').trim() ||
      null,
  };

  if (!isCoreIntegrationEnabled() || !isCoreApiConfigured()) {
    return data;
  }

  const session = await getCoreSession();
  if (session) {
    data.coreConnected = true;
    data.displayName = session.profile.displayName ?? data.displayName;
    data.avatarUrl = session.profile.avatarUrl ?? data.avatarUrl;
    if (session.gamification) {
      data.totalXp = session.gamification.totalXp;
      data.currentPoints = session.gamification.currentPoints ?? 0;
      data.level = session.gamification.level;
    }
  }

  const coreJwt = await getCoreJwtFromCookies();

  const [leaderboardResult, profileResult, badgesResult, catalogResult] =
    await Promise.allSettled([
      fetchCoreLeaderboard(10),
      coreJwt ? fetchCoreUserMe(coreJwt) : Promise.reject(new Error('no jwt')),
      userId ? fetchCoreUserBadges(userId) : Promise.reject(new Error('no user')),
      fetchCoreBadgeCatalog(),
    ]);

  if (profileResult.status === 'fulfilled') {
    const profile = profileResult.value;
    data.coreConnected = true;
    data.displayName = profile.name?.trim() || data.displayName;
    data.totalXp = profile.totalXp;
    data.currentPoints = profile.currentPoints;
    data.level = profile.currentLevel;
    data.levelTitle = profile.levelTitle;
  }

  const unlockedBadges =
    badgesResult.status === 'fulfilled' ? badgesResult.value.badges : [];

  if (catalogResult.status === 'fulfilled' && catalogResult.value.badges.length > 0) {
    data.badges = mergeCoreBadges(catalogResult.value.badges, unlockedBadges);
  } else if (unlockedBadges.length > 0) {
    data.badges = mapUnlockedCoreBadges(unlockedBadges);
  }

  data.badgeCount = data.badges.filter((b) => b.unlocked).length;
  data.recentBadges = unlockedBadges.slice(0, 3).map((b) => ({
    title: b.title,
    imageUrl: b.imageUrl,
    unlockedAt: b.unlockedAt,
  }));

  if (leaderboardResult.status === 'fulfilled') {
    const leaderboard = leaderboardResult.value;
    data.leaderboardTop10 = mapLeaderboardEntries(leaderboard.items, userId ?? null);
    data.leaderboardPreview = toPreviewRows(data.leaderboardTop10);
    data.leaderboardTotal = leaderboard.total;

    const youInTop = data.leaderboardTop10.find((row) => row.isYou);
    if (youInTop) {
      data.globalRank = youInTop.rank;
    } else if (userId) {
      try {
        const extended = await fetchCoreLeaderboard(100);
        const you = extended.items.find((item) => item.id === userId);
        if (you) {
          data.globalRank = you.rank;
        }
      } catch {
        // ignore — termasuk timeout Core
      }
    }
  }

  return data;
});
