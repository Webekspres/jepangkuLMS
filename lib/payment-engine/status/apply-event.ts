import { Prisma } from '@prisma/client';
import { syncLiveClassFilledSlots } from '@/features/admin-cms/lib/enrollment-counts';
import { logEnrollmentPaymentSettled } from '@/features/admin-cms/lib/enrollment-log';
import {
  notifyEnrollmentApproved,
  notifyLiveClassApproval,
} from '@/lib/lms/notifications';
import { resolveLmsDisplayName } from '@/lib/lms/user-profile';
import {
  closePendingEnrollmentForTerminalPayment,
  isTerminalPaymentStatus,
} from '@/lib/payment/close-pending-enrollment';
import { buildPaymentSseEvent } from '@/lib/payment/sse-event';
import { publishPaymentEvent } from '@/lib/payment/sse-hub';
import { getPaymentProvider } from '@/lib/payment-engine/service';
import { prisma } from '@/lib/prisma';
import { loggers } from '@/lib/logger';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { revalidatePath, revalidateTag } from 'next/cache';
import { LEARNING_CACHE_TAGS } from '@/lib/cache/learning-cache';

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
        include: {
          course: { select: { title: true, slug: true } },
          liveClass: { select: { id: true, title: true } },
          tryoutSession: { select: { code: true, title: true } },
        },
      },
    },
  });

  if (!payment) {
    throw new Error('MIDTRANS_PAYMENT_NOT_FOUND');
  }

  const previousStatus = payment.status;
  const nextStatus = statusResult.status;
  let nextEnrollmentStatus =
    nextStatus === 'PAID' || payment.enrollment.status === 'ACTIVE'
      ? ('ACTIVE' as const)
      : payment.enrollment.status;

  const productKey =
    payment.enrollment.type === 'COURSE'
      ? (payment.enrollment.course?.slug ?? null)
      : payment.enrollment.type === 'LIVE_CLASS'
        ? (payment.enrollment.liveClass?.id ?? null)
        : (payment.enrollment.tryoutSession?.code ?? null);

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

  if (
    isTerminalPaymentStatus(nextStatus) &&
    payment.enrollment.status === 'PENDING' &&
    previousStatus !== nextStatus
  ) {
    const closed = await closePendingEnrollmentForTerminalPayment({
      enrollmentId: payment.enrollmentId,
      actorUserId: null,
    });
    if (closed.closed) {
      nextEnrollmentStatus = payment.enrollment.status;
      for (const path of closed.revalidatePaths) {
        revalidatePath(path);
      }
      revalidateTag(LEARNING_CACHE_TAGS.userEnrollments(payment.enrollment.userId), 'default');
    }
  }

  if (nextStatus === 'PAID' && previousStatus !== 'PAID') {
    const productTitle =
      payment.enrollment.course?.title ??
      payment.enrollment.liveClass?.title ??
      payment.enrollment.tryoutSession?.title ??
      'Program';
    const productSubtitle =
      payment.enrollment.course?.slug ??
      payment.enrollment.liveClass?.id ??
      payment.enrollment.tryoutSession?.code ??
      null;
    const studentName = await resolveLmsDisplayName(payment.enrollment.userId, null);

    try {
      await logEnrollmentPaymentSettled({
        enrollmentId: payment.enrollmentId,
        userId: payment.enrollment.userId,
        type: payment.enrollment.type,
        productTitle,
        productSubtitle,
        studentName,
      });
    } catch (error) {
      log.warn(
        { paymentId: payment.id, error: error instanceof Error ? error.message : error },
        'EnrollmentLog PAYMENT_SETTLED failed (non-fatal)',
      );
    }

    if (payment.enrollment.type === 'LIVE_CLASS' && payment.enrollment.liveClass) {
      await syncLiveClassFilledSlots(payment.enrollment.liveClass.id);
      await notifyLiveClassApproval({
        studentUserId: payment.enrollment.userId,
        liveClassTitle: payment.enrollment.liveClass.title,
      });
    } else if (payment.enrollment.type === 'TRYOUT' && payment.enrollment.tryoutSession) {
      await notifyEnrollmentApproved({
        enrollmentId: payment.enrollmentId,
        studentUserId: payment.enrollment.userId,
        productTitle: payment.enrollment.tryoutSession.title,
        href: STUDENT_ROUTES.tryoutExam(payment.enrollment.tryoutSession.code),
      });
    } else {
      await notifyEnrollmentApproved({
        enrollmentId: payment.enrollmentId,
        studentUserId: payment.enrollment.userId,
        productTitle: payment.enrollment.course?.title ?? 'Kursus',
        href: payment.enrollment.course?.slug
          ? STUDENT_ROUTES.kursusDetail(payment.enrollment.course.slug)
          : STUDENT_ROUTES.kursus,
      });
    }
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
        productKey,
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
