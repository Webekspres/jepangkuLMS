import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { PaymentHistoryPage } from '@/features/payment/components/payment-history-page';
import { loadStudentPayments } from '@/features/payment/lib/load-student-payments';

export default async function PembayaranHistoryRoute() {
  const userId = await requireAuthUserWithAnchor();
  const items = await loadStudentPayments(userId);
  return <PaymentHistoryPage items={items} />;
}
