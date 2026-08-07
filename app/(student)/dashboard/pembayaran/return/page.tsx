import { redirect } from 'next/navigation';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { applyProviderPaymentEvent } from '@/lib/payment-engine/status/apply-event';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { prisma } from '@/lib/prisma';

type Props = {
  searchParams: Promise<{
    order_id?: string;
    status_code?: string;
    transaction_status?: string;
  }>;
};

/**
 * Midtrans Snap "Return to merchant" / finish callback (e-wallet GoPay, etc.).
 * Sync Status API then redirect to Payment Detail with ?confirmed=1 for fast success UX.
 */
export default async function MidtransPaymentReturnPage({ searchParams }: Props) {
  const userId = await requireAuthUserWithAnchor();
  const params = await searchParams;
  const orderId = params.order_id?.trim();

  if (!orderId) {
    redirect(STUDENT_ROUTES.pembayaranHistory);
  }

  const payment = await prisma.payment.findFirst({
    where: { orderId, userId },
    select: { id: true },
  });

  if (!payment) {
    redirect(STUDENT_ROUTES.pembayaranHistory);
  }

  try {
    await applyProviderPaymentEvent({ externalOrderId: orderId });
  } catch {
    // Still land on detail — visibility sync / Cek status / SSE remain
  }

  redirect(`${STUDENT_ROUTES.pembayaran(payment.id)}?confirmed=1`);
}
