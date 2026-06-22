import { notFound } from 'next/navigation';
import { AdminUserDetailPage } from '@/features/admin-cms/components/admin-user-detail-page';
import {
  loadAdminCourseOptions,
  loadAdminUserDetail,
} from '@/features/admin-cms/lib/load-admin-user-detail';

export default async function AdminUserDetailRoutePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const decodedUserId = decodeURIComponent(userId);

  const [user, courses] = await Promise.all([
    loadAdminUserDetail(decodedUserId),
    loadAdminCourseOptions(),
  ]);

  if (!user) notFound();

  return <AdminUserDetailPage user={user} courses={courses} />;
}
