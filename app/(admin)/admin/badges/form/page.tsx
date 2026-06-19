import { notFound } from 'next/navigation';
import { AdminBadgeFormPage } from '@/features/admin-cms/components/admin-badge-form';
import { loadAdminBadgeById } from '@/features/admin-cms/lib/load-admin-badges';
import { isR2Configured } from '@/lib/r2';

export default async function AdminBadgeFormRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const badge = id ? await loadAdminBadgeById(id) : null;
  if (id && !badge) notFound();

  return (
    <AdminBadgeFormPage
      r2Configured={isR2Configured()}
      badge={
        badge
          ? {
              id: badge.id,
              code: badge.code,
              title: badge.title,
              description: badge.description,
              imageUrl: badge.imageUrl,
              sortOrder: badge.sortOrder,
              unlockRule: badge.unlockRule,
              unlockValue: badge.unlockValue,
              xpBonus: badge.xpBonus,
              requirementText: badge.requirementText,
            }
          : undefined
      }
    />
  );
}
