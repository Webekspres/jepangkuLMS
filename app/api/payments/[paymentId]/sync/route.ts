import { auth } from '@clerk/nextjs/server';
import { applyProviderPaymentEvent } from '@/lib/payment-engine/status/apply-event';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ paymentId: string }>;
};

/**
 * JSON sync of Midtrans Status API → LMS Payment (same as "Cek status").
 * Prefer this over Server Actions for client poll/reconcile to avoid RSC unexpected-response errors.
 */
export async function POST(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { paymentId } = await context.params;
  if (!paymentId?.trim()) {
    return Response.json({ ok: false, message: 'paymentId required' }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, userId: true, orderId: true, status: true },
  });

  if (!payment || payment.userId !== userId) {
    return Response.json({ ok: false, message: 'Pembayaran tidak ditemukan.' }, { status: 404 });
  }

  try {
    const result = await applyProviderPaymentEvent({ externalOrderId: payment.orderId });
    return Response.json({ ok: true, status: result.status, paymentId: result.paymentId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menyinkronkan status.';
    if (message === 'MIDTRANS_PAYMENT_NOT_FOUND') {
      return Response.json({ ok: false, message: 'Pembayaran tidak ditemukan.' }, { status: 404 });
    }
    return Response.json({ ok: false, message }, { status: 502 });
  }
}
