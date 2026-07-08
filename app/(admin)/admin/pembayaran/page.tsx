import { AdminEnrollmentsPage } from '@/features/admin-cms/components/admin-enrollments-page';
import { loadAdminEnrollmentHistory } from '@/features/admin-cms/lib/load-admin-enrollment-history';
import { loadAdminEnrollments } from '@/features/admin-cms/lib/load-admin-enrollments';

export default async function AdminPembayaranPage() {
  const [data, history] = await Promise.all([loadAdminEnrollments(), loadAdminEnrollmentHistory()]);

  return (
    <AdminEnrollmentsPage
      enrollments={data.enrollments}
      history={history}
      pendingCount={data.pendingCount}
      courses={data.courses}
      liveClasses={data.liveClasses}
      tryoutSessions={data.tryoutSessions}
    />
  );
}
