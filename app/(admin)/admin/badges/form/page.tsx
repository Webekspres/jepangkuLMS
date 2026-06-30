import { notFound } from 'next/navigation';
import { AdminBadgeFormPage } from '@/features/admin-cms/components/admin-badge-form';
import { loadAdminBadgeById } from '@/features/admin-cms/lib/load-admin-badges';
import { isR2Configured } from '@/lib/r2';
import { prisma } from '@/lib/prisma';

export default async function AdminBadgeFormRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const badge = id ? await loadAdminBadgeById(id) : null;
  if (id && !badge) notFound();

  const courses = await prisma.course.findMany({
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  });

  return (
    <AdminBadgeFormPage
      r2Configured={isR2Configured()}
      courses={courses}
      badge={
        badge
          ? {
              id: badge.id,
              code: badge.code,
              title: badge.title,
              description: badge.description,
              imageUrl: badge.imageUrl,
              sortOrder: badge.sortOrder,
              rarity: badge.rarity,
              unlockRule: badge.unlockRule,
              unlockValue: badge.unlockValue,
              xpBonus: badge.xpBonus,
              requirementText: badge.requirementText,
              targetLevel: badge.targetLevel,
              targetCategory: badge.targetCategory,
              targetCourseId: badge.targetCourseId,
            }
          : undefined
      }
    />
  );
}
