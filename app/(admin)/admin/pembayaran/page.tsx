import { AdminEnrollmentsPage } from '@/features/admin-cms/components/admin-enrollments-page';
import { loadAdminEnrollments } from '@/features/admin-cms/lib/load-admin-enrollments';

export default async function AdminPembayaranPage() {
  const data = await loadAdminEnrollments();

  return (
    <AdminEnrollmentsPage
      enrollments={data.enrollments}
      pendingCount={data.pendingCount}
      courses={data.courses}
    />
  );
}
