import { prisma } from '@/lib/prisma';

export type AdminBadgeRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  unlockCount: number;
  createdAt: Date;
};

export async function loadAdminBadges(): Promise<AdminBadgeRow[]> {
  const rows = await prisma.lmsBadge.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { _count: { select: { userBadges: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
    unlockCount: row._count.userBadges,
    createdAt: row.createdAt,
  }));
}

export async function loadAdminBadgeById(id: string) {
  return prisma.lmsBadge.findUnique({ where: { id } });
}
