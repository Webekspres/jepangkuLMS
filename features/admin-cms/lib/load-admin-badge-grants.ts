import type { LmsBadgeRarity } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type AdminGrantBadgeOption = {
  id: string;
  title: string;
  code: string;
  rarity: LmsBadgeRarity;
};

export async function loadAdminGrantBadgeOptions(): Promise<AdminGrantBadgeOption[]> {
  const badges = await prisma.lmsBadge.findMany({
    orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    select: { id: true, title: true, code: true, rarity: true },
  });

  return badges.map((badge) => ({
    id: badge.id,
    title: badge.title,
    code: badge.code,
    rarity: badge.rarity ?? 'COMMON',
  }));
}
