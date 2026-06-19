import { prisma } from '@/lib/prisma';
import type { StudentAchievementBadge } from '@/features/student/lib/core-badge-mapper';

function formatBadgeDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(date);
  } catch {
    return date.toISOString();
  }
}

/** Katalog badge LMS + status unlock user. */
export async function loadLmsBadgesForUser(userId: string): Promise<StudentAchievementBadge[]> {
  const [catalog, unlocked] = await Promise.all([
    prisma.lmsBadge.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    }),
  ]);

  if (catalog.length === 0) return [];

  const unlockedByBadgeId = new Map(unlocked.map((row) => [row.badgeId, row]));

  return catalog.map((badge) => {
    const userBadge = unlockedByBadgeId.get(badge.id);
    return {
      id: badge.id,
      code: badge.code,
      name: badge.title,
      desc: badge.description ?? '',
      imageUrl: badge.imageUrl ?? '',
      icon: '🏅',
      xp: 0,
      unlocked: Boolean(userBadge),
      date: userBadge ? formatBadgeDate(userBadge.unlockedAt) : null,
      rarity: 'Common' as const,
      badgeType: 'LMS',
    };
  });
}

export async function unlockLmsBadgeByCode(userId: string, code: string): Promise<boolean> {
  const badge = await prisma.lmsBadge.findUnique({ where: { code } });
  if (!badge) return false;

  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
    create: { userId, badgeId: badge.id },
    update: {},
  });
  return true;
}
