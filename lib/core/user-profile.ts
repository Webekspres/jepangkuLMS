import { fetchLmsLeaderboard } from '@/lib/lms/leaderboard';
import { getCoreSession } from './session';
import { isCoreApiConfigured } from './client';
import type { CoreGamificationSummary, CoreLeaderboardEntry, CoreUserProfile } from './types';
import type { JepangKuJwtClaims } from './jwt-claims';
import { mapClaimsToGamificationSummary, mapClaimsToUserProfile } from './jwt-claims';

export function getUserProfileFromClaims(claims: JepangKuJwtClaims): CoreUserProfile {
    return mapClaimsToUserProfile(claims);
}

export function getGamificationFromClaims(
    claims: JepangKuJwtClaims,
): CoreGamificationSummary | null {
    return mapClaimsToGamificationSummary(claims);
}

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
    userId?: string,
): Promise<CoreGamificationSummary | null> {
    const session = await getCoreSession();
    if (session?.gamification) {
        return session.gamification;
    }

    if (!isCoreApiConfigured()) {
        return null;
    }

    void userId;
    return null;
}

/** Top N leaderboard LMS — ranking by lmsPoints (bukan XP global Core). */
export async function getLeaderboard(limit = 10): Promise<CoreLeaderboardEntry[]> {
    try {
        const data = await fetchLmsLeaderboard(limit);
        return data.items.map((item) => ({
            rank: item.rank,
            userId: item.userId,
            displayName: item.displayName,
            avatarUrl: item.avatarUrl,
            totalXp: item.points,
        }));
    } catch {
        return [];
    }
}
