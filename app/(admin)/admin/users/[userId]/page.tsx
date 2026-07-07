import { notFound } from 'next/navigation';
import { AdminUserDetailPage } from '@/features/admin-cms/components/admin-user-detail-page';
import {
  loadAdminGrantProductOptions,
  loadAdminUserDetail,
} from '@/features/admin-cms/lib/load-admin-user-detail';

export default async function AdminUserDetailRoutePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const decodedUserId = decodeURIComponent(userId);

  const [user, grantOptions] = await Promise.all([
    loadAdminUserDetail(decodedUserId),
    loadAdminGrantProductOptions(),
  ]);

  if (!user) notFound();

  return <AdminUserDetailPage user={user} grantOptions={grantOptions} />;
}
