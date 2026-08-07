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
 * Midtrans Snap "Return to merchant" / finish callback.
 * Syncs Status API then redirects to Payment Detail (never example.com).
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
    // Still land on detail — user can Cek status / SSE
  }

  redirect(STUDENT_ROUTES.pembayaran(payment.id));
}
