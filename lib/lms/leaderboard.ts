import { prisma } from '@/lib/prisma';
import { resolvePublicDisplayName } from '@/lib/lms/display-name';
import { resolveMediaUrl } from '@/lib/media/image-src';
import { getInitials } from '@/features/student/lib/leaderboard-helpers';

export type LmsLeaderboardItem = {
    rank: number;
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    badgeTitle: string | null;
    points: number;
    level: number | null;
};

export type LmsLeaderboardResult = {
    items: LmsLeaderboardItem[];
    total: number;
};

/** Leaderboard LMS — ranking by lmsPoints (bukan XP global Core). */
export async function fetchLmsLeaderboard(
    limit = 10,
    offset = 0,
): Promise<LmsLeaderboardResult> {
    const [rows, total] = await Promise.all([
        prisma.userLmsStats.findMany({
            where: { lmsPoints: { gt: 0 } },
            orderBy: [{ lmsPoints: 'desc' }, { updatedAt: 'asc' }],
            skip: offset,
            take: limit,
            select: {
                userId: true,
                lmsPoints: true,
                user: {
                    select: {
                        displayName: true,
                        ssoDisplayName: true,
                        avatarUrl: true,
                        equippedBadge: { select: { title: true } },
                    },
                },
            },
        }),
        prisma.userLmsStats.count({ where: { lmsPoints: { gt: 0 } } }),
    ]);

    const items: LmsLeaderboardItem[] = rows.map((row, index) => {
        const name = resolvePublicDisplayName({
            displayName: row.user.displayName,
            ssoDisplayName: row.user.ssoDisplayName,
        });
        return {
            rank: offset + index + 1,
            userId: row.userId,
            displayName: name,
            avatarUrl: resolveMediaUrl(row.user.avatarUrl),
            badgeTitle: row.user.equippedBadge?.title ?? null,
            points: row.lmsPoints,
            level: null,
        };
    });

    return { items, total };
}

export async function getLmsRankForUser(userId: string): Promise<number | null> {
    const stats = await prisma.userLmsStats.findUnique({
        where: { userId },
        select: { lmsPoints: true, updatedAt: true },
    });
    if (!stats || stats.lmsPoints <= 0) return null;

    const ahead = await prisma.userLmsStats.count({
        where: {
            OR: [
                { lmsPoints: { gt: stats.lmsPoints } },
                { lmsPoints: stats.lmsPoints, updatedAt: { lt: stats.updatedAt } },
            ],
        },
    });

    return ahead + 1;
}

export function leaderboardDisplayInitials(name: string): string {
    return getInitials(name);
}
