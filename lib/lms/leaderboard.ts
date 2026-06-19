import { prisma } from '@/lib/prisma';
import { getInitials } from '@/features/student/lib/leaderboard-helpers';

export type LmsLeaderboardItem = {
  rank: number;
  userId: string;
  displayName: string;
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
        user: { select: { displayName: true } },
      },
    }),
    prisma.userLmsStats.count({ where: { lmsPoints: { gt: 0 } } }),
  ]);

  const items: LmsLeaderboardItem[] = rows.map((row, index) => {
    const name = row.user.displayName?.trim() || 'Pengguna';
    return {
      rank: offset + index + 1,
      userId: row.userId,
      displayName: name,
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
