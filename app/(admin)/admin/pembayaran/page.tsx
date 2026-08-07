import { AdminEnrollmentsPage } from '@/features/admin-cms/components/admin-enrollments-page';
import { loadAdminEnrollmentHistory } from '@/features/admin-cms/lib/load-admin-enrollment-history';
import { loadAdminEnrollments } from '@/features/admin-cms/lib/load-admin-enrollments';
import { loadAdminPaymentMethodSettings } from '@/lib/payment-engine/registry/payment-method-settings';

export default async function AdminPembayaranPage() {
  const [data, history, paymentMethods] = await Promise.all([
    loadAdminEnrollments(),
    loadAdminEnrollmentHistory(),
    loadAdminPaymentMethodSettings(),
  ]);

  return (
    <AdminEnrollmentsPage
      enrollments={data.enrollments}
      history={history}
      pendingCount={data.pendingCount}
      courses={data.courses}
      liveClasses={data.liveClasses}
      tryoutSessions={data.tryoutSessions}
      paymentMethods={paymentMethods}
    />
  );
}
