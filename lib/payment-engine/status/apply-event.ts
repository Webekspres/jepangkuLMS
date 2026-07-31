import { Prisma } from '@prisma/client';
import { notifyEnrollmentApproved } from '@/lib/lms/notifications';
import { buildPaymentSseEvent } from '@/lib/payment/sse-event';
import { publishPaymentEvent } from '@/lib/payment/sse-hub';
import { getPaymentProvider } from '@/lib/payment-engine/service';
import { prisma } from '@/lib/prisma';
import { loggers } from '@/lib/logger';

const log = loggers.api.child({ module: 'payment-engine-status' });

/**
 * Apply Midtrans (or future provider) status after Status API fetch.
 * Persists Payment, activates Enrollment on PAID, publishes SSE.
 */
export async function applyProviderPaymentEvent(input: {
  externalOrderId: string;
}): Promise<{ paymentId: string; status: string }> {
  const provider = getPaymentProvider('midtrans');
  const statusResult = await provider.fetchStatus(input.externalOrderId);

  const payment = await prisma.payment.findUnique({
    where: { orderId: statusResult.externalOrderId },
    include: {
      enrollment: {
        include: { course: { select: { title: true, slug: true } } },
      },
    },
  });

  if (!payment) {
    throw new Error('MIDTRANS_PAYMENT_NOT_FOUND');
  }

  const previousStatus = payment.status;
  const nextStatus = statusResult.status;
  const nextEnrollmentStatus =
    nextStatus === 'PAID' || payment.enrollment.status === 'ACTIVE' ? 'ACTIVE' : payment.enrollment.status;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: nextStatus,
        transactionId: statusResult.externalTransactionId ?? payment.transactionId,
        paymentType: statusResult.providerPaymentType ?? payment.paymentType,
        statusCode: statusResult.statusCode,
        transactionStatus: statusResult.transactionStatus,
        fraudStatus: statusResult.fraudStatus,
        rawNotification: statusResult.raw as Prisma.InputJsonValue,
        paidAt: nextStatus === 'PAID' ? new Date() : payment.paidAt,
      },
    });

    if (nextStatus === 'PAID' && payment.enrollment.status !== 'ACTIVE') {
      await tx.enrollment.update({
        where: { id: payment.enrollmentId },
        data: { status: 'ACTIVE' },
      });
    }
  });

  if (nextStatus === 'PAID' && previousStatus !== 'PAID') {
    await notifyEnrollmentApproved({
      enrollmentId: payment.enrollmentId,
      studentUserId: payment.enrollment.userId,
      courseTitle: payment.enrollment.course?.title ?? 'Kursus',
      courseSlug: payment.enrollment.course?.slug ?? '',
    });
  }

  try {
    await publishPaymentEvent(
      buildPaymentSseEvent({
        paymentId: payment.id,
        orderId: payment.orderId,
        status: nextStatus,
        enrollmentId: payment.enrollmentId,
        enrollmentStatus: nextEnrollmentStatus,
        productType: payment.enrollment.type,
        courseSlug: payment.enrollment.course?.slug ?? null,
      }),
    );
  } catch (error) {
    log.warn(
      { paymentId: payment.id, error: error instanceof Error ? error.message : error },
      'SSE publish after settle failed (non-fatal)',
    );
  }

  return { paymentId: payment.id, status: nextStatus };
}
