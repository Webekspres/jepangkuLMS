import { cache } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
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
import { isGenericLmsDisplayName, resolvePublicDisplayName } from '@/lib/lms/display-name';
import { loadLmsUserProfile, resolveLmsAvatarUrl, resolveLmsDisplayName } from '@/lib/lms/user-profile';
import { DEFAULT_LMS_ROLE } from '@/lib/auth/lms-roles';
import {
    isCoreSessionForClerkUser,
    logCoreSessionUserMismatch,
} from '@/lib/auth/core-session-user';
import { userHasLmsAdminAccess } from '@/lib/auth/resolve-lms-admin';
import { prisma } from '@/lib/prisma';
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
        const name = item.displayName?.trim() || 'Siswa JepangKu';
        return {
            rank: item.rank,
            userId: item.userId,
            name,
            points: item.points,
            isYou: Boolean(userId && item.userId === userId),
            avatar: leaderboardDisplayInitials(name),
            imageUrl: item.avatarUrl,
            badgeTitle: item.badgeTitle,
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
    let lmsProfile: Awaited<ReturnType<typeof loadLmsUserProfile>> = null;

    const data: StudentCoreData = {
        ...EMPTY_STUDENT_CORE_DATA,
        userId: userId ?? null,
        email: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
        avatarUrl: clerkUser?.imageUrl ?? null,
        displayName: clerkName,
    };

    if (userId) {
        lmsProfile = await loadLmsUserProfile(userId);
        const email = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
        data.lmsRole = lmsProfile?.role ?? DEFAULT_LMS_ROLE;
        data.bio = lmsProfile?.bio ?? null;
        data.displayName = await resolveLmsDisplayName(userId, clerkName, email);
        data.needsDisplayNameSetup = !lmsProfile?.displayNameSetupAt;
        data.needsPhoneSetup = !lmsProfile?.phoneSetupAt;
        data.phone = lmsProfile?.phone ?? null;

        const placementAttemptCount = await prisma.placementAttempt.count({ where: { userId } });
        data.needsPlacementPrompt =
            !lmsProfile?.placementPromptDismissedAt && placementAttemptCount === 0;
        data.suggestedDisplayName = (() => {
            const suggested = resolvePublicDisplayName({
                displayName: null,
                ssoDisplayName: lmsProfile?.ssoDisplayName ?? clerkName,
                email,
            });
            return isGenericLmsDisplayName(suggested) ? '' : suggested;
        })();
        data.avatarUrl = (await resolveLmsAvatarUrl(userId, clerkUser?.imageUrl ?? null)) ?? data.avatarUrl;
        data.lmsPoints = await getUserLmsPoints(userId);
        data.lmsRank = await getLmsRankForUser(userId);

        const badges = await loadLmsBadgesForUser(userId, lmsProfile?.equippedBadgeId);
        data.badges = badges;
        data.badgeCount = badges.filter((b) => b.unlocked).length;
        const equipped = badges.find((b) => b.isEquipped && b.unlocked);
        data.equippedBadgeTitle = equipped?.name ?? null;
        data.equippedBadgeImageUrl = equipped?.imageUrl ?? null;
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
        data.canAccessAdmin = await userHasLmsAdminAccess(userId, []);
        return data;
    }

    const session = await getCoreSession();
    const sessionMatchesClerk = isCoreSessionForClerkUser(session, userId);
    if (session && userId && !sessionMatchesClerk) {
        logCoreSessionUserMismatch(userId, session.claims.sub, 'loadStudentCoreData');
    }
    if (sessionMatchesClerk && session) {
        data.coreConnected = true;
        if (!lmsProfile?.avatarUrl) {
            data.avatarUrl = session.profile.avatarUrl ?? data.avatarUrl;
        }
        data.canAccessAdmin = await userHasLmsAdminAccess(userId, session.roles);
        if (session.gamification) {
            data.totalXp = session.gamification.totalXp;
            data.level = session.gamification.level;
        }
    } else {
        data.canAccessAdmin = await userHasLmsAdminAccess(userId, []);
    }

    const coreJwt = sessionMatchesClerk ? await getCoreJwtFromCookies() : null;
    if (coreJwt) {
        try {
            const coreProfile = await fetchCoreUserMe(coreJwt);
            data.coreConnected = true;
            data.totalXp = coreProfile.totalXp;
            data.level = coreProfile.currentLevel;
            data.levelTitle = coreProfile.levelTitle;
        } catch {
            // Core down — tetap pakai data LMS lokal
        }
    }

    return data;
});
