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
 * Terminal non-PAID closes PENDING enrollment (Payment ledger kept via SetNull).
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
  const enrollment = payment.enrollment;
  let nextEnrollmentStatus =
    nextStatus === 'PAID' || enrollment?.status === 'ACTIVE'
      ? ('ACTIVE' as const)
      : (enrollment?.status ?? 'PENDING');

  const productKey =
    payment.productKey ??
    (enrollment?.type === 'COURSE'
      ? (enrollment.course?.slug ?? null)
      : enrollment?.type === 'LIVE_CLASS'
        ? (enrollment.liveClass?.id ?? null)
        : (enrollment?.tryoutSession?.code ?? null));

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

    if (nextStatus === 'PAID' && enrollment && enrollment.status !== 'ACTIVE') {
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: { status: 'ACTIVE' },
      });
    }
  });

  if (
    isTerminalPaymentStatus(nextStatus) &&
    enrollment?.status === 'PENDING' &&
    previousStatus !== nextStatus
  ) {
    const closed = await closePendingEnrollmentForTerminalPayment({
      enrollmentId: enrollment.id,
      actorUserId: null,
    });
    if (closed.closed) {
      nextEnrollmentStatus = 'PENDING';
      for (const path of closed.revalidatePaths) {
        revalidatePath(path);
      }
      revalidateTag(LEARNING_CACHE_TAGS.userEnrollments(payment.userId), 'default');
    }
  }

  if (nextStatus === 'PAID' && previousStatus !== 'PAID' && enrollment) {
    const productTitle =
      enrollment.course?.title ??
      enrollment.liveClass?.title ??
      enrollment.tryoutSession?.title ??
      payment.productTitle;
    const productSubtitle =
      enrollment.course?.slug ??
      enrollment.liveClass?.id ??
      enrollment.tryoutSession?.code ??
      payment.productKey;
    const studentName = await resolveLmsDisplayName(payment.userId, null);

    try {
      await logEnrollmentPaymentSettled({
        enrollmentId: enrollment.id,
        userId: payment.userId,
        type: enrollment.type,
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

    if (enrollment.type === 'LIVE_CLASS' && enrollment.liveClass) {
      await syncLiveClassFilledSlots(enrollment.liveClass.id);
      await notifyLiveClassApproval({
        studentUserId: payment.userId,
        liveClassTitle: enrollment.liveClass.title,
      });
    } else if (enrollment.type === 'TRYOUT' && enrollment.tryoutSession) {
      await notifyEnrollmentApproved({
        enrollmentId: enrollment.id,
        studentUserId: payment.userId,
        productTitle: enrollment.tryoutSession.title,
        href: STUDENT_ROUTES.tryoutExam(enrollment.tryoutSession.code),
      });
    } else {
      await notifyEnrollmentApproved({
        enrollmentId: enrollment.id,
        studentUserId: payment.userId,
        productTitle: enrollment.course?.title ?? payment.productTitle,
        href: enrollment.course?.slug
          ? STUDENT_ROUTES.kursusDetail(enrollment.course.slug)
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
        enrollmentId: enrollment?.id ?? payment.enrollmentId ?? payment.id,
        enrollmentStatus: nextEnrollmentStatus,
        productType: enrollment?.type ?? payment.productType,
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
